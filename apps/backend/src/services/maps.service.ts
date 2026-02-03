import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { nowIso } from '../config/paths.js';
import { getProjectById } from './projects.service.js';
import { openProjectDb } from '../db/projectDB.js';
// Добавил atomicWriteBuffer для надежности (как в прошлом примере)
import { assertInsideRoot, atomicWriteBuffer } from './files.service.js';

// --- Constants & Types ---

export type MapDTO = {
  id: string;
  project_id: string;
  parent_map_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

const MAP_COLUMNS = 'id, project_id, parent_map_id, title, filename, created_at, updated_at';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg'
};

const ALLOWED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.svg']);

// --- Helpers ---

const createError = (msg: string, code: string, status = 404) => 
  Object.assign(new Error(msg), { status, code });

/**
 * Определяет расширение файла.
 * Сначала доверяем расширению оригинала (если оно в белом списке),
 * иначе пытаемся определить по MIME-типу.
 */
function getSafeExtension(file: Express.Multer.File): string {
  const originalExt = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_EXTS.has(originalExt)) return originalExt;
  
  return MIME_TO_EXT[file.mimetype] || '.bin';
}

/**
 * Ищет карту во всех проектах.
 * Использует динамический импорт projects.service во избежание циклических зависимостей.
 */
async function findMapContext(mapId: string) {
  const { listProjects } = await import('./projects.service.js');
  const projects = await listProjects();

  for (const p of projects) {
    const db = openProjectDb(p.path);
    // Выбираем только нужные поля для контекста
    const row = db.prepare('SELECT id, parent_map_id, filename FROM maps WHERE id = ?').get(mapId) as 
      | { id: string; parent_map_id: string | null; filename: string } 
      | undefined;
    
    // Не закрываем DB здесь, если нашли, так как она может понадобиться вызывающему коду (транзакции)
    // Но для упрощения API helper'а закроем, а вызывающий откроет снова, 
    // либо (оптимизация) вернем путь к проекту, чтобы вызывающий сам открыл.
    db.close();

    if (row) {
      return { projectPath: p.path, row };
    }
  }
  return null;
}

// --- Services ---

export async function listMaps(projectId: string): Promise<MapDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw createError('Project not found', 'PROJECT_NOT_FOUND');

  const db = openProjectDb(project.path);
  const rows = db.prepare(`
    SELECT ${MAP_COLUMNS}
    FROM maps
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).all(projectId);
  db.close();

  return rows as MapDTO[];
}

export async function createMap(params: {
  projectId: string;
  title: string;
  parent_map_id?: string;
  file: Express.Multer.File;
}): Promise<MapDTO> {
  const project = await getProjectById(params.projectId);
  if (!project) throw createError('Project not found', 'PROJECT_NOT_FOUND');

  const db = openProjectDb(project.path);

  // 1. Валидация parent_map_id (до операций с файловой системой)
  const parentId = params.parent_map_id?.trim() || null;
  if (parentId) {
    const parentExists = db.prepare('SELECT 1 FROM maps WHERE id = ? AND project_id = ?').get(parentId, params.projectId);
    if (!parentExists) {
      db.close();
      throw createError('Invalid parent_map_id', 'INVALID_PARENT_MAP', 400);
    }
  }

  // 2. Подготовка путей
  const ext = getSafeExtension(params.file);
  const id = crypto.randomUUID();
  // Используем path.posix.join для генерации URL-подобного пути для БД (forward slashes)
  const relFilename = path.posix.join('assets', 'maps', `${id}${ext}`); 
  // Используем path.join для системного пути (обратные слеши на Windows)
  const absFilename = path.join(project.path, relFilename);

  assertInsideRoot(project.path, absFilename);

  // 3. Запись файла (используем atomicWriteBuffer если доступен, или fs.writeFile)
  // Важно: файл пишем ПОСЛЕ валидации parentId, чтобы не мусорить
  try {
    await (atomicWriteBuffer ? atomicWriteBuffer(absFilename, params.file.buffer) : fs.writeFile(absFilename, params.file.buffer));
  } catch (e) {
    db.close();
    throw e;
  }

  const now = nowIso();

  // 4. Вставка в БД
  const row = db.prepare(`
    INSERT INTO maps (id, project_id, parent_map_id, title, filename, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING ${MAP_COLUMNS}
  `).get(id, params.projectId, parentId, params.title.trim(), relFilename, now, now) as MapDTO;

  db.close();
  return row;
}

export async function getMapFileAbsPath(mapId: string): Promise<{ absPath: string; projectPath: string }> {
  const ctx = await findMapContext(mapId);
  if (!ctx) throw createError('Map not found', 'MAP_NOT_FOUND');

  const { projectPath, row } = ctx;
  const absPath = path.join(projectPath, row.filename);
  
  assertInsideRoot(projectPath, absPath);
  return { absPath, projectPath };
}

export async function deleteMap(mapId: string): Promise<void> {
  const ctx = await findMapContext(mapId);
  if (!ctx) throw createError('Map not found', 'MAP_NOT_FOUND');

  const { projectPath, row } = ctx;
  const db = openProjectDb(projectPath);

  const tx = db.transaction(() => {
    // 1) Отвязываем ссылки
    db.prepare(`UPDATE markers SET link_type = NULL, link_map_id = NULL WHERE link_map_id = ?`).run(mapId);
    // 2) Удаляем маркеры на самой карте
    db.prepare(`DELETE FROM markers WHERE map_id = ?`).run(mapId);
    // 3) Перепривязываем дочерние карты (поднимаем на уровень выше или отвязываем)
    db.prepare(`UPDATE maps SET parent_map_id = ? WHERE parent_map_id = ?`).run(row.parent_map_id, mapId);
    // 4) Удаляем саму карту
    db.prepare(`DELETE FROM maps WHERE id = ?`).run(mapId);
  });

  tx();
  db.close();

  // 5) Удаляем файл карты
  if (row.filename) {
    const absPath = path.join(projectPath, row.filename);
    try {
      assertInsideRoot(projectPath, absPath);
      await fs.unlink(absPath);
    } catch {
      // Игнорируем ошибку удаления файла (он мог уже отсутствовать)
    }
  }
}

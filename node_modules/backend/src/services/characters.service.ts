import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { openProjectDb } from '../db/projectDB.js';
import { nowIso } from '../config/paths.js';
import { getProjectById, listProjects } from './projects.service.js';
import { assertInsideRoot, atomicWriteBuffer, slugify } from './files.service.js';

// --- Constants & Types ---

export type CharacterDTO = {
  id: string;
  project_id: string;
  name: string;
  summary: string;
  notes: string;
  tags: string[];
  photo_path: string;
  created_at: string;
  updated_at: string;
};

type CharacterRow = {
  id: string;
  project_id: string;
  name: string;
  summary: string | null;
  notes: string | null;
  tags_json: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'id, project_id, name, summary, notes, tags_json, photo_path, created_at, updated_at';

const MIME_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg'
};
// Обратный маппинг для расширений (для getCharacterPhotoAbsPath)
const EXT_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// --- Helpers ---

const createError = (msg: string, code: string, status = 404) => 
  Object.assign(new Error(msg), { status, code });

function parseTagsJson(tags_json: string | null): string[] {
  if (!tags_json) return [];
  try {
    const v = JSON.parse(tags_json);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function rowToDTO(row: CharacterRow): CharacterDTO {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    summary: row.summary ?? '',
    notes: row.notes ?? '',
    tags: parseTagsJson(row.tags_json),
    photo_path: row.photo_path ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function safeDeleteFile(projectPath: string, relPath: string) {
  if (!relPath) return;
  const absPath = path.join(projectPath, relPath);
  try {
    assertInsideRoot(projectPath, absPath);
    await fs.unlink(absPath);
  } catch {
    // ignore (file not found or permission issue)
  }
}

/**
 * Ищет персонажа по всем проектам.
 * Возвращает найденную строку и путь к проекту.
 */
async function findCharacterContext(characterId: string) {
  const projects = await listProjects();
  for (const p of projects) {
    const db = openProjectDb(p.path);
    const row = db.prepare(`SELECT ${COLUMNS} FROM characters WHERE id = ?`).get(characterId) as CharacterRow | undefined;
    db.close();

    if (row) return { projectPath: p.path, row };
  }
  return null;
}

// --- Services ---

export async function listCharacters(projectId: string): Promise<CharacterDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw createError('Project not found', 'PROJECT_NOT_FOUND');

  const db = openProjectDb(project.path);
  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM characters WHERE project_id = ? ORDER BY updated_at DESC`)
    .all(projectId) as CharacterRow[];
  db.close();

  return rows.map(rowToDTO);
}

export async function createCharacter(
  projectId: string,
  input: { name: string; summary: string; notes: string; tags: string[] }
): Promise<CharacterDTO> {
  const project = await getProjectById(projectId);
  if (!project) throw createError('Project not found', 'PROJECT_NOT_FOUND');

  const id = crypto.randomUUID();
  const now = nowIso();

  const db = openProjectDb(project.path);
  // Используем RETURNING, чтобы избежать второго запроса SELECT
  const row = db.prepare(`
    INSERT INTO characters (id, project_id, name, summary, notes, tags_json, photo_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING ${COLUMNS}
  `).get(
    id,
    projectId,
    input.name.trim(),
    input.summary ?? '',
    input.notes ?? '',
    JSON.stringify(input.tags ?? []),
    '',
    now,
    now
  ) as CharacterRow;
  
  db.close();
  return rowToDTO(row);
}

export async function patchCharacter(
  characterId: string,
  patch: Partial<{ name: string; summary: string; notes: string; tags: string[]; photo_path: string }>
): Promise<CharacterDTO> {
  const ctx = await findCharacterContext(characterId);
  if (!ctx) throw createError('Character not found', 'CHARACTER_NOT_FOUND');
  
  const { projectPath, row: existing } = ctx;
  const db = openProjectDb(projectPath);

  // Мержим новые данные со старыми
  const nextName = patch.name !== undefined ? patch.name.trim() : existing.name;
  const nextSummary = patch.summary ?? existing.summary ?? '';
  const nextNotes = patch.notes ?? existing.notes ?? '';
  const nextTagsJson = patch.tags !== undefined ? JSON.stringify(patch.tags) : existing.tags_json;
  const nextPhotoPath = patch.photo_path !== undefined ? patch.photo_path : existing.photo_path;

  const updatedRow = db.prepare(`
    UPDATE characters
    SET name = ?, summary = ?, notes = ?, tags_json = ?, photo_path = ?, updated_at = ?
    WHERE id = ?
    RETURNING ${COLUMNS}
  `).get(
    nextName, nextSummary, nextNotes, nextTagsJson, nextPhotoPath, nowIso(), characterId
  ) as CharacterRow;

  db.close();
  return rowToDTO(updatedRow);
}

export async function deleteCharacter(characterId: string): Promise<void> {
  const ctx = await findCharacterContext(characterId);
  if (!ctx) throw createError('Character not found', 'CHARACTER_NOT_FOUND');

  const { projectPath, row } = ctx;
  const db = openProjectDb(projectPath);

  // Получаем актуальный путь к фото перед удалением (на случай гонки обновлений)
  const currentPhoto = db.prepare('SELECT photo_path FROM characters WHERE id = ?').get(characterId) as { photo_path: string } | undefined;
  const photoPathToDelete = currentPhoto?.photo_path;

  const tx = db.transaction(() => {
    db.prepare(`
      DELETE FROM relationships
      WHERE project_id = ? AND (from_character_id = ? OR to_character_id = ?)
    `).run(row.project_id, characterId, characterId);

    db.prepare('DELETE FROM characters WHERE id = ?').run(characterId);
  });

  tx();
  db.close();

  if (photoPathToDelete) {
    await safeDeleteFile(projectPath, photoPathToDelete);
  }
}

export async function setCharacterPhoto(
  characterId: string,
  file: { originalname: string; mimetype: string; buffer: Buffer }
): Promise<CharacterDTO> {
  const ctx = await findCharacterContext(characterId);
  if (!ctx) throw createError('Character not found', 'CHARACTER_NOT_FOUND');
  
  const { projectPath, row } = ctx;

  const ext = MIME_MAP[file.mimetype];
  if (!ext) throw createError('Invalid image mime', 'INVALID_CHARACTER_PHOTO_MIME', 400);

  const safeBase = slugify(row.name || 'character');
  const filename = `${safeBase}-${characterId}.${ext}`;
  // Унификация слешей для кросс-платформенности
  const relPath = path.join('characters', filename).split(path.sep).join('/');
  const absPath = path.join(projectPath, relPath);

  assertInsideRoot(projectPath, absPath);
  await atomicWriteBuffer(absPath, file.buffer);

  const db = openProjectDb(projectPath);
  
  // Получаем старый путь для удаления
  const oldPhoto = db.prepare('SELECT photo_path FROM characters WHERE id = ?').get(characterId) as { photo_path: string } | undefined;

  const updatedRow = db.prepare(`
    UPDATE characters SET photo_path = ?, updated_at = ? WHERE id = ?
    RETURNING ${COLUMNS}
  `).get(relPath, nowIso(), characterId) as CharacterRow;

  db.close();

  // Если старый файл существовал и путь отличается — удаляем
  if (oldPhoto?.photo_path && oldPhoto.photo_path !== relPath) {
    await safeDeleteFile(projectPath, oldPhoto.photo_path);
  }

  return rowToDTO(updatedRow);
}

export async function getCharacterPhotoAbsPath(characterId: string): Promise<{ absPath: string; mime: string }> {
  const ctx = await findCharacterContext(characterId);
  if (!ctx) throw createError('Character not found', 'CHARACTER_NOT_FOUND');

  const { projectPath, row } = ctx;
  if (!row.photo_path) throw createError('Character photo not found', 'CHARACTER_PHOTO_NOT_FOUND');

  const absPath = path.join(projectPath, row.photo_path);
  assertInsideRoot(projectPath, absPath);

  const ext = path.extname(row.photo_path).toLowerCase();
  const mime = EXT_MAP[ext] || 'application/octet-stream';

  return { absPath, mime };
}

export async function clearCharacterPhoto(characterId: string): Promise<CharacterDTO> {
  const ctx = await findCharacterContext(characterId);
  if (!ctx) throw createError('Character not found', 'CHARACTER_NOT_FOUND');

  const { projectPath } = ctx;
  const db = openProjectDb(projectPath);

  // Получаем текущее фото для удаления
  const currentPhoto = db.prepare('SELECT photo_path FROM characters WHERE id = ?').get(characterId) as { photo_path: string } | undefined;

  const updatedRow = db.prepare(`
    UPDATE characters SET photo_path = '', updated_at = ? WHERE id = ?
    RETURNING ${COLUMNS}
  `).get(nowIso(), characterId) as CharacterRow;

  db.close();

  if (currentPhoto?.photo_path) {
    await safeDeleteFile(projectPath, currentPhoto.photo_path);
  }

  return rowToDTO(updatedRow);
}

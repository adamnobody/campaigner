import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { nowIso } from '../config/paths.js';
import { getProjectById } from './projects.service.js';
import { openProjectDb } from '../db/projectDB.js';
import { assertInsideRoot } from './files.service.js';

export type MapDTO = {
  id: string;
  project_id: string;
  parent_map_id: string | null;
  title: string;
  filename: string; // relative: assets/maps/...
  created_at: string;
  updated_at: string;
};

export async function listMaps(projectId: string): Promise<MapDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const db = openProjectDb(project.path);
  const rows = db.prepare(`
    SELECT id, project_id, parent_map_id, title, filename, created_at, updated_at
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
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const extFromOriginal = path.extname(params.file.originalname || '').toLowerCase();
  const ext =
    extFromOriginal === '.png' || extFromOriginal === '.jpg' || extFromOriginal === '.jpeg' || extFromOriginal === '.svg'
      ? extFromOriginal
      : (params.file.mimetype === 'image/png' ? '.png'
        : params.file.mimetype === 'image/jpeg' ? '.jpg'
        : params.file.mimetype === 'image/svg+xml' ? '.svg'
        : '.bin');

  const id = crypto.randomUUID();
  const relFilename = path.join('assets', 'maps', `${id}${ext}`).replaceAll('\\', '/');
  const absFilename = path.join(project.path, relFilename);

  assertInsideRoot(project.path, absFilename);

  await fs.writeFile(absFilename, params.file.buffer);

  const created_at = nowIso();
  const updated_at = created_at;

  const db = openProjectDb(project.path);

  // validate parent_map_id belongs to same project (if provided)
  const parent = params.parent_map_id?.trim();
  let parent_map_id: string | null = null;
  if (parent) {
    const row = db.prepare('SELECT id FROM maps WHERE id = ? AND project_id = ?').get(parent, params.projectId);
    if (!row) {
      db.close();
      throw Object.assign(new Error('Invalid parent_map_id'), { status: 400, code: 'INVALID_PARENT_MAP' });
    }
    parent_map_id = parent;
  }

  db.prepare(`
    INSERT INTO maps (id, project_id, parent_map_id, title, filename, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.projectId, parent_map_id, params.title.trim(), relFilename, created_at, updated_at);

  db.close();

  return { id, project_id: params.projectId, parent_map_id, title: params.title.trim(), filename: relFilename, created_at, updated_at };
}

export async function getMapFileAbsPath(mapId: string): Promise<{ absPath: string; projectPath: string }>{
  // find map in any project: we need projectId; easiest: scan by opening the project DB known by project lookup
  // In MVP we require caller to know projectId? But endpoint is /api/maps/:mapId/file (no projectId).
  // We'll locate it by searching all projects (registry). OK for MVP.
  const { listProjects } = await import('./projects.service.js');
  const projects = await listProjects();

  for (const p of projects) {
    const db = openProjectDb(p.path);
    const row = db.prepare('SELECT filename FROM maps WHERE id = ?').get(mapId) as { filename?: string } | undefined;
    db.close();

    if (row?.filename) {
      const absPath = path.join(p.path, row.filename);
      assertInsideRoot(p.path, absPath);
      return { absPath, projectPath: p.path };
    }
  }

  throw Object.assign(new Error('Map not found'), { status: 404, code: 'MAP_NOT_FOUND' });
}

export async function deleteMap(mapId: string): Promise<void> {
  const { listProjects } = await import('./projects.service.js');

  const projects = await listProjects();

  for (const p of projects) {
    const db = openProjectDb(p.path);

    const row = db.prepare('SELECT id, parent_map_id, filename FROM maps WHERE id = ?').get(mapId) as
      | { id: string; parent_map_id: string | null; filename: string }
      | undefined;

    if (!row) {
      db.close();
      continue;
    }

    const parentId = row.parent_map_id ?? null;
    const filename = row.filename;

    const tx = db.transaction(() => {
      // 1) отвязываем ссылки других маркеров на эту карту
      db.prepare(`
        UPDATE markers
        SET link_type = NULL, link_map_id = NULL
        WHERE link_map_id = ?
      `).run(mapId);

      // 2) удаляем маркеры этой карты
      db.prepare(`DELETE FROM markers WHERE map_id = ?`).run(mapId);

      // 3) перепривязываем дочерние карты
      db.prepare(`UPDATE maps SET parent_map_id = ? WHERE parent_map_id = ?`).run(parentId, mapId);

      // 4) удаляем карту
      db.prepare(`DELETE FROM maps WHERE id = ?`).run(mapId);
    });

    tx();
    db.close();

    // 5) удаляем файл карты
    try {
      const absPath = path.join(p.path, filename);
      assertInsideRoot(p.path, absPath);
      await fs.unlink(absPath);
    } catch {
      // файл мог отсутствовать — не валим API
    }

    return;
  }

  throw Object.assign(new Error('Map not found'), { status: 404, code: 'MAP_NOT_FOUND' });
}

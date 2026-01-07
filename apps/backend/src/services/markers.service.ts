import crypto from 'node:crypto';
import { nowIso } from '../config/paths.js';
import { openProjectDb } from '../db/projectDB.js';
import { listProjects } from './projects.service.js';

export type MarkerLinkType = null | 'note' | 'map';

export type MarkerDTO = {
  id: string;
  map_id: string;

  title: string;
  description: string;

  x: number;
  y: number;

  // [NEW] Добавили точки для полигонов и стили
  points?: { x: number; y: number }[]; 
  style?: any; 

  // [NEW] Добавили тип 'area'
  marker_type: 'location' | 'event' | 'character' | 'area';
  color: string;

  link_type: MarkerLinkType;
  link_note_id: string | null;
  link_map_id: string | null;

  created_at: string;
  updated_at: string;
};

// [NEW] Хелпер для парсинга JSON полей из БД
function parseDbMarker(row: any): MarkerDTO {
  return {
    ...row,
    points: row.points ? JSON.parse(row.points) : undefined,
    style: row.style ? JSON.parse(row.style) : undefined,
  };
}

async function findProjectPathByMapId(mapId: string): Promise<string> {
  const projects = await listProjects();
  for (const p of projects) {
    try {
      const db = openProjectDb(p.path);
      const row = db.prepare('SELECT id FROM maps WHERE id = ?').get(mapId) as { id?: string } | undefined;
      db.close();
      if (row?.id) return p.path;
    } catch (e) { continue; }
  }
  throw Object.assign(new Error('Map not found'), { status: 404, code: 'MAP_NOT_FOUND' });
}

async function findProjectPathByMarkerId(markerId: string): Promise<string> {
  const projects = await listProjects();
  for (const p of projects) {
    try {
      const db = openProjectDb(p.path);
      const row = db.prepare('SELECT id FROM markers WHERE id = ?').get(markerId) as { id?: string } | undefined;
      db.close();
      if (row?.id) return p.path;
    } catch (e) { continue; }
  }
  throw Object.assign(new Error('Marker not found'), { status: 404, code: 'MARKER_NOT_FOUND' });
}

function normalizeLink(input: {
  link_type?: MarkerLinkType | undefined;
  link_note_id?: string | null | undefined;
  link_map_id?: string | null | undefined;
}) {
  const link_type = (input.link_type ?? null) as MarkerLinkType;
  const link_note_id = input.link_note_id ?? null;
  const link_map_id = input.link_map_id ?? null;

  if (link_type === null) {
    return { link_type: null, link_note_id: null, link_map_id: null };
  }
  if (link_type === 'note') {
    return { link_type: 'note' as const, link_note_id: link_note_id, link_map_id: null };
  }
  return { link_type: 'map' as const, link_note_id: null, link_map_id: link_map_id };
}

function assertLinkExists(db: any, link: { link_type: MarkerLinkType; link_note_id: string | null; link_map_id: string | null }) {
  if (link.link_type === null) return;

  if (link.link_type === 'note') {
    const ok = db.prepare('SELECT id FROM notes WHERE id = ?').get(link.link_note_id) as { id?: string } | undefined;
    if (!ok?.id) throw Object.assign(new Error('Linked note not found'), { status: 400, code: 'LINK_NOTE_NOT_FOUND' });
  }

  if (link.link_type === 'map') {
    const ok = db.prepare('SELECT id FROM maps WHERE id = ?').get(link.link_map_id) as { id?: string } | undefined;
    if (!ok?.id) throw Object.assign(new Error('Linked map not found'), { status: 400, code: 'LINK_MAP_NOT_FOUND' });
  }
}

export async function listMarkers(mapId: string): Promise<MarkerDTO[]> {
  const projectPath = await findProjectPathByMapId(mapId);
  const db = openProjectDb(projectPath);
  
  // [NEW] Добавили points, style в SELECT
  const rows = db.prepare(`
    SELECT
      id, map_id, title, description, x, y, points, style, marker_type, color,
      link_type, link_note_id, link_map_id,
      created_at, updated_at
    FROM markers
    WHERE map_id = ?
    ORDER BY created_at DESC
  `).all(mapId);
  
  db.close();
  // [NEW] Используем парсер
  return rows.map(parseDbMarker);
}

export async function createMarker(
  mapId: string,
  input: Omit<MarkerDTO, 'id' | 'map_id' | 'created_at' | 'updated_at'>
): Promise<MarkerDTO> {
  const projectPath = await findProjectPathByMapId(mapId);
  const db = openProjectDb(projectPath);

  const exists = db.prepare('SELECT id FROM maps WHERE id = ?').get(mapId) as { id?: string } | undefined;
  if (!exists?.id) {
    db.close();
    throw Object.assign(new Error('Map not found'), { status: 404, code: 'MAP_NOT_FOUND' });
  }

  const link = normalizeLink(input);
  assertLinkExists(db, link);

  const id = crypto.randomUUID();
  const created_at = nowIso();
  const updated_at = created_at;

  // [NEW] Подготовка JSON для points и style
  const pointsJson = input.points ? JSON.stringify(input.points) : null;
  const styleJson = input.style ? JSON.stringify(input.style) : null;

  db.prepare(`
    INSERT INTO markers (
      id, map_id, title, description, x, y, points, style, marker_type, color,
      link_type, link_note_id, link_map_id,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    mapId,
    input.title.trim(),
    input.description ?? '',
    input.x,
    input.y,
    pointsJson, // [NEW]
    styleJson,  // [NEW]
    input.marker_type,
    input.color,
    link.link_type,
    link.link_note_id,
    link.link_map_id,
    created_at,
    updated_at
  );

  db.close();

  return {
    id,
    map_id: mapId,
    title: input.title.trim(),
    description: input.description ?? '',
    x: input.x,
    y: input.y,
    points: input.points, // [NEW] возвращаем объект
    style: input.style,   // [NEW]
    marker_type: input.marker_type,
    color: input.color,
    link_type: link.link_type,
    link_note_id: link.link_note_id,
    link_map_id: link.link_map_id,
    created_at,
    updated_at
  };
}

export async function patchMarker(
  markerId: string,
  patch: Partial<Omit<MarkerDTO, 'id' | 'map_id' | 'created_at'>>
): Promise<MarkerDTO> {
  const projectPath = await findProjectPathByMarkerId(markerId);
  const db = openProjectDb(projectPath);

  const rawCurrent = db.prepare(`
    SELECT
      id, map_id, title, description, x, y, points, style, marker_type, color,
      link_type, link_note_id, link_map_id,
      created_at, updated_at
    FROM markers WHERE id = ?
  `).get(markerId);

  if (!rawCurrent) {
    db.close();
    throw Object.assign(new Error('Marker not found'), { status: 404, code: 'MARKER_NOT_FOUND' });
  }

  // Парсим текущее состояние из БД
  const current = parseDbMarker(rawCurrent);

  const wantsLinkUpdate =
    patch.link_type !== undefined || patch.link_note_id !== undefined || patch.link_map_id !== undefined;

  const nextLink = wantsLinkUpdate
    ? normalizeLink({
        link_type: (patch.link_type as any) ?? (current.link_type ?? null),
        link_note_id: patch.link_note_id ?? current.link_note_id ?? null,
        link_map_id: patch.link_map_id ?? current.link_map_id ?? null
      })
    : { link_type: current.link_type ?? null, link_note_id: current.link_note_id ?? null, link_map_id: current.link_map_id ?? null };

  assertLinkExists(db, nextLink);

  const updated_at = nowIso();

  const next: MarkerDTO = {
    ...current,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : current.title,
    description: patch.description !== undefined ? patch.description : current.description,
    
    // [NEW] Обработка points и style (если в патче нет, берем старые)
    points: patch.points !== undefined ? patch.points : current.points,
    style: patch.style !== undefined ? patch.style : current.style,

    link_type: nextLink.link_type,
    link_note_id: nextLink.link_note_id,
    link_map_id: nextLink.link_map_id,

    updated_at
  };

  // [NEW] Подготовка JSON для UPDATE
  const pointsJson = next.points ? JSON.stringify(next.points) : null;
  const styleJson = next.style ? JSON.stringify(next.style) : null;

  db.prepare(`
    UPDATE markers
    SET
      title = ?, description = ?, x = ?, y = ?, points = ?, style = ?, 
      marker_type = ?, color = ?,
      link_type = ?, link_note_id = ?, link_map_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    next.title,
    next.description,
    next.x,
    next.y,
    pointsJson, // [NEW]
    styleJson,  // [NEW]
    next.marker_type,
    next.color,
    next.link_type,
    next.link_note_id,
    next.link_map_id,
    next.updated_at,
    markerId
  );

  db.close();
  return next;
}

export async function deleteMarker(markerId: string): Promise<void> {
  const projectPath = await findProjectPathByMarkerId(markerId);
  const db = openProjectDb(projectPath);
  db.prepare('DELETE FROM markers WHERE id = ?').run(markerId);
  db.close();
}

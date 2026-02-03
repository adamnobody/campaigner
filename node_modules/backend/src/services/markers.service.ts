import { nowIso } from '../config/paths.js';
import { openProjectDb } from '../db/projectDB.js';
import { listProjects } from './projects.service.js';

// --- Types ---
export type MarkerLinkType = null | 'note' | 'map';

export type MarkerDTO = {
  id: string;
  map_id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  marker_type: 'location' | 'event' | 'character';
  color: string;
  icon: string;
  link_type: MarkerLinkType;
  link_note_id: string | null;
  link_map_id: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = `
  id, map_id, title, description, x, y, marker_type, color,
  icon, link_type, link_note_id, link_map_id, created_at, updated_at
`;

// --- Helpers ---

const createError = (msg: string, code: string, status = 404) =>
  Object.assign(new Error(msg), { status, code });

/**
 * Вспомогательная функция для безопасного выполнения операций с БД одного проекта.
 */
async function withProjectDb<T>(
  entityId: string,
  tableName: 'maps' | 'markers',
  operation: (db: any, projectPath: string) => T
): Promise<T> {
  const projects = await listProjects();

  for (const p of projects) {
    const db = openProjectDb(p.path);
    try {
      // Безопасная проверка существования сущности
      const exists = db.prepare(`SELECT 1 FROM ${tableName} WHERE id = ?`).get(entityId);
      if (exists) {
        return operation(db, p.path);
      }
    } finally {
      db.close();
    }
  }

  const entityName = tableName === 'maps' ? 'Map' : 'Marker';
  throw createError(`${entityName} not found`, `${entityName.toUpperCase()}_NOT_FOUND`);
}

/**
 * Вычисляет нормализованное состояние ссылок.
 */
function resolveLinkState(
  current: { link_type: MarkerLinkType; link_note_id: string | null; link_map_id: string | null },
  patch: { link_type?: MarkerLinkType | null; link_note_id?: string | null; link_map_id?: string | null }
) {
  const rawType = patch.link_type !== undefined ? patch.link_type : current.link_type;
  const rawNoteId = patch.link_note_id !== undefined ? patch.link_note_id : current.link_note_id;
  const rawMapId = patch.link_map_id !== undefined ? patch.link_map_id : current.link_map_id;

  if (rawType === 'note') return { link_type: 'note' as const, link_note_id: rawNoteId, link_map_id: null };
  if (rawType === 'map') return { link_type: 'map' as const, link_note_id: null, link_map_id: rawMapId };
  
  return { link_type: null, link_note_id: null, link_map_id: null };
}

/**
 * Проверяет, существуют ли связанные сущности в БД.
 */
function validateLinkTargets(
  db: any,
  state: { link_type: MarkerLinkType; link_note_id: string | null; link_map_id: string | null }
) {
  if (state.link_type === 'note' && state.link_note_id) {
    const valid = db.prepare('SELECT 1 FROM notes WHERE id = ?').get(state.link_note_id);
    if (!valid) throw createError('Linked note not found', 'LINK_NOTE_NOT_FOUND', 400);
  }
  if (state.link_type === 'map' && state.link_map_id) {
    const valid = db.prepare('SELECT 1 FROM maps WHERE id = ?').get(state.link_map_id);
    if (!valid) throw createError('Linked map not found', 'LINK_MAP_NOT_FOUND', 400);
  }
}

// --- Services ---

export async function listMarkers(mapId: string): Promise<MarkerDTO[]> {
  return withProjectDb(mapId, 'maps', (db) => {
    const rows = db.prepare(`
      SELECT ${COLUMNS}
      FROM markers
      WHERE map_id = ?
      ORDER BY created_at DESC
    `).all(mapId);
    return rows as MarkerDTO[];
  });
}

export async function createMarker(
  mapId: string,
  input: Omit<MarkerDTO, 'id' | 'map_id' | 'created_at' | 'updated_at'>
): Promise<MarkerDTO> {
  return withProjectDb(mapId, 'maps', (db) => {
    const linkState = resolveLinkState(
      { link_type: null, link_note_id: null, link_map_id: null },
      input
    );
    validateLinkTargets(db, linkState);

    const id = globalThis.crypto.randomUUID(); // Node.js >=19
    const now = nowIso();
    const icon = (input.icon ?? '').trim();

    const row = db.prepare(`
      INSERT INTO markers (
        id, map_id, title, description, x, y, marker_type, color,
        icon, link_type, link_note_id, link_map_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ${COLUMNS}
    `).get(
      id,
      mapId,
      input.title.trim(),
      input.description ?? '',
      input.x,
      input.y,
      input.marker_type,
      input.color,
      icon,
      linkState.link_type,
      linkState.link_note_id,
      linkState.link_map_id,
      now,
      now
    ) as MarkerDTO;

    return row;
  });
}

export async function patchMarker(
  markerId: string,
  patch: Partial<Omit<MarkerDTO, 'id' | 'map_id' | 'created_at'>>
): Promise<MarkerDTO> {
  return withProjectDb(markerId, 'markers', (db) => {
    // Получаем текущее состояние — теперь это безопасно и без лишнего запроса
    const current = db.prepare(`SELECT ${COLUMNS} FROM markers WHERE id = ?`).get(markerId) as MarkerDTO;
    if (!current) {
      // На практике не должно происходить, но для безопасности
      throw createError('Marker not found', 'MARKER_NOT_FOUND');
    }

    const hasLinkUpdates = 
      patch.link_type !== undefined || 
      patch.link_note_id !== undefined || 
      patch.link_map_id !== undefined;

    const linkState = hasLinkUpdates
      ? resolveLinkState(current, patch)
      : { link_type: current.link_type, link_note_id: current.link_note_id, link_map_id: current.link_map_id };

    if (hasLinkUpdates) {
      validateLinkTargets(db, linkState);
    }

    const nextTitle = patch.title !== undefined ? patch.title.trim() : current.title;
    const nextDesc = patch.description !== undefined ? patch.description : current.description;
    const nextIcon = patch.icon !== undefined ? String(patch.icon).trim() : current.icon;

    const row = db.prepare(`
      UPDATE markers
      SET
        title = ?, description = ?, x = ?, y = ?,
        marker_type = ?, color = ?, icon = ?,
        link_type = ?, link_note_id = ?, link_map_id = ?,
        updated_at = ?
      WHERE id = ?
      RETURNING ${COLUMNS}
    `).get(
      nextTitle,
      nextDesc,
      patch.x ?? current.x,
      patch.y ?? current.y,
      patch.marker_type ?? current.marker_type,
      patch.color ?? current.color,
      nextIcon,
      linkState.link_type,
      linkState.link_note_id,
      linkState.link_map_id,
      nowIso(),
      markerId
    ) as MarkerDTO;

    return row;
  });
}

export async function deleteMarker(markerId: string): Promise<void> {
  await withProjectDb(markerId, 'markers', (db) => {
    db.prepare('DELETE FROM markers WHERE id = ?').run(markerId);
  });
}

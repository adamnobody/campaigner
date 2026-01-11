import crypto from 'node:crypto';
import { openProjectDb } from '../db/projectDB.js';
import { nowIso } from '../config/paths.js';
import { getProjectById, listProjects } from './projects.service.js';

export type CharacterDTO = {
  id: string;
  project_id: string;
  name: string;
  summary: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type CharacterRow = {
  id: string;
  project_id: string;
  name: string;
  summary: string;
  notes: string;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

function parseTagsJson(tags_json: string): string[] {
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
    tags: parseTagsJson(row.tags_json ?? '[]'),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function readCharacterRowById(
  characterId: string
): Promise<{ projectPath: string; row: CharacterRow } | null> {
  const projects = await listProjects();
  for (const p of projects) {
    const db = openProjectDb(p.path);
    const row = db
      .prepare(
        `
        SELECT id, project_id, name, summary, notes, tags_json, created_at, updated_at
        FROM characters WHERE id = ?
      `
      )
      .get(characterId) as CharacterRow | undefined;
    db.close();

    if (row?.id) return { projectPath: p.path, row };
  }
  return null;
}

export async function listCharacters(projectId: string): Promise<CharacterDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const db = openProjectDb(project.path);
  const rows = db
    .prepare(
      `
      SELECT id, project_id, name, summary, notes, tags_json, created_at, updated_at
      FROM characters
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `
    )
    .all(projectId) as CharacterRow[];
  db.close();

  return rows.map(rowToDTO);
}

export async function createCharacter(
  projectId: string,
  input: { name: string; summary: string; notes: string; tags: string[] }
): Promise<CharacterDTO> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const id = crypto.randomUUID();
  const created_at = nowIso();
  const updated_at = created_at;

  const db = openProjectDb(project.path);
  db.prepare(
    `
    INSERT INTO characters (id, project_id, name, summary, notes, tags_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    projectId,
    input.name.trim(),
    input.summary ?? '',
    input.notes ?? '',
    JSON.stringify(input.tags ?? []),
    created_at,
    updated_at
  );

  const row = db
    .prepare(
      `
      SELECT id, project_id, name, summary, notes, tags_json, created_at, updated_at
      FROM characters WHERE id = ?
    `
    )
    .get(id) as CharacterRow;
  db.close();

  return rowToDTO(row);
}

export async function patchCharacter(
  characterId: string,
  patch: Partial<{ name: string; summary: string; notes: string; tags: string[] }>
): Promise<CharacterDTO> {
  const found = await readCharacterRowById(characterId);
  if (!found) throw Object.assign(new Error('Character not found'), { status: 404, code: 'CHARACTER_NOT_FOUND' });

  const updated_at = nowIso();
  const db = openProjectDb(found.projectPath);

  const existing = db
    .prepare(
      `
      SELECT id, project_id, name, summary, notes, tags_json, created_at, updated_at
      FROM characters WHERE id = ?
    `
    )
    .get(characterId) as CharacterRow | undefined;

  if (!existing?.id) {
    db.close();
    throw Object.assign(new Error('Character not found'), { status: 404, code: 'CHARACTER_NOT_FOUND' });
  }

  const nextName = patch.name !== undefined ? patch.name.trim() : existing.name;
  const nextSummary = patch.summary !== undefined ? patch.summary : existing.summary ?? '';
  const nextNotes = patch.notes !== undefined ? patch.notes : existing.notes ?? '';
  const nextTagsJson = patch.tags !== undefined ? JSON.stringify(patch.tags) : existing.tags_json ?? '[]';

  db.prepare(
    `
    UPDATE characters
    SET name = ?, summary = ?, notes = ?, tags_json = ?, updated_at = ?
    WHERE id = ?
  `
  ).run(nextName, nextSummary, nextNotes, nextTagsJson, updated_at, characterId);

  const row = db
    .prepare(
      `
      SELECT id, project_id, name, summary, notes, tags_json, created_at, updated_at
      FROM characters WHERE id = ?
    `
    )
    .get(characterId) as CharacterRow;

  db.close();
  return rowToDTO(row);
}

export async function deleteCharacter(characterId: string): Promise<void> {
  const found = await readCharacterRowById(characterId);
  if (!found) throw Object.assign(new Error('Character not found'), { status: 404, code: 'CHARACTER_NOT_FOUND' });

  const { projectPath, row } = found;

  const db = openProjectDb(projectPath);
  const tx = db.transaction(() => {
    db.prepare(
      `
      DELETE FROM relationships
      WHERE project_id = ?
        AND (from_character_id = ? OR to_character_id = ?)
    `
    ).run(row.project_id, characterId, characterId);

    db.prepare(`DELETE FROM characters WHERE id = ?`).run(characterId);
  });

  tx();
  db.close();
}

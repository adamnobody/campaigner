import crypto from 'node:crypto';
import { openProjectDb } from '../db/projectDB.js';
import { nowIso } from '../config/paths.js';
import { getProjectById, listProjects } from './projects.service.js';

export type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'spouse'
  | 'lover'
  | 'mentor'
  | 'student'
  | 'ally'
  | 'rival'
  | 'colleague'
  | 'leader'
  | 'subordinate'
  | 'other';

export type RelationshipDTO = {
  id: string;
  project_id: string;
  from_character_id: string;
  to_character_id: string;
  type: RelationshipType;
  note: string;
  created_at: string;
  updated_at: string;
};

type RelationshipRow = RelationshipDTO;

async function readRelationshipRowById(
  relId: string
): Promise<{ projectPath: string; row: RelationshipRow } | null> {
  const projects = await listProjects();
  for (const p of projects) {
    const db = openProjectDb(p.path);
    const row = db
      .prepare(
        `
        SELECT id, project_id, from_character_id, to_character_id, type, note, created_at, updated_at
        FROM relationships WHERE id = ?
      `
      )
      .get(relId) as RelationshipRow | undefined;
    db.close();

    if (row?.id) return { projectPath: p.path, row };
  }
  return null;
}

export async function listRelationships(projectId: string): Promise<RelationshipDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const db = openProjectDb(project.path);
  const rows = db
    .prepare(
      `
      SELECT id, project_id, from_character_id, to_character_id, type, note, created_at, updated_at
      FROM relationships
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `
    )
    .all(projectId) as RelationshipRow[];
  db.close();

  return rows;
}

export async function createRelationship(
  projectId: string,
  input: { from_character_id: string; to_character_id: string; type: RelationshipType; note: string }
): Promise<RelationshipDTO> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  if (input.from_character_id === input.to_character_id) {
    throw Object.assign(new Error('Relationship must connect two different characters'), {
      status: 400,
      code: 'RELATIONSHIP_SELF'
    });
  }

  const id = crypto.randomUUID();
  const created_at = nowIso();
  const updated_at = created_at;

  const db = openProjectDb(project.path);

  const a = db
    .prepare(`SELECT id FROM characters WHERE id = ? AND project_id = ?`)
    .get(input.from_character_id, projectId) as { id: string } | undefined;

  const b = db
    .prepare(`SELECT id FROM characters WHERE id = ? AND project_id = ?`)
    .get(input.to_character_id, projectId) as { id: string } | undefined;

  if (!a?.id || !b?.id) {
    db.close();
    throw Object.assign(new Error('Character not found in project'), { status: 404, code: 'CHARACTER_NOT_FOUND' });
  }

  db.prepare(
    `
    INSERT INTO relationships (id, project_id, from_character_id, to_character_id, type, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(id, projectId, input.from_character_id, input.to_character_id, input.type, input.note ?? '', created_at, updated_at);

  const row = db
    .prepare(
      `
      SELECT id, project_id, from_character_id, to_character_id, type, note, created_at, updated_at
      FROM relationships WHERE id = ?
    `
    )
    .get(id) as RelationshipRow;

  db.close();
  return row;
}

export async function deleteRelationship(relId: string): Promise<void> {
  const found = await readRelationshipRowById(relId);
  if (!found) throw Object.assign(new Error('Relationship not found'), { status: 404, code: 'RELATIONSHIP_NOT_FOUND' });

  const db = openProjectDb(found.projectPath);
  db.prepare(`DELETE FROM relationships WHERE id = ?`).run(relId);
  db.close();
}

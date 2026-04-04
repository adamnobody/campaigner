import { getDb } from '../db/connection';
import { NotFoundError } from '../middleware/errorHandler';
import type { Tag } from '@campaigner/shared';

interface TagAssociationRow {
  entity_id: number;
  id: number;
  name: string;
  color: string;
}

export function ensureEntityExists(
  table: string,
  id: number,
  label: string
): void {
  const db = getDb();
  const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id) as
    | { id: number }
    | undefined;
  if (!row) throw new NotFoundError(label);
}

export function loadTagsBatch(
  projectId: number,
  entityType: string,
  entityIds: number[]
): Map<number, Tag[]> {
  const result = new Map<number, Tag[]>();
  if (entityIds.length === 0) return result;

  for (const id of entityIds) {
    result.set(id, []);
  }

  const db = getDb();
  const placeholders = entityIds.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT ta.entity_id, t.id, t.name, t.color
    FROM tags t
    JOIN tag_associations ta ON t.id = ta.tag_id
    WHERE ta.entity_type = ? AND ta.entity_id IN (${placeholders}) AND t.project_id = ?
    ORDER BY t.name ASC
  `).all(entityType, ...entityIds, projectId) as TagAssociationRow[];

  for (const row of rows) {
    const tags = result.get(row.entity_id);
    if (tags) {
      tags.push({ id: row.id, name: row.name, color: row.color });
    }
  }

  return result;
}

type BooleanTransformKey = string;

export function buildUpdateQuery(
  table: string,
  fieldMap: Record<string, string>,
  data: Record<string, unknown>,
  id: number,
  options?: {
    booleanFields?: BooleanTransformKey[];
    withTimestamp?: boolean;
  }
): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];
  const booleanSet = new Set(options?.booleanFields ?? []);

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      fields.push(`${dbCol} = ?`);
      values.push(booleanSet.has(jsKey) ? (data[jsKey] ? 1 : 0) : data[jsKey]);
    }
  }

  if (fields.length === 0) return false;

  if (options?.withTimestamp !== false) {
    fields.push("updated_at = datetime('now')");
  }

  values.push(id);
  const db = getDb();
  db.prepare(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`).run(
    ...values
  );
  return true;
}

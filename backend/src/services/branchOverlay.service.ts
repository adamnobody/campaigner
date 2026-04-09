import { getDb } from '../db/connection.js';

export type OverlayEntityType = 'timeline_event' | 'map_marker' | 'map_territory' | 'note' | 'dogma';
export type OverlayOperation = 'upsert' | 'delete' | 'create';

type BranchOverrideRow = {
  entityId: number;
  op: OverlayOperation;
  patchJson: string;
};

export class BranchOverlayService {
  static getOverrides(branchId: number, entityType: OverlayEntityType): Map<number, BranchOverrideRow> {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        entity_id as entityId,
        op,
        patch_json as patchJson
      FROM branch_overrides
      WHERE branch_id = ? AND entity_type = ?
    `).all(branchId, entityType) as BranchOverrideRow[];

    const result = new Map<number, BranchOverrideRow>();
    rows.forEach((row) => result.set(row.entityId, row));
    return result;
  }

  static saveUpsertOverride(
    branchId: number,
    entityType: OverlayEntityType,
    entityId: number,
    patch: Record<string, unknown>,
  ): void {
    const db = getDb();
    const existing = db.prepare(`
      SELECT op, patch_json as patchJson
      FROM branch_overrides
      WHERE branch_id = ? AND entity_type = ? AND entity_id = ?
    `).get(branchId, entityType, entityId) as { op: OverlayOperation; patchJson: string } | undefined;

    let mergedPatch = patch;
    if (existing?.op === 'upsert') {
      try {
        const existingPatch = JSON.parse(existing.patchJson) as Record<string, unknown>;
        mergedPatch = { ...existingPatch, ...patch };
      } catch {
        mergedPatch = patch;
      }
    }

    db.prepare(`
      INSERT INTO branch_overrides (branch_id, entity_type, entity_id, op, patch_json, updated_at)
      VALUES (?, ?, ?, 'upsert', ?, datetime('now'))
      ON CONFLICT(branch_id, entity_type, entity_id)
      DO UPDATE SET op = 'upsert', patch_json = excluded.patch_json, updated_at = datetime('now')
    `).run(branchId, entityType, entityId, JSON.stringify(mergedPatch));
  }

  static saveDeleteOverride(branchId: number, entityType: OverlayEntityType, entityId: number): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO branch_overrides (branch_id, entity_type, entity_id, op, patch_json, updated_at)
      VALUES (?, ?, ?, 'delete', '{}', datetime('now'))
      ON CONFLICT(branch_id, entity_type, entity_id)
      DO UPDATE SET op = 'delete', patch_json = '{}', updated_at = datetime('now')
    `).run(branchId, entityType, entityId);
  }

  static applyItemOverlay<T extends { id: number }>(
    item: T | null,
    overrides: Map<number, BranchOverrideRow>,
  ): T | null {
    if (!item) return null;
    const override = overrides.get(item.id);
    if (!override) return item;
    if (override.op === 'delete') return null;
    if (override.op === 'upsert') {
      try {
        const patch = JSON.parse(override.patchJson) as Partial<T>;
        return { ...item, ...patch };
      } catch {
        return item;
      }
    }
    return item;
  }

  static applyListOverlay<T extends { id: number }>(
    items: T[],
    overrides: Map<number, BranchOverrideRow>,
  ): T[] {
    return items
      .map((item) => this.applyItemOverlay(item, overrides))
      .filter((item): item is T => item !== null);
  }
}

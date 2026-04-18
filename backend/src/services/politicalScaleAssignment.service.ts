import { getDb } from '../db/connection.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { ensureEntityExists } from '../utils/dbHelpers.js';
import type { PoliticalScaleAssignment, PutPoliticalScaleAssignmentsBody } from '@campaigner/shared';

type AssignmentRow = {
  id: number;
  scale_id: number;
  entity_type: 'state' | 'faction';
  entity_id: number;
  value: number;
  enabled: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type FactionKindRow = {
  project_id: number;
  kind: 'state' | 'faction';
};

function toDto(row: AssignmentRow): PoliticalScaleAssignment {
  return {
    id: row.id,
    scaleId: row.scale_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    value: row.value,
    enabled: row.enabled === 1,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PoliticalScaleAssignmentService {
  private static loadFaction(entityId: number): FactionKindRow {
    const db = getDb();
    const row = db
      .prepare('SELECT project_id, kind FROM factions WHERE id = ?')
      .get(entityId) as FactionKindRow | undefined;
    if (!row) throw new NotFoundError('Faction');
    return row;
  }

  private static assertEntityMatchesKind(entityType: 'state' | 'faction', faction: FactionKindRow): void {
    if (entityType === 'state' && faction.kind !== 'state') {
      throw new BadRequestError('entityType state требует фракцию с kind=state');
    }
    if (entityType === 'faction' && faction.kind !== 'faction') {
      throw new BadRequestError('entityType faction требует фракцию с kind=faction');
    }
  }

  /** Добавляет недостающие строки для всех доступных шкал (системные + кастомные мира). */
  static ensureDefaults(entityType: 'state' | 'faction', entityId: number): void {
    const faction = this.loadFaction(entityId);
    this.assertEntityMatchesKind(entityType, faction);
    const db = getDb();

    const insert = db.prepare(`
      INSERT INTO political_scale_assignments (scale_id, entity_type, entity_id, value, enabled, note)
      SELECT s.id, ?, ?, 0, 1, NULL
      FROM political_scales s
      WHERE s.entity_type = ?
        AND (s.is_system = 1 OR s.project_id = ?)
        AND NOT EXISTS (
          SELECT 1 FROM political_scale_assignments a
          WHERE a.scale_id = s.id AND a.entity_type = ? AND a.entity_id = ?
        )
    `);
    insert.run(entityType, entityId, entityType, faction.project_id, entityType, entityId);
  }

  static list(entityType: 'state' | 'faction', entityId: number): PoliticalScaleAssignment[] {
    ensureEntityExists('factions', entityId, 'Faction');
    this.ensureDefaults(entityType, entityId);

    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT * FROM political_scale_assignments
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY id ASC
    `
      )
      .all(entityType, entityId) as AssignmentRow[];
    return rows.map(toDto);
  }

  static replace(payload: PutPoliticalScaleAssignmentsBody): PoliticalScaleAssignment[] {
    const { entityType, entityId, assignments } = payload;
    ensureEntityExists('factions', entityId, 'Faction');
    const faction = this.loadFaction(entityId);
    this.assertEntityMatchesKind(entityType, faction);

    const db = getDb();
    const scaleIds = assignments.map((a) => a.scaleId);
    if (new Set(scaleIds).size !== scaleIds.length) {
      throw new BadRequestError('Дублируется scaleId в списке');
    }

    for (const scaleId of scaleIds) {
      const scale = db
        .prepare(
          `
        SELECT id, entity_type, is_system, project_id
        FROM political_scales
        WHERE id = ?
      `
        )
        .get(scaleId) as
        | { id: number; entity_type: string; is_system: number; project_id: number | null }
        | undefined;
      if (!scale) {
        throw new BadRequestError(`Шкала не найдена: ${scaleId}`);
      }
      if (scale.entity_type !== entityType) {
        throw new BadRequestError(`Шкала ${scaleId} не подходит для entityType ${entityType}`);
      }
      if (scale.is_system !== 1 && scale.project_id !== faction.project_id) {
        throw new BadRequestError(`Шкала ${scaleId} не относится к этому миру`);
      }
    }

    const run = db.transaction(() => {
      db.prepare('DELETE FROM political_scale_assignments WHERE entity_type = ? AND entity_id = ?').run(
        entityType,
        entityId
      );

      const insert = db.prepare(`
        INSERT INTO political_scale_assignments (
          scale_id, entity_type, entity_id, value, enabled, note
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const row of assignments) {
        insert.run(
          row.scaleId,
          entityType,
          entityId,
          row.value,
          row.enabled ? 1 : 0,
          row.note ?? null
        );
      }
    });

    run();
    return this.list(entityType, entityId);
  }

  static delete(assignmentId: number): void {
    const db = getDb();
    const row = db.prepare('SELECT id FROM political_scale_assignments WHERE id = ?').get(assignmentId) as
      | { id: number }
      | undefined;
    if (!row) throw new NotFoundError('Political scale assignment');
    db.prepare('DELETE FROM political_scale_assignments WHERE id = ?').run(assignmentId);
  }
}

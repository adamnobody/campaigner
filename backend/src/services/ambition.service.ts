import type { Ambition, CreateAmbition, UpdateAmbition } from '@campaigner/shared';
import { getDb } from '../db/connection.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

interface AmbitionRow {
  id: number;
  name: string;
  description: string;
  icon_path: string;
  is_custom: number;
  project_id: number | null;
  created_at: string;
  updated_at: string;
}

function mapAmbitionRow(row: AmbitionRow): Ambition {
  const exclusions = AmbitionService.getExclusions(row.id);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    iconPath: row.icon_path ?? '',
    isCustom: row.is_custom === 1,
    exclusions,
    projectId: row.project_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AmbitionService {
  static getCatalog(projectId: number): Ambition[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT id, name, description, icon_path, is_custom, project_id, created_at, updated_at
        FROM ambitions_catalog
        WHERE is_custom = 0 OR project_id = ?
        ORDER BY is_custom ASC, name COLLATE NOCASE ASC
      `
      )
      .all(projectId) as AmbitionRow[];
    return rows.map(mapAmbitionRow);
  }

  static getById(id: number): Ambition {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT id, name, description, icon_path, is_custom, project_id, created_at, updated_at
        FROM ambitions_catalog
        WHERE id = ?
      `
      )
      .get(id) as AmbitionRow | undefined;
    if (!row) throw new NotFoundError('Ambition');
    return mapAmbitionRow(row);
  }

  static create(data: CreateAmbition): Ambition {
    const db = getDb();
    const result = db
      .prepare(
        `
        INSERT INTO ambitions_catalog (name, description, icon_path, is_custom, project_id)
        VALUES (?, ?, ?, 1, ?)
      `
      )
      .run(data.name, data.description ?? '', data.iconPath ?? '', data.projectId);
    const id = result.lastInsertRowid as number;
    const created = this.getById(id);
    if (data.excludedIds && data.excludedIds.length > 0) {
      return this.setExclusions(created.id, data.excludedIds);
    }
    return created;
  }

  static update(id: number, data: UpdateAmbition): Ambition {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT is_custom
        FROM ambitions_catalog
        WHERE id = ?
      `
      )
      .get(id) as { is_custom: number } | undefined;
    if (!row) throw new NotFoundError('Ambition');
    if (row.is_custom !== 1) throw new BadRequestError('Only custom ambitions can be updated');

    db.prepare(
      `
      UPDATE ambitions_catalog
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon_path = COALESCE(?, icon_path),
        updated_at = datetime('now')
      WHERE id = ?
    `
    ).run(
      data.name ?? null,
      data.description ?? null,
      data.iconPath ?? null,
      id
    );

    return this.getById(id);
  }

  static getExclusions(ambitionId: number): number[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT excluded_ambition_id
        FROM ambition_exclusions
        WHERE ambition_id = ?
        ORDER BY excluded_ambition_id ASC
      `
      )
      .all(ambitionId) as { excluded_ambition_id: number }[];
    return rows.map((row) => row.excluded_ambition_id);
  }

  static setExclusions(ambitionId: number, excludedIds: number[]): Ambition {
    const db = getDb();
    const ambition = db
      .prepare(`SELECT id, is_custom, project_id FROM ambitions_catalog WHERE id = ?`)
      .get(ambitionId) as { id: number; is_custom: number; project_id: number | null } | undefined;
    if (!ambition) throw new NotFoundError('Ambition');

    const normalized = Array.from(new Set(excludedIds));
    if (normalized.includes(ambitionId)) {
      throw new BadRequestError('Ambition cannot exclude itself');
    }

    if (normalized.length > 0) {
      const placeholders = normalized.map(() => '?').join(',');
      const candidates = db
        .prepare(
          `
          SELECT id, project_id
          FROM ambitions_catalog
          WHERE id IN (${placeholders})
        `
        )
        .all(...normalized) as Array<{ id: number; project_id: number | null }>;

      if (candidates.length !== normalized.length) {
        throw new NotFoundError('Excluded ambition');
      }

      const invalidCandidate = candidates.find((candidate) => {
        if (ambition.project_id == null) {
          return candidate.project_id != null;
        }
        return candidate.project_id != null && candidate.project_id !== ambition.project_id;
      });
      if (invalidCandidate) {
        throw new BadRequestError('Excluded ambitions must belong to the same scope');
      }
    }

    const remove = db.prepare(`
      DELETE FROM ambition_exclusions
      WHERE ambition_id = ? OR excluded_ambition_id = ?
    `);
    const insert = db.prepare(`
      INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id)
      VALUES (?, ?)
    `);

    const tx = db.transaction(() => {
      remove.run(ambitionId, ambitionId);
      for (const excludedId of normalized) {
        insert.run(ambitionId, excludedId);
        insert.run(excludedId, ambitionId);
      }
    });
    tx();

    return this.getById(ambitionId);
  }

  static delete(id: number): void {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT is_custom
        FROM ambitions_catalog
        WHERE id = ?
      `
      )
      .get(id) as { is_custom: number } | undefined;
    if (!row) throw new NotFoundError('Ambition');
    if (row.is_custom !== 1) throw new BadRequestError('Cannot delete predefined ambition');
    db.prepare(`DELETE FROM ambitions_catalog WHERE id = ?`).run(id);
  }

  static getFactionAmbitions(factionId: number): Ambition[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT ac.id, ac.name, ac.description, ac.icon_path, ac.is_custom, ac.project_id, ac.created_at, ac.updated_at
        FROM faction_ambitions fa
        JOIN ambitions_catalog ac ON ac.id = fa.ambition_id
        WHERE fa.faction_id = ?
        ORDER BY ac.is_custom ASC, ac.name COLLATE NOCASE ASC
      `
      )
      .all(factionId) as AmbitionRow[];
    return rows.map(mapAmbitionRow);
  }

  static assignToFaction(factionId: number, ambitionId: number): void {
    const db = getDb();
    const check = db
      .prepare(
        `
        SELECT
          f.project_id AS faction_project_id,
          a.project_id AS ambition_project_id
        FROM factions f
        CROSS JOIN ambitions_catalog a
        WHERE f.id = ? AND a.id = ?
      `
      )
      .get(factionId, ambitionId) as
      | { faction_project_id: number; ambition_project_id: number | null }
      | undefined;

    if (!check) {
      throw new NotFoundError('Faction or ambition');
    }
    if (check.ambition_project_id != null && check.ambition_project_id !== check.faction_project_id) {
      throw new BadRequestError('Ambition does not belong to the same project as faction');
    }

    const conflict = db
      .prepare(
        `
        SELECT fa.ambition_id AS assigned_ambition_id
        FROM faction_ambitions fa
        LEFT JOIN ambition_exclusions e1
          ON e1.ambition_id = fa.ambition_id AND e1.excluded_ambition_id = ?
        LEFT JOIN ambition_exclusions e2
          ON e2.ambition_id = ? AND e2.excluded_ambition_id = fa.ambition_id
        WHERE fa.faction_id = ?
          AND (e1.ambition_id IS NOT NULL OR e2.ambition_id IS NOT NULL)
        LIMIT 1
      `
      )
      .get(ambitionId, ambitionId, factionId) as { assigned_ambition_id: number } | undefined;
    if (conflict) {
      throw new BadRequestError('Ambition conflicts with already assigned ambition');
    }

    db.prepare(
      `
      INSERT OR IGNORE INTO faction_ambitions (faction_id, ambition_id)
      VALUES (?, ?)
    `
    ).run(factionId, ambitionId);
  }

  static unassignFromFaction(factionId: number, ambitionId: number): void {
    const db = getDb();
    db.prepare(
      `
      DELETE FROM faction_ambitions
      WHERE faction_id = ? AND ambition_id = ?
    `
    ).run(factionId, ambitionId);
  }
}

import { getDb } from '../../db/connection.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { buildUpdateQuery, ensureEntityExists } from '../../utils/dbHelpers.js';
import type { CreateFactionPolicy, UpdateFactionPolicy } from '@campaigner/shared';

type FactionPolicyRow = {
  id: number;
  faction_id: number;
  title: string;
  type: 'ambition' | 'policy';
  status: 'planned' | 'active' | 'archived';
  category: 'economy' | 'military' | 'social' | 'religion' | 'foreign' | 'other';
  enacted_date: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const UPDATE_MAP: Record<string, string> = {
  title: 'title',
  type: 'type',
  status: 'status',
  category: 'category',
  enactedDate: 'enacted_date',
  description: 'description',
  sortOrder: 'sort_order',
};

function toDto(row: FactionPolicyRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    title: row.title,
    type: row.type,
    status: row.status,
    category: row.category ?? 'other',
    enactedDate: row.enacted_date,
    description: row.description || '',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class FactionPolicyService {
  private static getRow(factionId: number, policyId: number): FactionPolicyRow {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM faction_policies WHERE id = ? AND faction_id = ?')
      .get(policyId, factionId) as FactionPolicyRow | undefined;
    if (!row) throw new NotFoundError('Faction policy');
    return row;
  }

  static list(factionId: number) {
    ensureEntityExists('factions', factionId, 'Faction');
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT * FROM faction_policies
      WHERE faction_id = ?
      ORDER BY sort_order ASC, id ASC
    `
      )
      .all(factionId) as FactionPolicyRow[];
    return rows.map(toDto);
  }

  static create(factionId: number, data: CreateFactionPolicy) {
    ensureEntityExists('factions', factionId, 'Faction');
    const db = getDb();
    const result = db
      .prepare(
        `
      INSERT INTO faction_policies (faction_id, title, type, status, category, enacted_date, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        factionId,
        data.title.trim(),
        data.type,
        data.status ?? 'active',
        data.category ?? 'other',
        data.enactedDate ?? null,
        data.description ?? '',
        data.sortOrder ?? 0
      );
    return toDto(this.getRow(factionId, result.lastInsertRowid as number));
  }

  static update(factionId: number, policyId: number, data: UpdateFactionPolicy) {
    this.getRow(factionId, policyId);
    const normalized: UpdateFactionPolicy = {
      ...data,
      ...(typeof data.title === 'string' ? { title: data.title.trim() } : {}),
    };
    buildUpdateQuery('faction_policies', UPDATE_MAP, normalized as Record<string, unknown>, policyId);
    return toDto(this.getRow(factionId, policyId));
  }

  static delete(factionId: number, policyId: number) {
    this.getRow(factionId, policyId);
    const db = getDb();
    db.prepare('DELETE FROM faction_policies WHERE id = ? AND faction_id = ?').run(policyId, factionId);
  }
}

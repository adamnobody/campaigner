import { getDb } from '../db/connection.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { loadTagsBatch, buildUpdateQuery, ensureEntityExists } from '../utils/dbHelpers.js';
import { FACTION_METRICS, STATE_METRICS } from '@campaigner/shared';
import type {
  FactionFilters,
  TagRow,
  CountRow,
  FactionWithMetaRow,
  ChildFactionRow,
  RankRow,
  MemberRow,
  RelationRow,
  FactionCreateData,
  FactionUpdateData,
  RankCreateData,
  RankUpdateData,
  MemberCreateData,
  MemberUpdateData,
  RelationCreateData,
  RelationUpdateData,
  CustomMetricInput,
  CustomMetricRow,
  CompareFactionResult,
} from './faction/faction.types.js';
import {
  FACTION_UPDATE_MAP,
  RANK_UPDATE_MAP,
  MEMBER_UPDATE_MAP,
  RELATION_UPDATE_MAP,
  toFaction,
  toRank,
  toMember,
  toRelation,
  toCustomMetric,
  MEMBER_SELECT,
  RELATION_SELECT,
} from './faction/faction.mappers.js';

export class FactionService {
  private static readonly DEFAULT_MEMBER_ROLE = 'Член фракции';
  private static readonly METRIC_LABELS = new Map(
    [...STATE_METRICS, ...FACTION_METRICS].map((metric) => [metric.key, metric.label] as const)
  );

  private static metricKeyToColumn(key: string): string | null {
    const map: Record<string, string> = {
      treasury: 'treasury',
      population: 'population',
      army_size: 'army_size',
      navy_size: 'navy_size',
      territory_km2: 'territory_km2',
      annual_income: 'annual_income',
      annual_expenses: 'annual_expenses',
      members_count: 'members_count',
      influence: 'influence',
    };
    return map[key] ?? null;
  }

  private static validateMetricsByKind(kind: 'state' | 'faction', data: FactionUpdateData): void {
    const keys = [
      'treasury',
      'population',
      'armySize',
      'navySize',
      'territoryKm2',
      'annualIncome',
      'annualExpenses',
      'membersCount',
      'influence',
    ] as const;
    const allowed = kind === 'state'
      ? new Set(['treasury', 'population', 'armySize', 'navySize', 'territoryKm2', 'annualIncome', 'annualExpenses'])
      : new Set(['treasury', 'membersCount', 'influence', 'annualIncome', 'annualExpenses']);

    for (const key of keys) {
      const value = data[key];
      if (value !== undefined && value !== null && !allowed.has(key)) {
        throw new BadRequestError(`Metric "${key}" is not allowed for kind "${kind}"`);
      }
    }
  }

  private static getLowestRankIdForFaction(db: ReturnType<typeof getDb>, factionId: number): number | null {
    const row = db.prepare(`
      SELECT id
      FROM faction_ranks
      WHERE faction_id = ?
      ORDER BY level ASC, id ASC
      LIMIT 1
    `).get(factionId) as { id: number } | undefined;
    return row?.id ?? null;
  }

  private static ensureCharacterFactionLink(
    db: ReturnType<typeof getDb>,
    characterId: number,
    factionId: number
  ): void {
    db.prepare(`
      INSERT OR IGNORE INTO character_factions (character_id, faction_id)
      VALUES (?, ?)
    `).run(characterId, factionId);
  }

  private static ensureFactionMemberLink(
    db: ReturnType<typeof getDb>,
    factionId: number,
    characterId: number,
    options?: { rankId?: number | null; role?: string; joinedDate?: string; leftDate?: string; isActive?: boolean; notes?: string }
  ): void {
    const existing = db.prepare(`
      SELECT id
      FROM faction_members
      WHERE faction_id = ? AND character_id = ?
    `).get(factionId, characterId) as { id: number } | undefined;
    if (existing) {
      return;
    }

    const fallbackRankId = this.getLowestRankIdForFaction(db, factionId);
    db.prepare(`
      INSERT OR IGNORE INTO faction_members (faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      factionId,
      characterId,
      options?.rankId ?? fallbackRankId,
      options?.role?.trim() || this.DEFAULT_MEMBER_ROLE,
      options?.joinedDate || '',
      options?.leftDate || '',
      options?.isActive === false ? 0 : 1,
      options?.notes || ''
    );
  }

  // ==================== FACTIONS CRUD ====================

  static getAll(projectId: number, filters: FactionFilters = {}) {
    const db = getDb();
    const conditions = ['f.project_id = ?'];
    const params: Array<number | string> = [projectId];

    if (filters.kind) {
      conditions.push('f.kind = ?');
      params.push(filters.kind);
    }

    if (filters.status) {
      conditions.push('f.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push('(f.name LIKE ? OR f.motto LIKE ? OR f.description LIKE ?)');
      const like = `%${filters.search}%`;
      params.push(like, like, like);
    }

    const where = conditions.join(' AND ');

    const countRow = db.prepare(`
      SELECT COUNT(*) as cnt FROM factions f WHERE ${where}
    `).get(...params) as CountRow;

    const total = countRow.cnt;
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const rows = db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id AND fm.is_active = 1) as member_count,
        pf.name as parent_faction_name
      FROM factions f
      LEFT JOIN factions pf ON f.parent_faction_id = pf.id
      WHERE ${where}
      ORDER BY f.sort_order ASC, f.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as FactionWithMetaRow[];

    const tagsMap = loadTagsBatch(projectId, 'faction', rows.map((row) => row.id));

    const factions = rows.map((row) => {
      const faction = toFaction(row);
      return {
        ...faction,
        memberCount: row.member_count || 0,
        parentFaction: row.parent_faction_id
          ? { id: row.parent_faction_id, name: row.parent_faction_name }
          : null,
        tags: tagsMap.get(row.id) || [],
      };
    });

    return { items: factions, total };
  }

  static getById(id: number) {
    const db = getDb();

    const row = db.prepare(`
      SELECT f.*, pf.name as parent_faction_name
      FROM factions f
      LEFT JOIN factions pf ON f.parent_faction_id = pf.id
      WHERE f.id = ?
    `).get(id) as FactionWithMetaRow | undefined;

    if (!row) throw new NotFoundError('Faction');

    const faction = toFaction(row);

    const tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN tag_associations ta ON t.id = ta.tag_id
      WHERE ta.entity_type = 'faction' AND ta.entity_id = ?
    `).all(id) as TagRow[];

    const rankRows = db.prepare(`
      SELECT * FROM faction_ranks WHERE faction_id = ? ORDER BY level DESC
    `).all(id) as RankRow[];

    const memberRows = db.prepare(`
      ${MEMBER_SELECT} WHERE fm.faction_id = ?
      ORDER BY COALESCE(fr.level, -1) DESC, c.name ASC
    `).all(id) as MemberRow[];

    const childRows = db.prepare(`
      SELECT id, name FROM factions WHERE parent_faction_id = ? ORDER BY name
    `).all(id) as ChildFactionRow[];

    const customMetricRows = db.prepare(`
      SELECT * FROM faction_custom_metrics WHERE faction_id = ? ORDER BY sort_order ASC, id ASC
    `).all(id) as CustomMetricRow[];

    return {
      ...faction,
      parentFaction: row.parent_faction_id
        ? { id: row.parent_faction_id, name: row.parent_faction_name }
        : null,
      tags,
      ranks: rankRows.map(toRank),
      members: memberRows.map(toMember),
      customMetrics: customMetricRows.map(toCustomMetric),
      memberCount: memberRows.filter((member) => !!member.is_active).length,
      childFactions: childRows,
    };
  }

  static create(data: FactionCreateData) {
    const db = getDb();
    const kind = data.kind || 'faction';
    this.validateMetricsByKind(kind, data);

    const result = db.prepare(`
      INSERT INTO factions (
        project_id, name, kind, type, motto, description, history, goals, headquarters, territory,
        treasury, population, army_size, navy_size, territory_km2, annual_income, annual_expenses, members_count, influence,
        status, color, secondary_color, founded_date, disbanded_date,
        parent_faction_id, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.name, kind, data.type ?? null, data.motto || '', data.description || '', data.history || '',
      data.goals || '', data.headquarters || '', data.territory || '',
      data.treasury ?? null, data.population ?? null, data.armySize ?? null, data.navySize ?? null, data.territoryKm2 ?? null,
      data.annualIncome ?? null, data.annualExpenses ?? null, data.membersCount ?? null, data.influence ?? null,
      data.status || 'active', data.color || '', data.secondaryColor || '',
      data.foundedDate || '', data.disbandedDate || '', data.parentFactionId || null, data.sortOrder || 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: FactionUpdateData) {
    const faction = this.getById(id);
    this.validateMetricsByKind((data.kind as 'state' | 'faction' | undefined) ?? faction.kind, data);
    buildUpdateQuery('factions', FACTION_UPDATE_MAP, data as Record<string, unknown>, id);
    return this.getById(id);
  }

  static delete(id: number) {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM factions WHERE id = ?').run(id);
  }

  static updateImage(id: number, field: 'image_path' | 'banner_path', imagePath: string) {
    this.getById(id);
    const db = getDb();
    db.prepare(`UPDATE factions SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id);
  }

  // ==================== RANKS ====================

  static getRanks(factionId: number) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM faction_ranks WHERE faction_id = ? ORDER BY level DESC').all(factionId) as RankRow[];
    return rows.map(toRank);
  }

  static createRank(data: RankCreateData) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO faction_ranks (faction_id, name, level, description, permissions, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.factionId, data.name, data.level ?? 0, data.description || '', data.permissions || '', data.icon || '', data.color || '');

    const row = db.prepare('SELECT * FROM faction_ranks WHERE id = ?').get(result.lastInsertRowid as number) as RankRow;
    return toRank(row);
  }

  static updateRank(id: number, data: RankUpdateData) {
    ensureEntityExists('faction_ranks', id, 'Faction rank');
    buildUpdateQuery('faction_ranks', RANK_UPDATE_MAP, data as Record<string, unknown>, id, { withTimestamp: false });
    const db = getDb();
    const row = db.prepare('SELECT * FROM faction_ranks WHERE id = ?').get(id) as RankRow;
    return toRank(row);
  }

  static deleteRank(id: number) {
    ensureEntityExists('faction_ranks', id, 'Faction rank');
    const db = getDb();
    db.prepare('UPDATE faction_members SET rank_id = NULL WHERE rank_id = ?').run(id);
    db.prepare('DELETE FROM faction_ranks WHERE id = ?').run(id);
  }

  // ==================== MEMBERS ====================

  static getMembers(factionId: number) {
    const db = getDb();
    const rows = db.prepare(`
      ${MEMBER_SELECT} WHERE fm.faction_id = ?
      ORDER BY COALESCE(fr.level, -1) DESC, c.name ASC
    `).all(factionId) as MemberRow[];
    return rows.map(toMember);
  }

  static addMember(data: MemberCreateData) {
    const db = getDb();
    this.ensureFactionMemberLink(db, data.factionId, data.characterId, {
      rankId: data.rankId ?? null,
      role: data.role,
      joinedDate: data.joinedDate,
      leftDate: data.leftDate,
      isActive: data.isActive,
      notes: data.notes,
    });
    this.ensureCharacterFactionLink(db, data.characterId, data.factionId);

    const memberRow = db.prepare(`
      SELECT id
      FROM faction_members
      WHERE faction_id = ? AND character_id = ?
    `).get(data.factionId, data.characterId) as { id: number } | undefined;
    if (!memberRow) {
      throw new BadRequestError('Failed to create faction member');
    }

    const row = db.prepare(`${MEMBER_SELECT} WHERE fm.id = ?`).get(memberRow.id) as MemberRow;
    return toMember(row);
  }

  static updateMember(id: number, data: MemberUpdateData) {
    ensureEntityExists('faction_members', id, 'Faction member');
    buildUpdateQuery('faction_members', MEMBER_UPDATE_MAP, data as Record<string, unknown>, id, { booleanFields: ['isActive'], withTimestamp: false });
    const db = getDb();
    const row = db.prepare(`${MEMBER_SELECT} WHERE fm.id = ?`).get(id) as MemberRow;
    return toMember(row);
  }

  static removeMember(id: number) {
    ensureEntityExists('faction_members', id, 'Faction member');
    const db = getDb();
    const memberRow = db.prepare(`
      SELECT faction_id as factionId, character_id as characterId
      FROM faction_members
      WHERE id = ?
    `).get(id) as { factionId: number; characterId: number } | undefined;
    db.prepare('DELETE FROM faction_members WHERE id = ?').run(id);
    if (memberRow) {
      db.prepare(`
        DELETE FROM character_factions
        WHERE character_id = ? AND faction_id = ?
      `).run(memberRow.characterId, memberRow.factionId);
    }
  }

  // ==================== RELATIONS ====================

  static getRelations(projectId: number) {
    const db = getDb();
    const rows = db.prepare(`${RELATION_SELECT} WHERE fr.project_id = ? ORDER BY fr.created_at DESC`).all(projectId) as RelationRow[];
    return rows.map(toRelation);
  }

  static replaceCustomMetrics(factionId: number, metrics: CustomMetricInput[]) {
    ensureEntityExists('factions', factionId, 'Faction');
    const db = getDb();
    const names = new Set<string>();

    for (const metric of metrics) {
      const name = metric.name.trim();
      if (!name) {
        throw new BadRequestError('Custom metric name is required');
      }
      const normalizedName = name.toLowerCase();
      if (names.has(normalizedName)) {
        throw new BadRequestError(`Duplicate custom metric name "${name}"`);
      }
      names.add(normalizedName);
    }

    const run = db.transaction(() => {
      db.prepare('DELETE FROM faction_custom_metrics WHERE faction_id = ?').run(factionId);
      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        db.prepare(`
          INSERT INTO faction_custom_metrics (faction_id, name, value, unit, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(
          factionId,
          metric.name.trim(),
          metric.value,
          metric.unit?.trim() || null,
          metric.sortOrder ?? i
        );
      }
    });
    run();
    return this.getById(factionId).customMetrics ?? [];
  }

  static compare(factionIds: number[], metricKeys: string[]): CompareFactionResult {
    const db = getDb();
    const uniqueFactionIds = Array.from(new Set(factionIds));
    const uniqueMetricKeys = Array.from(new Set(metricKeys.map((key) => key.trim()).filter(Boolean)));
    if (!uniqueFactionIds.length || !uniqueMetricKeys.length) {
      throw new BadRequestError('factionIds and metricKeys must not be empty');
    }

    const placeholders = uniqueFactionIds.map(() => '?').join(', ');
    const factions = db.prepare(`
      SELECT id, name, kind FROM factions WHERE id IN (${placeholders})
    `).all(...uniqueFactionIds) as Array<{ id: number; name: string; kind: 'state' | 'faction' }>;
    if (factions.length !== uniqueFactionIds.length) {
      throw new BadRequestError('One or more factions do not exist');
    }
    const factionsById = new Map(factions.map((faction) => [faction.id, faction]));

    const customNames = uniqueMetricKeys
      .filter((key) => key.startsWith('custom:'))
      .map((key) => key.slice('custom:'.length).trim())
      .filter(Boolean);
    const customMetricRows = customNames.length
      ? db.prepare(`
        SELECT faction_id as factionId, name, value, unit
        FROM faction_custom_metrics
        WHERE faction_id IN (${placeholders}) AND name IN (${customNames.map(() => '?').join(', ')})
      `).all(...uniqueFactionIds, ...customNames) as Array<{ factionId: number; name: string; value: number; unit: string | null }>
      : [];
    const customMetricValueMap = new Map<string, { value: number; unit: string | null }>();
    for (const row of customMetricRows) {
      customMetricValueMap.set(`${row.factionId}:${row.name}`, { value: row.value, unit: row.unit });
    }

    const metrics = uniqueMetricKeys.map((key) => {
      if (key.startsWith('custom:')) {
        const customName = key.slice('custom:'.length).trim();
        if (!customName) {
          throw new BadRequestError(`Invalid metric key "${key}"`);
        }
        const values = uniqueFactionIds.map((factionId) => {
          const row = customMetricValueMap.get(`${factionId}:${customName}`);
          return { factionId, value: row ? row.value : null };
        });
        const firstWithUnit = uniqueFactionIds
          .map((factionId) => customMetricValueMap.get(`${factionId}:${customName}`))
          .find(Boolean);
        return { key, label: customName, unit: firstWithUnit?.unit ?? null, values };
      }

      const column = this.metricKeyToColumn(key);
      if (!column) {
        throw new BadRequestError(`Invalid metric key "${key}"`);
      }
      const applicableKinds = new Set<'state' | 'faction'>(['state', 'faction']);
      if (['population', 'army_size', 'navy_size', 'territory_km2'].includes(key)) applicableKinds.delete('faction');
      if (['members_count', 'influence'].includes(key)) applicableKinds.delete('state');
      const values = uniqueFactionIds.map((factionId) => {
        const faction = factionsById.get(factionId);
        if (!faction || !applicableKinds.has(faction.kind)) {
          return { factionId, value: null };
        }
        const row = db.prepare(`SELECT ${column} as value FROM factions WHERE id = ?`).get(factionId) as { value: number | null };
        return { factionId, value: row?.value ?? null };
      });
      const meta = [...STATE_METRICS, ...FACTION_METRICS].find((metric) => metric.key === key);
      return { key, label: meta?.label || this.METRIC_LABELS.get(key as any) || key, unit: meta?.unit ?? null, values };
    });

    return { factions, metrics };
  }

  static createRelation(data: RelationCreateData) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO faction_relations (
        project_id, source_faction_id, target_faction_id,
        relation_type, custom_label, description, started_date, is_bidirectional
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.sourceFactionId, data.targetFactionId,
      data.relationType || 'neutral', data.customLabel || '',
      data.description || '', data.startedDate || '',
      data.isBidirectional !== false ? 1 : 0
    );

    const row = db.prepare(`${RELATION_SELECT} WHERE fr.id = ?`).get(result.lastInsertRowid as number) as RelationRow;
    return toRelation(row);
  }

  static updateRelation(id: number, data: RelationUpdateData) {
    ensureEntityExists('faction_relations', id, 'Faction relation');
    buildUpdateQuery('faction_relations', RELATION_UPDATE_MAP, data as Record<string, unknown>, id, { booleanFields: ['isBidirectional'], withTimestamp: false });
    const db = getDb();
    const row = db.prepare(`${RELATION_SELECT} WHERE fr.id = ?`).get(id) as RelationRow;
    return toRelation(row);
  }

  static deleteRelation(id: number) {
    ensureEntityExists('faction_relations', id, 'Faction relation');
    const db = getDb();
    db.prepare('DELETE FROM faction_relations WHERE id = ?').run(id);
  }

  // ==================== GRAPH ====================

  static getGraph(projectId: number) {
    const db = getDb();

    const factions = db.prepare(`
      SELECT id, name, kind, type, status, color, image_path,
        (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = factions.id AND fm.is_active = 1) as member_count
      FROM factions WHERE project_id = ?
    `).all(projectId) as Array<{
      id: number; name: string; kind: 'state' | 'faction'; type: string | null;
      status: string; color: string | null;
      image_path: string | null; member_count: number;
    }>;

    const relations = db.prepare(`${RELATION_SELECT} WHERE fr.project_id = ?`).all(projectId) as RelationRow[];

    return {
      nodes: factions.map((f) => ({
        id: f.id, name: f.name, kind: f.kind, type: f.type ?? null,
        status: f.status, color: f.color || '',
        imagePath: f.image_path || '', memberCount: f.member_count,
      })),
      edges: relations.map(toRelation),
    };
  }
}

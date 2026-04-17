import { getDb } from '../db/connection.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { loadTagsBatch, buildUpdateQuery, ensureEntityExists } from '../utils/dbHelpers.js';
import type {
  FactionFilters,
  TagRow,
  CountRow,
  FactionWithMetaRow,
  ChildFactionRow,
  RankRow,
  MemberRow,
  RelationRow,
  AssetRow,
  FactionCreateData,
  FactionUpdateData,
  RankCreateData,
  RankUpdateData,
  MemberCreateData,
  MemberUpdateData,
  RelationCreateData,
  RelationUpdateData,
  AssetCreateData,
  AssetUpdateData,
} from './faction/faction.types.js';
import {
  FACTION_UPDATE_MAP,
  RANK_UPDATE_MAP,
  MEMBER_UPDATE_MAP,
  RELATION_UPDATE_MAP,
  ASSET_UPDATE_MAP,
  toFaction,
  toRank,
  toMember,
  toRelation,
  toAsset,
  MEMBER_SELECT,
  RELATION_SELECT,
} from './faction/faction.mappers.js';

export class FactionService {
  private static normalizeAssetName(name: string): string {
    return name.trim().toLowerCase();
  }

  // ==================== FACTIONS CRUD ====================

  static getAll(projectId: number, filters: FactionFilters = {}) {
    const db = getDb();
    const conditions = ['f.project_id = ?'];
    const params: Array<number | string> = [projectId];

    if (filters.type) {
      conditions.push('f.type = ?');
      params.push(filters.type);
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

    const assetRows = db.prepare(`
      SELECT * FROM faction_assets WHERE faction_id = ? ORDER BY sort_order ASC, id ASC
    `).all(id) as AssetRow[];

    return {
      ...faction,
      parentFaction: row.parent_faction_id
        ? { id: row.parent_faction_id, name: row.parent_faction_name }
        : null,
      tags,
      ranks: rankRows.map(toRank),
      members: memberRows.map(toMember),
      assets: assetRows.map(toAsset),
      memberCount: memberRows.filter((member) => !!member.is_active).length,
      childFactions: childRows,
    };
  }

  static create(data: FactionCreateData) {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO factions (
        project_id, name, type, custom_type, state_type, custom_state_type,
        motto, description, history, goals, headquarters, territory,
        status, color, secondary_color, founded_date, disbanded_date,
        parent_faction_id, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.name, data.type || 'faction',
      data.customType || '', data.stateType || '', data.customStateType || '',
      data.motto || '', data.description || '', data.history || '',
      data.goals || '', data.headquarters || '', data.territory || '',
      data.status || 'active', data.color || '', data.secondaryColor || '',
      data.foundedDate || '', data.disbandedDate || '',
      data.parentFactionId || null, data.sortOrder || 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: FactionUpdateData) {
    this.getById(id);
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
    const result = db.prepare(`
      INSERT INTO faction_members (faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.factionId, data.characterId, data.rankId || null,
      data.role || '', data.joinedDate || '', data.leftDate || '',
      data.isActive !== false ? 1 : 0, data.notes || ''
    );

    const row = db.prepare(`${MEMBER_SELECT} WHERE fm.id = ?`).get(result.lastInsertRowid as number) as MemberRow;
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
    db.prepare('DELETE FROM faction_members WHERE id = ?').run(id);
  }

  // ==================== RELATIONS ====================

  static getRelations(projectId: number) {
    const db = getDb();
    const rows = db.prepare(`${RELATION_SELECT} WHERE fr.project_id = ? ORDER BY fr.created_at DESC`).all(projectId) as RelationRow[];
    return rows.map(toRelation);
  }

  // ==================== ASSETS ====================

  static getAssets(factionId: number) {
    ensureEntityExists('factions', factionId, 'Faction');
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM faction_assets WHERE faction_id = ? ORDER BY sort_order ASC, id ASC
    `).all(factionId) as AssetRow[];
    return rows.map(toAsset);
  }

  static createAsset(data: AssetCreateData) {
    ensureEntityExists('factions', data.factionId, 'Faction');
    const db = getDb();
    const name = data.name.trim();
    const value = (data.value ?? '').trim();
    const result = db.prepare(`
      INSERT INTO faction_assets (faction_id, name, value, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(data.factionId, name, value, data.sortOrder ?? 0);
    const row = db.prepare('SELECT * FROM faction_assets WHERE id = ?').get(result.lastInsertRowid as number) as AssetRow;
    return toAsset(row);
  }

  static updateAsset(id: number, data: AssetUpdateData) {
    ensureEntityExists('faction_assets', id, 'Faction asset');
    const normalizedData: AssetUpdateData = {
      ...data,
      ...(typeof data.name === 'string' ? { name: data.name.trim() } : {}),
      ...(typeof data.value === 'string' ? { value: data.value.trim() } : {}),
    };
    buildUpdateQuery('faction_assets', ASSET_UPDATE_MAP, normalizedData as Record<string, unknown>, id);
    const db = getDb();
    const row = db.prepare('SELECT * FROM faction_assets WHERE id = ?').get(id) as AssetRow;
    return toAsset(row);
  }

  static deleteAsset(id: number) {
    ensureEntityExists('faction_assets', id, 'Faction asset');
    const db = getDb();
    db.prepare('DELETE FROM faction_assets WHERE id = ?').run(id);
  }

  static reorderAssets(factionId: number, orderedIds: number[]) {
    ensureEntityExists('factions', factionId, 'Faction');
    const existing = this.getAssets(factionId);
    const dbIdsSorted = [...existing.map((a) => a.id)].sort((a, b) => a - b);

    if (orderedIds.length !== dbIdsSorted.length) {
      throw new BadRequestError('orderedIds must list every asset id for this faction exactly once');
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestError('orderedIds must not contain duplicates');
    }
    const inputSorted = [...orderedIds].sort((a, b) => a - b);
    for (let i = 0; i < dbIdsSorted.length; i++) {
      if (dbIdsSorted[i] !== inputSorted[i]) {
        throw new BadRequestError('orderedIds must match the current asset ids for this faction');
      }
    }

    if (orderedIds.length === 0) {
      return existing;
    }

    const db = getDb();
    const run = db.transaction(() => {
      orderedIds.forEach((assetId, index) => {
        const result = db.prepare(`
          UPDATE faction_assets SET sort_order = ?, updated_at = datetime('now')
          WHERE id = ? AND faction_id = ?
        `).run(index, assetId, factionId);
        if (result.changes !== 1) {
          throw new BadRequestError('Invalid asset id for this faction');
        }
      });
    });
    run();
    return this.getAssets(factionId);
  }

  static bootstrapDefaultAssets(factionId: number) {
    const defaults = ['Казна', 'Земельные активы', 'Военный ресурс', 'Торговый ресурс'] as const;
    const existing = this.getAssets(factionId);
    const existingNormalized = new Set(existing.map((asset) => this.normalizeAssetName(asset.name)));

    const created = [];
    const skipped: string[] = [];

    for (const defaultName of defaults) {
      const normalized = this.normalizeAssetName(defaultName);
      if (existingNormalized.has(normalized)) {
        skipped.push(defaultName);
        continue;
      }

      const createdAsset = this.createAsset({
        factionId,
        name: defaultName,
        value: '',
        sortOrder: existing.length + created.length,
      });
      created.push(createdAsset);
      existingNormalized.add(normalized);
    }

    return { created, skipped };
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
      SELECT id, name, type, custom_type, state_type, status, color, image_path,
        (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = factions.id AND fm.is_active = 1) as member_count
      FROM factions WHERE project_id = ?
    `).all(projectId) as Array<{
      id: number; name: string; type: string; custom_type: string | null;
      state_type: string | null; status: string; color: string | null;
      image_path: string | null; member_count: number;
    }>;

    const relations = db.prepare(`${RELATION_SELECT} WHERE fr.project_id = ?`).all(projectId) as RelationRow[];

    return {
      nodes: factions.map((f) => ({
        id: f.id, name: f.name, type: f.type,
        customType: f.custom_type || '', stateType: f.state_type || '',
        status: f.status, color: f.color || '',
        imagePath: f.image_path || '', memberCount: f.member_count,
      })),
      edges: relations.map(toRelation),
    };
  }
}

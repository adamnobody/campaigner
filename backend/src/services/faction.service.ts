import { getDb } from '../db/connection';
import { NotFoundError } from '../middleware/errorHandler';

interface FactionFilters {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface TagRow {
  id: number;
  name: string;
  color: string;
}

interface CountRow {
  cnt: number;
}

interface FactionRow {
  id: number;
  project_id: number;
  name: string;
  type: string;
  custom_type: string | null;
  state_type: string | null;
  custom_state_type: string | null;
  motto: string | null;
  description: string | null;
  history: string | null;
  goals: string | null;
  headquarters: string | null;
  territory: string | null;
  status: string;
  color: string | null;
  secondary_color: string | null;
  image_path: string | null;
  banner_path: string | null;
  founded_date: string | null;
  disbanded_date: string | null;
  parent_faction_id: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

interface FactionWithMetaRow extends FactionRow {
  member_count: number;
  parent_faction_name: string | null;
}

interface ChildFactionRow {
  id: number;
  name: string;
}

interface RankRow {
  id: number;
  faction_id: number;
  name: string;
  level: number;
  description: string | null;
  permissions: string | null;
  icon: string | null;
  color: string | null;
}

interface MemberRow {
  id: number;
  faction_id: number;
  character_id: number;
  rank_id: number | null;
  role: string | null;
  joined_date: string | null;
  left_date: string | null;
  is_active: number | boolean;
  notes: string | null;
  character_name?: string | null;
  character_image_path?: string | null;
  rank_name?: string | null;
  rank_level?: number | null;
}

interface RelationRow {
  id: number;
  project_id: number;
  source_faction_id: number;
  target_faction_id: number;
  relation_type: string;
  custom_label: string | null;
  description: string | null;
  started_date: string | null;
  is_bidirectional: number | boolean;
  created_at: string;
  source_faction_name?: string | null;
  target_faction_name?: string | null;
}

interface FactionCreateData {
  projectId: number;
  name: string;
  type?: string;
  customType?: string;
  stateType?: string;
  customStateType?: string;
  motto?: string;
  description?: string;
  history?: string;
  goals?: string;
  headquarters?: string;
  territory?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  disbandedDate?: string;
  parentFactionId?: number | null;
  sortOrder?: number;
}

interface FactionUpdateData extends Partial<FactionCreateData> {}

interface RankCreateData {
  factionId: number;
  name: string;
  level?: number;
  description?: string;
  permissions?: string;
  icon?: string;
  color?: string;
}

interface RankUpdateData extends Partial<Omit<RankCreateData, 'factionId'>> {}

interface MemberCreateData {
  factionId: number;
  characterId: number;
  rankId?: number | null;
  role?: string;
  joinedDate?: string;
  leftDate?: string;
  isActive?: boolean;
  notes?: string;
}

interface MemberUpdateData {
  rankId?: number | null;
  role?: string;
  joinedDate?: string;
  leftDate?: string;
  isActive?: boolean;
  notes?: string;
}

interface RelationCreateData {
  projectId: number;
  sourceFactionId: number;
  targetFactionId: number;
  relationType?: string;
  customLabel?: string;
  description?: string;
  startedDate?: string;
  isBidirectional?: boolean;
}

interface RelationUpdateData {
  relationType?: string;
  customLabel?: string;
  description?: string;
  startedDate?: string;
  isBidirectional?: boolean;
}

function toFaction(row: FactionRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    customType: row.custom_type || '',
    stateType: row.state_type || '',
    customStateType: row.custom_state_type || '',
    motto: row.motto || '',
    description: row.description || '',
    history: row.history || '',
    goals: row.goals || '',
    headquarters: row.headquarters || '',
    territory: row.territory || '',
    status: row.status,
    color: row.color || '',
    secondaryColor: row.secondary_color || '',
    imagePath: row.image_path || '',
    bannerPath: row.banner_path || '',
    foundedDate: row.founded_date || '',
    disbandedDate: row.disbanded_date || '',
    parentFactionId: row.parent_faction_id || null,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRank(row: RankRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    name: row.name,
    level: row.level,
    description: row.description || '',
    permissions: row.permissions || '',
    icon: row.icon || '',
    color: row.color || '',
  };
}

function toMember(row: MemberRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    characterId: row.character_id,
    rankId: row.rank_id || null,
    role: row.role || '',
    joinedDate: row.joined_date || '',
    leftDate: row.left_date || '',
    isActive: !!row.is_active,
    notes: row.notes || '',
    characterName: row.character_name || '',
    characterImagePath: row.character_image_path || '',
    rankName: row.rank_name || '',
    rankLevel: row.rank_level ?? null,
  };
}

function toRelation(row: RelationRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceFactionId: row.source_faction_id,
    targetFactionId: row.target_faction_id,
    relationType: row.relation_type,
    customLabel: row.custom_label || '',
    description: row.description || '',
    startedDate: row.started_date || '',
    isBidirectional: !!row.is_bidirectional,
    createdAt: row.created_at,
    sourceFactionName: row.source_faction_name || '',
    targetFactionName: row.target_faction_name || '',
  };
}

function ensureRankExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_ranks WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction rank');
}

function ensureMemberExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_members WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction member');
}

function ensureRelationExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_relations WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction relation');
}

export class FactionService {
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
      SELECT COUNT(*) as cnt
      FROM factions f
      WHERE ${where}
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

    const factions = rows.map((row) => {
      const faction = toFaction(row);

      const tags = db.prepare(`
        SELECT t.id, t.name, t.color
        FROM tags t
        JOIN tag_associations ta ON t.id = ta.tag_id
        WHERE ta.entity_type = 'faction' AND ta.entity_id = ?
      `).all(row.id) as TagRow[];

      return {
        ...faction,
        memberCount: row.member_count || 0,
        parentFaction: row.parent_faction_id
          ? { id: row.parent_faction_id, name: row.parent_faction_name }
          : null,
        tags,
      };
    });

    return { items: factions, total };
  }

  static getById(id: number) {
    const db = getDb();

    const row = db.prepare(`
      SELECT f.*,
        pf.name as parent_faction_name
      FROM factions f
      LEFT JOIN factions pf ON f.parent_faction_id = pf.id
      WHERE f.id = ?
    `).get(id) as FactionWithMetaRow | undefined;

    if (!row) {
      throw new NotFoundError('Faction');
    }

    const faction = toFaction(row);

    const tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN tag_associations ta ON t.id = ta.tag_id
      WHERE ta.entity_type = 'faction' AND ta.entity_id = ?
    `).all(id) as TagRow[];

    const rankRows = db.prepare(`
      SELECT * FROM faction_ranks
      WHERE faction_id = ?
      ORDER BY level DESC
    `).all(id) as RankRow[];

    const memberRows = db.prepare(`
      SELECT fm.*,
        c.name as character_name,
        c.image_path as character_image_path,
        fr.name as rank_name,
        fr.level as rank_level
      FROM faction_members fm
      JOIN characters c ON fm.character_id = c.id
      LEFT JOIN faction_ranks fr ON fm.rank_id = fr.id
      WHERE fm.faction_id = ?
      ORDER BY COALESCE(fr.level, -1) DESC, c.name ASC
    `).all(id) as MemberRow[];

    const childRows = db.prepare(`
      SELECT id, name
      FROM factions
      WHERE parent_faction_id = ?
      ORDER BY name
    `).all(id) as ChildFactionRow[];

    return {
      ...faction,
      parentFaction: row.parent_faction_id
        ? { id: row.parent_faction_id, name: row.parent_faction_name }
        : null,
      tags,
      ranks: rankRows.map(toRank),
      members: memberRows.map(toMember),
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
      data.projectId,
      data.name,
      data.type || 'other',
      data.customType || '',
      data.stateType || '',
      data.customStateType || '',
      data.motto || '',
      data.description || '',
      data.history || '',
      data.goals || '',
      data.headquarters || '',
      data.territory || '',
      data.status || 'active',
      data.color || '',
      data.secondaryColor || '',
      data.foundedDate || '',
      data.disbandedDate || '',
      data.parentFactionId || null,
      data.sortOrder || 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: FactionUpdateData) {
    const db = getDb();
    this.getById(id);

    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<keyof FactionUpdateData, string> = {
      projectId: 'project_id',
      name: 'name',
      type: 'type',
      customType: 'custom_type',
      stateType: 'state_type',
      customStateType: 'custom_state_type',
      motto: 'motto',
      description: 'description',
      history: 'history',
      goals: 'goals',
      headquarters: 'headquarters',
      territory: 'territory',
      status: 'status',
      color: 'color',
      secondaryColor: 'secondary_color',
      foundedDate: 'founded_date',
      disbandedDate: 'disbanded_date',
      parentFactionId: 'parent_faction_id',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(map) as Array<[keyof FactionUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE factions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

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
    db.prepare(`
      UPDATE factions
      SET ${field} = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(imagePath, id);
    return this.getById(id);
  }

  // ==================== RANKS ====================

  static getRanks(factionId: number) {
    const db = getDb();

    const rows = db.prepare(`
      SELECT *
      FROM faction_ranks
      WHERE faction_id = ?
      ORDER BY level DESC
    `).all(factionId) as RankRow[];

    return rows.map(toRank);
  }

  static createRank(data: RankCreateData) {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO faction_ranks (faction_id, name, level, description, permissions, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.factionId,
      data.name,
      data.level ?? 0,
      data.description || '',
      data.permissions || '',
      data.icon || '',
      data.color || ''
    );

    const row = db.prepare(`
      SELECT *
      FROM faction_ranks
      WHERE id = ?
    `).get(result.lastInsertRowid as number) as RankRow;

    return toRank(row);
  }

  static updateRank(id: number, data: RankUpdateData) {
    ensureRankExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<keyof RankUpdateData, string> = {
      name: 'name',
      level: 'level',
      description: 'description',
      permissions: 'permissions',
      icon: 'icon',
      color: 'color',
    };

    for (const [key, col] of Object.entries(map) as Array<[keyof RankUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE faction_ranks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const row = db.prepare(`
      SELECT *
      FROM faction_ranks
      WHERE id = ?
    `).get(id) as RankRow;

    return toRank(row);
  }

  static deleteRank(id: number) {
    ensureRankExists(id);
    const db = getDb();
    db.prepare('UPDATE faction_members SET rank_id = NULL WHERE rank_id = ?').run(id);
    db.prepare('DELETE FROM faction_ranks WHERE id = ?').run(id);
  }

  // ==================== MEMBERS ====================

  static getMembers(factionId: number) {
    const db = getDb();

    const rows = db.prepare(`
      SELECT fm.*,
        c.name as character_name,
        c.image_path as character_image_path,
        fr.name as rank_name,
        fr.level as rank_level
      FROM faction_members fm
      JOIN characters c ON fm.character_id = c.id
      LEFT JOIN faction_ranks fr ON fm.rank_id = fr.id
      WHERE fm.faction_id = ?
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
      data.factionId,
      data.characterId,
      data.rankId || null,
      data.role || '',
      data.joinedDate || '',
      data.leftDate || '',
      data.isActive !== false ? 1 : 0,
      data.notes || ''
    );

    const row = db.prepare(`
      SELECT fm.*,
        c.name as character_name,
        c.image_path as character_image_path,
        fr.name as rank_name,
        fr.level as rank_level
      FROM faction_members fm
      JOIN characters c ON fm.character_id = c.id
      LEFT JOIN faction_ranks fr ON fm.rank_id = fr.id
      WHERE fm.id = ?
    `).get(result.lastInsertRowid as number) as MemberRow;

    return toMember(row);
  }

  static updateMember(id: number, data: MemberUpdateData) {
    ensureMemberExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<keyof MemberUpdateData, string> = {
      rankId: 'rank_id',
      role: 'role',
      joinedDate: 'joined_date',
      leftDate: 'left_date',
      isActive: 'is_active',
      notes: 'notes',
    };

    for (const [key, col] of Object.entries(map) as Array<[keyof MemberUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(key === 'isActive' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE faction_members SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const row = db.prepare(`
      SELECT fm.*,
        c.name as character_name,
        c.image_path as character_image_path,
        fr.name as rank_name,
        fr.level as rank_level
      FROM faction_members fm
      JOIN characters c ON fm.character_id = c.id
      LEFT JOIN faction_ranks fr ON fm.rank_id = fr.id
      WHERE fm.id = ?
    `).get(id) as MemberRow;

    return toMember(row);
  }

  static removeMember(id: number) {
    ensureMemberExists(id);
    const db = getDb();
    db.prepare('DELETE FROM faction_members WHERE id = ?').run(id);
  }

  // ==================== RELATIONS ====================

  static getRelations(projectId: number) {
    const db = getDb();

    const rows = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.project_id = ?
      ORDER BY fr.created_at DESC
    `).all(projectId) as RelationRow[];

    return rows.map(toRelation);
  }

  static createRelation(data: RelationCreateData) {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO faction_relations (
        project_id, source_faction_id, target_faction_id,
        relation_type, custom_label, description, started_date, is_bidirectional
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.sourceFactionId,
      data.targetFactionId,
      data.relationType || 'neutral',
      data.customLabel || '',
      data.description || '',
      data.startedDate || '',
      data.isBidirectional !== false ? 1 : 0
    );

    const row = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.id = ?
    `).get(result.lastInsertRowid as number) as RelationRow;

    return toRelation(row);
  }

  static updateRelation(id: number, data: RelationUpdateData) {
    ensureRelationExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<keyof RelationUpdateData, string> = {
      relationType: 'relation_type',
      customLabel: 'custom_label',
      description: 'description',
      startedDate: 'started_date',
      isBidirectional: 'is_bidirectional',
    };

    for (const [key, col] of Object.entries(map) as Array<[keyof RelationUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(key === 'isBidirectional' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE faction_relations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const row = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.id = ?
    `).get(id) as RelationRow;

    return toRelation(row);
  }

  static deleteRelation(id: number) {
    ensureRelationExists(id);
    const db = getDb();
    db.prepare('DELETE FROM faction_relations WHERE id = ?').run(id);
  }

  // ==================== GRAPH ====================

  static getGraph(projectId: number) {
    const db = getDb();

    const factions = db.prepare(`
      SELECT id, name, type, custom_type, state_type, status, color, image_path,
        (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = factions.id AND fm.is_active = 1) as member_count
      FROM factions
      WHERE project_id = ?
    `).all(projectId) as Array<{
      id: number;
      name: string;
      type: string;
      custom_type: string | null;
      state_type: string | null;
      status: string;
      color: string | null;
      image_path: string | null;
      member_count: number;
    }>;

    const relations = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.project_id = ?
    `).all(projectId) as RelationRow[];

    return {
      nodes: factions.map((faction) => ({
        id: faction.id,
        name: faction.name,
        type: faction.type,
        customType: faction.custom_type || '',
        stateType: faction.state_type || '',
        status: faction.status,
        color: faction.color || '',
        imagePath: faction.image_path || '',
        memberCount: faction.member_count,
      })),
      edges: relations.map(toRelation),
    };
  }
}
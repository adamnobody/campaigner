import { getDb } from '../db/connection';
import { NotFoundError } from '../middleware/errorHandler';

interface FactionFilters {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Snake_case → camelCase
function toFaction(row: any) {
  if (!row) return null;
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

function toRank(row: any) {
  if (!row) return null;
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

function toMember(row: any) {
  if (!row) return null;
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

function toRelation(row: any) {
  if (!row) return null;
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

function ensureRankExists(id: number) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_ranks WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction rank');
}

function ensureMemberExists(id: number) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_members WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction member');
}

function ensureRelationExists(id: number) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM faction_relations WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('Faction relation');
}

export class FactionService {
  // ==================== FACTIONS CRUD ====================

  static getAll(projectId: number, filters: FactionFilters = {}) {
    const db = getDb();
    const conditions = ['f.project_id = ?'];
    const params: any[] = [projectId];

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
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM factions f WHERE ${where}`).get(...params) as any;
    const total = countRow.cnt;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const rows = db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id AND fm.is_active = 1) as member_count,
        pf.name as parent_faction_name
      FROM factions f
      LEFT JOIN factions pf ON f.parent_faction_id = pf.id
      WHERE ${where}
      ORDER BY f.sort_order ASC, f.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const factions = rows.map(row => {
      const faction = toFaction(row);

      const tags = db.prepare(`
        SELECT t.id, t.name, t.color
        FROM tags t
        JOIN tag_associations ta ON t.id = ta.tag_id
        WHERE ta.entity_type = 'faction' AND ta.entity_id = ?
      `).all(row.id) as any[];

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
    `).get(id) as any;

    if (!row) throw new NotFoundError('Faction');

    const faction = toFaction(row);

    const tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN tag_associations ta ON t.id = ta.tag_id
      WHERE ta.entity_type = 'faction' AND ta.entity_id = ?
    `).all(id) as any[];

    const rankRows = db.prepare(`
      SELECT * FROM faction_ranks WHERE faction_id = ? ORDER BY level DESC
    `).all(id) as any[];

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
    `).all(id) as any[];

    const childRows = db.prepare(`
      SELECT id, name FROM factions WHERE parent_faction_id = ? ORDER BY name
    `).all(id) as any[];

    return {
      ...faction,
      parentFaction: row.parent_faction_id
        ? { id: row.parent_faction_id, name: row.parent_faction_name }
        : null,
      tags,
      ranks: rankRows.map(toRank),
      members: memberRows.map(toMember),
      memberCount: memberRows.filter((m: any) => m.is_active).length,
      childFactions: childRows,
    };
  }

  static create(data: any) {
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
      data.sortOrder || 0,
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: any) {
    const db = getDb();
    this.getById(id);

    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
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

    for (const [key, col] of Object.entries(map)) {
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
    db.prepare(`UPDATE factions SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id);
  }

  // ==================== RANKS ====================

  static getRanks(factionId: number) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM faction_ranks WHERE faction_id = ? ORDER BY level DESC
    `).all(factionId) as any[];

    return rows.map(toRank);
  }

  static createRank(data: any) {
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
      data.color || '',
    );

    return toRank(
      db.prepare('SELECT * FROM faction_ranks WHERE id = ?').get(result.lastInsertRowid)
    );
  }

  static updateRank(id: number, data: any) {
    ensureRankExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      name: 'name',
      level: 'level',
      description: 'description',
      permissions: 'permissions',
      icon: 'icon',
      color: 'color',
    };

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE faction_ranks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return toRank(db.prepare('SELECT * FROM faction_ranks WHERE id = ?').get(id));
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
    `).all(factionId) as any[];

    return rows.map(toMember);
  }

  static addMember(data: any) {
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
      data.notes || '',
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
    `).get(result.lastInsertRowid) as any;

    return toMember(row);
  }

  static updateMember(id: number, data: any) {
    ensureMemberExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      rankId: 'rank_id',
      role: 'role',
      joinedDate: 'joined_date',
      leftDate: 'left_date',
      isActive: 'is_active',
      notes: 'notes',
    };

    for (const [key, col] of Object.entries(map)) {
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
    `).get(id) as any;

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
    `).all(projectId) as any[];

    return rows.map(toRelation);
  }

  static createRelation(data: any) {
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
      data.isBidirectional !== false ? 1 : 0,
    );

    const row = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.id = ?
    `).get(result.lastInsertRowid) as any;

    return toRelation(row);
  }

  static updateRelation(id: number, data: any) {
    ensureRelationExists(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      relationType: 'relation_type',
      customLabel: 'custom_label',
      description: 'description',
      startedDate: 'started_date',
      isBidirectional: 'is_bidirectional',
    };

    for (const [key, col] of Object.entries(map)) {
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
    `).get(id) as any;

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
    `).all(projectId) as any[];

    const relations = db.prepare(`
      SELECT fr.*,
        sf.name as source_faction_name,
        tf.name as target_faction_name
      FROM faction_relations fr
      JOIN factions sf ON fr.source_faction_id = sf.id
      JOIN factions tf ON fr.target_faction_id = tf.id
      WHERE fr.project_id = ?
    `).all(projectId) as any[];

    return {
      nodes: factions.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        customType: f.custom_type,
        stateType: f.state_type,
        status: f.status,
        color: f.color,
        imagePath: f.image_path,
        memberCount: f.member_count,
      })),
      edges: relations.map(toRelation),
    };
  }
}
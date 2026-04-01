import { getDb } from '../db/connection';
import { NotFoundError } from '../middleware/errorHandler';

interface DynastyFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface CountRow {
  count: number;
}

interface NameRow {
  name: string;
}

interface TagRow {
  id: number;
  name: string;
  color: string;
}

interface DynastyRow {
  id: number;
  project_id: number;
  name: string;
  motto: string | null;
  description: string | null;
  history: string | null;
  status: string;
  color: string | null;
  secondary_color: string | null;
  image_path: string | null;
  founded_date: string | null;
  extinct_date: string | null;
  founder_id: number | null;
  current_leader_id: number | null;
  heir_id: number | null;
  linked_faction_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface DynastyMemberRow {
  id: number;
  dynasty_id: number;
  character_id: number;
  generation: number;
  role: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_main_line: number | boolean;
  notes: string | null;
  graph_x: number | null;
  graph_y: number | null;
  character_name: string;
  character_image_path: string | null;
  character_status: string;
}

interface DynastyFamilyLinkRow {
  id: number;
  dynasty_id: number;
  source_character_id: number;
  target_character_id: number;
  relation_type: string;
  custom_label: string | null;
  source_character_name: string;
  target_character_name: string;
}

interface DynastyEventRow {
  id: number;
  dynasty_id: number;
  title: string;
  description: string | null;
  event_date: string;
  importance: string;
  sort_order: number;
  created_at: string;
}

interface DynastyCreateData {
  projectId: number;
  name: string;
  motto?: string;
  description?: string;
  history?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  extinctDate?: string;
  founderId?: number | null;
  currentLeaderId?: number | null;
  heirId?: number | null;
  linkedFactionId?: number | null;
  sortOrder?: number;
}

interface DynastyUpdateData {
  name?: string;
  motto?: string;
  description?: string;
  history?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  extinctDate?: string;
  founderId?: number | null;
  currentLeaderId?: number | null;
  heirId?: number | null;
  linkedFactionId?: number | null;
  sortOrder?: number;
}

interface DynastyMemberCreateData {
  characterId: number;
  generation?: number;
  role?: string;
  birthDate?: string;
  deathDate?: string;
  isMainLine?: boolean;
  notes?: string;
}

interface DynastyMemberUpdateData {
  generation?: number;
  role?: string;
  birthDate?: string;
  deathDate?: string;
  isMainLine?: boolean;
  notes?: string;
}

interface DynastyFamilyLinkCreateData {
  sourceCharacterId: number;
  targetCharacterId: number;
  relationType: string;
  customLabel?: string;
}

interface DynastyEventCreateData {
  title: string;
  description?: string;
  eventDate: string;
  importance?: string;
  sortOrder?: number;
}

interface DynastyEventUpdateData {
  title?: string;
  description?: string;
  eventDate?: string;
  importance?: string;
  sortOrder?: number;
}

function ensureDynastyMemberExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM dynasty_members WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('DynastyMember');
}

function ensureDynastyFamilyLinkExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM dynasty_family_links WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('DynastyFamilyLink');
}

function ensureDynastyEventExists(id: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM dynasty_events WHERE id = ?').get(id) as { id: number } | undefined;
  if (!row) throw new NotFoundError('DynastyEvent');
}

function mapDynastyMember(row: DynastyMemberRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    characterId: row.character_id,
    generation: row.generation,
    role: row.role || '',
    birthDate: row.birth_date || '',
    deathDate: row.death_date || '',
    isMainLine: !!row.is_main_line,
    notes: row.notes || '',
    graphX: row.graph_x ?? null,
    graphY: row.graph_y ?? null,
    characterName: row.character_name,
    characterImagePath: row.character_image_path,
    characterStatus: row.character_status,
  };
}

function mapDynastyFamilyLink(row: DynastyFamilyLinkRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    sourceCharacterId: row.source_character_id,
    targetCharacterId: row.target_character_id,
    relationType: row.relation_type,
    customLabel: row.custom_label || '',
    sourceCharacterName: row.source_character_name,
    targetCharacterName: row.target_character_name,
  };
}

function mapDynastyEvent(row: DynastyEventRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    title: row.title,
    description: row.description || '',
    eventDate: row.event_date,
    importance: row.importance,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export class DynastyService {
  static getAll(projectId: number, params: DynastyFilters = {}) {
    const db = getDb();
    const { search, status, limit = 50, offset = 0 } = params;

    let where = 'WHERE d.project_id = ?';
    const args: Array<number | string> = [projectId];

    if (status) {
      where += ' AND d.status = ?';
      args.push(status);
    }

    if (search) {
      where += ' AND (d.name LIKE ? OR d.motto LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM dynasties d
      ${where}
    `).get(...args) as CountRow;

    const rows = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d
      ${where}
      ORDER BY d.sort_order ASC, d.name ASC
      LIMIT ? OFFSET ?
    `).all(...args, limit, offset) as DynastyRow[];

    return {
      items: rows.map((row) => this.mapRow(row)),
      total: totalRow.count,
    };
  }

  static getById(id: number) {
    const db = getDb();

    const row = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d
      WHERE d.id = ?
    `).get(id) as DynastyRow | undefined;

    if (!row) {
      throw new NotFoundError('Dynasty');
    }

    const dynasty = this.mapRow(row) as ReturnType<typeof DynastyService.mapRow> & {
      members?: ReturnType<typeof mapDynastyMember>[];
      familyLinks?: ReturnType<typeof mapDynastyFamilyLink>[];
      events?: ReturnType<typeof mapDynastyEvent>[];
      tags?: TagRow[];
      founderName?: string | null;
      currentLeaderName?: string | null;
      heirName?: string | null;
      linkedFactionName?: string | null;
    };

    const memberRows = db.prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm
      JOIN characters c ON c.id = dm.character_id
      WHERE dm.dynasty_id = ?
      ORDER BY dm.generation ASC, c.name ASC
    `).all(id) as DynastyMemberRow[];

    dynasty.members = memberRows.map(mapDynastyMember);

    const familyLinkRows = db.prepare(`
      SELECT fl.*,
        cs.name as source_character_name,
        ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id
      WHERE fl.dynasty_id = ?
    `).all(id) as DynastyFamilyLinkRow[];

    dynasty.familyLinks = familyLinkRows.map(mapDynastyFamilyLink);

    const eventRows = db.prepare(`
      SELECT *
      FROM dynasty_events
      WHERE dynasty_id = ?
      ORDER BY sort_order ASC, event_date ASC
    `).all(id) as DynastyEventRow[];

    dynasty.events = eventRows.map(mapDynastyEvent);

    dynasty.tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN tag_associations ta ON ta.tag_id = t.id
      WHERE ta.entity_type = 'dynasty' AND ta.entity_id = ?
    `).all(id) as TagRow[];

    if (dynasty.founderId) {
      const founder = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.founderId) as NameRow | undefined;
      dynasty.founderName = founder?.name || null;
    }

    if (dynasty.currentLeaderId) {
      const currentLeader = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.currentLeaderId) as NameRow | undefined;
      dynasty.currentLeaderName = currentLeader?.name || null;
    }

    if (dynasty.heirId) {
      const heir = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.heirId) as NameRow | undefined;
      dynasty.heirName = heir?.name || null;
    }

    if (dynasty.linkedFactionId) {
      const linkedFaction = db.prepare('SELECT name FROM factions WHERE id = ?').get(dynasty.linkedFactionId) as NameRow | undefined;
      dynasty.linkedFactionName = linkedFaction?.name || null;
    }

    return dynasty;
  }

  static create(data: DynastyCreateData) {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO dynasties (
        project_id, name, motto, description, history, status, color, secondary_color,
        founded_date, extinct_date, founder_id, current_leader_id, heir_id, linked_faction_id, sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.name,
      data.motto || '',
      data.description || '',
      data.history || '',
      data.status || 'active',
      data.color || '',
      data.secondaryColor || '',
      data.foundedDate || '',
      data.extinctDate || '',
      data.founderId || null,
      data.currentLeaderId || null,
      data.heirId || null,
      data.linkedFactionId || null,
      data.sortOrder || 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: DynastyUpdateData) {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const mapping: Record<keyof DynastyUpdateData, string> = {
      name: 'name',
      motto: 'motto',
      description: 'description',
      history: 'history',
      status: 'status',
      color: 'color',
      secondaryColor: 'secondary_color',
      foundedDate: 'founded_date',
      extinctDate: 'extinct_date',
      founderId: 'founder_id',
      currentLeaderId: 'current_leader_id',
      heirId: 'heir_id',
      linkedFactionId: 'linked_faction_id',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(mapping) as Array<[keyof DynastyUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE dynasties SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number) {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM dynasties WHERE id = ?').run(id);
  }

  static uploadImage(id: number, imagePath: string) {
    this.getById(id);
    const db = getDb();

    db.prepare(`
      UPDATE dynasties
      SET image_path = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(imagePath, id);

    return this.getById(id);
  }

  // Members

  static addMember(dynastyId: number, data: DynastyMemberCreateData) {
    this.getById(dynastyId);
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO dynasty_members (
        dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dynastyId,
      data.characterId,
      data.generation || 0,
      data.role || '',
      data.birthDate || '',
      data.deathDate || '',
      data.isMainLine !== false ? 1 : 0,
      data.notes || ''
    );

    return this.getMember(result.lastInsertRowid as number);
  }

  static updateMember(memberId: number, data: DynastyMemberUpdateData) {
    ensureDynastyMemberExists(memberId);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const mapping: Record<keyof DynastyMemberUpdateData, string> = {
      generation: 'generation',
      role: 'role',
      birthDate: 'birth_date',
      deathDate: 'death_date',
      isMainLine: 'is_main_line',
      notes: 'notes',
    };

    for (const [key, col] of Object.entries(mapping) as Array<[keyof DynastyMemberUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(key === 'isMainLine' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(memberId);
      db.prepare(`UPDATE dynasty_members SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getMember(memberId);
  }

  static removeMember(memberId: number) {
    ensureDynastyMemberExists(memberId);
    const db = getDb();
    db.prepare('DELETE FROM dynasty_members WHERE id = ?').run(memberId);
  }

  static getMember(memberId: number) {
    const db = getDb();

    const member = db.prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm
      JOIN characters c ON c.id = dm.character_id
      WHERE dm.id = ?
    `).get(memberId) as DynastyMemberRow | undefined;

    if (!member) {
      throw new NotFoundError('DynastyMember');
    }

    return mapDynastyMember(member);
  }

  // Family links

  static addFamilyLink(dynastyId: number, data: DynastyFamilyLinkCreateData) {
    this.getById(dynastyId);
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO dynasty_family_links (
        dynasty_id, source_character_id, target_character_id, relation_type, custom_label
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      dynastyId,
      data.sourceCharacterId,
      data.targetCharacterId,
      data.relationType,
      data.customLabel || ''
    );

    return this.getFamilyLink(result.lastInsertRowid as number);
  }

  static deleteFamilyLink(linkId: number) {
    ensureDynastyFamilyLinkExists(linkId);
    const db = getDb();
    db.prepare('DELETE FROM dynasty_family_links WHERE id = ?').run(linkId);
  }

  static getFamilyLink(linkId: number) {
    const db = getDb();

    const link = db.prepare(`
      SELECT fl.*, cs.name as source_character_name, ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id
      WHERE fl.id = ?
    `).get(linkId) as DynastyFamilyLinkRow | undefined;

    if (!link) {
      throw new NotFoundError('DynastyFamilyLink');
    }

    return mapDynastyFamilyLink(link);
  }

  // Events

  static addEvent(dynastyId: number, data: DynastyEventCreateData) {
    this.getById(dynastyId);
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO dynasty_events (
        dynasty_id, title, description, event_date, importance, sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      dynastyId,
      data.title,
      data.description || '',
      data.eventDate,
      data.importance || 'normal',
      data.sortOrder || 0
    );

    return this.getEvent(result.lastInsertRowid as number);
  }

  static updateEvent(eventId: number, data: DynastyEventUpdateData) {
    ensureDynastyEventExists(eventId);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const mapping: Record<keyof DynastyEventUpdateData, string> = {
      title: 'title',
      description: 'description',
      eventDate: 'event_date',
      importance: 'importance',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(mapping) as Array<[keyof DynastyEventUpdateData, string]>) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(eventId);
      db.prepare(`UPDATE dynasty_events SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getEvent(eventId);
  }

  static deleteEvent(eventId: number) {
    ensureDynastyEventExists(eventId);
    const db = getDb();
    db.prepare('DELETE FROM dynasty_events WHERE id = ?').run(eventId);
  }

  static getEvent(eventId: number) {
    const db = getDb();

    const event = db.prepare(`
      SELECT *
      FROM dynasty_events
      WHERE id = ?
    `).get(eventId) as DynastyEventRow | undefined;

    if (!event) {
      throw new NotFoundError('DynastyEvent');
    }

    return mapDynastyEvent(event);
  }

  // Tags

  static setTags(id: number, tagIds: number[]) {
    this.getById(id);
    const db = getDb();

    db.prepare(`
      DELETE FROM tag_associations
      WHERE entity_type = 'dynasty' AND entity_id = ?
    `).run(id);

    const insert = db.prepare(`
      INSERT INTO tag_associations (tag_id, entity_type, entity_id)
      VALUES (?, ?, ?)
    `);

    for (const tagId of tagIds) {
      insert.run(tagId, 'dynasty', id);
    }
  }

  static saveGraphPositions(
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[]
  ) {
    this.getById(dynastyId);
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE dynasty_members
      SET graph_x = ?, graph_y = ?
      WHERE dynasty_id = ? AND character_id = ?
    `);

    const transaction = db.transaction(() => {
      for (const pos of positions) {
        stmt.run(pos.graphX, pos.graphY, dynastyId, pos.characterId);
      }
    });

    transaction();
  }

  private static mapRow(row: DynastyRow) {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      motto: row.motto || '',
      description: row.description || '',
      history: row.history || '',
      status: row.status,
      color: row.color || '',
      secondaryColor: row.secondary_color || '',
      imagePath: row.image_path || null,
      foundedDate: row.founded_date || '',
      extinctDate: row.extinct_date || '',
      founderId: row.founder_id || null,
      currentLeaderId: row.current_leader_id || null,
      heirId: row.heir_id || null,
      linkedFactionId: row.linked_faction_id || null,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      memberCount: row.member_count || 0,
    };
  }
}

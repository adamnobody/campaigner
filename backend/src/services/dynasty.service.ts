import { getDb } from '../db/connection';
import { NotFoundError } from '../middleware/errorHandler';

export class DynastyService {
  static getAll(projectId: number, params: any = {}) {
    const db = getDb();
    const { search, status, limit = 50, offset = 0 } = params;
    let where = 'WHERE d.project_id = ?';
    const args: any[] = [projectId];

    if (status) {
      where += ' AND d.status = ?';
      args.push(status);
    }
    if (search) {
      where += ' AND (d.name LIKE ? OR d.motto LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM dynasties d ${where}`).get(...args) as any;

    const rows = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d
      ${where}
      ORDER BY d.sort_order ASC, d.name ASC
      LIMIT ? OFFSET ?
    `).all(...args, limit, offset);

    return {
      items: rows.map(this.mapRow),
      total: total.count,
    };
  }

  static getById(id: number) {
    const db = getDb();
    const row = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d WHERE d.id = ?
    `).get(id) as any;

    if (!row) throw new NotFoundError('Dynasty');

    const dynasty: any = this.mapRow(row);

    // Members
    dynasty.members = db.prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm
      JOIN characters c ON c.id = dm.character_id
      WHERE dm.dynasty_id = ?
      ORDER BY dm.generation ASC, c.name ASC
    `).all(id).map((m: any) => ({
      id: m.id,
      dynastyId: m.dynasty_id,
      characterId: m.character_id,
      generation: m.generation,
      role: m.role || '',
      birthDate: m.birth_date || '',
      deathDate: m.death_date || '',
      isMainLine: !!m.is_main_line,
      notes: m.notes || '',
      graphX: m.graph_x ?? null,
      graphY: m.graph_y ?? null,
      characterName: m.character_name,
      characterImagePath: m.character_image_path,
      characterStatus: m.character_status,
    }));

    // Family links
    dynasty.familyLinks = db.prepare(`
      SELECT fl.*,
        cs.name as source_character_name,
        ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id
      WHERE fl.dynasty_id = ?
    `).all(id).map((l: any) => ({
      id: l.id,
      dynastyId: l.dynasty_id,
      sourceCharacterId: l.source_character_id,
      targetCharacterId: l.target_character_id,
      relationType: l.relation_type,
      customLabel: l.custom_label || '',
      sourceCharacterName: l.source_character_name,
      targetCharacterName: l.target_character_name,
    }));

    // Events
    dynasty.events = db.prepare(`
      SELECT * FROM dynasty_events WHERE dynasty_id = ?
      ORDER BY sort_order ASC, event_date ASC
    `).all(id).map((e: any) => ({
      id: e.id,
      dynastyId: e.dynasty_id,
      title: e.title,
      description: e.description || '',
      eventDate: e.event_date,
      importance: e.importance,
      sortOrder: e.sort_order,
      createdAt: e.created_at,
    }));

    // Tags
    dynasty.tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN tag_associations ta ON ta.tag_id = t.id
      WHERE ta.entity_type = 'dynasty' AND ta.entity_id = ?
    `).all(id);

    // Named refs
    if (dynasty.founderId) {
      const f = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.founderId) as any;
      dynasty.founderName = f?.name || null;
    }
    if (dynasty.currentLeaderId) {
      const c = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.currentLeaderId) as any;
      dynasty.currentLeaderName = c?.name || null;
    }
    if (dynasty.heirId) {
      const h = db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.heirId) as any;
      dynasty.heirName = h?.name || null;
    }
    if (dynasty.linkedFactionId) {
      const lf = db.prepare('SELECT name FROM factions WHERE id = ?').get(dynasty.linkedFactionId) as any;
      dynasty.linkedFactionName = lf?.name || null;
    }

    return dynasty;
  }

  static create(data: any) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO dynasties (project_id, name, motto, description, history, status, color, secondary_color,
        founded_date, extinct_date, founder_id, current_leader_id, heir_id, linked_faction_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.name, data.motto || '', data.description || '',
      data.history || '', data.status || 'active', data.color || '', data.secondaryColor || '',
      data.foundedDate || '', data.extinctDate || '',
      data.founderId || null, data.currentLeaderId || null, data.heirId || null,
      data.linkedFactionId || null, data.sortOrder || 0,
    );
    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: any) {
    this.getById(id); // check exists
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    const mapping: Record<string, string> = {
      name: 'name', motto: 'motto', description: 'description', history: 'history',
      status: 'status', color: 'color', secondaryColor: 'secondary_color',
      foundedDate: 'founded_date', extinctDate: 'extinct_date',
      founderId: 'founder_id', currentLeaderId: 'current_leader_id',
      heirId: 'heir_id', linkedFactionId: 'linked_faction_id', sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(mapping)) {
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
    db.prepare("UPDATE dynasties SET image_path = ?, updated_at = datetime('now') WHERE id = ?").run(imagePath, id);
    return this.getById(id);
  }

  // Members
  static addMember(dynastyId: number, data: any) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO dynasty_members (dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(dynastyId, data.characterId, data.generation || 0, data.role || '',
      data.birthDate || '', data.deathDate || '', data.isMainLine !== false ? 1 : 0, data.notes || '');
    return this.getMember(result.lastInsertRowid as number);
  }

  static updateMember(memberId: number, data: any) {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];
    const mapping: Record<string, string> = {
      generation: 'generation', role: 'role', birthDate: 'birth_date',
      deathDate: 'death_date', isMainLine: 'is_main_line', notes: 'notes',
    };
    for (const [key, col] of Object.entries(mapping)) {
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
    const db = getDb();
    db.prepare('DELETE FROM dynasty_members WHERE id = ?').run(memberId);
  }

  static getMember(memberId: number) {
    const db = getDb();
    const m = db.prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm JOIN characters c ON c.id = dm.character_id
      WHERE dm.id = ?
    `).get(memberId) as any;
    if (!m) throw new NotFoundError('DynastyMember');
    return {
      id: m.id, dynastyId: m.dynasty_id, characterId: m.character_id,
      generation: m.generation, role: m.role || '', birthDate: m.birth_date || '',
      deathDate: m.death_date || '', isMainLine: !!m.is_main_line, notes: m.notes || '',
      characterName: m.character_name, characterImagePath: m.character_image_path,
      graphX: m.graph_x ?? null,
      graphY: m.graph_y ?? null,
      characterStatus: m.character_status,
    };
  }

  // Family links
  static addFamilyLink(dynastyId: number, data: any) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO dynasty_family_links (dynasty_id, source_character_id, target_character_id, relation_type, custom_label)
      VALUES (?, ?, ?, ?, ?)
    `).run(dynastyId, data.sourceCharacterId, data.targetCharacterId, data.relationType, data.customLabel || '');
    return this.getFamilyLink(result.lastInsertRowid as number);
  }

  static deleteFamilyLink(linkId: number) {
    const db = getDb();
    db.prepare('DELETE FROM dynasty_family_links WHERE id = ?').run(linkId);
  }

  static getFamilyLink(linkId: number) {
    const db = getDb();
    const l = db.prepare(`
      SELECT fl.*, cs.name as source_character_name, ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id
      WHERE fl.id = ?
    `).get(linkId) as any;
    if (!l) throw new NotFoundError('DynastyFamilyLink');
    return {
      id: l.id, dynastyId: l.dynasty_id,
      sourceCharacterId: l.source_character_id, targetCharacterId: l.target_character_id,
      relationType: l.relation_type, customLabel: l.custom_label || '',
      sourceCharacterName: l.source_character_name, targetCharacterName: l.target_character_name,
    };
  }

  // Events
  static addEvent(dynastyId: number, data: any) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO dynasty_events (dynasty_id, title, description, event_date, importance, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dynastyId, data.title, data.description || '', data.eventDate, data.importance || 'normal', data.sortOrder || 0);
    return this.getEvent(result.lastInsertRowid as number);
  }

  static updateEvent(eventId: number, data: any) {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];
    const mapping: Record<string, string> = {
      title: 'title', description: 'description', eventDate: 'event_date',
      importance: 'importance', sortOrder: 'sort_order',
    };
    for (const [key, col] of Object.entries(mapping)) {
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
    const db = getDb();
    db.prepare('DELETE FROM dynasty_events WHERE id = ?').run(eventId);
  }

  static getEvent(eventId: number) {
    const db = getDb();
    const e = db.prepare('SELECT * FROM dynasty_events WHERE id = ?').get(eventId) as any;
    if (!e) throw new NotFoundError('DynastyEvent');
    return {
      id: e.id, dynastyId: e.dynasty_id, title: e.title,
      description: e.description || '', eventDate: e.event_date,
      importance: e.importance, sortOrder: e.sort_order, createdAt: e.created_at,
    };
  }

  // Tags
  static setTags(id: number, tagIds: number[]) {
    const db = getDb();
    db.prepare("DELETE FROM tag_associations WHERE entity_type = 'dynasty' AND entity_id = ?").run(id);
    const insert = db.prepare('INSERT INTO tag_associations (tag_id, entity_type, entity_id) VALUES (?, ?, ?)');
    for (const tagId of tagIds) {
      insert.run(tagId, 'dynasty', id);
    }
  }

  static saveGraphPositions(dynastyId: number, positions: { characterId: number; graphX: number; graphY: number }[]) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE dynasty_members SET graph_x = ?, graph_y = ?
      WHERE dynasty_id = ? AND character_id = ?
    `);
    const transaction = db.transaction(() => {
      for (const pos of positions) {
        stmt.run(pos.graphX, pos.graphY, dynastyId, pos.characterId);
      }
    });
    transaction();
  }

  private static mapRow(row: any) {
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
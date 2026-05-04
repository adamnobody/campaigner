import { getDb } from '../../db/connection.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';
import { buildUpdateQuery, ensureEntityExists } from '../../utils/dbHelpers.js';
import {
  branchEntityVisibilitySql,
  effectiveBranchIdForRead,
  isEntityVisibleInBranch,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from '../branchScope.js';
import type {
  DynastyFilters,
  CountRow,
  NameRow,
  TagRow,
  DynastyRow,
  DynastyMemberRow,
  DynastyFamilyLinkRow,
  DynastyEventRow,
  DynastyCreateData,
  DynastyUpdateData,
  DynastyMemberCreateData,
  DynastyMemberUpdateData,
  DynastyFamilyLinkCreateData,
  DynastyEventCreateData,
  DynastyEventUpdateData,
} from './dynasty.types.js';
import {
  DYNASTY_UPDATE_MAP,
  MEMBER_UPDATE_MAP,
  EVENT_UPDATE_MAP,
  mapDynastyRow,
  mapDynastyMember,
  mapDynastyFamilyLink,
  mapDynastyEvent,
} from './dynasty.mappers.js';

export class DynastyService {
  static getAll(projectId: number, params: DynastyFilters = {}, branchId?: number) {
    const db = getDb();
    const { search, status, limit = 50, offset = 0 } = params;

    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const scope = branchEntityVisibilitySql(projectId, viewBranch, 'd.created_branch_id', 'd.created_at');

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

    where += scope.sql;
    args.push(...scope.params);

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM dynasties d ${where}`).get(...args) as CountRow;

    const rows = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d
      ${where}
      ORDER BY d.sort_order ASC, d.name ASC
      LIMIT ? OFFSET ?
    `).all(...args, limit, offset) as DynastyRow[];

    return {
      items: rows.map((row) => mapDynastyRow(row)),
      total: totalRow.count,
    };
  }

  static getById(id: number, branchId?: number) {
    const db = getDb();

    const row = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) as member_count
      FROM dynasties d WHERE d.id = ?
    `).get(id) as DynastyRow | undefined;

    if (!row) throw new NotFoundError('Dynasty');

    const vb = effectiveBranchIdForRead(row.project_id, branchId);
    if (!isEntityVisibleInBranch(row.project_id, vb, row.created_branch_id, row.created_at)) {
      throw new NotFoundError('Dynasty');
    }

    const dynasty = mapDynastyRow(row) as ReturnType<typeof mapDynastyRow> & {
      members?: ReturnType<typeof mapDynastyMember>[];
      familyLinks?: ReturnType<typeof mapDynastyFamilyLink>[];
      events?: ReturnType<typeof mapDynastyEvent>[];
      tags?: TagRow[];
      founderName?: string | null;
      currentLeaderName?: string | null;
      heirName?: string | null;
      linkedFactionName?: string | null;
    };

    dynasty.members = (db.prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm JOIN characters c ON c.id = dm.character_id
      WHERE dm.dynasty_id = ? ORDER BY dm.generation ASC, c.name ASC
    `).all(id) as DynastyMemberRow[]).map(mapDynastyMember);

    dynasty.familyLinks = (db.prepare(`
      SELECT fl.*, cs.name as source_character_name, ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id
      WHERE fl.dynasty_id = ?
    `).all(id) as DynastyFamilyLinkRow[]).map(mapDynastyFamilyLink);

    dynasty.events = (db.prepare(`
      SELECT * FROM dynasty_events WHERE dynasty_id = ? ORDER BY sort_order ASC, event_date ASC
    `).all(id) as DynastyEventRow[]).map(mapDynastyEvent);

    dynasty.tags = db.prepare(`
      SELECT t.id, t.name, t.color FROM tags t
      JOIN tag_associations ta ON ta.tag_id = t.id
      WHERE ta.entity_type = 'dynasty' AND ta.entity_id = ?
    `).all(id) as TagRow[];

    if (dynasty.founderId) {
      dynasty.founderName = (db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.founderId) as NameRow | undefined)?.name || null;
    }
    if (dynasty.currentLeaderId) {
      dynasty.currentLeaderName = (db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.currentLeaderId) as NameRow | undefined)?.name || null;
    }
    if (dynasty.heirId) {
      dynasty.heirName = (db.prepare('SELECT name FROM characters WHERE id = ?').get(dynasty.heirId) as NameRow | undefined)?.name || null;
    }
    if (dynasty.linkedFactionId) {
      dynasty.linkedFactionName = (db.prepare('SELECT name FROM factions WHERE id = ?').get(dynasty.linkedFactionId) as NameRow | undefined)?.name || null;
    }

    return dynasty;
  }

  static create(data: DynastyCreateData, requestBranchId?: number) {
    const db = getDb();
    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, data.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(data.projectId, requestBranchId);
    const result = db.prepare(`
      INSERT INTO dynasties (
        project_id, name, motto, description, history, status, color, secondary_color,
        founded_date, extinct_date, founder_id, current_leader_id, heir_id, linked_faction_id, sort_order, created_branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.name, data.motto || '', data.description || '',
      data.history || '', data.status || 'active', data.color || '',
      data.secondaryColor || '', data.foundedDate || '', data.extinctDate || '',
      data.founderId || null, data.currentLeaderId || null,
      data.heirId || null, data.linkedFactionId || null, data.sortOrder || 0,
      createdBranchId,
    );
    const viewBranch = requestBranchId ?? effectiveBranchIdForRead(data.projectId, undefined);
    return this.getById(result.lastInsertRowid as number, viewBranch);
  }

  static update(id: number, data: DynastyUpdateData, branchId?: number) {
    this.getById(id, branchId);
    buildUpdateQuery('dynasties', DYNASTY_UPDATE_MAP, data as Record<string, unknown>, id);
    return this.getById(id, branchId);
  }

  static delete(id: number, branchId?: number) {
    this.getById(id, branchId);
    getDb().prepare('DELETE FROM dynasties WHERE id = ?').run(id);
  }

  static uploadImage(id: number, imagePath: string, branchId?: number) {
    this.getById(id, branchId);
    getDb().prepare(`UPDATE dynasties SET image_path = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id, branchId);
  }

  // ==================== Members ====================

  static addMember(dynastyId: number, data: DynastyMemberCreateData, branchId?: number) {
    this.getById(dynastyId, branchId);
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO dynasty_members (dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(dynastyId, data.characterId, data.generation || 0, data.role || '',
      data.birthDate || '', data.deathDate || '', data.isMainLine !== false ? 1 : 0, data.notes || '');
    return this.getMember(result.lastInsertRowid as number);
  }

  static updateMember(memberId: number, data: DynastyMemberUpdateData) {
    ensureEntityExists('dynasty_members', memberId, 'DynastyMember');
    buildUpdateQuery('dynasty_members', MEMBER_UPDATE_MAP, data as Record<string, unknown>, memberId, { booleanFields: ['isMainLine'], withTimestamp: false });
    return this.getMember(memberId);
  }

  static removeMember(memberId: number) {
    ensureEntityExists('dynasty_members', memberId, 'DynastyMember');
    getDb().prepare('DELETE FROM dynasty_members WHERE id = ?').run(memberId);
  }

  static getMember(memberId: number) {
    const member = getDb().prepare(`
      SELECT dm.*, c.name as character_name, c.image_path as character_image_path, c.status as character_status
      FROM dynasty_members dm JOIN characters c ON c.id = dm.character_id WHERE dm.id = ?
    `).get(memberId) as DynastyMemberRow | undefined;
    if (!member) throw new NotFoundError('DynastyMember');
    return mapDynastyMember(member);
  }

  // ==================== Family Links ====================

  static addFamilyLink(dynastyId: number, data: DynastyFamilyLinkCreateData, branchId?: number) {
    this.getById(dynastyId, branchId);
    const result = getDb().prepare(`
      INSERT INTO dynasty_family_links (dynasty_id, source_character_id, target_character_id, relation_type, custom_label)
      VALUES (?, ?, ?, ?, ?)
    `).run(dynastyId, data.sourceCharacterId, data.targetCharacterId, data.relationType, data.customLabel || '');
    return this.getFamilyLink(result.lastInsertRowid as number);
  }

  static deleteFamilyLink(linkId: number) {
    ensureEntityExists('dynasty_family_links', linkId, 'DynastyFamilyLink');
    getDb().prepare('DELETE FROM dynasty_family_links WHERE id = ?').run(linkId);
  }

  static getFamilyLink(linkId: number) {
    const link = getDb().prepare(`
      SELECT fl.*, cs.name as source_character_name, ct.name as target_character_name
      FROM dynasty_family_links fl
      JOIN characters cs ON cs.id = fl.source_character_id
      JOIN characters ct ON ct.id = fl.target_character_id WHERE fl.id = ?
    `).get(linkId) as DynastyFamilyLinkRow | undefined;
    if (!link) throw new NotFoundError('DynastyFamilyLink');
    return mapDynastyFamilyLink(link);
  }

  // ==================== Events ====================

  static addEvent(dynastyId: number, data: DynastyEventCreateData, branchId?: number) {
    this.getById(dynastyId, branchId);
    const result = getDb().prepare(`
      INSERT INTO dynasty_events (dynasty_id, title, description, event_date, importance, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dynastyId, data.title, data.description || '', data.eventDate, data.importance || 'normal', data.sortOrder || 0);
    return this.getEvent(result.lastInsertRowid as number);
  }

  static updateEvent(eventId: number, data: DynastyEventUpdateData) {
    ensureEntityExists('dynasty_events', eventId, 'DynastyEvent');
    buildUpdateQuery('dynasty_events', EVENT_UPDATE_MAP, data as Record<string, unknown>, eventId, { withTimestamp: false });
    return this.getEvent(eventId);
  }

  static deleteEvent(eventId: number) {
    ensureEntityExists('dynasty_events', eventId, 'DynastyEvent');
    getDb().prepare('DELETE FROM dynasty_events WHERE id = ?').run(eventId);
  }

  static getEvent(eventId: number) {
    const event = getDb().prepare('SELECT * FROM dynasty_events WHERE id = ?').get(eventId) as DynastyEventRow | undefined;
    if (!event) throw new NotFoundError('DynastyEvent');
    return mapDynastyEvent(event);
  }

  static reorderEvents(dynastyId: number, orderedIds: number[], branchId?: number): void {
    this.getById(dynastyId, branchId);

    const db = getDb();
    const placeholders = orderedIds.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT id FROM dynasty_events WHERE dynasty_id = ? AND id IN (${placeholders})`
    ).all(dynastyId, ...orderedIds) as { id: number }[];

    if (rows.length !== orderedIds.length) {
      throw new BadRequestError('Some event IDs do not belong to this dynasty');
    }

    const stmt = db.prepare(`UPDATE dynasty_events SET sort_order = ? WHERE id = ? AND dynasty_id = ?`);
    db.transaction(() => {
      orderedIds.forEach((eventId, index) => {
        stmt.run(index, eventId, dynastyId);
      });
    })();
  }

  // ==================== Graph Layout ====================

  static saveGraphPositions(
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[],
    branchId?: number,
  ) {
    this.getById(dynastyId, branchId);
    const db = getDb();
    const stmt = db.prepare(`UPDATE dynasty_members SET graph_x = ?, graph_y = ? WHERE dynasty_id = ? AND character_id = ?`);
    db.transaction(() => { for (const pos of positions) stmt.run(pos.graphX, pos.graphY, dynastyId, pos.characterId); })();
  }
}

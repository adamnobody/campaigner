import { getDb } from '../db/connection';
import {
  CreateCharacter, UpdateCharacter, Character,
  CreateRelationship, UpdateRelationship, CharacterRelationship,
  CharacterGraph, Pagination, Tag
} from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import { TagService } from './tag.service';

function mapRow(row: any): Character {
  return {
    ...row,
    tags: [],
    level: row.level ?? null,
  };
}

/** Batch-загрузка тегов для списка entity_id за 1 запрос */
function loadTagsBatch(projectId: number, entityType: string, entityIds: number[]): Map<number, Tag[]> {
  const result = new Map<number, Tag[]>();
  if (entityIds.length === 0) return result;

  entityIds.forEach(id => result.set(id, []));

  const db = getDb();
  const placeholders = entityIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT ta.entity_id, t.id, t.name, t.color
    FROM tags t
    JOIN tag_associations ta ON t.id = ta.tag_id
    WHERE ta.entity_type = ? AND ta.entity_id IN (${placeholders}) AND t.project_id = ?
    ORDER BY t.name ASC
  `).all(entityType, ...entityIds, projectId) as any[];

  for (const row of rows) {
    const tags = result.get(row.entity_id);
    if (tags) {
      tags.push({ id: row.id, name: row.name, color: row.color });
    }
  }

  return result;
}

export class CharacterService {
  static getAll(projectId: number, pagination?: Pagination): { items: Character[]; total: number } {
    const db = getDb();
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = pagination || {};
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE project_id = ?';
    const params: any[] = [projectId];

    if (search) {
      whereClause += ' AND (name LIKE ? OR title LIKE ? OR race LIKE ? OR character_class LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const allowedSortColumns: Record<string, string> = {
      name: 'name', createdAt: 'created_at', updatedAt: 'updated_at', status: 'status',
      race: 'race', level: 'level',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'name';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM characters ${whereClause}`).get(...params) as any).count;

    const rows = db.prepare(`
      SELECT id, project_id as projectId, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    // Batch-загрузка тегов — 1 запрос вместо N
    const ids = rows.map(r => r.id);
    const tagsMap = loadTagsBatch(projectId, 'character', ids);

    const items = rows.map(row => {
      const character = mapRow(row);
      character.tags = tagsMap.get(row.id) || [];
      return character;
    });

    return { items, total };
  }

  static getById(id: number): Character {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, project_id as projectId, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters WHERE id = ?
    `).get(id) as any | undefined;

    if (!row) throw new NotFoundError('Character');
    const character = mapRow(row);
    character.tags = TagService.getTagsForEntity(row.projectId, 'character', id);
    return character;
  }

  static create(data: CreateCharacter): Character {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO characters (project_id, name, title, race, character_class, level, status,
                              bio, appearance, personality, backstory, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.name, data.title || '', data.race || '',
      data.characterClass || '', data.level || null, data.status || 'alive',
      data.bio || '', data.appearance || '', data.personality || '',
      data.backstory || '', data.notes || ''
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateCharacter): Character {
    const existing = this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name', title: 'title', race: 'race', characterClass: 'character_class',
      level: 'level', status: 'status', bio: 'bio', appearance: 'appearance',
      personality: 'personality', backstory: 'backstory', notes: 'notes', imagePath: 'image_path',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${column} = ?`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  }

  static updateImage(id: number, imagePath: string): Character {
    this.getById(id);
    const db = getDb();
    db.prepare(`UPDATE characters SET image_path = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id);
  }

  // ==================== Relationships ====================

  static getRelationships(projectId: number): any[] {
    const db = getDb();
    // JOIN для имён персонажей — убираем необходимость дополнительных запросов на фронте
    return db.prepare(`
      SELECT cr.id, cr.project_id as projectId,
             cr.source_character_id as sourceCharacterId,
             cr.target_character_id as targetCharacterId,
             cr.relationship_type as relationshipType,
             cr.custom_label as customLabel, cr.description,
             cr.is_bidirectional as isBidirectional,
             cr.created_at as createdAt,
             sc.name as sourceCharacterName,
             tc.name as targetCharacterName
      FROM character_relationships cr
      LEFT JOIN characters sc ON cr.source_character_id = sc.id
      LEFT JOIN characters tc ON cr.target_character_id = tc.id
      WHERE cr.project_id = ?
    `).all(projectId) as any[];
  }

  static createRelationship(data: CreateRelationship): any {
    const db = getDb();
    this.getById(data.sourceCharacterId);
    this.getById(data.targetCharacterId);

    const result = db.prepare(`
      INSERT INTO character_relationships (project_id, source_character_id, target_character_id,
                                           relationship_type, custom_label, description, is_bidirectional)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.sourceCharacterId, data.targetCharacterId,
      data.relationshipType, data.customLabel || '', data.description || '',
      data.isBidirectional ? 1 : 0
    );

    return db.prepare(`
      SELECT cr.id, cr.project_id as projectId,
             cr.source_character_id as sourceCharacterId,
             cr.target_character_id as targetCharacterId,
             cr.relationship_type as relationshipType,
             cr.custom_label as customLabel, cr.description,
             cr.is_bidirectional as isBidirectional,
             cr.created_at as createdAt,
             sc.name as sourceCharacterName,
             tc.name as targetCharacterName
      FROM character_relationships cr
      LEFT JOIN characters sc ON cr.source_character_id = sc.id
      LEFT JOIN characters tc ON cr.target_character_id = tc.id
      WHERE cr.id = ?
    `).get(result.lastInsertRowid as number);
  }

  static updateRelationship(id: number, data: UpdateRelationship): CharacterRelationship {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM character_relationships WHERE id = ?').get(id);
    if (!existing) throw new NotFoundError('Relationship');

    const fields: string[] = [];
    const values: any[] = [];

    if (data.relationshipType !== undefined) { fields.push('relationship_type = ?'); values.push(data.relationshipType); }
    if (data.customLabel !== undefined) { fields.push('custom_label = ?'); values.push(data.customLabel); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.isBidirectional !== undefined) { fields.push('is_bidirectional = ?'); values.push(data.isBidirectional ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE character_relationships SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return db.prepare(`
      SELECT id, project_id as projectId, source_character_id as sourceCharacterId,
             target_character_id as targetCharacterId, relationship_type as relationshipType,
             custom_label as customLabel, description, is_bidirectional as isBidirectional,
             created_at as createdAt
      FROM character_relationships WHERE id = ?
    `).get(id) as CharacterRelationship;
  }

  static deleteRelationship(id: number): void {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM character_relationships WHERE id = ?').get(id);
    if (!existing) throw new NotFoundError('Relationship');
    db.prepare('DELETE FROM character_relationships WHERE id = ?').run(id);
  }

  // ==================== Character Graph ====================

  static getGraph(projectId: number): CharacterGraph {
    const db = getDb();

    const nodes = db.prepare(`
      SELECT id, name, title, status, image_path as imagePath
      FROM characters WHERE project_id = ?
    `).all(projectId) as any[];

    const edges = db.prepare(`
      SELECT id, source_character_id as source, target_character_id as target,
             relationship_type as relationshipType, custom_label as customLabel,
             is_bidirectional as isBidirectional
      FROM character_relationships WHERE project_id = ?
    `).all(projectId) as any[];

    return { nodes, edges };
  }
}
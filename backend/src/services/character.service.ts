import { getDb } from '../db/connection.js';
import {
  CreateCharacter,
  UpdateCharacter,
  Character,
  CreateRelationship,
  UpdateRelationship,
  CharacterRelationship,
  CharacterGraph,
  Pagination,
} from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler.js';
import { TagService } from './tag.service.js';
import { loadTagsBatch, buildUpdateQuery, ensureEntityExists } from '../utils/dbHelpers.js';

type CharacterStatus = Character['status'];

interface CharacterRow {
  id: number;
  projectId: number;
  name: string;
  title: string;
  race: string;
  characterClass: string;
  level: number | null;
  status: CharacterStatus;
  bio: string;
  appearance: string;
  personality: string;
  backstory: string;
  notes: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CharacterRelationshipRow {
  id: number;
  projectId: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationshipType: string;
  customLabel: string;
  description: string;
  isBidirectional: number | boolean;
  createdAt: string;
  sourceCharacterName?: string;
  targetCharacterName?: string;
}

const CHARACTER_UPDATE_MAP: Record<string, string> = {
  name: 'name',
  title: 'title',
  race: 'race',
  characterClass: 'character_class',
  level: 'level',
  status: 'status',
  bio: 'bio',
  appearance: 'appearance',
  personality: 'personality',
  backstory: 'backstory',
  notes: 'notes',
  imagePath: 'image_path',
};

function mapRow(row: CharacterRow): Character {
  return {
    ...row,
    tags: [],
    level: row.level ?? null,
  };
}

export class CharacterService {
  static getAll(
    projectId: number,
    pagination?: Pagination
  ): { items: Character[]; total: number } {
    const db = getDb();
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = pagination || {};

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE project_id = ?';
    const params: Array<number | string> = [projectId];

    if (search) {
      whereClause += ' AND (name LIKE ? OR title LIKE ? OR race LIKE ? OR character_class LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const allowedSortColumns: Record<string, string> = {
      name: 'name',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      status: 'status',
      race: 'race',
      level: 'level',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'name';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM characters
      ${whereClause}
    `).get(...params) as { count: number };

    const rows = db.prepare(`
      SELECT id, project_id as projectId, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as CharacterRow[];

    const ids = rows.map((row) => row.id);
    const tagsMap = loadTagsBatch(projectId, 'character', ids);

    const items = rows.map((row) => {
      const character = mapRow(row);
      character.tags = tagsMap.get(row.id) || [];
      return character;
    });

    return { items, total: totalRow.count };
  }

  static getById(id: number): Character {
    const db = getDb();

    const row = db.prepare(`
      SELECT id, project_id as projectId, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters
      WHERE id = ?
    `).get(id) as CharacterRow | undefined;

    if (!row) {
      throw new NotFoundError('Character');
    }

    const character = mapRow(row);
    character.tags = TagService.getTagsForEntity(row.projectId, 'character', id);
    return character;
  }

  static create(data: CreateCharacter): Character {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO characters (
        project_id, name, title, race, character_class, level, status,
        bio, appearance, personality, backstory, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.name,
      data.title || '',
      data.race || '',
      data.characterClass || '',
      data.level || null,
      data.status || 'alive',
      data.bio || '',
      data.appearance || '',
      data.personality || '',
      data.backstory || '',
      data.notes || ''
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateCharacter): Character {
    this.getById(id);
    buildUpdateQuery('characters', CHARACTER_UPDATE_MAP, data as Record<string, unknown>, id);
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
    db.prepare(`
      UPDATE characters
      SET image_path = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(imagePath, id);

    return this.getById(id);
  }

  // ==================== Relationships ====================

  static getRelationships(projectId: number): CharacterRelationshipRow[] {
    const db = getDb();

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
    `).all(projectId) as CharacterRelationshipRow[];
  }

  static createRelationship(data: CreateRelationship): CharacterRelationshipRow {
    const db = getDb();

    this.getById(data.sourceCharacterId);
    this.getById(data.targetCharacterId);

    const result = db.prepare(`
      INSERT INTO character_relationships (
        project_id, source_character_id, target_character_id,
        relationship_type, custom_label, description, is_bidirectional
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.sourceCharacterId,
      data.targetCharacterId,
      data.relationshipType,
      data.customLabel || '',
      data.description || '',
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
    `).get(result.lastInsertRowid as number) as CharacterRelationshipRow;
  }

  static updateRelationship(id: number, data: UpdateRelationship): CharacterRelationship {
    ensureEntityExists('character_relationships', id, 'Relationship');

    buildUpdateQuery(
      'character_relationships',
      {
        relationshipType: 'relationship_type',
        customLabel: 'custom_label',
        description: 'description',
        isBidirectional: 'is_bidirectional',
      },
      data as Record<string, unknown>,
      id,
      { booleanFields: ['isBidirectional'], withTimestamp: false }
    );

    const db = getDb();
    return db.prepare(`
      SELECT id, project_id as projectId, source_character_id as sourceCharacterId,
             target_character_id as targetCharacterId, relationship_type as relationshipType,
             custom_label as customLabel, description, is_bidirectional as isBidirectional,
             created_at as createdAt
      FROM character_relationships
      WHERE id = ?
    `).get(id) as CharacterRelationship;
  }

  static deleteRelationship(id: number): void {
    ensureEntityExists('character_relationships', id, 'Relationship');
    const db = getDb();
    db.prepare('DELETE FROM character_relationships WHERE id = ?').run(id);
  }

  // ==================== Character Graph ====================

  static getGraph(projectId: number): CharacterGraph {
    const db = getDb();

    const nodes = db.prepare(`
      SELECT id, name, title, status, image_path as imagePath
      FROM characters
      WHERE project_id = ?
    `).all(projectId) as CharacterGraph['nodes'];

    const edges = db.prepare(`
      SELECT id, source_character_id as source, target_character_id as target,
             relationship_type as relationshipType, custom_label as customLabel,
             is_bidirectional as isBidirectional
      FROM character_relationships
      WHERE project_id = ?
    `).all(projectId) as CharacterGraph['edges'];

    return { nodes, edges };
  }
}
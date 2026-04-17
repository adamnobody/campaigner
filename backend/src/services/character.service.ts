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
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { TagService } from './tag.service.js';
import { loadTagsBatch, buildUpdateQuery, ensureEntityExists } from '../utils/dbHelpers.js';

type CharacterStatus = Character['status'];

interface CharacterRow {
  id: number;
  projectId: number;
  stateId: number | null;
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
  stateId: 'state_id',
};

function mapRow(row: CharacterRow): Character {
  return {
    ...row,
    tags: [],
    factionIds: [],
    level: row.level ?? null,
    stateId: row.stateId ?? null,
  };
}

type FactionType = 'state' | 'faction';

interface FactionValidationRow {
  id: number;
  project_id: number;
  kind: FactionType;
}

export class CharacterService {
  private static readonly DEFAULT_MEMBER_ROLE = 'Член фракции';

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

  private static ensureFactionMemberLink(
    db: ReturnType<typeof getDb>,
    factionId: number,
    characterId: number
  ): void {
    const existing = db.prepare(`
      SELECT id
      FROM faction_members
      WHERE faction_id = ? AND character_id = ?
    `).get(factionId, characterId) as { id: number } | undefined;
    if (existing) {
      return;
    }

    db.prepare(`
      INSERT OR IGNORE INTO faction_members (
        faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes
      )
      VALUES (?, ?, ?, ?, '', '', 1, '')
    `).run(
      factionId,
      characterId,
      this.getLowestRankIdForFaction(db, factionId),
      this.DEFAULT_MEMBER_ROLE
    );
  }

  private static getFactionIdsByCharacterIds(characterIds: number[]): Map<number, number[]> {
    const map = new Map<number, number[]>();
    if (characterIds.length === 0) {
      return map;
    }

    const db = getDb();
    const placeholders = characterIds.map(() => '?').join(', ');
    const rows = db
      .prepare(
        `
        SELECT character_id as characterId, faction_id as factionId
        FROM character_factions
        WHERE character_id IN (${placeholders})
        ORDER BY character_id ASC, faction_id ASC
      `
      )
      .all(...characterIds) as Array<{ characterId: number; factionId: number }>;

    for (const row of rows) {
      if (!map.has(row.characterId)) {
        map.set(row.characterId, []);
      }
      map.get(row.characterId)!.push(row.factionId);
    }

    return map;
  }

  private static validateFactionType(
    db: ReturnType<typeof getDb>,
    factionId: number,
    projectId: number,
    expectedType: FactionType
  ): void {
    const faction = db
      .prepare('SELECT id, project_id, kind FROM factions WHERE id = ?')
      .get(factionId) as FactionValidationRow | undefined;

    if (!faction) {
      throw new BadRequestError(`Faction with id ${factionId} not found`);
    }
    if (faction.project_id !== projectId) {
      throw new BadRequestError(`Faction with id ${factionId} belongs to another project`);
    }
    if (faction.kind !== expectedType) {
      if (expectedType === 'state') {
        throw new BadRequestError(`Faction with id ${factionId} is not a state`);
      }
      throw new BadRequestError(`Faction with id ${factionId} is not a faction`);
    }
  }

  private static syncCharacterAffiliations(
    db: ReturnType<typeof getDb>,
    characterId: number,
    projectId: number,
    stateId: number | null | undefined,
    factionIds: number[] | undefined
  ): void {
    const shouldUpdateState = stateId !== undefined;
    const normalizedStateId = typeof stateId === 'number' ? stateId : null;
    const normalizedFactionIds = Array.isArray(factionIds)
      ? Array.from(new Set(factionIds.filter((id) => Number.isInteger(id) && id > 0)))
      : undefined;

    if (shouldUpdateState && normalizedStateId !== null) {
      this.validateFactionType(db, normalizedStateId, projectId, 'state');
    }

    if (normalizedFactionIds) {
      for (const factionId of normalizedFactionIds) {
        this.validateFactionType(db, factionId, projectId, 'faction');
      }
    }

    if (shouldUpdateState) {
      db.prepare(`
        UPDATE characters
        SET state_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(normalizedStateId, characterId);
    }

    if (normalizedFactionIds) {
      const existingRows = db.prepare(`
        SELECT faction_id as factionId
        FROM character_factions
        WHERE character_id = ?
      `).all(characterId) as Array<{ factionId: number }>;
      const existingFactionIds = new Set(existingRows.map((row) => row.factionId));
      const nextFactionIds = new Set(normalizedFactionIds);

      for (const factionId of existingFactionIds) {
        if (nextFactionIds.has(factionId)) {
          continue;
        }
        db.prepare(`
          DELETE FROM character_factions
          WHERE character_id = ? AND faction_id = ?
        `).run(characterId, factionId);
        db.prepare(`
          DELETE FROM faction_members
          WHERE character_id = ? AND faction_id = ?
        `).run(characterId, factionId);
      }

      for (const factionId of nextFactionIds) {
        if (!existingFactionIds.has(factionId)) {
          db.prepare(`
            INSERT OR IGNORE INTO character_factions (character_id, faction_id)
            VALUES (?, ?)
          `).run(characterId, factionId);
        }
        this.ensureFactionMemberLink(db, factionId, characterId);
      }
    }
  }

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
             level, status, bio, appearance, personality, backstory, notes, state_id as stateId,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as CharacterRow[];

    const ids = rows.map((row) => row.id);
    const tagsMap = loadTagsBatch(projectId, 'character', ids);
    const factionIdsMap = this.getFactionIdsByCharacterIds(ids);

    const items = rows.map((row) => {
      const character = mapRow(row);
      character.tags = tagsMap.get(row.id) || [];
      character.factionIds = factionIdsMap.get(row.id) || [];
      return character;
    });

    return { items, total: totalRow.count };
  }

  static getById(id: number): Character {
    const db = getDb();

    const row = db.prepare(`
      SELECT id, project_id as projectId, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes, state_id as stateId,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters
      WHERE id = ?
    `).get(id) as CharacterRow | undefined;

    if (!row) {
      throw new NotFoundError('Character');
    }

    const character = mapRow(row);
    character.tags = TagService.getTagsForEntity(row.projectId, 'character', id);
    character.factionIds = this.getFactionIdsByCharacterIds([id]).get(id) || [];
    return character;
  }

  static create(data: CreateCharacter): Character {
    const db = getDb();
    const run = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO characters (
          project_id, name, title, race, character_class, level, status,
          bio, appearance, personality, backstory, notes, state_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.notes || '',
        data.stateId ?? null
      );

      const characterId = result.lastInsertRowid as number;
      this.syncCharacterAffiliations(db, characterId, data.projectId, data.stateId, data.factionIds);
      return characterId;
    });

    return this.getById(run());
  }

  static update(id: number, data: UpdateCharacter): Character {
    const current = this.getById(id);
    const { factionIds, ...characterData } = data;

    const db = getDb();
    const run = db.transaction(() => {
      buildUpdateQuery('characters', CHARACTER_UPDATE_MAP, characterData as Record<string, unknown>, id);
      this.syncCharacterAffiliations(db, id, current.projectId, data.stateId, factionIds);
    });
    run();

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
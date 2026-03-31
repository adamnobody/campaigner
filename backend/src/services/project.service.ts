import { getDb } from '../db/connection';
import { CreateProject, UpdateProject, Project } from '@campaigner/shared';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { MapService } from './map.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

interface ExportCharacterRow {
  id: number;
  name: string;
  title: string;
  race: string;
  characterClass: string;
  level: number | null;
  status: string;
  bio: string;
  appearance: string;
  personality: string;
  backstory: string;
  notes: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportRelationshipRow {
  id: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationshipType: string;
  customLabel: string;
  description: string;
  isBidirectional: number | boolean;
  createdAt: string;
}

interface ExportNoteRow {
  id: number;
  folderId: number | null;
  title: string;
  content: string;
  format: string;
  noteType: string;
  isPinned: number | boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportFolderRow {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

interface ExportMapRow {
  id: number;
  projectId: number;
  parentMapId: number | null;
  parentMarkerId: number | null;
  name: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportMarkerRow {
  id: number;
  mapId: number;
  title: string;
  description: string;
  positionX: number;
  positionY: number;
  color: string;
  icon: string;
  linkedNoteId: number | null;
  childMapId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportTimelineEventRow {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  sortOrder: number;
  era: string;
  linkedNoteId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportTagRow {
  id: number;
  name: string;
  color: string;
}

interface ExportTagAssociationRow {
  tagId: number;
  entityType: string;
  entityId: number;
}

interface ImportedProjectPayload {
  version: string;
  project: {
    name: string;
    description?: string;
    status?: string;
    mapImageBase64?: string | null;
  };
  characters?: Array<ExportCharacterRow & { imageBase64?: string | null }>;
  relationships?: ExportRelationshipRow[];
  notes?: ExportNoteRow[];
  folders?: ExportFolderRow[];
  maps?: ExportMapRow[];
  markers?: ExportMarkerRow[];
  timelineEvents?: ExportTimelineEventRow[];
  tags?: ExportTagRow[];
  tagAssociations?: ExportTagAssociationRow[];
}

function readFileAsBase64(relativePath: string | null): string | null {
  if (!relativePath) {
    return null;
  }

  try {
    const normalizedPath = relativePath.replace(/^\/+/, '');
    const fullPath = path.join(DATA_DIR, normalizedPath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(relativePath).toLowerCase().replace('.', '');

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    const mime = mimeMap[ext] || 'application/octet-stream';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

function saveBase64ToFile(base64: string, subDir: string): string | null {
  try {
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
      return null;
    }

    const mime = match[1];
    const data = match[2];

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    const ext = extMap[mime] || 'png';
    const filename = `${uuidv4()}.${ext}`;
    const dirPath = path.join(DATA_DIR, 'uploads', subDir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    return `/uploads/${subDir}/${filename}`;
  } catch {
    return null;
  }
}

export class ProjectService {
  static getAll(): Project[] {
    const db = getDb();

    return db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects
      ORDER BY updated_at DESC
    `).all() as Project[];
  }

  static getById(id: number): Project {
    const db = getDb();

    const row = db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects
      WHERE id = ?
    `).get(id) as Project | undefined;

    if (!row) {
      throw new NotFoundError('Project');
    }

    return row;
  }

  static create(data: CreateProject): Project {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO projects (name, description, status)
      VALUES (?, ?, ?)
    `).run(
      data.name,
      data.description || '',
      data.status || 'active'
    );

    const projectId = result.lastInsertRowid as number;
    const mapService = new MapService();
    mapService.createRootMapForProject(projectId);

    return this.getById(projectId);
  }

  static update(id: number, data: UpdateProject): Project {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.mapImagePath !== undefined) {
      fields.push('map_image_path = ?');
      values.push(data.mapImagePath);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  static updateMapImage(id: number, imagePath: string): Project {
    this.getById(id);
    const db = getDb();

    db.prepare(`
      UPDATE projects
      SET map_image_path = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(imagePath, id);

    return this.getById(id);
  }

  static exportProject(id: number): ImportedProjectPayload & {
    exportedAt: string;
    project: ImportedProjectPayload['project'];
  } {
    const db = getDb();
    const project = this.getById(id);

    const characters = db.prepare(`
      SELECT id, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters
      WHERE project_id = ?
    `).all(id) as ExportCharacterRow[];

    const relationships = db.prepare(`
      SELECT id, source_character_id as sourceCharacterId,
             target_character_id as targetCharacterId,
             relationship_type as relationshipType,
             custom_label as customLabel, description,
             is_bidirectional as isBidirectional,
             created_at as createdAt
      FROM character_relationships
      WHERE project_id = ?
    `).all(id) as ExportRelationshipRow[];

    const notes = db.prepare(`
      SELECT id, folder_id as folderId, title, content, format,
             note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE project_id = ?
    `).all(id) as ExportNoteRow[];

    const folders = db.prepare(`
      SELECT id, name, parent_id as parentId, created_at as createdAt
      FROM folders
      WHERE project_id = ?
    `).all(id) as ExportFolderRow[];

    const maps = db.prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
             parent_marker_id as parentMarkerId, name, image_path as imagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM maps
      WHERE project_id = ?
    `).all(id) as ExportMapRow[];

    const markers = db.prepare(`
      SELECT mm.id, mm.map_id as mapId, mm.title, mm.description,
             mm.position_x as positionX, mm.position_y as positionY,
             mm.color, mm.icon, mm.linked_note_id as linkedNoteId,
             mm.child_map_id as childMapId,
             mm.created_at as createdAt, mm.updated_at as updatedAt
      FROM map_markers mm
      JOIN maps m ON mm.map_id = m.id
      WHERE m.project_id = ?
    `).all(id) as ExportMarkerRow[];

    const timelineEvents = db.prepare(`
      SELECT id, title, description, event_date as eventDate,
             sort_order as sortOrder, era,
             linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM timeline_events
      WHERE project_id = ?
    `).all(id) as ExportTimelineEventRow[];

    const tags = db.prepare(`
      SELECT id, name, color
      FROM tags
      WHERE project_id = ?
    `).all(id) as ExportTagRow[];

    const tagAssociations = db.prepare(`
      SELECT ta.tag_id as tagId, ta.entity_type as entityType, ta.entity_id as entityId
      FROM tag_associations ta
      JOIN tags t ON ta.tag_id = t.id
      WHERE t.project_id = ?
    `).all(id) as ExportTagAssociationRow[];

    const mapImageBase64 = readFileAsBase64(project.mapImagePath || null);

    const charactersWithImages = characters.map((character) => ({
      ...character,
      imageBase64: readFileAsBase64(character.imagePath),
    }));

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        mapImageBase64,
      },
      characters: charactersWithImages,
      relationships,
      notes,
      folders,
      maps,
      markers,
      timelineEvents,
      tags,
      tagAssociations,
    };
  }

  static importProject(data: ImportedProjectPayload): Project {
    const db = getDb();

    if (!data.version || !data.project?.name) {
      throw new ValidationError('Invalid export file format');
    }

    const transaction = db.transaction(() => {
      const projectResult = db.prepare(`
        INSERT INTO projects (name, description, status)
        VALUES (?, ?, ?)
      `).run(
        `${data.project.name} (импорт)`,
        data.project.description || '',
        data.project.status || 'active'
      );

      const projectId = projectResult.lastInsertRowid as number;

      const mapService = new MapService();
      mapService.createRootMapForProject(projectId);

      if (data.project.mapImageBase64) {
        const mapPath = saveBase64ToFile(data.project.mapImageBase64, 'maps');
        if (mapPath) {
          db.prepare('UPDATE projects SET map_image_path = ? WHERE id = ?').run(mapPath, projectId);
        }
      }

      const folderIdMap = new Map<number, number>();
      const characterIdMap = new Map<number, number>();
      const noteIdMap = new Map<number, number>();
      const tagIdMap = new Map<number, number>();
      const mapIdMap = new Map<number, number>();

      if (data.folders?.length) {
        for (const folder of data.folders) {
          const result = db.prepare(`
            INSERT INTO folders (project_id, name, parent_id)
            VALUES (?, ?, NULL)
          `).run(projectId, folder.name);

          folderIdMap.set(folder.id, result.lastInsertRowid as number);
        }

        for (const folder of data.folders) {
          if (folder.parentId && folderIdMap.has(folder.parentId)) {
            db.prepare('UPDATE folders SET parent_id = ? WHERE id = ?').run(
              folderIdMap.get(folder.parentId),
              folderIdMap.get(folder.id)
            );
          }
        }
      }

      if (data.maps?.length) {
        for (const map of data.maps) {
          const newParentMapId = map.parentMapId
            ? (mapIdMap.get(map.parentMapId) || null)
            : null;

          const result = db.prepare(`
            INSERT INTO maps (project_id, parent_map_id, parent_marker_id, name, image_path)
            VALUES (?, ?, NULL, ?, ?)
          `).run(
            projectId,
            newParentMapId,
            map.name,
            map.imagePath || null
          );

          mapIdMap.set(map.id, result.lastInsertRowid as number);
        }
      }

      if (data.tags?.length) {
        for (const tag of data.tags) {
          const result = db.prepare(`
            INSERT INTO tags (project_id, name, color)
            VALUES (?, ?, ?)
          `).run(
            projectId,
            tag.name,
            tag.color || '#808080'
          );

          tagIdMap.set(tag.id, result.lastInsertRowid as number);
        }
      }

      if (data.characters?.length) {
        for (const character of data.characters) {
          let newImagePath: string | null = null;

          if (character.imageBase64) {
            newImagePath = saveBase64ToFile(character.imageBase64, 'characters');
          }

          const result = db.prepare(`
            INSERT INTO characters (
              project_id, name, title, race, character_class,
              level, status, bio, appearance, personality, backstory, notes, image_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId,
            character.name,
            character.title || '',
            character.race || '',
            character.characterClass || '',
            character.level || null,
            character.status || 'alive',
            character.bio || '',
            character.appearance || '',
            character.personality || '',
            character.backstory || '',
            character.notes || '',
            newImagePath
          );

          characterIdMap.set(character.id, result.lastInsertRowid as number);
        }
      }

      if (data.notes?.length) {
        for (const note of data.notes) {
          const newFolderId = note.folderId
            ? (folderIdMap.get(note.folderId) || null)
            : null;

          const result = db.prepare(`
            INSERT INTO notes (project_id, folder_id, title, content, format, note_type, is_pinned)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId,
            newFolderId,
            note.title,
            note.content || '',
            note.format || 'md',
            note.noteType || 'note',
            note.isPinned ? 1 : 0
          );

          noteIdMap.set(note.id, result.lastInsertRowid as number);
        }
      }

      if (data.relationships?.length) {
        for (const relationship of data.relationships) {
          const newSource = characterIdMap.get(relationship.sourceCharacterId);
          const newTarget = characterIdMap.get(relationship.targetCharacterId);

          if (newSource && newTarget) {
            db.prepare(`
              INSERT INTO character_relationships (
                project_id, source_character_id, target_character_id,
                relationship_type, custom_label, description, is_bidirectional
              )
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
              projectId,
              newSource,
              newTarget,
              relationship.relationshipType,
              relationship.customLabel || '',
              relationship.description || '',
              relationship.isBidirectional ? 1 : 0
            );
          }
        }
      }

      if (data.markers?.length) {
        for (const marker of data.markers) {
          const newLinkedNoteId = marker.linkedNoteId
            ? (noteIdMap.get(marker.linkedNoteId) || null)
            : null;

          const newChildMapId = marker.childMapId
            ? (mapIdMap.get(marker.childMapId) || null)
            : null;

          const newMapId = marker.mapId
            ? (mapIdMap.get(marker.mapId) || null)
            : null;

          if (newMapId) {
            db.prepare(`
              INSERT INTO map_markers (
                map_id, title, description, position_x, position_y,
                color, icon, linked_note_id, child_map_id
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              newMapId,
              marker.title,
              marker.description || '',
              marker.positionX,
              marker.positionY,
              marker.color || '#FF6B6B',
              marker.icon || 'custom',
              newLinkedNoteId,
              newChildMapId
            );
          }
        }
      }

      if (data.timelineEvents?.length) {
        for (const event of data.timelineEvents) {
          const newLinkedNoteId = event.linkedNoteId
            ? (noteIdMap.get(event.linkedNoteId) || null)
            : null;

          db.prepare(`
            INSERT INTO timeline_events (
              project_id, title, description, event_date,
              sort_order, era, linked_note_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId,
            event.title,
            event.description || '',
            event.eventDate,
            event.sortOrder || 0,
            event.era || '',
            newLinkedNoteId
          );
        }
      }

      if (data.tagAssociations?.length) {
        const insertTagAssociation = db.prepare(`
          INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id)
          VALUES (?, ?, ?)
        `);

        for (const tagAssociation of data.tagAssociations) {
          const newTagId = tagIdMap.get(tagAssociation.tagId);

          if (!newTagId) {
            continue;
          }

          let newEntityId: number | undefined;

          if (tagAssociation.entityType === 'character') {
            newEntityId = characterIdMap.get(tagAssociation.entityId);
          } else if (tagAssociation.entityType === 'note') {
            newEntityId = noteIdMap.get(tagAssociation.entityId);
          }

          if (newEntityId) {
            insertTagAssociation.run(newTagId, tagAssociation.entityType, newEntityId);
          }
        }
      }

      return projectId;
    });

    const newProjectId = transaction();
    return this.getById(newProjectId);
  }
}

import { getDb } from '../db/connection';
import { CreateProject, UpdateProject, Project } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

function readFileAsBase64(relativePath: string | null): string | null {
  if (!relativePath) return null;
  try {
    const fullPath = path.join(DATA_DIR, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(relativePath).toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      svg: 'image/svg+xml', webp: 'image/webp', gif: 'image/gif',
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
    if (!match) return null;

    const mime = match[1];
    const data = match[2];
    const extMap: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg',
      'image/webp': 'webp', 'image/gif': 'gif',
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
    const rows = db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects ORDER BY updated_at DESC
    `).all() as Project[];
    return rows;
  }

  static getById(id: number): Project {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects WHERE id = ?
    `).get(id) as Project | undefined;

    if (!row) throw new NotFoundError('Project');
    return row;
  }

  static create(data: CreateProject): Project {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO projects (name, description, status)
      VALUES (?, ?, ?)
    `).run(data.name, data.description || '', data.status || 'active');

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateProject): Project {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.mapImagePath !== undefined) { fields.push('map_image_path = ?'); values.push(data.mapImagePath); }

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
    db.prepare(`UPDATE projects SET map_image_path = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id);
  }

  // ==================== Export ====================

  static exportProject(id: number): any {
    const db = getDb();
    const project = this.getById(id);

    const characters = db.prepare(`
      SELECT id, name, title, race, character_class as characterClass,
             level, status, bio, appearance, personality, backstory, notes,
             image_path as imagePath, created_at as createdAt, updated_at as updatedAt
      FROM characters WHERE project_id = ?
    `).all(id) as any[];

    const relationships = db.prepare(`
      SELECT id, source_character_id as sourceCharacterId,
             target_character_id as targetCharacterId,
             relationship_type as relationshipType,
             custom_label as customLabel, description,
             is_bidirectional as isBidirectional,
             created_at as createdAt
      FROM character_relationships WHERE project_id = ?
    `).all(id) as any[];

    const notes = db.prepare(`
      SELECT id, folder_id as folderId, title, content, format,
             note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes WHERE project_id = ?
    `).all(id) as any[];

    const folders = db.prepare(`
      SELECT id, name, parent_id as parentId, created_at as createdAt
      FROM folders WHERE project_id = ?
    `).all(id) as any[];

    const markers = db.prepare(`
      SELECT id, title, description, position_x as positionX, position_y as positionY,
             color, icon, linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE project_id = ?
    `).all(id) as any[];

    const timelineEvents = db.prepare(`
      SELECT id, title, description, event_date as eventDate,
             sort_order as sortOrder, era,
             linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM timeline_events WHERE project_id = ?
    `).all(id) as any[];

    const tags = db.prepare(`
      SELECT id, name, color FROM tags WHERE project_id = ?
    `).all(id) as any[];

    const tagAssociations = db.prepare(`
      SELECT ta.tag_id as tagId, ta.entity_type as entityType, ta.entity_id as entityId
      FROM tag_associations ta
      JOIN tags t ON ta.tag_id = t.id
      WHERE t.project_id = ?
    `).all(id) as any[];

    // Encode images as base64
    const mapImageBase64 = readFileAsBase64(project.mapImagePath || null);

    const charactersWithImages = characters.map(ch => ({
      ...ch,
      imageBase64: readFileAsBase64(ch.imagePath),
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
      markers,
      timelineEvents,
      tags,
      tagAssociations,
    };
  }

  // ==================== Import ====================

  static importProject(data: any): Project {
    const db = getDb();

    if (!data.version || !data.project?.name) {
      throw new Error('Invalid export file format');
    }

    const transaction = db.transaction(() => {
      // 1. Create project
      const projectResult = db.prepare(`
        INSERT INTO projects (name, description, status)
        VALUES (?, ?, ?)
      `).run(
        data.project.name + ' (импорт)',
        data.project.description || '',
        data.project.status || 'active'
      );
      const projectId = projectResult.lastInsertRowid as number;

      // Restore map image
      if (data.project.mapImageBase64) {
        const mapPath = saveBase64ToFile(data.project.mapImageBase64, 'maps');
        if (mapPath) {
          db.prepare(`UPDATE projects SET map_image_path = ? WHERE id = ?`).run(mapPath, projectId);
        }
      }

      // ID maps: old ID → new ID
      const folderIdMap = new Map<number, number>();
      const characterIdMap = new Map<number, number>();
      const noteIdMap = new Map<number, number>();
      const tagIdMap = new Map<number, number>();

      // 2. Folders
      if (data.folders?.length) {
        for (const folder of data.folders) {
          const r = db.prepare(`
            INSERT INTO folders (project_id, name, parent_id) VALUES (?, ?, NULL)
          `).run(projectId, folder.name);
          folderIdMap.set(folder.id, r.lastInsertRowid as number);
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

      // 3. Tags
      if (data.tags?.length) {
        for (const tag of data.tags) {
          const r = db.prepare(`
            INSERT INTO tags (project_id, name, color) VALUES (?, ?, ?)
          `).run(projectId, tag.name, tag.color || '#808080');
          tagIdMap.set(tag.id, r.lastInsertRowid as number);
        }
      }

      // 4. Characters (with image restore)
      if (data.characters?.length) {
        for (const ch of data.characters) {
          let newImagePath: string | null = null;
          if (ch.imageBase64) {
            newImagePath = saveBase64ToFile(ch.imageBase64, 'characters');
          }

          const r = db.prepare(`
            INSERT INTO characters (project_id, name, title, race, character_class,
                                    level, status, bio, appearance, personality, backstory, notes, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId, ch.name, ch.title || '', ch.race || '',
            ch.characterClass || '', ch.level || null, ch.status || 'alive',
            ch.bio || '', ch.appearance || '', ch.personality || '',
            ch.backstory || '', ch.notes || '', newImagePath
          );
          characterIdMap.set(ch.id, r.lastInsertRowid as number);
        }
      }

      // 5. Notes
      if (data.notes?.length) {
        for (const note of data.notes) {
          const newFolderId = note.folderId ? (folderIdMap.get(note.folderId) || null) : null;
          const r = db.prepare(`
            INSERT INTO notes (project_id, folder_id, title, content, format, note_type, is_pinned)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId, newFolderId, note.title,
            note.content || '', note.format || 'md',
            note.noteType || 'note', note.isPinned ? 1 : 0
          );
          noteIdMap.set(note.id, r.lastInsertRowid as number);
        }
      }

      // 6. Relationships
      if (data.relationships?.length) {
        for (const rel of data.relationships) {
          const newSource = characterIdMap.get(rel.sourceCharacterId);
          const newTarget = characterIdMap.get(rel.targetCharacterId);
          if (newSource && newTarget) {
            db.prepare(`
              INSERT INTO character_relationships (project_id, source_character_id, target_character_id,
                                                   relationship_type, custom_label, description, is_bidirectional)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
              projectId, newSource, newTarget,
              rel.relationshipType, rel.customLabel || '',
              rel.description || '', rel.isBidirectional ? 1 : 0
            );
          }
        }
      }

      // 7. Markers
      if (data.markers?.length) {
        for (const m of data.markers) {
          const newLinkedNoteId = m.linkedNoteId ? (noteIdMap.get(m.linkedNoteId) || null) : null;
          db.prepare(`
            INSERT INTO map_markers (project_id, title, description, position_x, position_y,
                                     color, icon, linked_note_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId, m.title, m.description || '',
            m.positionX, m.positionY, m.color || '#FF6B6B',
            m.icon || 'custom', newLinkedNoteId
          );
        }
      }

      // 8. Timeline events
      if (data.timelineEvents?.length) {
        for (const ev of data.timelineEvents) {
          const newLinkedNoteId = ev.linkedNoteId ? (noteIdMap.get(ev.linkedNoteId) || null) : null;
          db.prepare(`
            INSERT INTO timeline_events (project_id, title, description, event_date,
                                         sort_order, era, linked_note_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId, ev.title, ev.description || '',
            ev.eventDate, ev.sortOrder || 0, ev.era || '',
            newLinkedNoteId
          );
        }
      }

      // 9. Tag associations
      if (data.tagAssociations?.length) {
        const insertTA = db.prepare(`
          INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id) VALUES (?, ?, ?)
        `);
        for (const ta of data.tagAssociations) {
          const newTagId = tagIdMap.get(ta.tagId);
          if (!newTagId) continue;

          let newEntityId: number | undefined;
          if (ta.entityType === 'character') newEntityId = characterIdMap.get(ta.entityId);
          else if (ta.entityType === 'note') newEntityId = noteIdMap.get(ta.entityId);

          if (newEntityId) {
            insertTA.run(newTagId, ta.entityType, newEntityId);
          }
        }
      }

      return projectId;
    });

    const newProjectId = transaction();
    return this.getById(newProjectId);
  }
}
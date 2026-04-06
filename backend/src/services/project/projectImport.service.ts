import { getDb } from '../../db/connection';
import { ValidationError } from '../../middleware/errorHandler';
import { MapService } from '../map.service.js';
import { ProjectService } from '../project.service';
import { saveBase64ToFile } from './assetHelpers';
import type { ImportedProjectPayload } from './project.types';
import type { Project } from '@campaigner/shared';

export function importProject(data: ImportedProjectPayload): Project {
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

    db.prepare(`
      INSERT INTO scenario_branches (project_id, name, is_main)
      VALUES (?, 'Каноничная ветвь', 1)
    `).run(projectId);

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
          INSERT INTO folders (project_id, name, parent_id) VALUES (?, ?, NULL)
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
        `).run(projectId, newParentMapId, map.name, map.imagePath || null);

        mapIdMap.set(map.id, result.lastInsertRowid as number);
      }
    }

    if (data.tags?.length) {
      for (const tag of data.tags) {
        const result = db.prepare(`
          INSERT INTO tags (project_id, name, color) VALUES (?, ?, ?)
        `).run(projectId, tag.name, tag.color || '#808080');
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      for (const rel of data.relationships) {
        const newSource = characterIdMap.get(rel.sourceCharacterId);
        const newTarget = characterIdMap.get(rel.targetCharacterId);

        if (newSource && newTarget) {
          db.prepare(`
            INSERT INTO character_relationships (
              project_id, source_character_id, target_character_id,
              relationship_type, custom_label, description, is_bidirectional
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            projectId, newSource, newTarget,
            rel.relationshipType, rel.customLabel || '',
            rel.description || '', rel.isBidirectional ? 1 : 0
          );
        }
      }
    }

    if (data.markers?.length) {
      for (const marker of data.markers) {
        const newLinkedNoteId = marker.linkedNoteId ? (noteIdMap.get(marker.linkedNoteId) || null) : null;
        const newChildMapId = marker.childMapId ? (mapIdMap.get(marker.childMapId) || null) : null;
        const newMapId = marker.mapId ? (mapIdMap.get(marker.mapId) || null) : null;

        if (newMapId) {
          db.prepare(`
            INSERT INTO map_markers (
              map_id, title, description, position_x, position_y,
              color, icon, linked_note_id, child_map_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newMapId, marker.title, marker.description || '',
            marker.positionX, marker.positionY,
            marker.color || '#FF6B6B', marker.icon || 'custom',
            newLinkedNoteId, newChildMapId
          );
        }
      }
    }

    if (data.timelineEvents?.length) {
      for (const event of data.timelineEvents) {
        const newLinkedNoteId = event.linkedNoteId ? (noteIdMap.get(event.linkedNoteId) || null) : null;

        db.prepare(`
          INSERT INTO timeline_events (
            project_id, title, description, event_date,
            sort_order, era, linked_note_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, event.title, event.description || '',
          event.eventDate, event.sortOrder || 0,
          event.era || '', newLinkedNoteId
        );
      }
    }

    if (data.tagAssociations?.length) {
      const insertTagAssociation = db.prepare(`
        INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id) VALUES (?, ?, ?)
      `);

      for (const ta of data.tagAssociations) {
        const newTagId = tagIdMap.get(ta.tagId);
        if (!newTagId) continue;

        let newEntityId: number | undefined;
        if (ta.entityType === 'character') {
          newEntityId = characterIdMap.get(ta.entityId);
        } else if (ta.entityType === 'note') {
          newEntityId = noteIdMap.get(ta.entityId);
        }

        if (newEntityId) {
          insertTagAssociation.run(newTagId, ta.entityType, newEntityId);
        }
      }
    }

    return projectId;
  });

  const newProjectId = transaction();
  return ProjectService.getById(newProjectId);
}

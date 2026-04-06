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
    const markerIdMap = new Map<number, number>();
    const timelineEventIdMap = new Map<number, number>();
    const dogmaIdMap = new Map<number, number>();
    const factionIdMap = new Map<number, number>();
    const factionRankIdMap = new Map<number, number>();
    const dynastyIdMap = new Map<number, number>();

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
          const result = db.prepare(`
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
          markerIdMap.set(marker.id, result.lastInsertRowid as number);
        }
      }

      if (data.maps?.length) {
        for (const map of data.maps) {
          if (!map.parentMarkerId) continue;
          const newMapId = mapIdMap.get(map.id);
          const newParentMarkerId = markerIdMap.get(map.parentMarkerId);
          if (!newMapId || !newParentMarkerId) continue;
          db.prepare('UPDATE maps SET parent_marker_id = ? WHERE id = ?').run(newParentMarkerId, newMapId);
        }
      }
    }

    if (data.timelineEvents?.length) {
      for (const event of data.timelineEvents) {
        const newLinkedNoteId = event.linkedNoteId ? (noteIdMap.get(event.linkedNoteId) || null) : null;

        const result = db.prepare(`
          INSERT INTO timeline_events (
            project_id, title, description, event_date,
            sort_order, era, linked_note_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, event.title, event.description || '',
          event.eventDate, event.sortOrder || 0,
          event.era || '', newLinkedNoteId
        );
        timelineEventIdMap.set(event.id, result.lastInsertRowid as number);
      }
    }

    if (data.wikiLinks?.length) {
      for (const link of data.wikiLinks) {
        const newSourceNoteId = noteIdMap.get(link.sourceNoteId);
        const newTargetNoteId = noteIdMap.get(link.targetNoteId);
        if (!newSourceNoteId || !newTargetNoteId) continue;

        db.prepare(`
          INSERT OR IGNORE INTO wiki_links (
            project_id, source_note_id, target_note_id, label
          ) VALUES (?, ?, ?, ?)
        `).run(projectId, newSourceNoteId, newTargetNoteId, link.label || '');
      }
    }

    if (data.dogmas?.length) {
      for (const dogma of data.dogmas) {
        const result = db.prepare(`
          INSERT INTO dogmas (
            project_id, title, category, description, impact, exceptions,
            is_public, importance, status, sort_order, icon, color
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId,
          dogma.title,
          dogma.category || 'other',
          dogma.description || '',
          dogma.impact || '',
          dogma.exceptions || '',
          dogma.isPublic ? 1 : 0,
          dogma.importance || 'major',
          dogma.status || 'active',
          dogma.sortOrder ?? 0,
          dogma.icon || '',
          dogma.color || ''
        );
        dogmaIdMap.set(dogma.id, result.lastInsertRowid as number);
      }
    }

    if (data.factions?.length) {
      for (const faction of data.factions) {
        const result = db.prepare(`
          INSERT INTO factions (
            project_id, name, type, custom_type, state_type, custom_state_type,
            motto, description, history, goals, headquarters, territory, status,
            color, secondary_color, image_path, banner_path, founded_date, disbanded_date,
            parent_faction_id, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        `).run(
          projectId,
          faction.name,
          faction.type || 'other',
          faction.customType || '',
          faction.stateType || '',
          faction.customStateType || '',
          faction.motto || '',
          faction.description || '',
          faction.history || '',
          faction.goals || '',
          faction.headquarters || '',
          faction.territory || '',
          faction.status || 'active',
          faction.color || '',
          faction.secondaryColor || '',
          faction.imagePath || null,
          faction.bannerPath || null,
          faction.foundedDate || '',
          faction.disbandedDate || '',
          faction.sortOrder ?? 0
        );
        factionIdMap.set(faction.id, result.lastInsertRowid as number);
      }

      for (const faction of data.factions) {
        if (!faction.parentFactionId) continue;
        const newFactionId = factionIdMap.get(faction.id);
        const newParentFactionId = factionIdMap.get(faction.parentFactionId);
        if (!newFactionId || !newParentFactionId) continue;
        db.prepare('UPDATE factions SET parent_faction_id = ? WHERE id = ?').run(newParentFactionId, newFactionId);
      }
    }

    if (data.factionRanks?.length) {
      for (const rank of data.factionRanks) {
        const newFactionId = factionIdMap.get(rank.factionId);
        if (!newFactionId) continue;
        const result = db.prepare(`
          INSERT INTO faction_ranks (
            faction_id, name, level, description, permissions, icon, color
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          newFactionId,
          rank.name,
          rank.level ?? 0,
          rank.description || '',
          rank.permissions || '',
          rank.icon || '',
          rank.color || ''
        );
        factionRankIdMap.set(rank.id, result.lastInsertRowid as number);
      }
    }

    if (data.factionMembers?.length) {
      for (const member of data.factionMembers) {
        const newFactionId = factionIdMap.get(member.factionId);
        const newCharacterId = characterIdMap.get(member.characterId);
        const newRankId = member.rankId ? (factionRankIdMap.get(member.rankId) || null) : null;
        if (!newFactionId || !newCharacterId) continue;
        db.prepare(`
          INSERT OR IGNORE INTO faction_members (
            faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newFactionId,
          newCharacterId,
          newRankId,
          member.role || '',
          member.joinedDate || '',
          member.leftDate || '',
          member.isActive ? 1 : 0,
          member.notes || ''
        );
      }
    }

    if (data.factionRelations?.length) {
      for (const relation of data.factionRelations) {
        const newSourceFactionId = factionIdMap.get(relation.sourceFactionId);
        const newTargetFactionId = factionIdMap.get(relation.targetFactionId);
        if (!newSourceFactionId || !newTargetFactionId) continue;
        db.prepare(`
          INSERT INTO faction_relations (
            project_id, source_faction_id, target_faction_id,
            relation_type, custom_label, description, started_date, is_bidirectional
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId,
          newSourceFactionId,
          newTargetFactionId,
          relation.relationType || 'neutral',
          relation.customLabel || '',
          relation.description || '',
          relation.startedDate || '',
          relation.isBidirectional ? 1 : 0
        );
      }
    }

    if (data.territories?.length) {
      for (const territory of data.territories) {
        const newMapId = mapIdMap.get(territory.mapId);
        const newFactionId = territory.factionId ? (factionIdMap.get(territory.factionId) || null) : null;
        if (!newMapId) continue;

        db.prepare(`
          INSERT INTO map_territories (
            map_id, name, description, color, opacity, border_color, border_width,
            points, faction_id, smoothing, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newMapId,
          territory.name,
          territory.description || '',
          territory.color || '#4ECDC4',
          territory.opacity ?? 0.25,
          territory.borderColor || territory.color || '#4ECDC4',
          territory.borderWidth ?? 2,
          territory.points || '[]',
          newFactionId,
          territory.smoothing ?? 0,
          territory.sortOrder ?? 0
        );
      }
    }

    if (data.dynasties?.length) {
      for (const dynasty of data.dynasties) {
        const result = db.prepare(`
          INSERT INTO dynasties (
            project_id, name, motto, description, history, status, color, secondary_color,
            image_path, founded_date, extinct_date, founder_id, current_leader_id, heir_id,
            linked_faction_id, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId,
          dynasty.name,
          dynasty.motto || '',
          dynasty.description || '',
          dynasty.history || '',
          dynasty.status || 'active',
          dynasty.color || '',
          dynasty.secondaryColor || '',
          dynasty.imagePath || null,
          dynasty.foundedDate || '',
          dynasty.extinctDate || '',
          dynasty.founderId ? (characterIdMap.get(dynasty.founderId) || null) : null,
          dynasty.currentLeaderId ? (characterIdMap.get(dynasty.currentLeaderId) || null) : null,
          dynasty.heirId ? (characterIdMap.get(dynasty.heirId) || null) : null,
          dynasty.linkedFactionId ? (factionIdMap.get(dynasty.linkedFactionId) || null) : null,
          dynasty.sortOrder ?? 0
        );
        dynastyIdMap.set(dynasty.id, result.lastInsertRowid as number);
      }
    }

    if (data.dynastyMembers?.length) {
      for (const member of data.dynastyMembers) {
        const newDynastyId = dynastyIdMap.get(member.dynastyId);
        const newCharacterId = characterIdMap.get(member.characterId);
        if (!newDynastyId || !newCharacterId) continue;
        db.prepare(`
          INSERT OR IGNORE INTO dynasty_members (
            dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newDynastyId,
          newCharacterId,
          member.generation ?? 0,
          member.role || '',
          member.birthDate || '',
          member.deathDate || '',
          member.isMainLine ? 1 : 0,
          member.notes || ''
        );
      }
    }

    if (data.dynastyFamilyLinks?.length) {
      for (const link of data.dynastyFamilyLinks) {
        const newDynastyId = dynastyIdMap.get(link.dynastyId);
        const newSourceCharacterId = characterIdMap.get(link.sourceCharacterId);
        const newTargetCharacterId = characterIdMap.get(link.targetCharacterId);
        if (!newDynastyId || !newSourceCharacterId || !newTargetCharacterId) continue;
        db.prepare(`
          INSERT INTO dynasty_family_links (
            dynasty_id, source_character_id, target_character_id, relation_type, custom_label
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          newDynastyId,
          newSourceCharacterId,
          newTargetCharacterId,
          link.relationType,
          link.customLabel || ''
        );
      }
    }

    if (data.dynastyEvents?.length) {
      for (const event of data.dynastyEvents) {
        const newDynastyId = dynastyIdMap.get(event.dynastyId);
        if (!newDynastyId) continue;
        db.prepare(`
          INSERT INTO dynasty_events (
            dynasty_id, title, description, event_date, importance, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          newDynastyId,
          event.title,
          event.description || '',
          event.eventDate,
          event.importance || 'normal',
          event.sortOrder ?? 0
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
        } else if (ta.entityType === 'timeline_event') {
          newEntityId = timelineEventIdMap.get(ta.entityId);
        } else if (ta.entityType === 'dogma') {
          newEntityId = dogmaIdMap.get(ta.entityId);
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

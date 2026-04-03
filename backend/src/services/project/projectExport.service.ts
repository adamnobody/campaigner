import { getDb } from '../../db/connection';
import { ProjectService } from '../project.service';
import { readFileAsBase64 } from './assetHelpers';
import type {
  ImportedProjectPayload,
  ExportCharacterRow,
  ExportRelationshipRow,
  ExportNoteRow,
  ExportFolderRow,
  ExportMapRow,
  ExportMarkerRow,
  ExportTimelineEventRow,
  ExportTagRow,
  ExportTagAssociationRow,
} from './project.types';

export function exportProject(id: number): ImportedProjectPayload & {
  exportedAt: string;
} {
  const db = getDb();
  const project = ProjectService.getById(id);

  const characters = db.prepare(`
    SELECT id, name, title, race, character_class as characterClass,
           level, status, bio, appearance, personality, backstory, notes,
           image_path as imagePath, created_at as createdAt, updated_at as updatedAt
    FROM characters WHERE project_id = ?
  `).all(id) as ExportCharacterRow[];

  const relationships = db.prepare(`
    SELECT id, source_character_id as sourceCharacterId,
           target_character_id as targetCharacterId,
           relationship_type as relationshipType,
           custom_label as customLabel, description,
           is_bidirectional as isBidirectional,
           created_at as createdAt
    FROM character_relationships WHERE project_id = ?
  `).all(id) as ExportRelationshipRow[];

  const notes = db.prepare(`
    SELECT id, folder_id as folderId, title, content, format,
           note_type as noteType, is_pinned as isPinned,
           created_at as createdAt, updated_at as updatedAt
    FROM notes WHERE project_id = ?
  `).all(id) as ExportNoteRow[];

  const folders = db.prepare(`
    SELECT id, name, parent_id as parentId, created_at as createdAt
    FROM folders WHERE project_id = ?
  `).all(id) as ExportFolderRow[];

  const maps = db.prepare(`
    SELECT id, project_id as projectId, parent_map_id as parentMapId,
           parent_marker_id as parentMarkerId, name, image_path as imagePath,
           created_at as createdAt, updated_at as updatedAt
    FROM maps WHERE project_id = ?
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
    FROM timeline_events WHERE project_id = ?
  `).all(id) as ExportTimelineEventRow[];

  const tags = db.prepare(`
    SELECT id, name, color FROM tags WHERE project_id = ?
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

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
  ExportTerritoryRow,
  ExportTimelineEventRow,
  ExportTagRow,
  ExportTagAssociationRow,
  ExportWikiLinkRow,
  ExportDogmaRow,
  ExportFactionRow,
  ExportFactionRankRow,
  ExportFactionMemberRow,
  ExportFactionRelationRow,
  ExportDynastyRow,
  ExportDynastyMemberRow,
  ExportDynastyFamilyLinkRow,
  ExportDynastyEventRow,
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

  const mapsWithImages = maps.map((map) => ({
    ...map,
    imageBase64: readFileAsBase64(map.imagePath),
  }));

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

  const territories = db.prepare(`
    SELECT mt.id, mt.map_id as mapId, mt.name, mt.description, mt.color,
           mt.opacity, mt.border_color as borderColor, mt.border_width as borderWidth,
           mt.points, mt.faction_id as factionId, mt.smoothing, mt.sort_order as sortOrder,
           mt.created_at as createdAt, mt.updated_at as updatedAt
    FROM map_territories mt
    JOIN maps m ON mt.map_id = m.id
    WHERE m.project_id = ?
  `).all(id) as ExportTerritoryRow[];

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

  const wikiLinks = db.prepare(`
    SELECT id, source_note_id as sourceNoteId, target_note_id as targetNoteId,
           label, created_at as createdAt
    FROM wiki_links WHERE project_id = ?
  `).all(id) as ExportWikiLinkRow[];

  const dogmas = db.prepare(`
    SELECT id, title, category, description, impact, exceptions,
           is_public as isPublic, importance, status, sort_order as sortOrder,
           icon, color, created_at as createdAt, updated_at as updatedAt
    FROM dogmas WHERE project_id = ?
  `).all(id) as ExportDogmaRow[];

  const factions = db.prepare(`
    SELECT id, name, type, custom_type as customType, state_type as stateType,
           custom_state_type as customStateType, motto, description, history,
           goals, headquarters, territory, status, color,
           secondary_color as secondaryColor, image_path as imagePath,
           banner_path as bannerPath, founded_date as foundedDate,
           disbanded_date as disbandedDate, parent_faction_id as parentFactionId,
           sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt
    FROM factions WHERE project_id = ?
  `).all(id) as ExportFactionRow[];

  const factionRanks = db.prepare(`
    SELECT fr.id, fr.faction_id as factionId, fr.name, fr.level, fr.description,
           fr.permissions, fr.icon, fr.color
    FROM faction_ranks fr
    JOIN factions f ON fr.faction_id = f.id
    WHERE f.project_id = ?
  `).all(id) as ExportFactionRankRow[];

  const factionMembers = db.prepare(`
    SELECT fm.id, fm.faction_id as factionId, fm.character_id as characterId,
           fm.rank_id as rankId, fm.role, fm.joined_date as joinedDate,
           fm.left_date as leftDate, fm.is_active as isActive, fm.notes
    FROM faction_members fm
    JOIN factions f ON fm.faction_id = f.id
    WHERE f.project_id = ?
  `).all(id) as ExportFactionMemberRow[];

  const factionRelations = db.prepare(`
    SELECT fr.id, fr.source_faction_id as sourceFactionId,
           fr.target_faction_id as targetFactionId, fr.relation_type as relationType,
           fr.custom_label as customLabel, fr.description, fr.started_date as startedDate,
           fr.is_bidirectional as isBidirectional, fr.created_at as createdAt
    FROM faction_relations fr
    WHERE fr.project_id = ?
  `).all(id) as ExportFactionRelationRow[];

  const dynasties = db.prepare(`
    SELECT id, name, motto, description, history, status, color,
           secondary_color as secondaryColor, image_path as imagePath,
           founded_date as foundedDate, extinct_date as extinctDate,
           founder_id as founderId, current_leader_id as currentLeaderId,
           heir_id as heirId, linked_faction_id as linkedFactionId,
           sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt
    FROM dynasties WHERE project_id = ?
  `).all(id) as ExportDynastyRow[];

  const dynastyMembers = db.prepare(`
    SELECT dm.id, dm.dynasty_id as dynastyId, dm.character_id as characterId,
           dm.generation, dm.role, dm.birth_date as birthDate, dm.death_date as deathDate,
           dm.is_main_line as isMainLine, dm.notes
    FROM dynasty_members dm
    JOIN dynasties d ON dm.dynasty_id = d.id
    WHERE d.project_id = ?
  `).all(id) as ExportDynastyMemberRow[];

  const dynastyFamilyLinks = db.prepare(`
    SELECT dfl.id, dfl.dynasty_id as dynastyId,
           dfl.source_character_id as sourceCharacterId,
           dfl.target_character_id as targetCharacterId,
           dfl.relation_type as relationType, dfl.custom_label as customLabel
    FROM dynasty_family_links dfl
    JOIN dynasties d ON dfl.dynasty_id = d.id
    WHERE d.project_id = ?
  `).all(id) as ExportDynastyFamilyLinkRow[];

  const dynastyEvents = db.prepare(`
    SELECT de.id, de.dynasty_id as dynastyId, de.title, de.description,
           de.event_date as eventDate, de.importance, de.sort_order as sortOrder,
           de.created_at as createdAt
    FROM dynasty_events de
    JOIN dynasties d ON de.dynasty_id = d.id
    WHERE d.project_id = ?
  `).all(id) as ExportDynastyEventRow[];

  const mapImageBase64 = readFileAsBase64(project.mapImagePath || null);

  const charactersWithImages = characters.map((character) => ({
    ...character,
    imageBase64: readFileAsBase64(character.imagePath),
  }));

  return {
    version: '2.0',
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
    maps: mapsWithImages,
    markers,
    territories,
    timelineEvents,
    tags,
    tagAssociations,
    wikiLinks,
    dogmas,
    factions,
    factionRanks,
    factionMembers,
    factionRelations,
    dynasties,
    dynastyMembers,
    dynastyFamilyLinks,
    dynastyEvents,
  };
}

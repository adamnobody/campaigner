import type { DynastyRow, DynastyMemberRow, DynastyFamilyLinkRow, DynastyEventRow } from './dynasty.types.js';

export const DYNASTY_UPDATE_MAP: Record<string, string> = {
  name: 'name',
  motto: 'motto',
  description: 'description',
  history: 'history',
  status: 'status',
  color: 'color',
  secondaryColor: 'secondary_color',
  foundedDate: 'founded_date',
  extinctDate: 'extinct_date',
  founderId: 'founder_id',
  currentLeaderId: 'current_leader_id',
  heirId: 'heir_id',
  linkedFactionId: 'linked_faction_id',
  sortOrder: 'sort_order',
};

export const MEMBER_UPDATE_MAP: Record<string, string> = {
  generation: 'generation',
  role: 'role',
  birthDate: 'birth_date',
  deathDate: 'death_date',
  isMainLine: 'is_main_line',
  notes: 'notes',
};

export const EVENT_UPDATE_MAP: Record<string, string> = {
  title: 'title',
  description: 'description',
  eventDate: 'event_date',
  importance: 'importance',
  sortOrder: 'sort_order',
};

export function mapDynastyRow(row: DynastyRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    motto: row.motto || '',
    description: row.description || '',
    history: row.history || '',
    status: row.status,
    color: row.color || '',
    secondaryColor: row.secondary_color || '',
    imagePath: row.image_path || null,
    foundedDate: row.founded_date || '',
    extinctDate: row.extinct_date || '',
    founderId: row.founder_id || null,
    currentLeaderId: row.current_leader_id || null,
    heirId: row.heir_id || null,
    linkedFactionId: row.linked_faction_id || null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    memberCount: row.member_count || 0,
  };
}

export function mapDynastyMember(row: DynastyMemberRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    characterId: row.character_id,
    generation: row.generation,
    role: row.role || '',
    birthDate: row.birth_date || '',
    deathDate: row.death_date || '',
    isMainLine: !!row.is_main_line,
    notes: row.notes || '',
    graphX: row.graph_x ?? null,
    graphY: row.graph_y ?? null,
    characterName: row.character_name,
    characterImagePath: row.character_image_path,
    characterStatus: row.character_status,
  };
}

export function mapDynastyFamilyLink(row: DynastyFamilyLinkRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    sourceCharacterId: row.source_character_id,
    targetCharacterId: row.target_character_id,
    relationType: row.relation_type,
    customLabel: row.custom_label || '',
    sourceCharacterName: row.source_character_name,
    targetCharacterName: row.target_character_name,
  };
}

export function mapDynastyEvent(row: DynastyEventRow) {
  return {
    id: row.id,
    dynastyId: row.dynasty_id,
    title: row.title,
    description: row.description || '',
    eventDate: row.event_date,
    importance: row.importance,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

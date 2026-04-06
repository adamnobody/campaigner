import type { FactionRow, RankRow, MemberRow, RelationRow, AssetRow } from './faction.types';

export const FACTION_UPDATE_MAP: Record<string, string> = {
  projectId: 'project_id',
  name: 'name',
  type: 'type',
  customType: 'custom_type',
  stateType: 'state_type',
  customStateType: 'custom_state_type',
  motto: 'motto',
  description: 'description',
  history: 'history',
  goals: 'goals',
  headquarters: 'headquarters',
  territory: 'territory',
  status: 'status',
  color: 'color',
  secondaryColor: 'secondary_color',
  foundedDate: 'founded_date',
  disbandedDate: 'disbanded_date',
  parentFactionId: 'parent_faction_id',
  sortOrder: 'sort_order',
};

export const RANK_UPDATE_MAP: Record<string, string> = {
  name: 'name',
  level: 'level',
  description: 'description',
  permissions: 'permissions',
  icon: 'icon',
  color: 'color',
};

export const MEMBER_UPDATE_MAP: Record<string, string> = {
  rankId: 'rank_id',
  role: 'role',
  joinedDate: 'joined_date',
  leftDate: 'left_date',
  isActive: 'is_active',
  notes: 'notes',
};

export const RELATION_UPDATE_MAP: Record<string, string> = {
  relationType: 'relation_type',
  customLabel: 'custom_label',
  description: 'description',
  startedDate: 'started_date',
  isBidirectional: 'is_bidirectional',
};

export const ASSET_UPDATE_MAP: Record<string, string> = {
  name: 'name',
  value: 'value',
  sortOrder: 'sort_order',
};

export function toFaction(row: FactionRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    customType: row.custom_type || '',
    stateType: row.state_type || '',
    customStateType: row.custom_state_type || '',
    motto: row.motto || '',
    description: row.description || '',
    history: row.history || '',
    goals: row.goals || '',
    headquarters: row.headquarters || '',
    territory: row.territory || '',
    status: row.status,
    color: row.color || '',
    secondaryColor: row.secondary_color || '',
    imagePath: row.image_path || '',
    bannerPath: row.banner_path || '',
    foundedDate: row.founded_date || '',
    disbandedDate: row.disbanded_date || '',
    parentFactionId: row.parent_faction_id || null,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toRank(row: RankRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    name: row.name,
    level: row.level,
    description: row.description || '',
    permissions: row.permissions || '',
    icon: row.icon || '',
    color: row.color || '',
  };
}

export function toMember(row: MemberRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    characterId: row.character_id,
    rankId: row.rank_id || null,
    role: row.role || '',
    joinedDate: row.joined_date || '',
    leftDate: row.left_date || '',
    isActive: !!row.is_active,
    notes: row.notes || '',
    characterName: row.character_name || '',
    characterImagePath: row.character_image_path || '',
    rankName: row.rank_name || '',
    rankLevel: row.rank_level ?? null,
  };
}

export function toRelation(row: RelationRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceFactionId: row.source_faction_id,
    targetFactionId: row.target_faction_id,
    relationType: row.relation_type,
    customLabel: row.custom_label || '',
    description: row.description || '',
    startedDate: row.started_date || '',
    isBidirectional: !!row.is_bidirectional,
    createdAt: row.created_at,
    sourceFactionName: row.source_faction_name || '',
    targetFactionName: row.target_faction_name || '',
  };
}

export function toAsset(row: AssetRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    name: row.name,
    value: row.value || '',
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const MEMBER_SELECT = `
  SELECT fm.*,
    c.name as character_name,
    c.image_path as character_image_path,
    fr.name as rank_name,
    fr.level as rank_level
  FROM faction_members fm
  JOIN characters c ON fm.character_id = c.id
  LEFT JOIN faction_ranks fr ON fm.rank_id = fr.id
`;

export const RELATION_SELECT = `
  SELECT fr.*,
    sf.name as source_faction_name,
    tf.name as target_faction_name
  FROM faction_relations fr
  JOIN factions sf ON fr.source_faction_id = sf.id
  JOIN factions tf ON fr.target_faction_id = tf.id
`;

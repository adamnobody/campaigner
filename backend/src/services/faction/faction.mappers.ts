import type { FactionRow, RankRow, MemberRow, RelationRow, CustomMetricRow } from './faction.types.js';

export const FACTION_UPDATE_MAP: Record<string, string> = {
  projectId: 'project_id',
  name: 'name',
  kind: 'kind',
  type: 'type',
  motto: 'motto',
  description: 'description',
  history: 'history',
  goals: 'goals',
  headquarters: 'headquarters',
  territory: 'territory',
  treasury: 'treasury',
  population: 'population',
  armySize: 'army_size',
  navySize: 'navy_size',
  territoryKm2: 'territory_km2',
  annualIncome: 'annual_income',
  annualExpenses: 'annual_expenses',
  membersCount: 'members_count',
  influence: 'influence',
  status: 'status',
  color: 'color',
  secondaryColor: 'secondary_color',
  foundedDate: 'founded_date',
  disbandedDate: 'disbanded_date',
  parentFactionId: 'parent_faction_id',
  sortOrder: 'sort_order',
  rulingDynastyId: 'ruling_dynasty_id',
  rulerCharacterId: 'ruler_character_id',
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

export function toFaction(row: FactionRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    kind: row.kind as 'state' | 'faction',
    type: row.type ?? null,
    motto: row.motto || '',
    description: row.description || '',
    history: row.history || '',
    goals: row.goals || '',
    headquarters: row.headquarters || '',
    territory: row.territory || '',
    treasury: row.treasury ?? null,
    population: row.population ?? null,
    armySize: row.army_size ?? null,
    navySize: row.navy_size ?? null,
    territoryKm2: row.territory_km2 ?? null,
    annualIncome: row.annual_income ?? null,
    annualExpenses: row.annual_expenses ?? null,
    membersCount: row.members_count ?? null,
    influence: row.influence ?? null,
    status: row.status,
    color: row.color || '',
    secondaryColor: row.secondary_color || '',
    imagePath: row.image_path || '',
    bannerPath: row.banner_path || '',
    foundedDate: row.founded_date || '',
    disbandedDate: row.disbanded_date || '',
    parentFactionId: row.parent_faction_id || null,
    rulingDynastyId: row.ruling_dynasty_id ?? null,
    rulerCharacterId: row.ruler_character_id ?? null,
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

export function toCustomMetric(row: CustomMetricRow) {
  return {
    id: row.id,
    factionId: row.faction_id,
    name: row.name,
    value: row.value,
    unit: row.unit ?? null,
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

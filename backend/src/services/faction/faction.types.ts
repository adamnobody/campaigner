export interface FactionFilters {
  kind?: 'state' | 'faction';
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TagRow {
  id: number;
  name: string;
  color: string;
}

export interface CountRow {
  cnt: number;
}

export interface FactionRow {
  id: number;
  project_id: number;
  name: string;
  kind: string;
  type: string | null;
  motto: string | null;
  description: string | null;
  history: string | null;
  goals: string | null;
  headquarters: string | null;
  territory: string | null;
  treasury: number | null;
  population: number | null;
  army_size: number | null;
  navy_size: number | null;
  territory_km2: number | null;
  annual_income: number | null;
  annual_expenses: number | null;
  members_count: number | null;
  influence: number | null;
  status: string;
  color: string | null;
  secondary_color: string | null;
  image_path: string | null;
  banner_path: string | null;
  founded_date: string | null;
  disbanded_date: string | null;
  parent_faction_id: number | null;
  ruling_dynasty_id: number | null;
  ruler_character_id: number | null;
  sort_order: number | null;
  created_branch_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FactionWithMetaRow extends FactionRow {
  member_count: number;
  parent_faction_name: string | null;
  ruling_dynasty_name?: string | null;
  ruler_name?: string | null;
}

export interface ChildFactionRow {
  id: number;
  name: string;
}

export interface RankRow {
  id: number;
  faction_id: number;
  name: string;
  level: number;
  description: string | null;
  permissions: string | null;
  icon: string | null;
  color: string | null;
}

export interface MemberRow {
  id: number;
  faction_id: number;
  character_id: number;
  rank_id: number | null;
  role: string | null;
  joined_date: string | null;
  left_date: string | null;
  is_active: number | boolean;
  notes: string | null;
  character_name?: string | null;
  character_image_path?: string | null;
  rank_name?: string | null;
  rank_level?: number | null;
}

export interface RelationRow {
  id: number;
  project_id: number;
  source_faction_id: number;
  target_faction_id: number;
  relation_type: string;
  custom_label: string | null;
  description: string | null;
  started_date: string | null;
  is_bidirectional: number | boolean;
  created_at: string;
  created_branch_id?: number | null;
  source_faction_name?: string | null;
  target_faction_name?: string | null;
}

export interface CustomMetricRow {
  id: number;
  faction_id: number;
  name: string;
  value: number;
  unit: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface FactionCreateData {
  projectId: number;
  name: string;
  kind?: 'state' | 'faction';
  type?: string | null;
  motto?: string;
  description?: string;
  history?: string;
  goals?: string;
  headquarters?: string;
  territory?: string;
  treasury?: number | null;
  population?: number | null;
  armySize?: number | null;
  navySize?: number | null;
  territoryKm2?: number | null;
  annualIncome?: number | null;
  annualExpenses?: number | null;
  membersCount?: number | null;
  influence?: number | null;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  disbandedDate?: string;
  parentFactionId?: number | null;
  sortOrder?: number;
  rulingDynastyId?: number | null;
  rulerCharacterId?: number | null;
  territoryIds?: number[];
}

export interface FactionUpdateData extends Partial<FactionCreateData> {}

export interface RankCreateData {
  factionId: number;
  name: string;
  level?: number;
  description?: string;
  permissions?: string;
  icon?: string;
  color?: string;
}

export interface RankUpdateData extends Partial<Omit<RankCreateData, 'factionId'>> {}

export interface MemberCreateData {
  factionId: number;
  characterId: number;
  rankId?: number | null;
  role?: string;
  joinedDate?: string;
  leftDate?: string;
  isActive?: boolean;
  notes?: string;
}

export interface MemberUpdateData {
  rankId?: number | null;
  role?: string;
  joinedDate?: string;
  leftDate?: string;
  isActive?: boolean;
  notes?: string;
}

export interface RelationCreateData {
  projectId: number;
  sourceFactionId: number;
  targetFactionId: number;
  relationType?: string;
  customLabel?: string;
  description?: string;
  startedDate?: string;
  isBidirectional?: boolean;
}

export interface RelationUpdateData {
  relationType?: string;
  customLabel?: string;
  description?: string;
  startedDate?: string;
  isBidirectional?: boolean;
}

export interface CustomMetricInput {
  name: string;
  value: number;
  unit?: string | null;
  sortOrder?: number;
}

export interface CompareFactionResult {
  factions: Array<{ id: number; name: string; kind: 'state' | 'faction' }>;
  metrics: Array<{
    key: string;
    label: string;
    unit: string | null;
    values: Array<{ factionId: number; value: number | null }>;
  }>;
}

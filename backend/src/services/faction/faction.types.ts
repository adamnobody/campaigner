export interface FactionFilters {
  type?: 'state' | 'faction';
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
  type: string;
  custom_type: string | null;
  state_type: string | null;
  custom_state_type: string | null;
  motto: string | null;
  description: string | null;
  history: string | null;
  goals: string | null;
  headquarters: string | null;
  territory: string | null;
  status: string;
  color: string | null;
  secondary_color: string | null;
  image_path: string | null;
  banner_path: string | null;
  founded_date: string | null;
  disbanded_date: string | null;
  parent_faction_id: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface FactionWithMetaRow extends FactionRow {
  member_count: number;
  parent_faction_name: string | null;
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
  source_faction_name?: string | null;
  target_faction_name?: string | null;
}

export interface AssetRow {
  id: number;
  faction_id: number;
  name: string;
  value: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface FactionCreateData {
  projectId: number;
  name: string;
  type?: 'state' | 'faction';
  customType?: string;
  stateType?: string;
  customStateType?: string;
  motto?: string;
  description?: string;
  history?: string;
  goals?: string;
  headquarters?: string;
  territory?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  disbandedDate?: string;
  parentFactionId?: number | null;
  sortOrder?: number;
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

export interface AssetCreateData {
  factionId: number;
  name: string;
  value?: string;
  sortOrder?: number;
}

export interface AssetUpdateData {
  name?: string;
  value?: string;
  sortOrder?: number;
}

export interface DynastyFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CountRow {
  count: number;
}

export interface NameRow {
  name: string;
}

export interface TagRow {
  id: number;
  name: string;
  color: string;
}

export interface DynastyRow {
  id: number;
  project_id: number;
  name: string;
  motto: string | null;
  description: string | null;
  history: string | null;
  status: string;
  color: string | null;
  secondary_color: string | null;
  image_path: string | null;
  founded_date: string | null;
  extinct_date: string | null;
  founder_id: number | null;
  current_leader_id: number | null;
  heir_id: number | null;
  linked_faction_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface DynastyMemberRow {
  id: number;
  dynasty_id: number;
  character_id: number;
  generation: number;
  role: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_main_line: number | boolean;
  notes: string | null;
  graph_x: number | null;
  graph_y: number | null;
  character_name: string;
  character_image_path: string | null;
  character_status: string;
}

export interface DynastyFamilyLinkRow {
  id: number;
  dynasty_id: number;
  source_character_id: number;
  target_character_id: number;
  relation_type: string;
  custom_label: string | null;
  source_character_name: string;
  target_character_name: string;
}

export interface DynastyEventRow {
  id: number;
  dynasty_id: number;
  title: string;
  description: string | null;
  event_date: string;
  importance: string;
  sort_order: number;
  created_at: string;
}

export interface DynastyCreateData {
  projectId: number;
  name: string;
  motto?: string;
  description?: string;
  history?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  extinctDate?: string;
  founderId?: number | null;
  currentLeaderId?: number | null;
  heirId?: number | null;
  linkedFactionId?: number | null;
  sortOrder?: number;
}

export interface DynastyUpdateData {
  name?: string;
  motto?: string;
  description?: string;
  history?: string;
  status?: string;
  color?: string;
  secondaryColor?: string;
  foundedDate?: string;
  extinctDate?: string;
  founderId?: number | null;
  currentLeaderId?: number | null;
  heirId?: number | null;
  linkedFactionId?: number | null;
  sortOrder?: number;
}

export interface DynastyMemberCreateData {
  characterId: number;
  generation?: number;
  role?: string;
  birthDate?: string;
  deathDate?: string;
  isMainLine?: boolean;
  notes?: string;
}

export interface DynastyMemberUpdateData {
  generation?: number;
  role?: string;
  birthDate?: string;
  deathDate?: string;
  isMainLine?: boolean;
  notes?: string;
}

export interface DynastyFamilyLinkCreateData {
  sourceCharacterId: number;
  targetCharacterId: number;
  relationType: string;
  customLabel?: string;
}

export interface DynastyEventCreateData {
  title: string;
  description?: string;
  eventDate: string;
  importance?: string;
  sortOrder?: number;
}

export interface DynastyEventUpdateData {
  title?: string;
  description?: string;
  eventDate?: string;
  importance?: string;
  sortOrder?: number;
}

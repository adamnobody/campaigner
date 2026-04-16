import { z } from 'zod';
import {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  projectFolderSchema,
  createFolderSchema,
} from '../schemas/project.schema.js';
import {
  characterSchema,
  createCharacterSchema,
  updateCharacterSchema,
  characterRelationshipSchema,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '../schemas/character.schema.js';
import {
  noteSchema,
  createNoteSchema,
  updateNoteSchema,
} from '../schemas/note.schema.js';
import {
  mapSchema,
  createMapSchema,
  updateMapSchema,
  mapMarkerSchema,
  createMarkerSchema,
  updateMarkerSchema,
  mapTerritorySchema,
  createTerritorySchema,
  updateTerritorySchema,
} from '../schemas/map.schema.js';
import {
  timelineEventSchema,
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from '../schemas/timeline.schema.js';
import {
  tagSchema,
  createTagSchema,
  paginationSchema,
} from '../schemas/common.schema.js';
import {
  dogmaSchema,
  createDogmaSchema,
  updateDogmaSchema,
} from '../schemas/dogma.schema.js';
import {
  createFactionSchema,
  updateFactionSchema,
  createFactionRankSchema,
  updateFactionRankSchema,
  createFactionMemberSchema,
  updateFactionMemberSchema,
  createFactionRelationSchema,
  updateFactionRelationSchema,
  factionAssetSchema,
  createFactionAssetSchema,
  updateFactionAssetSchema,
  reorderFactionAssetsSchema,
  factionGraphNodeSchema,
  factionGraphSchema,
} from '../schemas/faction.schema.js';
import {
  wikiLinkSchema,
  createWikiLinkSchema,
  getWikiLinksQuerySchema,
} from '../schemas/wiki.schema.js';
import {
  scenarioBranchSchema,
  createScenarioBranchSchema,
  updateScenarioBranchSchema,
  branchOverrideSchema,
  branchLocalEntitySchema,
} from '../schemas/branch.schema.js';
import {
  factionPolicySchema,
  createFactionPolicyBodySchema,
  updateFactionPolicySchema,
  policyTypeSchema,
  policyStatusSchema,
} from '../schemas/policy.schema.js';
import {
  createDynastySchema,
  updateDynastySchema,
  createDynastyMemberSchema,
  updateDynastyMemberSchema,
  createDynastyRelationSchema,
  createDynastyEventSchema,
  updateDynastyEventSchema,
} from '../schemas/dynasty.schema.js';
import {
  characterTraitSchema,
  createCharacterTraitBodySchema,
} from '../schemas/character-trait.schema.js';
import {
  ambitionSchema,
  createAmbitionBodySchema,
  updateAmbitionBodySchema,
} from '../schemas/ambition.schema.js';

// ==================== Project ====================
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.input<typeof createProjectSchema>;
export type UpdateProject = z.input<typeof updateProjectSchema>;
export type ProjectFolder = z.infer<typeof projectFolderSchema>;
export type CreateFolder = z.infer<typeof createFolderSchema>;

// ==================== Character ====================
export type Character = z.infer<typeof characterSchema>;
export type CreateCharacter = z.input<typeof createCharacterSchema>;
export type UpdateCharacter = z.input<typeof updateCharacterSchema>;
export type CharacterRelationship = z.infer<typeof characterRelationshipSchema>;
export type CreateRelationship = z.input<typeof createRelationshipSchema>;
export type UpdateRelationship = z.input<typeof updateRelationshipSchema>;

// ==================== Character traits ====================
export type CharacterTrait = z.infer<typeof characterTraitSchema>;
export type CreateCharacterTrait = z.input<typeof createCharacterTraitBodySchema>;
export type Ambition = z.infer<typeof ambitionSchema>;
export type CreateAmbition = z.input<typeof createAmbitionBodySchema>;
export type UpdateAmbition = z.input<typeof updateAmbitionBodySchema>;

// ==================== Note ====================
export type Note = z.infer<typeof noteSchema>;
export type CreateNote = z.input<typeof createNoteSchema>;
export type UpdateNote = z.input<typeof updateNoteSchema>;

// ==================== Map ====================
export type Map = z.infer<typeof mapSchema>;
export type CreateMap = z.input<typeof createMapSchema>;
export type UpdateMap = z.input<typeof updateMapSchema>;
export type MapMarker = z.infer<typeof mapMarkerSchema>;
export type CreateMarker = z.input<typeof createMarkerSchema>;
export type UpdateMarker = z.input<typeof updateMarkerSchema>;
export type MapTerritory = z.infer<typeof mapTerritorySchema>;
export type CreateTerritory = z.input<typeof createTerritorySchema>;
export type UpdateTerritory = z.input<typeof updateTerritorySchema>;

// ==================== Timeline ====================
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type CreateTimelineEvent = z.input<typeof createTimelineEventSchema>;
export type UpdateTimelineEvent = z.input<typeof updateTimelineEventSchema>;

// ==================== Dogma ====================
export type Dogma = z.infer<typeof dogmaSchema>;
export type CreateDogma = z.input<typeof createDogmaSchema>;
export type UpdateDogma = z.input<typeof updateDogmaSchema>;

// ==================== Factions ====================
export type CreateFaction = z.input<typeof createFactionSchema>;
export type UpdateFaction = z.input<typeof updateFactionSchema>;

// Rank/member are created via routes that pass `factionId` in the URL,
// so request bodies should NOT include `factionId`.
export type CreateFactionRank = Omit<z.input<typeof createFactionRankSchema>, 'factionId'>;
export type UpdateFactionRank = z.input<typeof updateFactionRankSchema>;

export type CreateFactionMember = Omit<z.input<typeof createFactionMemberSchema>, 'factionId'>;
export type UpdateFactionMember = z.input<typeof updateFactionMemberSchema>;

export type CreateFactionRelation = z.input<typeof createFactionRelationSchema>;
export type UpdateFactionRelation = z.input<typeof updateFactionRelationSchema>;
export type FactionAsset = z.infer<typeof factionAssetSchema>;
export type CreateFactionAsset = Omit<z.input<typeof createFactionAssetSchema>, 'factionId'>;
export type UpdateFactionAsset = z.input<typeof updateFactionAssetSchema>;
export type ReorderFactionAssets = z.input<typeof reorderFactionAssetsSchema>;
export type FactionGraphNode = z.infer<typeof factionGraphNodeSchema>;
export type FactionGraph = z.infer<typeof factionGraphSchema>;

// ==================== Dynasties ====================
export type CreateDynasty = z.input<typeof createDynastySchema>;
export type UpdateDynasty = z.input<typeof updateDynastySchema>;

export type CreateDynastyMember = Omit<z.input<typeof createDynastyMemberSchema>, 'dynastyId'>;
export type UpdateDynastyMember = z.input<typeof updateDynastyMemberSchema>;

export type CreateDynastyFamilyLink = Omit<z.input<typeof createDynastyRelationSchema>, 'dynastyId'>;

export type CreateDynastyEvent = Omit<z.input<typeof createDynastyEventSchema>, 'dynastyId'>;
export type UpdateDynastyEvent = z.input<typeof updateDynastyEventSchema>;

// ==================== Wiki ====================
export type WikiLink = z.infer<typeof wikiLinkSchema>;
export type CreateWikiLink = z.input<typeof createWikiLinkSchema>;
export type GetWikiLinksQuery = z.input<typeof getWikiLinksQuerySchema>;

// ==================== Branches ====================
export type ScenarioBranch = z.infer<typeof scenarioBranchSchema>;
export type CreateScenarioBranch = z.input<typeof createScenarioBranchSchema>;
export type UpdateScenarioBranch = z.input<typeof updateScenarioBranchSchema>;
export type BranchOverride = z.infer<typeof branchOverrideSchema>;
export type BranchLocalEntity = z.infer<typeof branchLocalEntitySchema>;

// ==================== Faction policies ====================
export type FactionPolicy = z.infer<typeof factionPolicySchema>;
export type CreateFactionPolicy = z.input<typeof createFactionPolicyBodySchema>;
export type UpdateFactionPolicy = z.input<typeof updateFactionPolicySchema>;
export type PolicyType = z.infer<typeof policyTypeSchema>;
export type PolicyStatus = z.infer<typeof policyStatusSchema>;

// ==================== Common ====================
// In backend responses `Tag` always includes `id` and `color` (color falls back to '#808080').
export type Tag = Omit<z.infer<typeof tagSchema>, 'id' | 'color'> & {
  id: number;
  color: string;
};
export type CreateTag = z.input<typeof createTagSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

// ==================== API Response ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Character Graph ====================
export interface CharacterNode {
  id: number;
  name: string;
  title: string;
  status: string;
  imagePath: string | null;
}

export interface CharacterEdge {
  id: number;
  source: number;
  target: number;
  relationshipType: string;
  customLabel: string;
  isBidirectional: boolean;
}

export interface CharacterGraph {
  nodes: CharacterNode[];
  edges: CharacterEdge[];
}

export interface SearchResult {
  type: 'character' | 'note' | 'marker' | 'event' | 'dogma' | 'tag' | 'faction';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

// ==================== Project Transfer ====================
export interface ImportedProjectPayload {
  version: string;
  project: {
    name: string;
    description?: string;
    status?: string;
    mapImageBase64?: string | null;
  };
  characters?: Array<{
    id: number;
    name: string;
    title: string;
    race: string;
    characterClass: string;
    level: number | null;
    status: string;
    bio: string;
    appearance: string;
    personality: string;
    backstory: string;
    notes: string;
    imagePath: string | null;
    createdAt: string;
    updatedAt: string;
    imageBase64?: string | null;
  }>;
  relationships?: Array<{
    id: number;
    sourceCharacterId: number;
    targetCharacterId: number;
    relationshipType: string;
    customLabel: string;
    description: string;
    isBidirectional: number | boolean;
    createdAt: string;
  }>;
  notes?: Array<{
    id: number;
    folderId: number | null;
    title: string;
    content: string;
    format: string;
    noteType: string;
    isPinned: number | boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  folders?: Array<{
    id: number;
    name: string;
    parentId: number | null;
    createdAt: string;
  }>;
  maps?: Array<{
    id: number;
    projectId: number;
    parentMapId: number | null;
    parentMarkerId: number | null;
    name: string;
    imagePath: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  markers?: Array<{
    id: number;
    mapId: number;
    title: string;
    description: string;
    positionX: number;
    positionY: number;
    color: string;
    icon: string;
    linkedNoteId: number | null;
    childMapId: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  territories?: Array<{
    id: number;
    mapId: number;
    name: string;
    description: string;
    color: string;
    opacity: number;
    borderColor: string;
    borderWidth: number;
    points: string;
    factionId: number | null;
    smoothing: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  timelineEvents?: Array<{
    id: number;
    title: string;
    description: string;
    eventDate: string;
    sortOrder: number;
    era: string;
    linkedNoteId: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  tagAssociations?: Array<{
    tagId: number;
    entityType: string;
    entityId: number;
  }>;
  wikiLinks?: Array<{
    id: number;
    sourceNoteId: number;
    targetNoteId: number;
    label: string;
    createdAt: string;
  }>;
  dogmas?: Array<{
    id: number;
    title: string;
    category: string;
    description: string;
    impact: string;
    exceptions: string;
    isPublic: number | boolean;
    importance: string;
    status: string;
    sortOrder: number;
    icon: string;
    color: string;
    createdAt: string;
    updatedAt: string;
  }>;
  factions?: Array<{
    id: number;
    name: string;
    type: string;
    customType: string;
    stateType: string;
    customStateType: string;
    motto: string;
    description: string;
    history: string;
    goals: string;
    headquarters: string;
    territory: string;
    status: string;
    color: string;
    secondaryColor: string;
    imagePath: string | null;
    bannerPath: string | null;
    foundedDate: string;
    disbandedDate: string;
    parentFactionId: number | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  factionRanks?: Array<{
    id: number;
    factionId: number;
    name: string;
    level: number;
    description: string;
    permissions: string;
    icon: string;
    color: string;
  }>;
  factionMembers?: Array<{
    id: number;
    factionId: number;
    characterId: number;
    rankId: number | null;
    role: string;
    joinedDate: string;
    leftDate: string;
    isActive: number | boolean;
    notes: string;
  }>;
  factionRelations?: Array<{
    id: number;
    sourceFactionId: number;
    targetFactionId: number;
    relationType: string;
    customLabel: string;
    description: string;
    startedDate: string;
    isBidirectional: number | boolean;
    createdAt: string;
  }>;
  dynasties?: Array<{
    id: number;
    name: string;
    motto: string;
    description: string;
    history: string;
    status: string;
    color: string;
    secondaryColor: string;
    imagePath: string | null;
    foundedDate: string;
    extinctDate: string;
    founderId: number | null;
    currentLeaderId: number | null;
    heirId: number | null;
    linkedFactionId: number | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  dynastyMembers?: Array<{
    id: number;
    dynastyId: number;
    characterId: number;
    generation: number;
    role: string;
    birthDate: string;
    deathDate: string;
    isMainLine: number | boolean;
    notes: string;
  }>;
  dynastyFamilyLinks?: Array<{
    id: number;
    dynastyId: number;
    sourceCharacterId: number;
    targetCharacterId: number;
    relationType: string;
    customLabel: string;
  }>;
  dynastyEvents?: Array<{
    id: number;
    dynastyId: number;
    title: string;
    description: string;
    eventDate: string;
    importance: string;
    sortOrder: number;
    createdAt: string;
  }>;
}

// ==================== FACTIONS ====================

export interface Faction {
  id: number;
  projectId: number;
  name: string;
  type: string;
  customType?: string;
  stateType?: string;
  customStateType?: string;
  motto?: string;
  description?: string;
  history?: string;
  goals?: string;
  headquarters?: string;
  territory?: string;
  status: string;
  color?: string;
  secondaryColor?: string;
  imagePath?: string;
  bannerPath?: string;
  foundedDate?: string;
  disbandedDate?: string;
  parentFactionId?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Joined
  tags?: any[];
  assets?: FactionAsset[];
  ranks?: FactionRank[];
  members?: FactionMember[];
  memberCount?: number;
  parentFaction?: { id: number; name: string };
  childFactions?: { id: number; name: string }[];
}

export interface FactionRank {
  id: number;
  factionId: number;
  name: string;
  level: number;
  description?: string;
  permissions?: string;
  icon?: string;
  color?: string;
}

export interface FactionMember {
  id: number;
  factionId: number;
  characterId: number;
  rankId?: number;
  role?: string;
  joinedDate?: string;
  leftDate?: string;
  isActive: boolean;
  notes?: string;
  // Joined
  characterName?: string;
  characterImagePath?: string;
  rankName?: string;
  rankLevel?: number;
}

export interface FactionRelation {
  id: number;
  projectId: number;
  sourceFactionId: number;
  targetFactionId: number;
  relationType: string;
  customLabel?: string;
  description?: string;
  startedDate?: string;
  isBidirectional: boolean;
  createdAt: string;
  // Joined
  sourceFactionName?: string;
  targetFactionName?: string;
}

// ==================== DYNASTY ====================

export interface Dynasty {
  id: number;
  projectId: number;
  name: string;
  motto?: string;
  description?: string;
  history?: string;
  status: string;
  color?: string;
  secondaryColor?: string;
  imagePath?: string;
  foundedDate?: string;
  extinctDate?: string;
  founderId?: number;
  currentLeaderId?: number;
  heirId?: number;
  linkedFactionId?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Joined
  tags?: any[];
  members?: DynastyMember[];
  memberCount?: number;
  events?: DynastyEvent[];
  familyLinks?: DynastyFamilyLink[];
  founderName?: string;
  currentLeaderName?: string;
  heirName?: string;
  linkedFactionName?: string;
}

export interface DynastyMember {
  id: number;
  dynastyId: number;
  characterId: number;
  generation: number;
  role?: string;
  birthDate?: string;
  deathDate?: string;
  isMainLine: boolean;
  notes?: string;
  graphX?: number | null;
  graphY?: number | null;
  characterName?: string;
  characterImagePath?: string;
  characterStatus?: string;
}

export interface DynastyFamilyLink {
  id: number;
  dynastyId: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationType: string;
  customLabel?: string;
  // Joined
  sourceCharacterName?: string;
  targetCharacterName?: string;
}

export interface DynastyEvent {
  id: number;
  dynastyId: number;
  title: string;
  description?: string;
  eventDate: string;
  importance: string;
  sortOrder: number;
  createdAt: string;
}
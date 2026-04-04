import type { FactionRelation, CreateTag } from '@campaigner/shared';

export interface SearchResult {
  type: 'character' | 'note' | 'marker' | 'event' | 'dogma' | 'tag' | 'faction';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

export interface WikiLink {
  id: number;
  projectId: number;
  sourceNoteId: number;
  targetNoteId: number;
  label: string;
  createdAt: string;
  sourceTitle?: string;
  targetTitle?: string;
}

export interface FactionGraphNode {
  id: number;
  name: string;
  type: string;
  customType: string;
  stateType: string;
  status: string;
  color: string;
  imagePath: string;
  memberCount: number;
}

export interface FactionGraph {
  nodes: FactionGraphNode[];
  edges: FactionRelation[];
}

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
}

export interface CreateTagRequest extends CreateTag {
  projectId: number;
}

export type CharacterListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type NotesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  noteType?: string;
  folderId?: number | null;
};

export type DogmaListParams = {
  category?: string;
  importance?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type FactionsListParams = {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  append?: boolean;
};

export type DynastiesListParams = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  append?: boolean;
};

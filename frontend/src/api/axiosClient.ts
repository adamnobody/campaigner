import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Project,
  CreateProject,
  UpdateProject,
  Character,
  CreateCharacter,
  UpdateCharacter,
  CharacterRelationship,
  CharacterGraph,
  CreateRelationship,
  UpdateRelationship,
  Note,
  CreateNote,
  UpdateNote,
  Map,
  CreateMap,
  UpdateMap,
  MapMarker,
  CreateMarker,
  UpdateMarker,
  MapTerritory,
  CreateTerritory,
  UpdateTerritory,
  TimelineEvent,
  CreateTimelineEvent,
  UpdateTimelineEvent,
  Dogma,
  CreateDogma,
  UpdateDogma,
  Tag,
  CreateTag,
  Faction,
  CreateFaction,
  UpdateFaction,
  FactionRank,
  CreateFactionRank,
  UpdateFactionRank,
  FactionMember,
  CreateFactionMember,
  UpdateFactionMember,
  FactionRelation,
  CreateFactionRelation,
  UpdateFactionRelation,
  Dynasty,
  CreateDynasty,
  UpdateDynasty,
  DynastyMember,
  CreateDynastyMember,
  UpdateDynastyMember,
  DynastyFamilyLink,
  CreateDynastyFamilyLink,
  DynastyEvent,
  CreateDynastyEvent,
  UpdateDynastyEvent,
} from '@campaigner/shared';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;
      const rawData: unknown = error.response.data;
      const payload =
        rawData && typeof rawData === 'object'
          ? (rawData as { error?: unknown; message?: unknown; details?: unknown })
          : undefined;

      const message =
        (typeof payload?.error === 'string' && payload?.error) ||
        (typeof payload?.message === 'string' && payload?.message) ||
        'An error occurred';
      console.error(`API Error [${status}]:`, message);

      const enrichedError = new Error(message) as Error & { status?: number; details?: unknown };
      enrichedError.status = status;
      enrichedError.details = payload?.details;
      return Promise.reject(enrichedError);
    }

    if (axios.isAxiosError(error) && error.request) {
      console.error('Network Error: No response received');
      return Promise.reject(new Error('Network error. Server may be unavailable.'));
    }

    return Promise.reject(error);
  }
);

type ListWithTotal<T> = {
  success: boolean;
  data: T;
  total: number;
};

type VoidResponse = ApiResponse<undefined>;

interface SearchResult {
  type: 'character' | 'note' | 'marker' | 'event' | 'dogma' | 'tag' | 'faction';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

interface WikiLink {
  id: number;
  projectId: number;
  sourceNoteId: number;
  targetNoteId: number;
  label: string;
  createdAt: string;
  sourceTitle?: string;
  targetTitle?: string;
}

interface FactionGraphNode {
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

interface FactionGraph {
  nodes: FactionGraphNode[];
  edges: FactionRelation[];
}

interface ImportedProjectPayload {
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

interface CreateTagRequest extends CreateTag {
  projectId: number;
}

type CharacterListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type NotesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  noteType?: string;
  folderId?: number | null;
};

type DogmaListParams = {
  category?: string;
  importance?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

type FactionsListParams = {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  // used by UI/store for infinite scroll; backend ignores unknown query keys
  append?: boolean;
};

type DynastiesListParams = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  append?: boolean;
};

// ==================== API методы ====================

export const projectsApi = {
  getAll: () => apiClient.get<ApiResponse<Project[]>>('/projects'),
  getById: (id: number) => apiClient.get<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: CreateProject) => apiClient.post<ApiResponse<Project>>('/projects', data),
  update: (id: number, data: UpdateProject) => apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/projects/${id}`),
  uploadMap: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('mapImage', file);
    return apiClient.post<ApiResponse<Project>>(`/projects/${id}/map`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportProject: (id: number) => apiClient.get<Blob>(`/projects/${id}/export`, { responseType: 'blob' }),
  importProject: (data: ImportedProjectPayload) => apiClient.post<ApiResponse<Project>>('/projects/import', data),
};

export const charactersApi = {
  getAll: (
    projectId: number,
    params?: CharacterListParams
  ) =>
    apiClient.get<PaginatedResponse<Character>>('/characters', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Character>>(`/characters/${id}`),
  create: (data: CreateCharacter) => apiClient.post<ApiResponse<Character>>('/characters', data),
  update: (id: number, data: UpdateCharacter) => apiClient.put<ApiResponse<Character>>(`/characters/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/characters/${id}`),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('characterImage', file);
    return apiClient.post<ApiResponse<Character>>(`/characters/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/characters/${id}/tags`, { tagIds }),
  getGraph: (projectId: number) => apiClient.get<ApiResponse<CharacterGraph>>('/characters/graph', { params: { projectId } }),
  getRelationships: (projectId: number) => apiClient.get<ApiResponse<CharacterRelationship[]>>('/characters/relationships/list', { params: { projectId } }),
  createRelationship: (data: CreateRelationship) => apiClient.post<ApiResponse<CharacterRelationship>>('/characters/relationships', data),
  updateRelationship: (id: number, data: UpdateRelationship) => apiClient.put<ApiResponse<CharacterRelationship>>(`/characters/relationships/${id}`, data),
  deleteRelationship: (id: number) => apiClient.delete<VoidResponse>(`/characters/relationships/${id}`),
};

export const notesApi = {
  getAll: (projectId: number, params?: NotesListParams) =>
    apiClient.get<PaginatedResponse<Note>>('/notes', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Note>>(`/notes/${id}`),
  create: (data: CreateNote) => apiClient.post<ApiResponse<Note>>('/notes', data),
  update: (id: number, data: UpdateNote) => apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/notes/${id}`),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/notes/${id}/tags`, { tagIds }),
};

export const mapApi = {
  getRootMap: (projectId: number) => apiClient.get<ApiResponse<Map | null>>(`/projects/${projectId}/maps/root`),
  getMapById: (mapId: number) => apiClient.get<ApiResponse<Map>>(`/maps/${mapId}`),
  getMapTree: (projectId: number) => apiClient.get<ApiResponse<Map[]>>(`/projects/${projectId}/maps/tree`),
  createMap: (data: CreateMap) => apiClient.post<ApiResponse<Map>>('/maps', data),
  updateMap: (mapId: number, data: UpdateMap) => apiClient.put<ApiResponse<Map>>(`/maps/${mapId}`, data),
  deleteMap: (mapId: number) => apiClient.delete<VoidResponse>(`/maps/${mapId}`),
  uploadMapImage: (mapId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<Map>>(`/maps/${mapId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMarkersByMapId: (mapId: number) => apiClient.get<ApiResponse<MapMarker[]>>(`/maps/${mapId}/markers`),
  createMarker: (mapId: number, data: CreateMarker) => apiClient.post<ApiResponse<MapMarker>>(`/maps/${mapId}/markers`, data),
  updateMarker: (markerId: number, data: UpdateMarker) => apiClient.put<ApiResponse<MapMarker>>(`/markers/${markerId}`, data),
  deleteMarker: (markerId: number) => apiClient.delete<VoidResponse>(`/markers/${markerId}`),
  // Территории
  getTerritoriesByMapId: (mapId: number) => apiClient.get<ApiResponse<MapTerritory[]>>(`/maps/${mapId}/territories`),
  createTerritory: (mapId: number, data: CreateTerritory) => apiClient.post<ApiResponse<MapTerritory>>(`/maps/${mapId}/territories`, data),
  updateTerritory: (territoryId: number, data: UpdateTerritory) => apiClient.put<ApiResponse<MapTerritory>>(`/territories/${territoryId}`, data),
  deleteTerritory: (territoryId: number) => apiClient.delete<VoidResponse>(`/territories/${territoryId}`),
};

export const timelineApi = {
  getAll: (projectId: number, era?: string) =>
    apiClient.get<ApiResponse<TimelineEvent[]>>('/timeline', { params: { projectId, era } }),
  getById: (id: number) =>
    apiClient.get<ApiResponse<TimelineEvent>>(`/timeline/${id}`),
  create: (data: CreateTimelineEvent) =>
    apiClient.post<ApiResponse<TimelineEvent>>('/timeline', data),
  update: (id: number, data: UpdateTimelineEvent) =>
    apiClient.put<ApiResponse<TimelineEvent>>(`/timeline/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/timeline/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<TimelineEvent[]>>('/timeline/reorder', { projectId, orderedIds }),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/timeline/${id}/tags`, { tagIds }),
};

export const tagsApi = {
  getAll: (projectId: number) => apiClient.get<ApiResponse<Tag[]>>('/tags', { params: { projectId } }),
  create: (data: CreateTagRequest) => apiClient.post<ApiResponse<Tag>>('/tags', data),
  delete: (id: number) => apiClient.delete<void>(`/tags/${id}`),
};

export const searchApi = {
  search: (projectId: number, query: string) =>
    apiClient.get<ApiResponse<SearchResult[]>>('/search', { params: { projectId, q: query } }),
};

export const wikiApi = {
  getLinks: (projectId: number, noteId?: number) =>
    apiClient.get<ApiResponse<WikiLink[]>>('/wiki/links', { params: { projectId, noteId } }),
  createLink: (data: {
    projectId: number;
    sourceNoteId: number;
    targetNoteId: number;
    label?: string;
  }) => apiClient.post<ApiResponse<WikiLink>>('/wiki/links', data),
  deleteLink: (id: number) => apiClient.delete<VoidResponse>(`/wiki/links/${id}`),
  getCategories: (projectId: number) =>
    apiClient.get<ApiResponse<{ name: string; count: number }[]>>('/wiki/categories', { params: { projectId } }),
};

export const dogmasApi = {
  getAll: (
    projectId: number,
    params?: DogmaListParams
  ) =>
    apiClient.get<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Dogma>>(`/dogmas/${id}`),
  create: (data: CreateDogma) => apiClient.post<ApiResponse<Dogma>>('/dogmas', data),
  update: (id: number, data: UpdateDogma) => apiClient.put<ApiResponse<Dogma>>(`/dogmas/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/dogmas/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas/reorder', { projectId, orderedIds }),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/dogmas/${id}/tags`, { tagIds }),
};

export const factionsApi = {
  getAll: (projectId: number, params?: FactionsListParams) =>
    apiClient.get<ListWithTotal<Faction[]>>('/factions', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Faction>>(`/factions/${id}`),
  create: (data: CreateFaction) => apiClient.post<ApiResponse<Faction>>('/factions', data),
  update: (id: number, data: UpdateFaction) => apiClient.put<ApiResponse<Faction>>(`/factions/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/factions/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post<ApiResponse<Faction>>(`/factions/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('banner', file);
    return apiClient.post<ApiResponse<Faction>>(`/factions/${id}/banner`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/factions/${id}/tags`, { tagIds }),
  // Ranks
  getRanks: (factionId: number) => apiClient.get<ApiResponse<FactionRank[]>>(`/factions/${factionId}/ranks`),
  createRank: (factionId: number, data: CreateFactionRank) =>
    apiClient.post<ApiResponse<FactionRank>>(`/factions/${factionId}/ranks`, data),
  updateRank: (factionId: number, rankId: number, data: UpdateFactionRank) =>
    apiClient.put<ApiResponse<FactionRank>>(`/factions/${factionId}/ranks/${rankId}`, data),
  deleteRank: (factionId: number, rankId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/ranks/${rankId}`),
  // Members
  getMembers: (factionId: number) => apiClient.get<ApiResponse<FactionMember[]>>(`/factions/${factionId}/members`),
  addMember: (factionId: number, data: CreateFactionMember) =>
    apiClient.post<ApiResponse<FactionMember>>(`/factions/${factionId}/members`, data),
  updateMember: (factionId: number, memberId: number, data: UpdateFactionMember) =>
    apiClient.put<ApiResponse<FactionMember>>(`/factions/${factionId}/members/${memberId}`, data),
  removeMember: (factionId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/members/${memberId}`),
  // Relations
  getRelations: (projectId: number) => apiClient.get<ApiResponse<FactionRelation[]>>('/factions/relations', { params: { projectId } }),
  createRelation: (data: CreateFactionRelation) => apiClient.post<ApiResponse<FactionRelation>>('/factions/relations', data),
  updateRelation: (relationId: number, data: UpdateFactionRelation) =>
    apiClient.put<ApiResponse<FactionRelation>>(`/factions/relations/${relationId}`, data),
  deleteRelation: (relationId: number) =>
    apiClient.delete<VoidResponse>(`/factions/relations/${relationId}`),
  // Graph
  getGraph: (projectId: number) => apiClient.get<ApiResponse<FactionGraph>>('/factions/graph', { params: { projectId } }),
};

export const dynastiesApi = {
  getAll: (projectId: number, params?: DynastiesListParams) =>
    apiClient.get<ListWithTotal<Dynasty[]>>('/dynasties', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Dynasty>>(`/dynasties/${id}`),
  create: (data: CreateDynasty) => apiClient.post<ApiResponse<Dynasty>>('/dynasties', data),
  update: (id: number, data: UpdateDynasty) => apiClient.put<ApiResponse<Dynasty>>(`/dynasties/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/dynasties/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post<ApiResponse<Dynasty>>(`/dynasties/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/dynasties/${id}/tags`, { tagIds }),
  // Members
  addMember: (dynastyId: number, data: CreateDynastyMember) =>
    apiClient.post<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members`, data),
  updateMember: (dynastyId: number, memberId: number, data: UpdateDynastyMember) =>
    apiClient.put<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members/${memberId}`, data),
  removeMember: (dynastyId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/members/${memberId}`),
  // Family links
  addFamilyLink: (dynastyId: number, data: CreateDynastyFamilyLink) =>
    apiClient.post<ApiResponse<DynastyFamilyLink>>(`/dynasties/${dynastyId}/family-links`, data),
  deleteFamilyLink: (dynastyId: number, linkId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/family-links/${linkId}`),
  saveGraphPositions: (
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[]
  ) => apiClient.put<VoidResponse>(`/dynasties/${dynastyId}/graph-positions`, { positions }),
  // Events
  addEvent: (dynastyId: number, data: CreateDynastyEvent) =>
    apiClient.post<ApiResponse<DynastyEvent>>(`/dynasties/${dynastyId}/events`, data),
  updateEvent: (
    dynastyId: number,
    eventId: number,
    data: UpdateDynastyEvent
  ) => apiClient.put<ApiResponse<DynastyEvent>>(`/dynasties/${dynastyId}/events/${eventId}`, data),
  deleteEvent: (dynastyId: number, eventId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/events/${eventId}`),
};
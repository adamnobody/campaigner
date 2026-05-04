import type {
  ApiResponse,
  PaginatedResponse,
  Character,
  CreateCharacter,
  UpdateCharacter,
  CharacterRelationship,
  CharacterGraph,
  CreateRelationship,
  UpdateRelationship,
  Tag,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { CharacterListParams } from './types';
import { withBranchParams } from './withBranchParams';

export const charactersApi = {
  getAll: (projectId: number, params?: CharacterListParams) =>
    apiClient.get<PaginatedResponse<Character>>('/characters', {
      params: withBranchParams({ projectId, ...params }),
    }),
  getById: (id: number, projectId: number) =>
    apiClient.get<ApiResponse<Character>>(`/characters/${id}`, { params: withBranchParams({}, projectId) }),
  create: (data: CreateCharacter) =>
    apiClient.post<ApiResponse<Character>>('/characters', withBranchParams({ ...data })),
  update: (id: number, data: UpdateCharacter, projectId: number) =>
    apiClient.put<ApiResponse<Character>>(`/characters/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/characters/${id}`, { params: withBranchParams({}, projectId) }),
  uploadImage: (id: number, file: File, projectId: number) => {
    const formData = new FormData();
    formData.append('characterImage', file);
    return apiClient.post<ApiResponse<Character>>(`/characters/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withBranchParams({}, projectId),
    });
  },
  setTags: (id: number, tagIds: number[], projectId: number) =>
    apiClient.put<ApiResponse<Tag[]>>(`/characters/${id}/tags`, { tagIds }, { params: withBranchParams({}, projectId) }),
  getGraph: (projectId: number) =>
    apiClient.get<ApiResponse<CharacterGraph>>('/characters/graph', { params: withBranchParams({ projectId }) }),
  getRelationships: (projectId: number) =>
    apiClient.get<ApiResponse<CharacterRelationship[]>>('/characters/relationships/list', {
      params: withBranchParams({ projectId }),
    }),
  createRelationship: (data: CreateRelationship) =>
    apiClient.post<ApiResponse<CharacterRelationship>>('/characters/relationships', withBranchParams({ ...data })),
  updateRelationship: (id: number, data: UpdateRelationship, projectId: number) =>
    apiClient.put<ApiResponse<CharacterRelationship>>(
      `/characters/relationships/${id}`,
      withBranchParams({ ...data }, projectId),
    ),
  deleteRelationship: (id: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/characters/relationships/${id}`, {
      params: withBranchParams({}, projectId),
    }),
};

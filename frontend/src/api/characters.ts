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

export const charactersApi = {
  getAll: (projectId: number, params?: CharacterListParams) =>
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

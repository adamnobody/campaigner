import type { ApiResponse, CharacterTrait, CreateCharacterTrait } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const characterTraitsApi = {
  getAll: (projectId: number) =>
    apiClient.get<ApiResponse<CharacterTrait[]>>('/character-traits', { params: { projectId } }),

  getAssigned: (characterId: number) =>
    apiClient.get<ApiResponse<number[]>>('/character-traits/assigned', { params: { characterId } }),

  assign: (characterId: number, traitId: number) =>
    apiClient.post<VoidResponse>('/character-traits/assign', { characterId, traitId }),

  unassign: (characterId: number, traitId: number) =>
    apiClient.post<VoidResponse>('/character-traits/unassign', { characterId, traitId }),

  create: (data: CreateCharacterTrait) =>
    apiClient.post<ApiResponse<CharacterTrait>>('/character-traits', data),

  updateExclusions: (id: number, excludedIds: number[]) =>
    apiClient.patch<ApiResponse<CharacterTrait>>(`/character-traits/${id}/exclusions`, { excludedIds }),

  delete: (id: number) => apiClient.delete<VoidResponse>(`/character-traits/${id}`),
};

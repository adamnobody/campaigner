import type { Ambition, ApiResponse, CreateAmbition, UpdateAmbition } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const ambitionsApi = {
  getCatalog: (projectId: number) =>
    apiClient.get<ApiResponse<Ambition[]>>('/ambitions', { params: { projectId } }),

  create: (data: CreateAmbition) =>
    apiClient.post<ApiResponse<Ambition>>('/ambitions', data),

  update: (id: number, data: UpdateAmbition) =>
    apiClient.patch<ApiResponse<Ambition>>(`/ambitions/${id}`, data),

  updateExclusions: (id: number, excludedIds: number[]) =>
    apiClient.patch<ApiResponse<Ambition>>(`/ambitions/${id}/exclusions`, { excludedIds }),

  delete: (id: number) =>
    apiClient.delete<VoidResponse>(`/ambitions/${id}`),

  getFactionAmbitions: (factionId: number) =>
    apiClient.get<ApiResponse<Ambition[]>>(`/factions/${factionId}/ambitions`),

  assignFactionAmbition: (factionId: number, ambitionId: number) =>
    apiClient.post<VoidResponse>(`/factions/${factionId}/ambitions`, { ambitionId }),

  unassignFactionAmbition: (factionId: number, ambitionId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/ambitions/${ambitionId}`),
};

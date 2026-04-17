import type {
  ApiResponse,
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
  CustomMetric,
  ReplaceFactionCustomMetrics,
  CompareFactionsInput,
  FactionCompareResult,
  FactionGraph,
  Tag,
  FactionPolicy,
  CreateFactionPolicy,
  UpdateFactionPolicy,
} from '@campaigner/shared';
import { apiClient, type ListWithTotal, type VoidResponse } from './client';
import type { FactionsListParams } from './types';

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
  getRanks: (factionId: number) => apiClient.get<ApiResponse<FactionRank[]>>(`/factions/${factionId}/ranks`),
  createRank: (factionId: number, data: CreateFactionRank) =>
    apiClient.post<ApiResponse<FactionRank>>(`/factions/${factionId}/ranks`, data),
  updateRank: (factionId: number, rankId: number, data: UpdateFactionRank) =>
    apiClient.put<ApiResponse<FactionRank>>(`/factions/${factionId}/ranks/${rankId}`, data),
  deleteRank: (factionId: number, rankId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/ranks/${rankId}`),
  getMembers: (factionId: number) => apiClient.get<ApiResponse<FactionMember[]>>(`/factions/${factionId}/members`),
  addMember: (factionId: number, data: CreateFactionMember) =>
    apiClient.post<ApiResponse<FactionMember>>(`/factions/${factionId}/members`, data),
  updateMember: (factionId: number, memberId: number, data: UpdateFactionMember) =>
    apiClient.put<ApiResponse<FactionMember>>(`/factions/${factionId}/members/${memberId}`, data),
  removeMember: (factionId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/members/${memberId}`),
  replaceCustomMetrics: (factionId: number, data: ReplaceFactionCustomMetrics) =>
    apiClient.put<ApiResponse<CustomMetric[]>>(`/factions/${factionId}/custom-metrics`, data),
  compare: (data: CompareFactionsInput) =>
    apiClient.post<ApiResponse<FactionCompareResult>>('/factions/compare', data),
  getRelations: (projectId: number) => apiClient.get<ApiResponse<FactionRelation[]>>('/factions/relations', { params: { projectId } }),
  createRelation: (data: CreateFactionRelation) => apiClient.post<ApiResponse<FactionRelation>>('/factions/relations', data),
  updateRelation: (relationId: number, data: UpdateFactionRelation) =>
    apiClient.put<ApiResponse<FactionRelation>>(`/factions/relations/${relationId}`, data),
  deleteRelation: (relationId: number) =>
    apiClient.delete<VoidResponse>(`/factions/relations/${relationId}`),
  getGraph: (projectId: number) => apiClient.get<ApiResponse<FactionGraph>>('/factions/graph', { params: { projectId } }),
  getPolicies: (factionId: number) =>
    apiClient.get<ApiResponse<FactionPolicy[]>>(`/factions/${factionId}/policies`),
  createPolicy: (factionId: number, data: CreateFactionPolicy) =>
    apiClient.post<ApiResponse<FactionPolicy>>(`/factions/${factionId}/policies`, data),
  updatePolicy: (factionId: number, policyId: number, data: UpdateFactionPolicy) =>
    apiClient.put<ApiResponse<FactionPolicy>>(`/factions/${factionId}/policies/${policyId}`, data),
  deletePolicy: (factionId: number, policyId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/policies/${policyId}`),
};

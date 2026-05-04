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
import { withBranchParams } from './withBranchParams';

export const factionsApi = {
  getAll: (projectId: number, params?: FactionsListParams) =>
    apiClient.get<ListWithTotal<Faction[]>>('/factions', { params: withBranchParams({ projectId, ...params }) }),
  getById: (id: number, projectId: number) =>
    apiClient.get<ApiResponse<Faction>>(`/factions/${id}`, { params: withBranchParams({}, projectId) }),
  create: (data: CreateFaction) =>
    apiClient.post<ApiResponse<Faction>>('/factions', withBranchParams({ ...data })),
  update: (id: number, data: UpdateFaction, projectId: number) =>
    apiClient.put<ApiResponse<Faction>>(`/factions/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${id}`, { params: withBranchParams({}, projectId) }),
  uploadImage: (id: number, file: File, projectId: number) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post<ApiResponse<Faction>>(`/factions/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withBranchParams({}, projectId),
    });
  },
  uploadBanner: (id: number, file: File, projectId: number) => {
    const fd = new FormData();
    fd.append('banner', file);
    return apiClient.post<ApiResponse<Faction>>(`/factions/${id}/banner`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withBranchParams({}, projectId),
    });
  },
  setTags: (id: number, tagIds: number[], projectId: number) =>
    apiClient.put<ApiResponse<Tag[]>>(`/factions/${id}/tags`, { tagIds }, { params: withBranchParams({}, projectId) }),
  getRanks: (factionId: number, projectId: number) =>
    apiClient.get<ApiResponse<FactionRank[]>>(`/factions/${factionId}/ranks`, { params: withBranchParams({}, projectId) }),
  createRank: (factionId: number, data: CreateFactionRank, projectId: number) =>
    apiClient.post<ApiResponse<FactionRank>>(`/factions/${factionId}/ranks`, data, { params: withBranchParams({}, projectId) }),
  updateRank: (factionId: number, rankId: number, data: UpdateFactionRank, projectId: number) =>
    apiClient.put<ApiResponse<FactionRank>>(
      `/factions/${factionId}/ranks/${rankId}`,
      data,
      { params: withBranchParams({}, projectId) },
    ),
  deleteRank: (factionId: number, rankId: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/ranks/${rankId}`, {
      params: withBranchParams({}, projectId),
    }),
  getMembers: (factionId: number, projectId: number) =>
    apiClient.get<ApiResponse<FactionMember[]>>(`/factions/${factionId}/members`, { params: withBranchParams({}, projectId) }),
  addMember: (factionId: number, data: CreateFactionMember, projectId: number) =>
    apiClient.post<ApiResponse<FactionMember>>(`/factions/${factionId}/members`, data, {
      params: withBranchParams({}, projectId),
    }),
  updateMember: (factionId: number, memberId: number, data: UpdateFactionMember) =>
    apiClient.put<ApiResponse<FactionMember>>(`/factions/${factionId}/members/${memberId}`, data),
  removeMember: (factionId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/members/${memberId}`),
  replaceCustomMetrics: (factionId: number, data: ReplaceFactionCustomMetrics, projectId: number) =>
    apiClient.put<ApiResponse<CustomMetric[]>>(`/factions/${factionId}/custom-metrics`, data, {
      params: withBranchParams({}, projectId),
    }),
  compare: (data: CompareFactionsInput) =>
    apiClient.post<ApiResponse<FactionCompareResult>>('/factions/compare', data),
  getRelations: (projectId: number) =>
    apiClient.get<ApiResponse<FactionRelation[]>>('/factions/relations', { params: withBranchParams({ projectId }) }),
  createRelation: (data: CreateFactionRelation) =>
    apiClient.post<ApiResponse<FactionRelation>>('/factions/relations', withBranchParams({ ...data })),
  updateRelation: (relationId: number, data: UpdateFactionRelation) =>
    apiClient.put<ApiResponse<FactionRelation>>(`/factions/relations/${relationId}`, data),
  deleteRelation: (relationId: number) =>
    apiClient.delete<VoidResponse>(`/factions/relations/${relationId}`),
  getGraph: (projectId: number) =>
    apiClient.get<ApiResponse<FactionGraph>>('/factions/graph', { params: withBranchParams({ projectId }) }),
  getPolicies: (factionId: number, projectId: number) =>
    apiClient.get<ApiResponse<FactionPolicy[]>>(`/factions/${factionId}/policies`, { params: withBranchParams({}, projectId) }),
  createPolicy: (factionId: number, data: CreateFactionPolicy, projectId: number) =>
    apiClient.post<ApiResponse<FactionPolicy>>(`/factions/${factionId}/policies`, data, {
      params: withBranchParams({}, projectId),
    }),
  updatePolicy: (factionId: number, policyId: number, data: UpdateFactionPolicy, projectId: number) =>
    apiClient.put<ApiResponse<FactionPolicy>>(`/factions/${factionId}/policies/${policyId}`, data, {
      params: withBranchParams({}, projectId),
    }),
  deletePolicy: (factionId: number, policyId: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/factions/${factionId}/policies/${policyId}`, {
      params: withBranchParams({}, projectId),
    }),
};

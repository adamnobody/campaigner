import type {
  ApiResponse,
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
  Tag,
} from '@campaigner/shared';
import { apiClient, type ListWithTotal, type VoidResponse } from './client';
import type { DynastiesListParams } from './types';
import { withBranchParams } from './withBranchParams';

export const dynastiesApi = {
  getAll: (projectId: number, params?: DynastiesListParams) =>
    apiClient.get<ListWithTotal<Dynasty[]>>('/dynasties', {
      params: withBranchParams({ projectId, ...params }),
    }),
  getById: (id: number, projectId: number) =>
    apiClient.get<ApiResponse<Dynasty>>(`/dynasties/${id}`, { params: withBranchParams({}, projectId) }),
  create: (data: CreateDynasty) =>
    apiClient.post<ApiResponse<Dynasty>>('/dynasties', withBranchParams({ ...data })),
  update: (id: number, data: UpdateDynasty, projectId: number) =>
    apiClient.put<ApiResponse<Dynasty>>(`/dynasties/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${id}`, { params: withBranchParams({}, projectId) }),
  uploadImage: (id: number, file: File, projectId: number) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post<ApiResponse<Dynasty>>(`/dynasties/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withBranchParams({}, projectId),
    });
  },
  setTags: (id: number, tagIds: number[], projectId: number) =>
    apiClient.put<ApiResponse<Tag[]>>(`/dynasties/${id}/tags`, { tagIds }, { params: withBranchParams({}, projectId) }),
  addMember: (dynastyId: number, data: CreateDynastyMember, projectId: number) =>
    apiClient.post<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members`, withBranchParams({ ...data }, projectId)),
  updateMember: (dynastyId: number, memberId: number, data: UpdateDynastyMember) =>
    apiClient.put<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members/${memberId}`, data),
  removeMember: (dynastyId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/members/${memberId}`),
  addFamilyLink: (dynastyId: number, data: CreateDynastyFamilyLink, projectId: number) =>
    apiClient.post<ApiResponse<DynastyFamilyLink>>(
      `/dynasties/${dynastyId}/family-links`,
      withBranchParams({ ...data }, projectId),
    ),
  deleteFamilyLink: (dynastyId: number, linkId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/family-links/${linkId}`),
  saveGraphPositions: (
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[],
    projectId: number,
  ) =>
    apiClient.put<VoidResponse>(
      `/dynasties/${dynastyId}/graph-positions`,
      withBranchParams({ positions }, projectId),
    ),
  addEvent: (dynastyId: number, data: CreateDynastyEvent, projectId: number) =>
    apiClient.post<ApiResponse<DynastyEvent>>(
      `/dynasties/${dynastyId}/events`,
      withBranchParams({ ...data }, projectId),
    ),
  updateEvent: (dynastyId: number, eventId: number, data: UpdateDynastyEvent) =>
    apiClient.put<ApiResponse<DynastyEvent>>(`/dynasties/${dynastyId}/events/${eventId}`, data),
  deleteEvent: (dynastyId: number, eventId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/events/${eventId}`),
  reorderEvents: (dynastyId: number, orderedIds: number[], projectId: number) =>
    apiClient.post<ApiResponse<Dynasty>>(`/dynasties/${dynastyId}/events/reorder`, withBranchParams({ orderedIds }, projectId)),
};

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
  addMember: (dynastyId: number, data: CreateDynastyMember) =>
    apiClient.post<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members`, data),
  updateMember: (dynastyId: number, memberId: number, data: UpdateDynastyMember) =>
    apiClient.put<ApiResponse<DynastyMember>>(`/dynasties/${dynastyId}/members/${memberId}`, data),
  removeMember: (dynastyId: number, memberId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/members/${memberId}`),
  addFamilyLink: (dynastyId: number, data: CreateDynastyFamilyLink) =>
    apiClient.post<ApiResponse<DynastyFamilyLink>>(`/dynasties/${dynastyId}/family-links`, data),
  deleteFamilyLink: (dynastyId: number, linkId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/family-links/${linkId}`),
  saveGraphPositions: (
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[]
  ) => apiClient.put<VoidResponse>(`/dynasties/${dynastyId}/graph-positions`, { positions }),
  addEvent: (dynastyId: number, data: CreateDynastyEvent) =>
    apiClient.post<ApiResponse<DynastyEvent>>(`/dynasties/${dynastyId}/events`, data),
  updateEvent: (dynastyId: number, eventId: number, data: UpdateDynastyEvent) =>
    apiClient.put<ApiResponse<DynastyEvent>>(`/dynasties/${dynastyId}/events/${eventId}`, data),
  deleteEvent: (dynastyId: number, eventId: number) =>
    apiClient.delete<VoidResponse>(`/dynasties/${dynastyId}/events/${eventId}`),
};

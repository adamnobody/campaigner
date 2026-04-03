import type { ApiResponse, TimelineEvent, CreateTimelineEvent, UpdateTimelineEvent, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

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

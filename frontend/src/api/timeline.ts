import type { ApiResponse, TimelineEvent, CreateTimelineEvent, UpdateTimelineEvent, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import { withBranchParams } from './withBranchParams';

export const timelineApi = {
  getAll: (projectId: number, era?: string) =>
    apiClient.get<ApiResponse<TimelineEvent[]>>('/timeline', {
      params: withBranchParams({ projectId, era }),
    }),
  getById: (id: number, projectId?: number) =>
    apiClient.get<ApiResponse<TimelineEvent>>(`/timeline/${id}`, {
      params: withBranchParams({}, projectId),
    }),
  create: (data: CreateTimelineEvent) =>
    apiClient.post<ApiResponse<TimelineEvent>>('/timeline', withBranchParams({ ...data })),
  update: (id: number, data: UpdateTimelineEvent, projectId?: number) =>
    apiClient.put<ApiResponse<TimelineEvent>>(`/timeline/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId?: number) =>
    apiClient.delete<VoidResponse>(`/timeline/${id}`, { params: withBranchParams({}, projectId) }),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<TimelineEvent[]>>('/timeline/reorder', withBranchParams({ projectId, orderedIds })),
  setTags: (id: number, tagIds: number[], projectId?: number) =>
    apiClient.put<ApiResponse<Tag[]>>(`/timeline/${id}/tags`, { tagIds }, { params: withBranchParams({}, projectId) }),
};

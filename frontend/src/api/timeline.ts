import type { ApiResponse, TimelineEvent, CreateTimelineEvent, UpdateTimelineEvent, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import { getActiveBranchId } from '@/store/branchStorage';

function withBranch<T extends Record<string, unknown>>(payload: T): T & { branchId?: number } {
  const branchId = getActiveBranchId();
  return branchId ? { ...payload, branchId } : payload;
}

export const timelineApi = {
  getAll: (projectId: number, era?: string) =>
    apiClient.get<ApiResponse<TimelineEvent[]>>('/timeline', { params: withBranch({ projectId, era }) }),
  getById: (id: number) =>
    apiClient.get<ApiResponse<TimelineEvent>>(`/timeline/${id}`, { params: withBranch({}) }),
  create: (data: CreateTimelineEvent) =>
    apiClient.post<ApiResponse<TimelineEvent>>('/timeline', withBranch({ ...data })),
  update: (id: number, data: UpdateTimelineEvent) =>
    apiClient.put<ApiResponse<TimelineEvent>>(`/timeline/${id}`, withBranch({ ...data })),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/timeline/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<TimelineEvent[]>>('/timeline/reorder', withBranch({ projectId, orderedIds })),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/timeline/${id}/tags`, { tagIds }),
};

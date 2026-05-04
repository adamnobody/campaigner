import type { ApiResponse, Dogma, CreateDogma, UpdateDogma, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { DogmaListParams } from './types';
import { withBranchParams } from './withBranchParams';

export const dogmasApi = {
  getAll: (projectId: number, params?: DogmaListParams) =>
    apiClient.get<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas', {
      params: withBranchParams({ projectId, ...(params ?? {}) }),
    }),
  getById: (id: number, projectId?: number) =>
    apiClient.get<ApiResponse<Dogma>>(`/dogmas/${id}`, { params: withBranchParams({}, projectId) }),
  create: (data: CreateDogma) =>
    apiClient.post<ApiResponse<Dogma>>('/dogmas', withBranchParams({ ...data })),
  update: (id: number, data: UpdateDogma, projectId?: number) =>
    apiClient.put<ApiResponse<Dogma>>(`/dogmas/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId?: number) =>
    apiClient.delete<VoidResponse>(`/dogmas/${id}`, { params: withBranchParams({}, projectId) }),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas/reorder', withBranchParams({ projectId, orderedIds })),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/dogmas/${id}/tags`, { tagIds }),
};

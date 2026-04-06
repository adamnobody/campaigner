import type { ApiResponse, Dogma, CreateDogma, UpdateDogma, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { DogmaListParams } from './types';
import { getActiveBranchId } from '@/store/branchStorage';

function withBranch<T extends Record<string, unknown>>(payload: T): T & { branchId?: number } {
  const branchId = getActiveBranchId();
  return branchId ? { ...payload, branchId } : payload;
}

export const dogmasApi = {
  getAll: (projectId: number, params?: DogmaListParams) =>
    apiClient.get<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas', { params: withBranch({ projectId, ...(params ?? {}) }) }),
  getById: (id: number) => apiClient.get<ApiResponse<Dogma>>(`/dogmas/${id}`, { params: withBranch({}) }),
  create: (data: CreateDogma) => apiClient.post<ApiResponse<Dogma>>('/dogmas', data),
  update: (id: number, data: UpdateDogma) => apiClient.put<ApiResponse<Dogma>>(`/dogmas/${id}`, withBranch({ ...data })),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/dogmas/${id}`, { params: withBranch({}) }),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas/reorder', withBranch({ projectId, orderedIds })),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/dogmas/${id}/tags`, { tagIds }),
};

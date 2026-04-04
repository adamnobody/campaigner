import type { ApiResponse, Dogma, CreateDogma, UpdateDogma, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { DogmaListParams } from './types';

export const dogmasApi = {
  getAll: (projectId: number, params?: DogmaListParams) =>
    apiClient.get<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Dogma>>(`/dogmas/${id}`),
  create: (data: CreateDogma) => apiClient.post<ApiResponse<Dogma>>('/dogmas', data),
  update: (id: number, data: UpdateDogma) => apiClient.put<ApiResponse<Dogma>>(`/dogmas/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/dogmas/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post<ApiResponse<{ items: Dogma[]; total: number }>>('/dogmas/reorder', { projectId, orderedIds }),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/dogmas/${id}/tags`, { tagIds }),
};

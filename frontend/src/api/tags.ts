import type { ApiResponse, Tag } from '@campaigner/shared';
import { apiClient } from './client';
import type { CreateTagRequest } from './types';

export const tagsApi = {
  getAll: (projectId: number) => apiClient.get<ApiResponse<Tag[]>>('/tags', { params: { projectId } }),
  create: (data: CreateTagRequest) => apiClient.post<ApiResponse<Tag>>('/tags', data),
  delete: (id: number) => apiClient.delete<void>(`/tags/${id}`),
};

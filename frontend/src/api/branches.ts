import type {
  ApiResponse,
  ScenarioBranch,
  CreateScenarioBranch,
  UpdateScenarioBranch,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const branchesApi = {
  getAll: (projectId: number) =>
    apiClient.get<ApiResponse<ScenarioBranch[]>>('/branches', { params: { projectId } }),
  create: (data: CreateScenarioBranch) =>
    apiClient.post<ApiResponse<ScenarioBranch>>('/branches', data),
  update: (id: number, data: UpdateScenarioBranch) =>
    apiClient.put<ApiResponse<ScenarioBranch>>(`/branches/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<VoidResponse>(`/branches/${id}`),
};

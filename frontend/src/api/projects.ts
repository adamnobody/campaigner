import type { ApiResponse, Project, CreateProject, UpdateProject } from '@campaigner/shared';
import { apiClient } from './client';
import type { ImportedProjectPayload } from './types';

export const projectsApi = {
  getAll: () => apiClient.get<ApiResponse<Project[]>>('/projects'),
  getById: (id: number) => apiClient.get<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: CreateProject) => apiClient.post<ApiResponse<Project>>('/projects', data),
  update: (id: number, data: UpdateProject) => apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/projects/${id}`),
  uploadMap: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('mapImage', file);
    return apiClient.post<ApiResponse<Project>>(`/projects/${id}/map`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportProject: (id: number) => apiClient.get<Blob>(`/projects/${id}/export`, { responseType: 'blob' }),
  importProject: (data: ImportedProjectPayload) => apiClient.post<ApiResponse<Project>>('/projects/import', data),
};

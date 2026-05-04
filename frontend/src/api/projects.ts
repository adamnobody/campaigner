import type {
  ApiResponse,
  Project,
  CreateProject,
  UpdateProject,
  ImportedProjectPayload,
} from '@campaigner/shared';
import type { AppLanguage } from '@/i18n/types';
import { apiClient } from './client';

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
  importProject: (data: ImportedProjectPayload, opts?: { locale?: AppLanguage }) =>
    apiClient.post<ApiResponse<Project>>('/projects/import', {
      ...data,
      ...(opts?.locale ? { importLocale: opts.locale } : {}),
    }),
  createDemoProject: (body?: { locale?: AppLanguage }) =>
    apiClient.post<ApiResponse<Project>>('/projects/demo', body ?? {}),
};

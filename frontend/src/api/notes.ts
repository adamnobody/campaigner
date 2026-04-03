import type { ApiResponse, PaginatedResponse, Note, CreateNote, UpdateNote, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { NotesListParams } from './types';

export const notesApi = {
  getAll: (projectId: number, params?: NotesListParams) =>
    apiClient.get<PaginatedResponse<Note>>('/notes', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get<ApiResponse<Note>>(`/notes/${id}`),
  create: (data: CreateNote) => apiClient.post<ApiResponse<Note>>('/notes', data),
  update: (id: number, data: UpdateNote) => apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data),
  delete: (id: number) => apiClient.delete<VoidResponse>(`/notes/${id}`),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/notes/${id}/tags`, { tagIds }),
};

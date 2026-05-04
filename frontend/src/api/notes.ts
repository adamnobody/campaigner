import type { ApiResponse, PaginatedResponse, Note, CreateNote, UpdateNote, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { NotesListParams } from './types';
import { withBranchParams } from './withBranchParams';

export const notesApi = {
  getAll: (projectId: number, params?: NotesListParams) =>
    apiClient.get<PaginatedResponse<Note>>('/notes', {
      params: withBranchParams({ projectId, ...(params ?? {}) }),
    }),
  getById: (id: number, projectId?: number) =>
    apiClient.get<ApiResponse<Note>>(`/notes/${id}`, { params: withBranchParams({}, projectId) }),
  create: (data: CreateNote) => apiClient.post<ApiResponse<Note>>('/notes', withBranchParams({ ...data })),
  update: (id: number, data: UpdateNote, projectId?: number) =>
    apiClient.put<ApiResponse<Note>>(`/notes/${id}`, withBranchParams({ ...data }, projectId)),
  delete: (id: number, projectId?: number) =>
    apiClient.delete<VoidResponse>(`/notes/${id}`, { params: withBranchParams({}, projectId) }),
  setTags: (id: number, tagIds: number[], projectId?: number) =>
    apiClient.put<ApiResponse<Tag[]>>(`/notes/${id}/tags`, { tagIds }, { params: withBranchParams({}, projectId) }),
};

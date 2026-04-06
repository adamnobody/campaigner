import type { ApiResponse, PaginatedResponse, Note, CreateNote, UpdateNote, Tag } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { NotesListParams } from './types';
import { getActiveBranchId } from '@/store/branchStorage';

function withBranch<T extends Record<string, unknown>>(payload: T): T & { branchId?: number } {
  const branchId = getActiveBranchId();
  return branchId ? { ...payload, branchId } : payload;
}

export const notesApi = {
  getAll: (projectId: number, params?: NotesListParams) =>
    apiClient.get<PaginatedResponse<Note>>('/notes', { params: withBranch({ projectId, ...(params ?? {}) }) }),
  getById: (id: number) => apiClient.get<ApiResponse<Note>>(`/notes/${id}`, { params: withBranch({}) }),
  create: (data: CreateNote) => apiClient.post<ApiResponse<Note>>('/notes', withBranch({ ...data })),
  update: (id: number, data: UpdateNote) => apiClient.put<ApiResponse<Note>>(`/notes/${id}`, withBranch({ ...data })),
  delete: (id: number) =>
    apiClient.delete<VoidResponse>(`/notes/${id}`, { params: withBranch({}) }),
  setTags: (id: number, tagIds: number[]) => apiClient.put<ApiResponse<Tag[]>>(`/notes/${id}/tags`, { tagIds }),
};

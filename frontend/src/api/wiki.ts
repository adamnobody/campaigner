import type { ApiResponse } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { WikiLink, CreateWikiLink } from '@campaigner/shared';

export const wikiApi = {
  getLinks: (projectId: number, noteId?: number) =>
    apiClient.get<ApiResponse<WikiLink[]>>('/wiki/links', { params: { projectId, noteId } }),
  createLink: (data: CreateWikiLink) => apiClient.post<ApiResponse<WikiLink>>('/wiki/links', data),
  deleteLink: (id: number) => apiClient.delete<VoidResponse>(`/wiki/links/${id}`),
  getCategories: (projectId: number) =>
    apiClient.get<ApiResponse<{ name: string; count: number }[]>>('/wiki/categories', { params: { projectId } }),
};

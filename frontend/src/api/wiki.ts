import type { ApiResponse } from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import type { WikiLink, CreateWikiLink } from '@campaigner/shared';
import { withBranchParams } from './withBranchParams';

export const wikiApi = {
  getLinks: (projectId: number, noteId?: number) =>
    apiClient.get<ApiResponse<WikiLink[]>>('/wiki/links', {
      params: withBranchParams({ projectId, ...(noteId != null ? { noteId } : {}) }),
    }),
  createLink: (data: CreateWikiLink) =>
    apiClient.post<ApiResponse<WikiLink>>('/wiki/links', withBranchParams({ ...data })),
  deleteLink: (id: number, projectId: number) =>
    apiClient.delete<VoidResponse>(`/wiki/links/${id}`, { params: withBranchParams({}, projectId) }),
  getCategories: (projectId: number) =>
    apiClient.get<ApiResponse<{ name: string; count: number }[]>>('/wiki/categories', {
      params: withBranchParams({ projectId }),
    }),
};

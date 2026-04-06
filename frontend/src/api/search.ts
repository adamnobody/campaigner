import type { ApiResponse } from '@campaigner/shared';
import { apiClient } from './client';
import type { SearchResult } from '@campaigner/shared';

export const searchApi = {
  search: (projectId: number, query: string) =>
    apiClient.get<ApiResponse<SearchResult[]>>('/search', { params: { projectId, q: query } }),
};

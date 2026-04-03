import type { ApiResponse } from '@campaigner/shared';
import { apiClient } from './client';
import type { SearchResult } from './types';

export const searchApi = {
  search: (projectId: number, query: string) =>
    apiClient.get<ApiResponse<SearchResult[]>>('/search', { params: { projectId, q: query } }),
};

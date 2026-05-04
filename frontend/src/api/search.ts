import type { ApiResponse } from '@campaigner/shared';
import { apiClient } from './client';
import type { SearchResult } from '@campaigner/shared';
import { withBranchParams } from './withBranchParams';
export const searchApi = {
  search: (projectId: number, query: string) =>
    apiClient.get<ApiResponse<SearchResult[]>>('/search', {
      params: withBranchParams({ projectId, q: query }),
    }),
};

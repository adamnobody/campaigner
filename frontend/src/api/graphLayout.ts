import type { ApiResponse, GraphLayoutDataV1 } from '@campaigner/shared';
import { apiClient } from './client';

export const graphLayoutApi = {
  get: (projectId: number, params: { graphType: string; branchId?: number }) =>
    apiClient.get<ApiResponse<{ layoutData: GraphLayoutDataV1 }>>(`/projects/${projectId}/graph-layout`, {
      params,
    }),

  put: (
    projectId: number,
    body: { graphType: string; layoutData: GraphLayoutDataV1; branchId?: number },
  ) =>
    apiClient.put<ApiResponse<{ layoutData: GraphLayoutDataV1 }>>(`/projects/${projectId}/graph-layout`, body),

  delete: (projectId: number, params: { graphType: string; branchId?: number }) =>
    apiClient.delete(`/projects/${projectId}/graph-layout`, { params }),
};

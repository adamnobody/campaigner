import type {
  ApiResponse,
  PoliticalScale,
  PoliticalScaleAssignment,
  CreatePoliticalScale,
  UpdatePoliticalScale,
  PutPoliticalScaleAssignmentsBody,
} from '@campaigner/shared';
import { apiClient } from './client';

export const politicalScalesApi = {
  list: (params: { entityType: 'state' | 'faction'; worldId: number }) =>
    apiClient.get<ApiResponse<PoliticalScale[]>>('/political-scales', { params }),
  create: (data: CreatePoliticalScale) =>
    apiClient.post<ApiResponse<PoliticalScale>>('/political-scales', data),
  update: (id: number, data: UpdatePoliticalScale) =>
    apiClient.patch<ApiResponse<PoliticalScale>>(`/political-scales/${id}`, data),
  delete: (id: number) => apiClient.delete(`/political-scales/${id}`),
  getAssignments: (params: { entityType: 'state' | 'faction'; entityId: number }) =>
    apiClient.get<ApiResponse<PoliticalScaleAssignment[]>>('/political-scale-assignments', { params }),
  putAssignments: (body: PutPoliticalScaleAssignmentsBody) =>
    apiClient.put<ApiResponse<PoliticalScaleAssignment[]>>('/political-scale-assignments', body),
  deleteAssignment: (id: number) => apiClient.delete(`/political-scale-assignments/${id}`),
};

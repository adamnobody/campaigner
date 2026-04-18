import type {
  ApiResponse,
  Map,
  CreateMap,
  UpdateMap,
  MapMarker,
  CreateMarker,
  UpdateMarker,
  MapTerritory,
  MapTerritorySummary,
  CreateTerritory,
  UpdateTerritory,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';
import { getActiveBranchId } from '@/store/branchStorage';

function withBranch<T extends Record<string, unknown>>(payload: T): T & { branchId?: number } {
  const branchId = getActiveBranchId();
  return branchId ? { ...payload, branchId } : payload;
}

export const mapApi = {
  getRootMap: (projectId: number) => apiClient.get<ApiResponse<Map | null>>(`/projects/${projectId}/maps/root`, { params: withBranch({}) }),
  getMapById: (mapId: number) => apiClient.get<ApiResponse<Map>>(`/maps/${mapId}`, { params: withBranch({}) }),
  getMapTree: (projectId: number) => apiClient.get<ApiResponse<Map[]>>(`/projects/${projectId}/maps/tree`, { params: withBranch({}) }),
  getTerritorySummariesForProject: (projectId: number) =>
    apiClient.get<ApiResponse<MapTerritorySummary[]>>(`/projects/${projectId}/territories/summary`),
  createMap: (data: CreateMap) => apiClient.post<ApiResponse<Map>>('/maps', withBranch({ ...data })),
  updateMap: (mapId: number, data: UpdateMap) => apiClient.put<ApiResponse<Map>>(`/maps/${mapId}`, withBranch({ ...data })),
  deleteMap: (mapId: number) => apiClient.delete<VoidResponse>(`/maps/${mapId}`),
  uploadMapImage: (mapId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<Map>>(`/maps/${mapId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMarkersByMapId: (mapId: number) => apiClient.get<ApiResponse<MapMarker[]>>(`/maps/${mapId}/markers`, { params: withBranch({}) }),
  createMarker: (mapId: number, data: CreateMarker) => apiClient.post<ApiResponse<MapMarker>>(`/maps/${mapId}/markers`, withBranch({ ...data })),
  updateMarker: (markerId: number, data: UpdateMarker) => apiClient.put<ApiResponse<MapMarker>>(`/markers/${markerId}`, withBranch({ ...data })),
  deleteMarker: (markerId: number) =>
    apiClient.delete<VoidResponse>(`/markers/${markerId}`, { params: withBranch({}) }),
  getTerritoriesByMapId: (mapId: number) => apiClient.get<ApiResponse<MapTerritory[]>>(`/maps/${mapId}/territories`, { params: withBranch({}) }),
  createTerritory: (mapId: number, data: CreateTerritory) =>
    apiClient.post<ApiResponse<MapTerritory>>(`/maps/${mapId}/territories`, withBranch(data as Record<string, unknown>)),
  updateTerritory: (territoryId: number, data: UpdateTerritory) =>
    apiClient.put<ApiResponse<MapTerritory>>(`/territories/${territoryId}`, withBranch(data as Record<string, unknown>)),
  deleteTerritory: (territoryId: number) =>
    apiClient.delete<VoidResponse>(`/territories/${territoryId}`, { params: withBranch({}) }),
};

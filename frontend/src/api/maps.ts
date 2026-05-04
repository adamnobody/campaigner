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
import { withBranchParams } from './withBranchParams';

export const mapApi = {
  getRootMap: (projectId: number) =>
    apiClient.get<ApiResponse<Map | null>>(`/projects/${projectId}/maps/root`, {
      params: withBranchParams({ projectId }),
    }),
  getMapById: (mapId: number, projectId?: number) =>
    apiClient.get<ApiResponse<Map>>(`/maps/${mapId}`, { params: withBranchParams({}, projectId) }),
  getMapTree: (projectId: number) =>
    apiClient.get<ApiResponse<Map[]>>(`/projects/${projectId}/maps/tree`, {
      params: withBranchParams({ projectId }),
    }),
  getTerritorySummariesForProject: (projectId: number) =>
    apiClient.get<ApiResponse<MapTerritorySummary[]>>(`/projects/${projectId}/territories/summary`, {
      params: withBranchParams({ projectId }),
    }),
  createMap: (data: CreateMap) => apiClient.post<ApiResponse<Map>>('/maps', withBranchParams({ ...data })),
  updateMap: (mapId: number, data: UpdateMap, projectId?: number) =>
    apiClient.put<ApiResponse<Map>>(`/maps/${mapId}`, withBranchParams({ ...data }, projectId)),
  deleteMap: (mapId: number) => apiClient.delete<VoidResponse>(`/maps/${mapId}`),
  uploadMapImage: (mapId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<Map>>(`/maps/${mapId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMarkersByMapId: (mapId: number, projectId?: number) =>
    apiClient.get<ApiResponse<MapMarker[]>>(`/maps/${mapId}/markers`, {
      params: withBranchParams({}, projectId),
    }),
  createMarker: (mapId: number, data: CreateMarker, projectId?: number) =>
    apiClient.post<ApiResponse<MapMarker>>(`/maps/${mapId}/markers`, withBranchParams({ ...data }, projectId)),
  updateMarker: (markerId: number, data: UpdateMarker, projectId?: number) =>
    apiClient.put<ApiResponse<MapMarker>>(`/markers/${markerId}`, withBranchParams({ ...data }, projectId)),
  deleteMarker: (markerId: number, projectId?: number) =>
    apiClient.delete<VoidResponse>(`/markers/${markerId}`, { params: withBranchParams({}, projectId) }),
  getTerritoriesByMapId: (mapId: number, projectId?: number) =>
    apiClient.get<ApiResponse<MapTerritory[]>>(`/maps/${mapId}/territories`, {
      params: withBranchParams({}, projectId),
    }),
  createTerritory: (mapId: number, data: CreateTerritory, projectId?: number) =>
    apiClient.post<ApiResponse<MapTerritory>>(`/maps/${mapId}/territories`, withBranchParams(data as Record<string, unknown>, projectId)),
  updateTerritory: (territoryId: number, data: UpdateTerritory, projectId?: number) =>
    apiClient.put<ApiResponse<MapTerritory>>(`/territories/${territoryId}`, withBranchParams(data as Record<string, unknown>, projectId)),
  deleteTerritory: (territoryId: number, projectId?: number) =>
    apiClient.delete<VoidResponse>(`/territories/${territoryId}`, { params: withBranchParams({}, projectId) }),
};

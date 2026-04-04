import type {
  ApiResponse,
  Map,
  CreateMap,
  UpdateMap,
  MapMarker,
  CreateMarker,
  UpdateMarker,
  MapTerritory,
  CreateTerritory,
  UpdateTerritory,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const mapApi = {
  getRootMap: (projectId: number) => apiClient.get<ApiResponse<Map | null>>(`/projects/${projectId}/maps/root`),
  getMapById: (mapId: number) => apiClient.get<ApiResponse<Map>>(`/maps/${mapId}`),
  getMapTree: (projectId: number) => apiClient.get<ApiResponse<Map[]>>(`/projects/${projectId}/maps/tree`),
  createMap: (data: CreateMap) => apiClient.post<ApiResponse<Map>>('/maps', data),
  updateMap: (mapId: number, data: UpdateMap) => apiClient.put<ApiResponse<Map>>(`/maps/${mapId}`, data),
  deleteMap: (mapId: number) => apiClient.delete<VoidResponse>(`/maps/${mapId}`),
  uploadMapImage: (mapId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<Map>>(`/maps/${mapId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMarkersByMapId: (mapId: number) => apiClient.get<ApiResponse<MapMarker[]>>(`/maps/${mapId}/markers`),
  createMarker: (mapId: number, data: CreateMarker) => apiClient.post<ApiResponse<MapMarker>>(`/maps/${mapId}/markers`, data),
  updateMarker: (markerId: number, data: UpdateMarker) => apiClient.put<ApiResponse<MapMarker>>(`/markers/${markerId}`, data),
  deleteMarker: (markerId: number) => apiClient.delete<VoidResponse>(`/markers/${markerId}`),
  getTerritoriesByMapId: (mapId: number) => apiClient.get<ApiResponse<MapTerritory[]>>(`/maps/${mapId}/territories`),
  createTerritory: (mapId: number, data: CreateTerritory) => apiClient.post<ApiResponse<MapTerritory>>(`/maps/${mapId}/territories`, data),
  updateTerritory: (territoryId: number, data: UpdateTerritory) => apiClient.put<ApiResponse<MapTerritory>>(`/territories/${territoryId}`, data),
  deleteTerritory: (territoryId: number) => apiClient.delete<VoidResponse>(`/territories/${territoryId}`),
};

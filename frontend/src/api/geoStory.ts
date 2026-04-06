import type {
  ApiResponse,
  GeoStoryEvent,
  CreateGeoStoryEvent,
  UpdateGeoStoryEvent,
  GeoStoryListQuery,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const geoStoryApi = {
  list: (params: GeoStoryListQuery) =>
    apiClient.get<ApiResponse<GeoStoryEvent[]>>('/geo-story', { params }),
  create: (data: CreateGeoStoryEvent) =>
    apiClient.post<ApiResponse<GeoStoryEvent>>('/geo-story', data),
  update: (id: number, data: UpdateGeoStoryEvent) =>
    apiClient.put<ApiResponse<GeoStoryEvent>>(`/geo-story/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<VoidResponse>(`/geo-story/${id}`),
};

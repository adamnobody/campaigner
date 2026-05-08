import type { ApiResponse } from '@campaigner/shared';
import { apiClient } from './client';

interface UploadAsset {
  path: string;
  filename: string;
  originalName: string;
  size: number;
}

export const uploadsApi = {
  uploadAppearanceImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    return apiClient.post<ApiResponse<UploadAsset>>('/upload/appearance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

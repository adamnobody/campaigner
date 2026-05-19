import type { ApiResponse } from '@campaigner/shared';
import type { UploadSavedPath } from '@/types/generated/bindings';
import { uploadFileViaTransport } from './uploadFile';

interface UploadAsset {
  path: string;
  filename: string;
  originalName: string;
  size: number;
}

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const toUploadAssetResponse = (
  response: ApiResponse<UploadAsset> | UploadSavedPath,
): ApiResult<UploadAsset> => {
  if (response && typeof response === 'object' && 'success' in response) {
    return { data: response as ApiResponse<UploadAsset> };
  }

  const saved = response as UploadSavedPath;
  return {
    data: {
      success: true,
      data: {
        path: saved.path,
        filename: saved.path.split('/').pop() ?? '',
        originalName: saved.path.split('/').pop() ?? '',
        size: 0,
      },
    },
  };
};

const uploadGeneric = async (
  command: string,
  file: File,
): Promise<ApiResult<UploadAsset>> => {
  const response = await uploadFileViaTransport<UploadSavedPath>(command, file);
  return toUploadAssetResponse(response);
};

export const uploadsApi = {
  uploadAppearanceImage: (file: File) =>
    uploadGeneric('uploads_save_appearance_image', file),

  uploadTraitImage: (file: File) =>
    uploadGeneric('uploads_save_trait_image', file),

  uploadAmbitionImage: (file: File) =>
    uploadGeneric('uploads_save_ambition_image', file),

  uploadMapImage: (file: File) =>
    uploadGeneric('uploads_save_map_image', file),
};

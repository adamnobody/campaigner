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
  response: UploadSavedPath,
): ApiResult<UploadAsset> => {
  return {
    data: {
      success: true,
      data: {
        path: response.path,
        filename: response.path.split('/').pop() ?? '',
        originalName: response.path.split('/').pop() ?? '',
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

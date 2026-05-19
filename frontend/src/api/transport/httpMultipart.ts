import type { AxiosResponse } from 'axios';

import { apiClient } from '@/api/client';

type MultipartQuery = Record<string, string | number | boolean | undefined>;

/** Multipart POST for HTTP transport only. Do not import outside `frontend/src/api/`. */
export async function httpPostMultipart<TResponse>(
  path: string,
  formData: FormData,
  options?: { params?: MultipartQuery },
): Promise<AxiosResponse<TResponse>> {
  return apiClient.post<TResponse>(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: options?.params,
  });
}

/** Multipart GET is unused; blob export uses {@link httpGetBlob}. */
export async function httpGetBlob(
  path: string,
  options?: { params?: MultipartQuery },
): Promise<AxiosResponse<Blob>> {
  return apiClient.get<Blob>(path, {
    responseType: 'blob',
    params: options?.params,
  });
}

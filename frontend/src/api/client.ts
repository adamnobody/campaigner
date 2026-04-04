import axios from 'axios';
import type { ApiResponse } from '@campaigner/shared';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;
      const rawData: unknown = error.response.data;
      const payload =
        rawData && typeof rawData === 'object'
          ? (rawData as { error?: unknown; message?: unknown; details?: unknown })
          : undefined;

      const message =
        (typeof payload?.error === 'string' && payload?.error) ||
        (typeof payload?.message === 'string' && payload?.message) ||
        'An error occurred';
      console.error(`API Error [${status}]:`, message);

      const enrichedError = new Error(message) as Error & { status?: number; details?: unknown };
      enrichedError.status = status;
      enrichedError.details = payload?.details;
      return Promise.reject(enrichedError);
    }

    if (axios.isAxiosError(error) && error.request) {
      console.error('Network Error: No response received');
      return Promise.reject(new Error('Network error. Server may be unavailable.'));
    }

    return Promise.reject(error);
  }
);

export type ListWithTotal<T> = {
  success: boolean;
  data: T;
  total: number;
};

export type VoidResponse = ApiResponse<undefined>;

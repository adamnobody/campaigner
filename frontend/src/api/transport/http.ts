import { apiClient } from '@/api/client';
import type { Transport, TransportRequest } from './types';
import { TransportError } from './types';

const toTransportError = (error: unknown): TransportError => {
  if (error instanceof TransportError) {
    return error;
  }

  if (error instanceof Error) {
    const maybeStatus = 'status' in error ? (error as { status?: number }).status : undefined;
    const maybeDetails = 'details' in error ? (error as { details?: unknown }).details : undefined;
    return new TransportError('HTTP_REQUEST_ERROR', error.message, {
      status: maybeStatus,
      details: maybeDetails,
    });
  }

  return new TransportError('HTTP_REQUEST_ERROR', 'HTTP transport request failed', { details: error });
};

export const httpTransport: Transport = {
  async request<TResponse, TBody = unknown>(request: TransportRequest<TBody>): Promise<TResponse> {
    if (!request.http) {
      throw new TransportError(
        'HTTP_CONFIG_MISSING',
        'HTTP request config is missing for the selected transport'
      );
    }

    const { method, path, query, data, body } = request.http;

    try {
      const response = await apiClient.request<TResponse>({
        method,
        url: path,
        params: query,
        data: data ?? body,
      });

      return response.data;
    } catch (error) {
      throw toTransportError(error);
    }
  },
};

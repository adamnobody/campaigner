import { invoke, type InvokeArgs } from '@tauri-apps/api/core';

import type { Transport, TransportRequest } from './types';
import { TransportError } from './types';

const toTransportError = (error: unknown): TransportError => {
  if (error instanceof TransportError) {
    return error;
  }

  if (error instanceof Error) {
    return new TransportError('TAURI_INVOKE_ERROR', error.message, { details: error });
  }

  return new TransportError('TAURI_INVOKE_ERROR', 'Tauri invoke failed', { details: error });
};

export const tauriTransport: Transport = {
  async request<TResponse, TArgs extends InvokeArgs | undefined = InvokeArgs>(
    request: TransportRequest<TArgs>
  ): Promise<TResponse> {
    const { command, args } = request;

    try {
      return await invoke<TResponse>(command, args);
    } catch (error) {
      throw toTransportError(error);
    }
  },
};

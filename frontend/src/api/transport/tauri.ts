import { invoke } from '@tauri-apps/api/core';

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
  async request<TResponse, TBody = unknown>(request: TransportRequest<TBody>): Promise<TResponse> {
    if (!request.tauri) {
      throw new TransportError(
        'TAURI_CONFIG_MISSING',
        'Tauri request config is missing for the selected transport'
      );
    }

    const { command, args } = request.tauri;

    try {
      return await invoke<TResponse>(command, args);
    } catch (error) {
      throw toTransportError(error);
    }
  },
};

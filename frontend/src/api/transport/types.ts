import type { InvokeArgs } from '@tauri-apps/api/core';

export interface TransportRequest<TArgs extends InvokeArgs | undefined = InvokeArgs> {
  command: string;
  args?: TArgs;
}

export class TransportError extends Error {
  code: string;
  details?: unknown;
  status?: number;

  constructor(code: string, message: string, options?: { details?: unknown; status?: number }) {
    super(message);
    this.name = 'TransportError';
    this.code = code;
    this.details = options?.details;
    this.status = options?.status;
  }
}

export interface Transport {
  request<TResponse, TArgs extends InvokeArgs | undefined = InvokeArgs>(
    request: TransportRequest<TArgs>
  ): Promise<TResponse>;
}

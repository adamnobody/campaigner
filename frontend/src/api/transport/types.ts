export type TransportMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TransportHttpRequest<TBody = unknown> = {
  method: TransportMethod;
  path: string;
  query?: Record<string, unknown>;
  body?: TBody;
  data?: TBody;
};

export type TransportTauriRequest = {
  command: string;
  args?: Record<string, unknown>;
};

export type TransportRequest<TBody = unknown> = {
  http?: TransportHttpRequest<TBody>;
  tauri?: TransportTauriRequest;
};

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
  request<TResponse, TBody = unknown>(request: TransportRequest<TBody>): Promise<TResponse>;
}

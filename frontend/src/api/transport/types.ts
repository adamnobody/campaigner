export type TransportRequest<TArgs = any> = {
  command: string;
  args?: TArgs;
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
  request<TResponse, TArgs = any>(request: TransportRequest<TArgs>): Promise<TResponse>;
}

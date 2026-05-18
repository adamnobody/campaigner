import type { AppHealthResponse } from '@/types/generated/bindings';

import { transport } from '@/api/transport';

type ExpressHealthResponse = {
  success?: boolean;
};

const isAppHealthResponse = (value: unknown): value is AppHealthResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.status === 'string' &&
    typeof candidate.database === 'string' &&
    typeof candidate.appVersion === 'string'
  );
};

export const getAppHealth = async (): Promise<AppHealthResponse> => {
  const response = await transport.request<AppHealthResponse | ExpressHealthResponse>({
    http: {
      method: 'GET',
      path: '/api/health',
    },
    tauri: {
      command: 'app_health',
    },
  });

  if (isAppHealthResponse(response)) {
    return response;
  }

  if (response && typeof response === 'object' && (response as ExpressHealthResponse).success) {
    return {
      status: 'ok',
      database: 'unknown',
      appVersion: 'express',
    };
  }

  throw new Error('Unexpected health response format');
};

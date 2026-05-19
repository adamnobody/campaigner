import type { AppHealthResponse } from '@/types/generated/bindings';

import { transport } from '@/api/transport';

export const getAppHealth = async (): Promise<AppHealthResponse> => {
  return transport.request<AppHealthResponse>({
    tauri: {
      command: 'app_health',
    },
  });
};

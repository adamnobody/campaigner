import { httpTransport } from './http';
import { tauriTransport } from './tauri';
import type { Transport } from './types';

const resolveTransport = (): Transport => {
  const mode = import.meta.env.VITE_TRANSPORT;

  if (!mode || mode === 'http') {
    return httpTransport;
  }

  if (mode === 'tauri') {
    return tauriTransport;
  }

  if (import.meta.env.DEV) {
    throw new Error(`Unsupported VITE_TRANSPORT value: ${mode}`);
  }

  return httpTransport;
};

export const transport = resolveTransport();
export * from './types';

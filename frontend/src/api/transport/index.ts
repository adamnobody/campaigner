import { httpTransport } from './http';
import { tauriTransport } from './tauri';
import type { Transport } from './types';

const resolveTransport = (): Transport => {
  const mode = import.meta.env.VITE_TRANSPORT;

  if (import.meta.env.DEV && !mode) {
    throw new Error(
      'VITE_TRANSPORT is not set. Use frontend/.env.development (http) or run Vite with --mode tauri (see frontend/.env.example).',
    );
  }

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

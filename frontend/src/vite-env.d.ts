/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSPORT?: 'http' | 'tauri';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

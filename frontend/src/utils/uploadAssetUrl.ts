/**
 * Resolves a backend upload path for use in <img src> / Avatar src.
 * HTTP: `/api/uploads/...` via Express static.
 * Tauri: `campaigner://uploads/...` via custom protocol handler.
 */
export function uploadAssetUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('campaigner://')) return path;

  if (import.meta.env.VITE_TRANSPORT === 'tauri' && path.startsWith('/uploads')) {
    return `campaigner://${path.replace(/^\//, '')}`;
  }

  if (path.startsWith('/uploads')) return `/api${path}`;
  return path;
}

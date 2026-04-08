/**
 * Resolves a backend upload path for use in <img src> / Avatar src.
 * Stored paths look like `/uploads/characters/...`. The API serves the same files under
 * `/api/uploads/...` (see backend index). In Vite dev, `/api` is proxied to the backend;
 * using `/api` + path matches MapPage (`/api${imagePath}`) and avoids 404 on :5173.
 */
export function uploadAssetUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/uploads')) return `/api${path}`;
  return path;
}

import { convertFileSrc, invoke } from '@tauri-apps/api/core';

const isTauriTransport = () => import.meta.env.VITE_TRANSPORT === 'tauri';

const stripExtendedPathPrefix = (absolutePath: string): string => {
  if (absolutePath.startsWith('\\\\?\\')) {
    return absolutePath.slice(4);
  }
  return absolutePath;
};

/** HTTP URL for uploads in web mode (sync). */
export function uploadAssetUrlHttp(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/uploads')) return `/api${path}`;
  return path;
}

/**
 * Resolves a backend upload path for use in &lt;img src&gt;, Avatar src, or CSS url().
 * Tauri: absolute path via `uploads_resolve_path` + `convertFileSrc`.
 * Web: `/api/uploads/...` via Express static.
 */
export async function resolveUploadAssetUrl(
  path: string | null | undefined,
): Promise<string | undefined> {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;

  if (isTauriTransport() && path.startsWith('/uploads')) {
    const absolutePath = await invoke<string>('uploads_resolve_path', {
      relativePath: path,
    });
    return convertFileSrc(stripExtendedPathPrefix(absolutePath));
  }

  return uploadAssetUrlHttp(path);
}

/** @deprecated Use {@link resolveUploadAssetUrl} or {@link useAssetUrl}. Sync helper for HTTP-only call sites. */
export function uploadAssetUrl(path: string | null | undefined): string | undefined {
  if (isTauriTransport()) {
    return undefined;
  }
  return uploadAssetUrlHttp(path);
}

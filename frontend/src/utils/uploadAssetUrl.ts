import { convertFileSrc, invoke } from '@tauri-apps/api/core';

const WINDOWS_DRIVE_PATH = /^[A-Za-z]:[\\/]/;

export const stripExtendedPathPrefix = (absolutePath: string): string => {
  if (absolutePath.startsWith('\\\\?\\')) {
    return absolutePath.slice(4);
  }
  return absolutePath;
};

/** Windows drive-letter or UNC paths (legacy dirty canvas persistence). */
const isWindowsFilesystemPath = (path: string): boolean =>
  WINDOWS_DRIVE_PATH.test(path) || path.startsWith('\\\\');

/**
 * Resolves a stored asset path for use in &lt;img src&gt;, Avatar src, or CSS url().
 *
 * Resolution order (first match wins):
 * 1. http(s)/data/blob URLs — passthrough; asset.localhost — warn + undefined
 * 2. /uploads/... — uploads_resolve_path + convertFileSrc (user uploads, canvas)
 * 3. Windows/UNC absolute filesystem paths — convertFileSrc (legacy only)
 * 4. /... — passthrough (Vite public bundled assets)
 * 5. otherwise — passthrough (relative public paths)
 */
export async function resolveUploadAssetUrl(
  path: string | null | undefined,
): Promise<string | undefined> {
  if (path == null || path === '') return undefined;

  if (path.startsWith('http://asset.localhost') || path.startsWith('https://asset.localhost')) {
    console.warn(
      'resolveUploadAssetUrl: stored upload asset is already a Tauri asset URL; expected a file path or /uploads path',
      { path },
    );
    return undefined;
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  if (path.startsWith('/uploads')) {
    const absolutePath = await invoke<string>('uploads_resolve_path', { relativePath: path });
    return convertFileSrc(stripExtendedPathPrefix(absolutePath));
  }

  if (isWindowsFilesystemPath(path)) {
    return convertFileSrc(stripExtendedPathPrefix(path));
  }

  if (path.startsWith('/')) {
    return path;
  }

  return path;
}

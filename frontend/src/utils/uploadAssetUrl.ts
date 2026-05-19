import { convertFileSrc, invoke } from '@tauri-apps/api/core';

const stripExtendedPathPrefix = (absolutePath: string): string => {
  if (absolutePath.startsWith('\\\\?\\')) {
    return absolutePath.slice(4);
  }
  return absolutePath;
};

/**
 * Resolves an upload path for use in &lt;img src&gt;, Avatar src, or CSS url().
 * Tauri: absolute path via `uploads_resolve_path` + `convertFileSrc`.
 */
export async function resolveUploadAssetUrl(
  path: string | null | undefined,
): Promise<string | undefined> {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads')) {
    const absolutePath = await invoke<string>('uploads_resolve_path', { relativePath: path });
    return convertFileSrc(stripExtendedPathPrefix(absolutePath));
  }
  return path;
}

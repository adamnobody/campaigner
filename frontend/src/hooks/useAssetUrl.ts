import { useEffect, useState } from 'react';

import { resolveUploadAssetUrl, uploadAssetUrlHttp } from '@/utils/uploadAssetUrl';

const isTauriTransport = () => import.meta.env.VITE_TRANSPORT === 'tauri';

function syncUrlForPath(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  if (!isTauriTransport()) return uploadAssetUrlHttp(path);
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;
  return undefined;
}

/**
 * Resolves an upload path to a URL loadable by the WebView (HTTP or Tauri asset URL).
 */
export function useAssetUrl(path: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => syncUrlForPath(path));

  useEffect(() => {
    let cancelled = false;

    setUrl(syncUrlForPath(path));

    void resolveUploadAssetUrl(path)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('useAssetUrl: resolve failed', { path, err });
          setUrl(uploadAssetUrlHttp(path));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

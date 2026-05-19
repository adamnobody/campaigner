import { useEffect, useState } from 'react';

import { resolveUploadAssetUrl, uploadAssetUrlHttp } from '@/utils/uploadAssetUrl';

/**
 * Resolves an upload path to a URL loadable by the WebView (HTTP or Tauri asset URL).
 */
export function useAssetUrl(path: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() =>
    import.meta.env.VITE_TRANSPORT === 'tauri' ? undefined : uploadAssetUrlHttp(path),
  );

  useEffect(() => {
    let cancelled = false;

    void resolveUploadAssetUrl(path).then((resolved) => {
      if (!cancelled) {
        setUrl(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

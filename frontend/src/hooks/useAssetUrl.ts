import { useEffect, useState } from 'react';

import { resolveUploadAssetUrl } from '@/utils/uploadAssetUrl';

/**
 * Resolves an upload path to a URL loadable by the WebView.
 */
export function useAssetUrl(path: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    setUrl(undefined);

    void resolveUploadAssetUrl(path)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('useAssetUrl: resolve failed', { path, err });
          setUrl(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

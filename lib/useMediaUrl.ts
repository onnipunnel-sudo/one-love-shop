'use client';

import { useEffect, useState } from 'react';
import { getMediaBlob, idbId, isIdbRef } from './mediaStore';

/**
 * Resolves a media reference to a playable src.
 * - `idb:<id>` → object URL created from the IndexedDB blob
 * - anything else (http URL, dataURL) → returned as-is
 */
export function useMediaUrl(ref?: string | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() =>
    ref && !isIdbRef(ref) ? ref : undefined,
  );
  useEffect(() => {
    if (!ref) {
      setUrl(undefined);
      return;
    }
    if (!isIdbRef(ref)) {
      setUrl(ref);
      return;
    }
    let alive = true;
    let obj: string | null = null;
    getMediaBlob(idbId(ref))
      .then((blob) => {
        if (!alive) return;
        if (blob) {
          obj = URL.createObjectURL(blob);
          setUrl(obj);
        } else {
          setUrl(undefined);
        }
      })
      .catch(() => {
        if (alive) setUrl(undefined);
      });
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [ref]);
  return url;
}

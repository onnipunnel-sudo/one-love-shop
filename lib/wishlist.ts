'use client';
// Wishlist: stored in browser localStorage (no login needed).
// Shared across the shop via storage events.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'onelove_wishlist_v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setIds(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      write(next);
      return next;
    });
  }, []);

  return { ids, count: ids.length, toggle, has, remove };
}

// Large-media storage in IndexedDB — bypasses the ~5MB localStorage quota
// so gallery videos up to 500MB can be kept in the browser.
// References are stored as `idb:<id>` strings in the normal DB fields.

const DB_NAME = 'onelove_media_v1';
const STORE = 'media';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

export const isIdbRef = (v?: string | null): v is string => !!v && v.startsWith('idb:');
export const idbId = (v: string): string => v.slice(4);

export async function saveMediaBlob(blob: Blob): Promise<string> {
  const db = await openDb();
  const id = 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try {
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error || new Error('save failed'));
    });
    return id;
  } finally {
    db.close();
  }
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const q = tx.objectStore(STORE).get(id);
      q.onsuccess = () => res((q.result as Blob) || null);
      q.onerror = () => rej(q.error || new Error('read failed'));
    });
  } finally {
    db.close();
  }
}

export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    const db = await openDb();
    try {
      await new Promise<void>((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error || new Error('delete failed'));
      });
    } finally {
      db.close();
    }
  } catch {
    /* best-effort cleanup */
  }
}

/** Fire-and-forget cleanup for an `idb:` reference. */
export function dropIdbRef(ref?: string | null): void {
  if (isIdbRef(ref)) void deleteMediaBlob(idbId(ref));
}

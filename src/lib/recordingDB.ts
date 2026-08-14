/**
 * IndexedDB helper for persisting shadowing recordings locally.
 * Recordings survive page refresh and browser restarts until explicitly deleted.
 */

export interface SavedRecording {
  id: string;          // timestamp-based unique id
  passageId: string;
  passageTitle: string;
  dateISO: string;
  durationMs: number;
  mimeType: string;
  blob: Blob;
}

const DB_NAME = 'smarty-shadowing-v1';
const STORE   = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveRecording(rec: SavedRecording): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getPassageRecordings(passageId: string): Promise<SavedRecording[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = req.result as SavedRecording[];
      resolve(
        all
          .filter(r => r.passageId === passageId)
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

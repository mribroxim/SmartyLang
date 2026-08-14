// Image store backed by IndexedDB (via idb-keyval). Used to keep large data
// URLs out of localStorage — the 5MB localStorage cap fills up fast when
// students upload chart/graph screenshots for IELTS Task 1.
//
// API:
//   const id = await putImage(dataUrl);   // store, returns ID
//   const dataUrl = await getImage(id);   // read by ID
//   await deleteImage(id);                // remove
//
// Image IDs are stored inside the `useCustomSessions` records (which still
// live in localStorage). That way localStorage only carries small JSON,
// while the big image blobs live in IDB.

import { createStore, get, set, del } from 'idb-keyval';

const store = createStore('smarty-images', 'images');

export type ImageId = string;

function newId(): ImageId {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Store a data URL and return its ID. */
export async function putImage(dataUrl: string): Promise<ImageId> {
  const id = newId();
  await set(id, dataUrl, store);
  return id;
}

/** Update an existing image (same ID). */
export async function setImage(id: ImageId, dataUrl: string): Promise<void> {
  await set(id, dataUrl, store);
}

/** Fetch a stored data URL by ID. Returns null if missing. */
export async function getImage(id: ImageId): Promise<string | null> {
  try {
    const v = await get<string>(id, store);
    return v ?? null;
  } catch {
    return null;
  }
}

/** Remove an image by ID. Silent on failure. */
export async function deleteImage(id: ImageId): Promise<void> {
  try { await del(id, store); } catch {}
}

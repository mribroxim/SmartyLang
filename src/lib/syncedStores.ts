/**
 * Small registry of client stores that ride along in the user's `progress`
 * document (server merges top-level keys, so each store owns one key).
 * useFirebaseSync applies remote values on login and includes snapshots in
 * every debounced `progress.set`.
 */
export interface SyncedStore {
  key: string;
  /** Current value to upload (undefined = nothing to send). */
  snapshot(): unknown;
  /** Merge a remote value (store decides who wins, e.g. newer updatedAt). */
  apply(remote: unknown): void;
  subscribe(fn: () => void): () => void;
}

const stores: SyncedStore[] = [];

export function registerSyncedStore(store: SyncedStore) {
  if (!stores.some((s) => s.key === store.key)) stores.push(store);
}

export function syncedSnapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of stores) {
    const v = s.snapshot();
    if (v !== undefined) out[s.key] = v;
  }
  return out;
}

export function applySyncedStores(progress: Record<string, unknown> | null | undefined) {
  if (!progress) return;
  for (const s of stores) {
    if (progress[s.key] !== undefined) {
      try { s.apply(progress[s.key]); } catch (e) { console.error('synced store apply failed', s.key, e); }
    }
  }
}

export function subscribeSyncedStores(fn: () => void): () => void {
  const offs = stores.map((s) => s.subscribe(fn));
  return () => offs.forEach((off) => off());
}

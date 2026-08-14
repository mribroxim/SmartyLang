import { useCallback, useEffect, useState } from 'react';
import { putImage, getImage, deleteImage, setImage, type ImageId } from '../lib/imageStore';

export interface CustomSession {
  id: string;
  title: string;
  prompt: string;
  createdAt: string; // ISO date
  /**
   * Reference to the image stored in IndexedDB (see lib/imageStore).
   * Localstorage only carries this small ID, not the full data URL.
   */
  imageId?: ImageId;
}

/**
 * Legacy shape that earlier versions stored — `imageDataUrl` inline in
 * localStorage. We migrate any of those on first load.
 */
interface LegacyCustomSession extends CustomSession {
  imageDataUrl?: string;
}

function load(storageKey: string): CustomSession[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(storageKey: string, list: CustomSession[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(list)); } catch {}
}

/**
 * Migrate any legacy sessions that still carry inline `imageDataUrl` —
 * push the data URL into IDB, replace with `imageId`, and clear the field.
 * Safe to call repeatedly.
 */
async function migrateInlineImages(storageKey: string, list: LegacyCustomSession[]): Promise<CustomSession[]> {
  let changed = false;
  const next: CustomSession[] = [];
  for (const s of list) {
    if (s.imageDataUrl && !s.imageId) {
      try {
        const id = await putImage(s.imageDataUrl);
        next.push({ id: s.id, title: s.title, prompt: s.prompt, createdAt: s.createdAt, imageId: id });
        changed = true;
        continue;
      } catch {
        // Fall through and keep without image rather than blocking
      }
    }
    const { imageDataUrl, ...rest } = s;
    next.push(rest as CustomSession);
    if (imageDataUrl) changed = true; // drop the bloat
  }
  if (changed) persist(storageKey, next);
  return next;
}

/**
 * Lightweight per-feature saveable practice store. JSON metadata lives in
 * localStorage; large image data lives in IndexedDB (via lib/imageStore).
 *
 * Usage:
 *   const { sessions, save, remove } = useCustomSessions('writing_custom_v1');
 *   save({ title: 'Bar chart', prompt: '...', imageDataUrl });
 */
export function useCustomSessions(storageKey: string) {
  const [sessions, setSessions] = useState<CustomSession[]>(() => load(storageKey));

  // Run one-time migration on mount (and whenever the key changes).
  useEffect(() => {
    const raw = load(storageKey) as LegacyCustomSession[];
    if (raw.some(s => s.imageDataUrl)) {
      migrateInlineImages(storageKey, raw).then(setSessions);
    } else {
      setSessions(raw);
    }
  }, [storageKey]);

  /**
   * Save a new session. Pass `imageDataUrl` to attach an image — it gets
   * stored in IDB and only the ID is persisted in localStorage.
   */
  const save = useCallback(async (input: {
    title: string;
    prompt: string;
    imageDataUrl?: string;
  }): Promise<CustomSession> => {
    let imageId: ImageId | undefined;
    if (input.imageDataUrl) {
      try { imageId = await putImage(input.imageDataUrl); } catch {}
    }
    const next: CustomSession = {
      id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      title: (input.title || '').trim() || 'Untitled',
      prompt: (input.prompt || '').trim(),
      imageId,
    };
    setSessions(prev => {
      const updated = [next, ...prev];
      persist(storageKey, updated);
      return updated;
    });
    return next;
  }, [storageKey]);

  /** Remove a session, including its image in IDB. */
  const remove = useCallback(async (id: string): Promise<void> => {
    const target = sessions.find(s => s.id === id);
    if (target?.imageId) await deleteImage(target.imageId);
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      persist(storageKey, updated);
      return updated;
    });
  }, [storageKey, sessions]);

  /** Update fields of a session. To swap the image, pass `imageDataUrl`. */
  const update = useCallback(async (
    id: string,
    patch: Partial<Pick<CustomSession, 'title' | 'prompt'>> & { imageDataUrl?: string | null },
  ): Promise<void> => {
    let next: CustomSession[] = [];
    setSessions(prev => {
      next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
      persist(storageKey, next);
      return next;
    });
    if (patch.imageDataUrl === null) {
      // Explicit removal
      const target = sessions.find(s => s.id === id);
      if (target?.imageId) {
        await deleteImage(target.imageId);
        setSessions(prev => prev.map(s => s.id === id ? { ...s, imageId: undefined } : s));
      }
    } else if (typeof patch.imageDataUrl === 'string') {
      const target = next.find(s => s.id === id);
      if (target?.imageId) {
        await setImage(target.imageId, patch.imageDataUrl);
      } else {
        try {
          const newId = await putImage(patch.imageDataUrl);
          setSessions(prev => prev.map(s => s.id === id ? { ...s, imageId: newId } : s));
        } catch {}
      }
    }
  }, [storageKey, sessions]);

  /** Helper: fetch the data URL for a session's image (returns null if none). */
  const loadImage = useCallback(async (sessionId: string): Promise<string | null> => {
    const s = sessions.find(x => x.id === sessionId);
    if (!s?.imageId) return null;
    return getImage(s.imageId);
  }, [sessions]);

  return { sessions, save, remove, update, loadImage };
}

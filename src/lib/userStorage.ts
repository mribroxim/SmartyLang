/**
 * UID-scoped localStorage cache so shared browsers don't mix accounts.
 * Falls back to legacy unscoped keys when no uid is set (pre-login).
 */

let activeUid: string | null = null;

export function setStorageUid(uid: string | null) {
  activeUid = uid || null;
}

export function getStorageUid(): string | null {
  return activeUid;
}

export function scopedKey(base: string, uid: string | null = activeUid): string {
  if (!uid) return base;
  return `smarty_${uid}_${base}`;
}

export function readScopedJSON<T>(base: string, fallback: T, uid: string | null = activeUid): T {
  try {
    const scoped = localStorage.getItem(scopedKey(base, uid));
    if (scoped) return JSON.parse(scoped) as T;
    // Legacy unscoped migration read
    if (uid) {
      const legacy = localStorage.getItem(base);
      if (legacy) {
        localStorage.setItem(scopedKey(base, uid), legacy);
        return JSON.parse(legacy) as T;
      }
    } else {
      const legacy = localStorage.getItem(base);
      if (legacy) return JSON.parse(legacy) as T;
    }
  } catch { /* ignore */ }
  return fallback;
}

export function writeScopedJSON(base: string, value: unknown, uid: string | null = activeUid): void {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(scopedKey(base, uid), json);
    // Keep legacy mirror only when logged out (anonymous preview)
    if (!uid) localStorage.setItem(base, json);
  } catch { /* quota */ }
}

export function removeScoped(base: string, uid: string | null = activeUid): void {
  try {
    localStorage.removeItem(scopedKey(base, uid));
    if (!uid) localStorage.removeItem(base);
  } catch { /* ignore */ }
}

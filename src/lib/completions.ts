/**
 * Central completion / activity history pipeline.
 * Writes uid-scoped local cache + Firestore users/{uid}/completions/{id}.
 */

import { collection, doc, setDoc, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { appendHistory } from './sessionHistory';
import { readScopedJSON, writeScopedJSON, getStorageUid } from './userStorage';
import { logActivity, type ActivityType } from './activity-tracker';

export type CompletionType =
  | 'exercise'
  | 'ielts-reading'
  | 'ielts-listening'
  | 'ielts-speaking'
  | 'ielts-writing'
  | 'comprehensive-reading'
  | 'comprehensive-listening'
  | 'dictation'
  | 'story'
  | 'shadowing'
  | 'writing-mock'
  | 'writing'
  | 'speaking'
  | 'reading-pronunciation';

export interface CompletionRecord {
  id: string;
  type: CompletionType;
  timestamp: number;
  contentLang?: string;
  title?: string;
  score?: number;
  total?: number;
  accuracy?: number;
  band?: number;
  data?: Record<string, unknown>;
}

const LOCAL_KEY = 'completions_v1';
const CAP = 300;

/** Legacy localStorage keys → completion type for migration / Dashboard reads */
export const LEGACY_COMPLETION_KEYS: Record<string, CompletionType> = {
  cr_completions_v1: 'comprehensive-reading',
  cl_completions_v1: 'comprehensive-listening',
  ld_completions_v1: 'dictation',
  is_completions_v1: 'story',
  shadowing_completions_v1: 'shadowing',
  writing_mock_history_v1: 'writing-mock',
  ielts_speaking_history_v1: 'ielts-speaking',
  readmaster_exercises_history: 'exercise',
};

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadLocalCompletions(uid?: string | null): CompletionRecord[] {
  return readScopedJSON<CompletionRecord[]>(LOCAL_KEY, [], uid ?? getStorageUid());
}

export function saveLocalCompletions(list: CompletionRecord[], uid?: string | null): void {
  writeScopedJSON(LOCAL_KEY, list.slice(0, CAP), uid ?? getStorageUid());
}

export function completionsOfType(type: CompletionType | CompletionType[], uid?: string | null): CompletionRecord[] {
  const types = Array.isArray(type) ? type : [type];
  return loadLocalCompletions(uid).filter(c => types.includes(c.type));
}

/** Merge cloud + local by id, newest first. */
export function mergeCompletions(a: CompletionRecord[], b: CompletionRecord[]): CompletionRecord[] {
  const map = new Map<string, CompletionRecord>();
  for (const c of [...a, ...b]) {
    if (!c?.id) continue;
    const prev = map.get(c.id);
    if (!prev || (c.timestamp || 0) >= (prev.timestamp || 0)) map.set(c.id, c);
  }
  return Array.from(map.values()).sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0)).slice(0, CAP);
}

export async function fetchCloudCompletions(uid: string, max = 200): Promise<CompletionRecord[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, 'users', uid, 'completions'), orderBy('timestamp', 'desc'), fbLimit(max));
    const snap = await getDocs(q);
    const out: CompletionRecord[] = [];
    snap.forEach(d => {
      const data = d.data() as Omit<CompletionRecord, 'id'>;
      out.push({ id: d.id, ...data });
    });
    return out;
  } catch (e) {
    console.error('fetchCloudCompletions failed:', e);
    return [];
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function activityTypeFor(type: CompletionType): ActivityType | null {
  switch (type) {
    case 'comprehensive-reading': return 'comprehensive_reading';
    case 'comprehensive-listening': return 'comprehensive_listening';
    case 'dictation': return 'audio_dictation';
    case 'story': return 'interactive_story';
    case 'exercise':
    case 'ielts-reading':
    case 'ielts-listening':
      return 'exercise';
    case 'speaking':
    case 'ielts-speaking':
      return 'speaking_practice';
    case 'writing':
    case 'writing-mock':
    case 'ielts-writing':
      return 'writing_practice';
    case 'reading-pronunciation':
      return 'reading_pronunciation';
    case 'shadowing':
      return 'speaking_practice';
    default:
      return null;
  }
}

/**
 * Record a completion: local cache + Firestore + teacher activity feed.
 * Also mirrors into legacy keys for any UI still reading them.
 */
export function recordCompletion(
  type: CompletionType,
  payload: {
    title?: string;
    score?: number;
    total?: number;
    accuracy?: number;
    band?: number;
    contentLang?: string;
    data?: Record<string, unknown>;
    /** Skip teacher feed when caller already logged */
    skipActivity?: boolean;
  } = {},
): CompletionRecord {
  const id = newId();
  const timestamp = Date.now();
  const record: CompletionRecord = {
    id,
    type,
    timestamp,
    title: payload.title,
    score: payload.score,
    total: payload.total,
    accuracy: payload.accuracy,
    band: payload.band,
    contentLang: payload.contentLang,
    data: payload.data,
  };

  const list = [record, ...loadLocalCompletions()];
  saveLocalCompletions(list);

  // Mirror legacy arrays used by Dashboard / PracticeHistory widgets
  mirrorLegacy(type, record);

  const uid = auth?.currentUser?.uid || getStorageUid();
  if (uid && isFirebaseConfigured && db) {
    const ref = doc(db, 'users', uid, 'completions', id);
    setDoc(ref, stripUndefined({ ...record })).catch(e => console.error('completion sync failed:', e));
  }

  if (!payload.skipActivity) {
    try {
      const at = activityTypeFor(type);
      if (at) {
        const rawDetails = payload.data?.details;
        const details = Array.isArray(rawDetails)
          ? rawDetails
          : Array.isArray(payload.data?.questions)
            ? payload.data!.questions
            : undefined;
        logActivity({
          type: at,
          title: payload.title || type,
          score: payload.score,
          total: payload.total,
          accuracy: payload.accuracy ?? (payload.band != null ? Math.round((payload.band / 9) * 100) : undefined),
          exerciseId: type.startsWith('ielts') || type === 'exercise' ? type : undefined,
          details: details as any,
        });
      }
    } catch (e) {
      console.warn('recordCompletion activity log failed:', e);
    }
  }

  return record;
}

function mirrorLegacy(type: CompletionType, record: CompletionRecord) {
  const entry = {
    ...record.data,
    id: record.id,
    timestamp: record.timestamp,
    title: record.title,
    score: record.score,
    total: record.total,
    accuracy: record.accuracy,
    band: record.band,
    contentLang: record.contentLang,
    type: type === 'exercise' ? (record.data as any)?.exerciseType || 'exercise' : type,
  };

  const map: Partial<Record<CompletionType, string>> = {
    'comprehensive-reading': 'cr_completions_v1',
    'comprehensive-listening': 'cl_completions_v1',
    dictation: 'ld_completions_v1',
    story: 'is_completions_v1',
    shadowing: 'shadowing_completions_v1',
    'writing-mock': 'writing_mock_history_v1',
    'ielts-speaking': 'ielts_speaking_history_v1',
  };

  const key = map[type];
  if (key) {
    appendHistory(key, entry, 200);
    // Also write scoped copy
    const scoped = readScopedJSON<any[]>(key, []);
    writeScopedJSON(key, [entry, ...scoped].slice(0, 200));
  }

  if (type === 'exercise' || type === 'ielts-reading' || type === 'ielts-listening') {
    const hist = readScopedJSON<any[]>('readmaster_exercises_history', []);
    const row = {
      type: type === 'exercise' ? (record.data as any)?.exerciseType || 'exercise' : type,
      timestamp: record.timestamp,
      data: {
        ...(record.data || {}),
        score: record.score,
        total: record.total,
        title: record.title,
        band: record.band,
      },
      contentLang: record.contentLang,
    };
    writeScopedJSON('readmaster_exercises_history', [row, ...hist].slice(0, 200));
    try {
      localStorage.setItem('readmaster_exercises_history', JSON.stringify([row, ...hist].slice(0, 200)));
    } catch { /* ignore */ }
  }
}

/** Estimate IELTS band from /40 score (simple linear map used in-product). */
export function bandFromScore40(score: number): number {
  const pct = Math.max(0, Math.min(40, score)) / 40;
  const band = 1 + pct * 8;
  return Math.round(band * 2) / 2; // 0.5 steps
}

export async function hydrateCompletionsFromCloud(uid: string): Promise<CompletionRecord[]> {
  const cloud = await fetchCloudCompletions(uid);
  const local = loadLocalCompletions(uid);
  const merged = mergeCompletions(cloud, local);
  saveLocalCompletions(merged, uid);
  return merged;
}

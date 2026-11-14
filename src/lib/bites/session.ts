import type { ContentLang } from '../contentLang';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import type { BiteDef, BiteStep, StepKind } from './types';

export interface StepScore {
  kind: StepKind;
  percent: number;
  mistakes: string[];
  correctWords: string[];
  retry?: boolean;
  skipped?: boolean;
}
export interface AnswerHistory { mistakes: string[]; hadWrong: boolean }

interface BiteSnapshot {
  version: 1;
  lang: ContentLang;
  id: string;
  signature: string;
  steps: BiteStep[];
  index: number;
  scores: StepScore[];
  elapsed: number;
  answered?: Record<number, string[]>;
  answerHistory?: AnswerHistory;
}

const KEY = 'bite_session_v1';

function readSnapshots(): Record<string, BiteSnapshot> {
  try {
    const raw = JSON.parse(localStorage.getItem(scopedKey(KEY)) || 'null');
    if (raw?.v === 2 && raw.sessions && typeof raw.sessions === 'object') return raw.sessions;
    // Preserve the original single-session cache on upgrade.
    if (raw?.version === 1 && raw.lang && raw.id) return { [`${raw.lang}:${raw.id}`]: raw };
  } catch { /* Invalid or unavailable cache. */ }
  return {};
}

/** Restore completed steps only; a partially answered step starts again. */
export function loadBiteSession(lang: ContentLang, def: BiteDef): BiteSnapshot | null {
  try {
    // Session snapshots must never migrate from another user's legacy cache.
    const s = readSnapshots()[`${lang}:${def.id}`];
    if (!s) return null;
    if (s.version !== 1 || s.lang !== lang || s.id !== def.id || s.signature !== JSON.stringify(def.steps)) return null;
    if (!Array.isArray(s.steps) || !Array.isArray(s.scores) || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.steps.length) return null;
    if (s.scores.length !== s.index || !Number.isFinite(s.elapsed) || s.elapsed < 0) return null;
    if (JSON.stringify(s.steps.slice(0, def.steps.length)) !== JSON.stringify(def.steps)) return null;
    if (s.steps.length > def.steps.length + 1) return null;
    if (s.steps.length > def.steps.length && (s.steps.at(-1)?.kind !== 'definition-quiz' || !s.steps.at(-1)?.retry)) return null;
    if (s.scores.some((score, i) => !score || score.kind !== s.steps[i].kind || !Number.isFinite(score.percent) || !Array.isArray(score.mistakes) || !Array.isArray(score.correctWords))) return null;
    if (s.answered && Object.values(s.answered).some(list => !Array.isArray(list) || list.some(id => typeof id !== 'string'))) return null;
    if (s.answerHistory && (!Array.isArray(s.answerHistory.mistakes) || s.answerHistory.mistakes.some(word => typeof word !== 'string') || typeof s.answerHistory.hadWrong !== 'boolean')) return null;
    return s;
  } catch { return null; }
}

export function saveBiteSession(lang: ContentLang, def: BiteDef, steps: BiteStep[], index: number, scores: StepScore[], elapsed: number, answered?: Record<number, string[]>, answerHistory?: AnswerHistory) {
  const snapshot: BiteSnapshot = { version: 1, lang, id: def.id, signature: JSON.stringify(def.steps), steps, index, scores, elapsed, answered, answerHistory };
  const entries = Object.entries(readSnapshots()).filter(([key]) => key !== `${lang}:${def.id}`).slice(-9);
  writeScopedJSON(KEY, { v: 2, sessions: { ...Object.fromEntries(entries), [`${lang}:${def.id}`]: snapshot } });
}

export function clearBiteSession(lang: ContentLang, def: BiteDef) {
  try {
    const sessions = readSnapshots();
    delete sessions[`${lang}:${def.id}`];
    if (Object.keys(sessions).length) writeScopedJSON(KEY, { v: 2, sessions });
    else localStorage.removeItem(scopedKey(KEY, getStorageUid()));
  } catch { /* Storage is optional. */ }
}

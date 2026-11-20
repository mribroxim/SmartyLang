/**
 * Workshop store: refined items per learning language, synced in the progress
 * document as `workshop_v1`. Fed by every graded bite step.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import type { StepKind } from '../bites/types';
import type { Level, ReadingText } from '../reading-logic';
import { DAY, advance, newItem, normalizeWorkshop, mergeWorkshop, type Evidence, type WorkItem, type WorkshopItems, type WorkshopState, type Stage } from './model';
const empty = (): WorkshopState => ({ items: {}, backfilled: {}, updatedAt: 0 });
export { normalizeWorkshop, mergeWorkshop, type WorkshopState } from './model';

export const WORKSHOP_KEY = 'workshop_v1';
export const SECTION_LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

/** Which kind of evidence a lesson step gives about its words. */
export function evidenceFor(kind: StepKind): Evidence | null {
  switch (kind) {
    case 'vocab-intro': case 'teach': return 'see';
    case 'definition-quiz': case 'listening-match': case 'true-false-quiz': case 'word-match': case 'comprehension': case 'cloze': case 'v2-recognise': case 'v2-scene-quiz':
      return 'recognise';
    case 'spelling-practice': case 'word-scramble': case 'audio-dictation': case 'sentence-reorder': case 'v2-produce':
      return 'recall';
    case 'pronunciation': case 'read-back-shadowing': case 'mission-reply':
      return 'use';
    case 'word-review':
      return 'review';
    default:
      return null;
  }
}

export interface Graded { correct: string[]; wrong: string[] }

/** Pure: apply one step's results. Returns the new items and which words moved up a stage. */
export function applyEvidence(items: WorkshopItems, graded: Graded, evidence: Evidence, sec: number, now: number): { items: WorkshopItems; moved: { word: string; from: Stage; to: Stage }[] } {
  const out = { ...items };
  const moved: { word: string; from: Stage; to: Stage }[] = [];
  const norm = (w: string) => w.trim().toLowerCase();
  const wrong = new Set(graded.wrong.map(norm).filter(Boolean));
  const apply = (word: string, ok: boolean) => {
    const prev: WorkItem = out[word] ?? newItem(sec, now);
    const next = advance(prev, evidence, ok, now);
    if (next !== prev || !out[word]) out[word] = next;
    if (next.stage > prev.stage) moved.push({ word, from: prev.stage, to: next.stage });
  };
  for (const w of new Set(graded.correct.map(norm).filter(Boolean))) if (!wrong.has(w)) apply(w, true);
  // Wrong answers only matter for items the learner has already met.
  for (const w of wrong) if (out[w]) apply(w, false);
  return { items: out, moved };
}

/**
 * Pure, idempotent: seed items from lessons finished before the workshop
 * existed — Recognised, or Recalled when that lesson was passed at ≥80%.
 * Never lowers an existing item.
 */
export function backfillItems(items: WorkshopItems, lessons: { words: string[]; sec: number; best: number | null }[], now: number): WorkshopItems {
  const out = { ...items };
  for (const l of lessons) {
    if (l.best == null) continue;
    const stage: Stage = l.best >= 80 ? 3 : 2;
    for (const raw of l.words) {
      const w = raw.trim().toLowerCase();
      if (!w || (out[w] && out[w].stage >= stage)) continue;
      // First refine is due tomorrow: nobody should open the app to a dusty workshop.
      out[w] = { ...(out[w] ?? newItem(l.sec, now)), stage, sec: out[w]?.sec ?? l.sec, due: now + DAY, reps: 1, interval: 1, updatedAt: now };
    }
  }
  return out;
}

// ── store ───────────────────────────────────────────────────────────────

let owner: string | null | undefined;
let current = empty();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function ensureLoaded() {
  const uid = getStorageUid();
  if (owner === uid) return;
  owner = uid;
  try { current = normalizeWorkshop(JSON.parse(localStorage.getItem(scopedKey(WORKSHOP_KEY)) || 'null')); }
  catch { current = empty(); }
}
function commit(next: WorkshopState) { current = { ...next, updatedAt: Date.now() }; writeScopedJSON(WORKSHOP_KEY, current); emit(); }

export function getWorkshop(): WorkshopState { ensureLoaded(); return current; }
export function workshopItems(lang: string): WorkshopItems { return getWorkshop().items[lang] ?? {}; }

/** Record a graded step. Returns the stage moves (for the end-of-bite screen). */
export function recordWorkshop(lang: string, kind: StepKind, graded: Graded, sec: number, now = Date.now()) {
  const evidence = evidenceFor(kind);
  if (!evidence) return [];
  ensureLoaded();
  const r = applyEvidence(current.items[lang] ?? {}, graded, evidence, sec, now);
  commit({ ...current, items: { ...current.items, [lang]: r.items } });
  return r.moved;
}

/** One-time copy of finished lessons into the workshop. Safe to call often. */
export function backfillWorkshop(lang: string, textsByLevel: Record<Level, ReadingText[]>, bestFor: (text: ReadingText) => number | null, now = Date.now()) {
  ensureLoaded();
  if (current.backfilled[lang]) return;
  const lessons = SECTION_LEVELS.flatMap((lvl, sec) => (textsByLevel[lvl] || []).map((tx) => ({
    words: (tx.vocabulary || []).map((v) => v.word), sec, best: bestFor(tx),
  })));
  if (!lessons.length) return;
  commit({ ...current, items: { ...current.items, [lang]: backfillItems(current.items[lang] ?? {}, lessons, now) }, backfilled: { ...current.backfilled, [lang]: now } });
}

/** Recently refined words (Used/Recalled first) for Smarty to bring up in chat. */
export function practisingWords(lang: string, n = 12): string[] {
  return Object.entries(workshopItems(lang)).filter(([, i]) => i.stage >= 2)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt || b.stage - a.stage).slice(0, n).map(([w]) => w);
}

export function subscribeWorkshop(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const useWorkshop = () => useSyncExternalStore(subscribeWorkshop, getWorkshop, getWorkshop);

registerSyncedStore({
  key: WORKSHOP_KEY,
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: (remote) => {
    ensureLoaded();
    const next = mergeWorkshop(current, normalizeWorkshop(remote));
    if (JSON.stringify(next) !== JSON.stringify(current)) { current = next; writeScopedJSON(WORKSHOP_KEY, current); emit(); }
  },
  subscribe: subscribeWorkshop,
});

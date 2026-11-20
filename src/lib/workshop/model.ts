/**
 * Word Workshop: every lesson item is refined through five stages, like parts
 * moving along a production line.
 *
 *   1 Found       – seen on a teach card
 *   2 Recognised  – picked its meaning / heard it
 *   3 Recalled    – produced it (spelled, built, wrote it down)
 *   4 Used        – used it in a sentence (mission, speaking, open build)
 *   5 Mastered    – kept it: a review passed ≥7 days after Used, OR
 *                   3 successful recalls on ≥2 different days after Used
 *
 * Items come due for review on a spaced schedule. An overdue item is "dusty":
 * it stays at its stage (never drops on its own) and stops advancing until it
 * is refined in a review session. Only a failed review moves it back a stage.
 * Pure + deterministic: callers pass `now`.
 */

export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export const STAGES = [1, 2, 3, 4, 5] as const;
export type Evidence = 'see' | 'recognise' | 'recall' | 'use' | 'review';

export interface WorkItem {
  stage: Stage;
  /** Section index (0 = Beginner) the item was taught in. */
  sec: number;
  /** When it first reached Used. */
  usedAt?: number;
  /** Successful recalls/reviews after Used, and the distinct days they happened on. */
  recalls: number;
  days: string[];
  /** Spaced schedule (SM-2 style). */
  due: number;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  updatedAt: number;
}

export const DAY = 24 * 60 * 60 * 1000;
export const MASTER_GAP_DAYS = 7;
export const MASTER_RECALLS = 3;
export const MASTER_DISTINCT_DAYS = 2;

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function newItem(sec: number, now: number): WorkItem {
  return { stage: 0, sec, recalls: 0, days: [], due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, updatedAt: now };
}

/** Overdue for review (and old enough to have a schedule). */
export function isDusty(item: WorkItem, now: number): boolean {
  return item.stage >= 2 && item.due > 0 && item.due <= now;
}

function schedule(item: WorkItem, quality: number, now: number): WorkItem {
  let { interval, reps, ease } = item;
  if (quality >= 3) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
    reps += 1;
  } else {
    reps = 0;
    interval = 1;
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { ...item, interval, reps, ease, due: now + interval * DAY };
}

const RANK: Record<Evidence, Stage> = { see: 1, recognise: 2, recall: 3, use: 4, review: 0 };

function masteryReached(item: WorkItem): boolean {
  if (item.stage < 4 || !item.usedAt) return false;
  if (item.recalls >= MASTER_RECALLS && item.days.length >= MASTER_DISTINCT_DAYS) return true;
  return false;
}

/** Apply one graded answer about an item. */
export function advance(item: WorkItem, evidence: Evidence, correct: boolean, now: number): WorkItem {
  if (evidence === 'see') return item.stage >= 1 ? item : { ...item, stage: 1, updatedAt: now };
  const dusty = isDusty(item, now);
  if (!correct) {
    let next = schedule({ ...item, lapses: item.lapses + 1 }, 1, now);
    // Only a failed review costs a stage (never below Recognised).
    if (evidence === 'review' && item.stage > 2) next = { ...next, stage: (item.stage - 1) as Stage, recalls: 0, days: [] };
    return { ...next, updatedAt: now };
  }
  // Dusty items are frozen until refined in a review.
  if (dusty && evidence !== 'review') return item;
  let next: WorkItem = { ...item, updatedAt: now };
  const target = RANK[evidence];
  if (target > next.stage) next.stage = target;
  if (next.stage >= 4 && !next.usedAt) next.usedAt = now;
  // After Used, each correct recall/use/review counts toward Mastered.
  const counts = item.stage >= 4 && evidence !== 'recognise';
  if (counts) {
    const day = dayKey(now);
    next.recalls = item.recalls + 1;
    next.days = item.days.includes(day) ? item.days : [...item.days, day].slice(-10);
  }
  // A passed review a week after Used also proves it stuck.
  const longReview = evidence === 'review' && item.usedAt != null && now - item.usedAt >= MASTER_GAP_DAYS * DAY;
  if (next.stage === 4 && (longReview || masteryReached(next))) next.stage = 5;
  // The clock moves at most once a day: several answers in one lesson are one exposure.
  const scheduledToday = item.due > 0 && dayKey(item.updatedAt) === dayKey(now);
  if (!scheduledToday && (dusty || next.stage !== item.stage || item.due === 0 || evidence === 'review')) next = schedule(next, 4, now);
  return next;
}

export interface WorkshopCounts { total: number; byStage: Record<Stage, number>; dusty: number; atLeast: (s: Stage) => number }

export function countItems(items: Record<string, WorkItem>, now: number, sec?: number): WorkshopCounts {
  const byStage: Record<Stage, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let dusty = 0; let total = 0;
  for (const it of Object.values(items)) {
    if (sec != null && it.sec !== sec) continue;
    byStage[it.stage]++; total++;
    if (isDusty(it, now)) dusty++;
  }
  return { total, byStage, dusty, atLeast: (s) => STAGES.filter((x) => x >= s).reduce((a, x) => a + byStage[x], 0) };
}

/** Share of active items that aren't dusty (0–100). */
export function efficiency(items: Record<string, WorkItem>, now: number): number {
  const active = Object.values(items).filter((i) => i.stage >= 2);
  if (!active.length) return 100;
  return Math.round(100 * (1 - active.filter((i) => isDusty(i, now)).length / active.length));
}

/** Items to refine first: dusty, then due soonest, lower stage first. */
export function refineQueue(items: Record<string, WorkItem>, now: number, n = 12): string[] {
  return Object.entries(items)
    .filter(([, i]) => i.stage >= 2)
    .sort(([, a], [, b]) => Number(isDusty(b, now)) - Number(isDusty(a, now)) || a.due - b.due || a.stage - b.stage)
    .slice(0, n)
    .map(([w]) => w);
}

// ── sync ────────────────────────────────────────────────────────────────

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function normalizeItem(raw: unknown): WorkItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const stage = num(r.stage);
  if (!Number.isInteger(stage) || stage < 0 || stage > 5) return null;
  return {
    stage: stage as Stage,
    sec: Math.max(0, Math.min(4, Math.round(num(r.sec)))),
    ...(num(r.usedAt) > 0 ? { usedAt: num(r.usedAt) } : {}),
    recalls: Math.max(0, Math.round(num(r.recalls))),
    days: Array.isArray(r.days) ? r.days.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-10) : [],
    due: Math.max(0, num(r.due)),
    interval: Math.max(0, num(r.interval)),
    ease: Math.max(1.3, num(r.ease, 2.5)),
    reps: Math.max(0, Math.round(num(r.reps))),
    lapses: Math.max(0, Math.round(num(r.lapses))),
    updatedAt: Math.max(0, num(r.updatedAt)),
  };
}

/** Two devices: the further-refined item wins; ties go to the newer edit. Days are pooled. */
export function mergeItem(a: WorkItem, b: WorkItem): WorkItem {
  const win = b.stage > a.stage || (b.stage === a.stage && b.updatedAt > a.updatedAt) ? b : a;
  const lose = win === a ? b : a;
  const days = Array.from(new Set([...win.days, ...(lose.stage === win.stage ? lose.days : [])])).sort().slice(-10);
  return { ...win, days, recalls: Math.max(win.recalls, lose.stage === win.stage ? lose.recalls : 0), usedAt: win.usedAt ?? lose.usedAt };
}

export type WorkshopItems = Record<string, WorkItem>;

export function normalizeItems(raw: unknown): WorkshopItems {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: WorkshopItems = {};
  for (const [word, v] of Object.entries(raw)) {
    const item = normalizeItem(v);
    if (item && word.trim() && word.length <= 80) out[word.trim().toLowerCase()] = item;
  }
  return out;
}

export function mergeItems(a: WorkshopItems, b: WorkshopItems): WorkshopItems {
  const out = { ...a };
  for (const [w, item] of Object.entries(b)) out[w] = out[w] ? mergeItem(out[w], item) : item;
  return out;
}

export interface WorkshopState {
  items: Record<string, WorkshopItems>;
  /** lang → when legacy progress was copied in (runs once). */
  backfilled: Record<string, number>;
  updatedAt: number;
}


export function normalizeWorkshop(raw: unknown): WorkshopState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { items: {}, backfilled: {}, updatedAt: 0 };
  const r = raw as Record<string, unknown>;
  const items: Record<string, WorkshopItems> = {};
  if (r.items && typeof r.items === 'object') {
    for (const [lang, v] of Object.entries(r.items as Record<string, unknown>)) if (/^[a-z]{2}$/.test(lang)) items[lang] = normalizeItems(v);
  }
  const backfilled: Record<string, number> = {};
  if (r.backfilled && typeof r.backfilled === 'object') {
    for (const [lang, v] of Object.entries(r.backfilled as Record<string, unknown>)) if (/^[a-z]{2}$/.test(lang) && typeof v === 'number' && v > 0) backfilled[lang] = v;
  }
  return { items, backfilled, updatedAt: typeof r.updatedAt === 'number' && r.updatedAt > 0 ? r.updatedAt : 0 };
}

export function mergeWorkshop(a: WorkshopState, b: WorkshopState): WorkshopState {
  const items: Record<string, WorkshopItems> = { ...a.items };
  for (const [lang, v] of Object.entries(b.items)) items[lang] = mergeItems(items[lang] ?? {}, v);
  const backfilled: Record<string, number> = { ...a.backfilled };
  for (const [lang, v] of Object.entries(b.backfilled)) backfilled[lang] = Math.max(backfilled[lang] ?? 0, v);
  return { items, backfilled, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}


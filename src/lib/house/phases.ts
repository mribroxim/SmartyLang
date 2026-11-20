/**
 * Smarty's house grows with the course: every unit has its own room, themed
 * on the unit's topic (Food & Drink → the kitchen). A room is built by
 * delivering that unit's words: finish its lessons, then recall, use and
 * master its words — like a factory project with a few deliveries.
 * Delivered amounts are high-water marks — once delivered they stay
 * delivered, even if words later get dusty.
 */
import ROOMS from './rooms.json' with { type: 'json' };
import type { WorkshopItems, Stage } from '../workshop/model';

export type PhaseId = string;
export type DeliverableId = 'lessons' | 'recalled' | 'used' | 'mastered';

export interface Phase { id: PhaseId; sec: number; unit: number; topic: string; built?: boolean }
export const PHASES: Phase[] = ROOMS.rooms.map((r) => ({ id: r.id, sec: r.section, unit: r.unit, topic: r.topic, built: !!(r as { built?: boolean }).built }));
export const DELIVERABLES: DeliverableId[] = ['lessons', 'recalled', 'used', 'mastered'];
export const LESSONS_PER_ROOM = 10;
const STAGE_FOR: Record<Exclude<DeliverableId, 'lessons'>, Stage> = { recalled: 3, used: 4, mastered: 5 };
const DEFAULT_WORDS = 45;

/** Targets scale with how many words the unit teaches; mastered stays small so nobody waits on the calendar. */
export function targetsFor(words: number): Record<DeliverableId, number> {
  const n = Math.max(8, Math.round(words) || DEFAULT_WORDS);
  return { lessons: LESSONS_PER_ROOM, recalled: Math.ceil(n * 0.7), used: Math.ceil(n * 0.4), mastered: Math.ceil(n * 0.2) };
}

type Row = Partial<Record<DeliverableId, number>> & { n?: number };
/** Delivered so far: lang → room → best counts (+ n = words in the unit). */
export type Delivered = Record<string, Record<PhaseId, Row>>;

/** Live counts for one room: the unit's words in the workshop + its finished lessons. */
export function liveCounts(items: WorkshopItems, words: Iterable<string>, lessonsDone: number): Record<DeliverableId, number> {
  const out = { lessons: Math.max(0, lessonsDone), recalled: 0, used: 0, mastered: 0 };
  for (const raw of words) {
    const it = items[raw.trim().toLowerCase()];
    if (!it) continue;
    for (const d of ['recalled', 'used', 'mastered'] as const) if (it.stage >= STAGE_FOR[d]) out[d]++;
  }
  return out;
}

/** Pure: raise delivered marks to the live counts (never lowers). Capped at the target. */
export function deliver(prev: Delivered, lang: string, phase: Phase, live: Record<DeliverableId, number>, words = DEFAULT_WORDS): Delivered {
  const cur = prev[lang]?.[phase.id] ?? {};
  const n = Math.max(cur.n ?? 0, Math.round(words));
  const targets = targetsFor(n);
  const next: Row = { ...cur, n };
  let changed = cur.n !== n;
  for (const d of DELIVERABLES) {
    const v = Math.min(targets[d], Math.max(cur[d] ?? 0, live[d]));
    if (v !== (cur[d] ?? 0)) { next[d] = v; changed = true; }
  }
  if (!changed) return prev;
  return { ...prev, [lang]: { ...prev[lang], [phase.id]: next } };
}

export function phaseProgress(delivered: Delivered, lang: string, phase: Phase) {
  const got = delivered[lang]?.[phase.id] ?? {};
  const targets = targetsFor(got.n ?? DEFAULT_WORDS);
  const rows = DELIVERABLES.map((d) => ({ id: d, have: got[d] ?? 0, target: targets[d] }));
  const done = rows.every((r) => r.have >= r.target);
  const pct = Math.round(100 * rows.reduce((a, r) => a + Math.min(1, r.have / r.target), 0) / rows.length);
  return { rows, done, pct };
}

/**
 * First room not built yet (the one being worked on), starting from the first
 * room the learner has delivered anything to — a course without a Unit 0
 * never gets stuck on the doorstep.
 */
export function currentPhase(delivered: Delivered, lang: string): Phase {
  const started = PHASES.findIndex((p) => !!delivered[lang]?.[p.id]);
  const from = started < 0 ? 0 : started;
  return PHASES.slice(from).find((p) => !phaseProgress(delivered, lang, p).done) ?? PHASES[PHASES.length - 1];
}

/** A room can be visited once its unit has been started (lessons delivered) or it's built. */
export function roomOpen(delivered: Delivered, lang: string, phase: Phase): boolean {
  if (phase.sec === 0 && phase.unit <= 1) return true;
  const got = delivered[lang]?.[phase.id];
  return !!got && ((got.lessons ?? 0) > 0 || phaseProgress(delivered, lang, phase).done);
}

export interface NextGoal { phase: PhaseId; id: DeliverableId; have: number; target: number; left: number }

/** The closest unmet delivery in the current room — what "one more bite" gets you. */
export function nextGoal(delivered: Delivered, lang: string): NextGoal | null {
  const phase = currentPhase(delivered, lang);
  const p = phaseProgress(delivered, lang, phase);
  if (p.done) return null;
  const open = p.rows.filter((r) => r.have < r.target).sort((a, b) => (a.target - a.have) - (b.target - b.have));
  const r = open[0];
  return { phase: phase.id, id: r.id, have: r.have, target: r.target, left: r.target - r.have };
}

const IDS = new Set(PHASES.map((p) => p.id));

export function normalizeDelivered(raw: unknown): Delivered {
  const out: Delivered = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [lang, rooms] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z]{2}$/.test(lang) || !rooms || typeof rooms !== 'object') continue;
    for (const [id, row] of Object.entries(rooms as Record<string, unknown>)) {
      if (!IDS.has(id) || !row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const clean: Row = {};
      for (const k of [...DELIVERABLES, 'n'] as const) {
        const v = r[k];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) clean[k] = Math.min(500, Math.round(v));
      }
      if (Object.keys(clean).length) (out[lang] ??= {})[id] = clean;
    }
  }
  return out;
}

export function mergeDelivered(a: Delivered, b: Delivered): Delivered {
  let out = a;
  for (const [lang, rooms] of Object.entries(b)) for (const ph of PHASES) {
    const row = rooms?.[ph.id];
    if (row) out = deliver(out, lang, ph, { lessons: row.lessons ?? 0, recalled: row.recalled ?? 0, used: row.used ?? 0, mastered: row.mastered ?? 0 }, row.n ?? 0);
  }
  return out;
}

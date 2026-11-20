/**
 * Pure progress maths for the Progress screen and the weekly recap.
 * Weeks run Monday 00:00 → Sunday 23:59 in local time.
 */
import type { CompletionRecord } from '../completions';

const DAY = 86_400_000;

export interface WeekStats {
  xp: number;
  bites: number;
  lessons: number;
  minutes: number;
  words: number;
  daysActive: number;
}

export interface Totals { learned: number; mastered: number }

/** Monday 00:00 local of the week containing `now`, shifted back by `weeksAgo` weeks. */
export function weekStart(now: Date | number, weeksAgo = 0): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const back = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - back - weeksAgo * 7);
  return d.getTime();
}

export function localDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Data = { xp?: unknown; ms?: unknown; passageId?: unknown; correctWords?: unknown };
const dataOf = (c: CompletionRecord): Data => (c.data ?? {}) as Data;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const norm = (w: string) => w.trim().toLowerCase();
const wordsOf = (c: CompletionRecord): string[] => {
  const w = dataOf(c).correctWords;
  return Array.isArray(w) ? w.filter((x): x is string => typeof x === 'string').map(norm).filter(Boolean) : [];
};

export interface WeekInput {
  completions: CompletionRecord[];
  /** Saved dictionary words with their save time (ms). */
  vocab?: Record<string, { timestamp?: number }>;
}

/** Stats for the 7-day window [from, from+7d). "Words" = first correct use or first save in the window. */
export function statsForWeek({ completions, vocab = {} }: WeekInput, from: number): WeekStats {
  const to = from + 7 * DAY;
  const inWin = completions.filter((c) => c.timestamp >= from && c.timestamp < to);
  const bites = inWin.filter((c) => c.type === 'lesson-bite');
  const seenBefore = new Set<string>();
  for (const c of completions) if (c.timestamp < from) for (const w of wordsOf(c)) seenBefore.add(w);
  const fresh = new Set<string>();
  for (const c of bites) for (const w of wordsOf(c)) if (!seenBefore.has(w)) fresh.add(w);
  for (const [w, v] of Object.entries(vocab)) {
    const ts = v?.timestamp;
    if (typeof ts === 'number' && ts >= from && ts < to && !seenBefore.has(norm(w))) fresh.add(norm(w));
  }
  const ms = inWin.reduce((s, c) => s + num(dataOf(c).ms), 0);
  return {
    xp: Math.round(inWin.reduce((s, c) => s + num(dataOf(c).xp), 0)),
    bites: bites.length,
    lessons: new Set(bites.map((c) => dataOf(c).passageId).filter((p): p is string => typeof p === 'string')).size,
    minutes: Math.round(ms / 60_000),
    words: fresh.size,
    daysActive: new Set(inWin.map((c) => localDayKey(c.timestamp))).size,
  };
}

export interface WeekCompare { thisWeek: WeekStats; lastWeek: WeekStats }

export function compareWeeks(input: WeekInput, now: Date | number = new Date()): WeekCompare {
  return { thisWeek: statsForWeek(input, weekStart(now)), lastWeek: statsForWeek(input, weekStart(now, 1)) };
}

/** Recap of the week that just ended (shown on Monday or later) — the previous full week. */
export function recapWeek(input: WeekInput, now: Date | number = new Date()): { stats: WeekStats; before: WeekStats; from: number } {
  const from = weekStart(now, 1);
  return { stats: statsForWeek(input, from), before: statsForWeek(input, weekStart(now, 2)), from };
}

export function hasAnyActivity(s: WeekStats): boolean {
  return s.bites > 0 || s.xp > 0 || s.minutes > 0 || s.words > 0 || s.daysActive > 0;
}

/** Percent change, or null when there is nothing to compare with. */
export function deltaPct(now: number, before: number): number | null {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export function wordTotals(items: Record<string, { stage: number }>, vocab: Record<string, unknown> = {}): Totals {
  const learned = new Set<string>();
  let mastered = 0;
  for (const [w, it] of Object.entries(items)) {
    if (it.stage >= 2) learned.add(norm(w));
    if (it.stage >= 5) mastered++;
  }
  for (const w of Object.keys(vocab)) learned.add(norm(w));
  return { learned: learned.size, mastered };
}

export interface HeatDay { key: string; count: number; future: boolean; ts: number }

/** Last `weeks` weeks (oldest first), 7 days each Mon→Sun, with completions per day. */
export function heatmap(completions: CompletionRecord[], now: Date | number = new Date(), weeks = 5): HeatDay[][] {
  const counts = new Map<string, number>();
  for (const c of completions) counts.set(localDayKey(c.timestamp), (counts.get(localDayKey(c.timestamp)) ?? 0) + 1);
  const nowMs = new Date(now).getTime();
  const start = weekStart(now, weeks - 1);
  const out: HeatDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: HeatDay[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + w * 7 + d);
      const key = localDayKey(day.getTime());
      row.push({ key, ts: day.getTime(), count: counts.get(key) ?? 0, future: day.getTime() > nowMs });
    }
    out.push(row);
  }
  return out;
}

/** 0 none … 3 lots. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  return count <= 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3;
}

// ── "Can do" ────────────────────────────────────────────────────────────

export interface CanDoUnit { unitKey: string; title: string; items: string[] }

interface UnitLike { title: string; lessons: { id: string; languageGoal?: string }[] }

/** Can-do lines from lessons the learner has finished, grouped by unit (units with none are omitted). */
export function canDoFromUnits(units: UnitLike[], isDone: (lessonId: string) => boolean): CanDoUnit[] {
  const out: CanDoUnit[] = [];
  units.forEach((u, i) => {
    const items = u.lessons.filter((l) => isDone(l.id) && l.languageGoal?.trim()).map((l) => l.languageGoal!.trim());
    if (items.length) out.push({ unitKey: `${i}`, title: u.title, items });
  });
  return out;
}

/** "I can introduce myself" → "You can introduce myself" is wrong, so flip first person to second. */
export function youCan(canDo: string): string {
  let s = canDo.trim().replace(/[.!]+$/, '');
  s = s.replace(/^(i|we) can\s+/i, '');
  s = s.replace(/^can\s+/i, '');
  s = s.replace(/\b(myself)\b/gi, 'yourself').replace(/\bmy\b/gi, 'your').replace(/\bme\b/gi, 'you');
  return `You can ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}

// ── weekly recap popup gate ─────────────────────────────────────────────

/** `YYYY-MM-DD` of the Monday of the week containing `now`. */
export function weekId(now: Date | number): string { return localDayKey(weekStart(now)); }

/** Pure: show once per week. Any day counts as "on/after Monday" because weeks start on Monday. */
export function recapDue(lastShownWeek: string | null | undefined, now: Date | number = new Date()): boolean {
  return lastShownWeek !== weekId(now);
}

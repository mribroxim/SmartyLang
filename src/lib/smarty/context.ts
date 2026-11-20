/**
 * What Smarty knows about the learner, so lines can be personal.
 * App.tsx pushes a fresh snapshot whenever the underlying state changes.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SmartyCtx {
  displayName?: string;
  streak: number;
  xpToday: number;
  goalDone: boolean;
  weakWords: string[];
  lastLesson?: string;
  isMax: boolean;
  createdAt?: number;
}

let ctx: SmartyCtx = { streak: 0, xpToday: 0, goalDone: false, weakWords: [], isMax: false };

export function setSmartyCtx(next: Partial<SmartyCtx>) {
  ctx = { ...ctx, ...next };
}

export function getSmartyCtx(): SmartyCtx {
  return ctx;
}

/** Use the first name from the profile. */
export function learnerName(): string | undefined {
  const first = (ctx.displayName || '').trim().split(/\s+/)[0];
  return first || undefined;
}

export function timeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** Streak is at risk after 18:00 if no XP was earned today. */
export function streakAtRisk(d = new Date()): boolean {
  return ctx.streak > 0 && ctx.xpToday === 0 && d.getHours() >= 18;
}

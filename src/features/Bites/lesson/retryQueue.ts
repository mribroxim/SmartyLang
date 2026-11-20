/**
 * "Fix your mistakes" queue for one lesson step. Pure helpers so the rules are testable:
 * a missed question comes back a few questions later (or at the end), at most twice,
 * and the step is only finished once the queue is empty.
 */
import type { Question } from './questions';

export interface QueueItem {
  /** Index into the step's original questions. */
  qi: number;
  /** 0 = first time, 1+ = a retry of an earlier miss. */
  attempt: number;
}

export const MAX_RETRIES = 2;
/** A missed question reappears after this many other questions (or at the end when fewer remain). */
export const RETRY_GAP = 3;

export const initialQueue = (n: number): QueueItem[] => Array.from({ length: n }, (_, qi) => ({ qi, attempt: 0 }));

/** Speaking can be mis-heard and match-pairs already loops until every pair is right, so neither is re-asked. */
export function isRetryable(q: Pick<Question, 'type'>): boolean {
  return q.type !== 'speak' && q.type !== 'pairs';
}

/**
 * Queue after the question at `idx` was answered wrong. The item is re-inserted after
 * `gap` further questions (clamped to the end). Returns the same array when capped.
 */
export function requeueMissed(queue: QueueItem[], idx: number, maxRetries = MAX_RETRIES, gap = RETRY_GAP): QueueItem[] {
  const cur = queue[idx];
  if (!cur || cur.attempt >= maxRetries) return queue;
  const at = Math.min(queue.length, idx + 1 + gap);
  return [...queue.slice(0, at), { qi: cur.qi, attempt: cur.attempt + 1 }, ...queue.slice(at)];
}

const shuffled = <T,>(a: T[], rng: () => number): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

/** Same order as `a` (compared by value) means the shuffle changed nothing. */
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Shuffle so the result differs from the input whenever there are at least two distinct values. */
function reshuffle(a: string[], rng: () => number): string[] {
  if (new Set(a).size < 2) return a;
  for (let i = 0; i < 6; i++) { const b = shuffled(a, rng); if (!sameOrder(a, b)) return b; }
  return [...a.slice(1), a[0]];
}

/** A retried question with its options / tiles in a new order (answers are matched by value, so grading is unchanged). */
export function variantForRetry(q: Question, rng: () => number = Math.random): Question {
  if (q.type === 'choice') return { ...q, options: reshuffle(q.options, rng) };
  if (q.type === 'tiles') return { ...q, tiles: reshuffle(q.tiles, rng) };
  return q;
}

/** Progress shown to the learner: never goes backwards, even when a miss adds a step. */
export const monotoneProgress = (prev: number, next: number): number => Math.max(prev, Math.min(1, Math.max(0, next)));

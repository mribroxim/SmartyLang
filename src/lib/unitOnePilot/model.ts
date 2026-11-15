import type { PilotTask, ReplyRule } from './content';
export function normalizeReply(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{M}\p{N}'\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function acceptsReply(value: string, rule: ReplyRule): boolean {
  const text = normalizeReply(value);
  if (text.length > 140) return false;
  if (rule === 'ask-name') return ["what's your name", 'what is your name'].includes(text);
  if (rule === 'ask-origin') return text === 'where are you from';
  const clean = text.replace(/^(?:hello|hi|hey)\s+/, '');
  const match = rule === 'origin' ? clean.match(/^(?:i am|i'm) from ([\p{L}\p{M}][\p{L}\p{M}' -]{0,60})$/u)
    : clean.match(/^(?:my name is|my name's|i am|i'm) ([\p{L}\p{M}][\p{L}\p{M}' -]{0,40})$/u);
  if (!match) return false;
  const detail = match[1].trim();
  return !!detail && !/^(?:from|am|are|is|your|my|name|i)(?:\s|$)/.test(detail);
}
export function checkTask(task: PilotTask, value: string): boolean {
  if (task.kind === 'choice') return value === task.answer;
  if (task.kind === 'build') return task.answers.some(answer => normalizeReply(answer) === normalizeReply(value));
  if (task.kind === 'reply') return acceptsReply(value, task.rule);
  if (task.kind === 'speak') return normalizeReply(value) === normalizeReply(task.target);
  return true;
}
export interface PilotRecord { completedAt: number; best: number; missed: string[]; }
export type PilotProgress = Record<string, PilotRecord>;
const IDS = new Set(['hello', 'name', 'listen', 'be', 'review', 'from', 'story', 'chat', 'repair', 'mission']);
export function normalizePilot(raw: unknown): PilotProgress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([id, value]) => IDS.has(id) && value && Number.isFinite(value.completedAt) && value.completedAt > 0 && Number.isFinite(value.best)).map(([id, value]) => [id, { completedAt: value.completedAt, best: Math.max(0, Math.min(100, Math.round(value.best))), missed: Array.isArray(value.missed) ? [...new Set<string>(value.missed.filter((x: unknown) => typeof x === 'string').slice(0, 80))] : [] }]));
}
export function mergePilot(a: unknown, b: unknown): PilotProgress {
  const result = normalizePilot(a);
  for (const [id, value] of Object.entries(normalizePilot(b))) {
    const previous = result[id];
    result[id] = previous ? { completedAt: Math.max(previous.completedAt, value.completedAt), best: Math.max(previous.best, value.best), missed: value.completedAt > previous.completedAt ? value.missed : previous.missed } : value;
  }
  return result;
}

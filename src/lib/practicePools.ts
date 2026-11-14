import type { ReadingText } from './reading-logic';
export type PracticeMode = 'mistakes' | 'review' | 'listening' | 'speaking' | 'translate' | 'match' | 'truefalse' | 'scramble' | 'spell';
export function practicePools(all: ReadingText[], savedVocab: Record<string, any>, problemWords: Record<string, { count: number }>, catalog: Map<string, unknown>, missedByLesson: Record<string, string[]>, now = Date.now()): Record<PracticeMode, string[]> {
    const missed = [...(Object.entries(problemWords) as [string, { count: number }][]).sort((a, b) => b[1].count - a[1].count).map(([w]) => w),
      ...all.flatMap((tx) => missedByLesson[tx.id] || [])].map((w) => w.toLowerCase());
    const mistakes = [...new Set(missed)].filter((w) => catalog.has(w));
    
    const saved = (Object.entries(savedVocab) as [string, { srs?: { nextReviewDate: number }; timestamp?: number }][]).filter(([w]) => catalog.has(w.toLowerCase()));
    const due = saved.filter(([, v]) => (v.srs?.nextReviewDate ?? 0) <= now).map(([w]) => w.toLowerCase());
    const review = due.length >= 4 ? due : [...due, ...saved.sort((a, b) => (a[1].timestamp ?? 0) - (b[1].timestamp ?? 0)).map(([w]) => w.toLowerCase()).filter((w) => !due.includes(w))];
    const known = [...new Set([...mistakes, ...saved.map(([w]) => w.toLowerCase())])];
    const single = known.filter((w) => !/\s/.test(w));
    const pools: Record<PracticeMode, string[]> = {
      mistakes, review, listening: known, speaking: single,
      translate: known, match: known, truefalse: known, scramble: single, spell: single,
    };

return pools;
}

import type { ReadingText } from './reading-logic';
import type { LessonUnlock } from './lessonProgress';
export type PracticeMode = 'mistakes' | 'review' | 'listening' | 'speaking' | 'translate' | 'match' | 'truefalse' | 'scramble' | 'spell';
export function practicePools(all: ReadingText[], savedVocab: Record<string, any>, problemWords: Record<string, { count: number }>, catalog: Map<string, unknown>, missedByLesson: Record<string, string[]>, now = Date.now(), progress: Record<string, LessonUnlock> = {}, lang?: string): Record<PracticeMode, string[]> {
  const normalize = (word: string) => word.trim().toLowerCase();
  const missed = [...Object.entries(problemWords).sort((a, b) => b[1].count - a[1].count).map(([word]) => word), ...all.flatMap(text => missedByLesson[text.id] || [])].map(normalize);
  const mistakes = [...new Set(missed)].filter(word => catalog.has(word));
  const saved = Object.entries(savedVocab).filter(([word, value]) => (!lang || !value.lang || value.lang === lang) && catalog.has(normalize(word)));
  const due = saved.filter(([, value]) => value.srs && value.srs.nextReviewDate <= now).sort((a, b) => (a[1].srs?.nextReviewDate ?? 0) - (b[1].srs?.nextReviewDate ?? 0)).map(([word]) => normalize(word));
  const learned = all.filter(text => {
    const record = progress[text.id];
    return record && (record.vocabPassed || record.readingBest != null || Object.keys(record.exerciseBest || {}).length || Object.keys(record.bites || {}).length);
  }).flatMap(text => (text.vocabulary || []).map(item => normalize(item.word))).filter(word => catalog.has(word));
  const known = [...new Set([...mistakes, ...saved.map(([word]) => normalize(word)), ...learned])];
  const review = [...new Set([...due, ...saved.sort((a, b) => (a[1].timestamp ?? 0) - (b[1].timestamp ?? 0)).map(([word]) => normalize(word)), ...learned])];
  const single = known.filter(word => !/\s/.test(word));
  return { mistakes, review, listening: known, speaking: known, translate: known, match: known, truefalse: known, scramble: single, spell: single };
}

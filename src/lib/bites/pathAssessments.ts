import type { ContentLang } from '../contentLang';
import type { LessonUnit } from '../lessonUnits';
import { readScopedJSON, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { type LessonBiteState, lessonBiteState } from './biteProgress';
import { ASSESSMENT_SCORES, mergeAssessmentScores } from './assessmentScores';
import { isV2, type V2Text } from '../lessons/v2';
import type { ReadingText } from '../reading-logic';

export const UNIT_PASS = 80;
type AssessmentKind = 'checkpoint' | 'exam';

const listeners = new Set<() => void>();
const readScores = () => readScopedJSON<Record<string, number>>(ASSESSMENT_SCORES, {});
export const isAuthoredAssessment = (text: ReadingText): text is V2Text => isV2(text) && (text.v2.type === 'review' || text.v2.type === 'test');

export function saveAssessment(lang: ContentLang, id: string, score: number) {
  writeScopedJSON(ASSESSMENT_SCORES, mergeAssessmentScores(readScores(), { [`${lang}:${id}`]: score }));
  listeners.forEach(fn => fn());
  window.dispatchEvent(new Event('smarty:lesson-progress'));
}

export function assessPath(lang: ContentLang, units: LessonUnit[], knownStates?: Map<string, LessonBiteState>, preview = false) {
  const scores = readScores();
  let previousPassed = true;
  return units.map(unit => {
    const states = unit.lessons.map(lesson => knownStates?.get(lesson.id) ?? lessonBiteState(lang, lesson));
    // Honor units learners had already started before exams were introduced.
    const open = preview || previousPassed || states.some(state => state.doneCount > 0);
    const taught = unit.lessons.flatMap((text, i) => isAuthoredAssessment(text) ? [] : [{ text, index: i }]);
    const authored = unit.lessons.filter(isAuthoredAssessment);
    const assessment = (kind: AssessmentKind, start: number, end: number, source?: V2Text) => {
      const included = taught.filter(lesson => lesson.index >= start && lesson.index < end);
      const lessons = included.map(lesson => lesson.text);
      const id = `${unit.id}:${kind}:${end}:${lessons[0]?.id ?? 'none'}:${source?.v2.id ?? lessons.at(-1)?.id ?? 'none'}`;
      const best = scores[`${lang}:${id}`] ?? null;
      return { id, kind, lessons, end, authored: source, best, passed: best !== null && best >= UNIT_PASS,
        ready: preview || open && included.every(lesson => states[lesson.index].complete) };
    };
    const checkpoints = [];
    const reviews = authored.filter(text => text.v2.type === 'review');
    if (reviews.length) {
      let start = 0;
      for (const review of reviews) {
        const end = unit.lessons.indexOf(review);
        if (taught.some(lesson => lesson.index >= start && lesson.index < end)) checkpoints.push(assessment('checkpoint', start, end, review));
        start = end + 1;
      }
    } else {
      for (let n = 3; n < taught.length; n += 3) checkpoints.push(assessment('checkpoint', taught[n - 3].index, taught[n - 1].index + 1));
    }
    const exam = assessment('exam', 0, (taught.at(-1)?.index ?? -1) + 1, authored.find(text => text.v2.type === 'test'));
    previousPassed = exam.passed;
    return { unit, states, open, checkpoints, exam };
  });
}

export type PathAssessment = ReturnType<typeof assessPath>[number]['exam'];

registerSyncedStore({
  key: ASSESSMENT_SCORES,
  snapshot: readScores,
  apply: raw => writeScopedJSON(ASSESSMENT_SCORES, mergeAssessmentScores(readScores(), raw)),
  subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn); }; },
});

import { expect, test } from 'vitest';
import type { Assignment } from '../src/firebase';
import { homeworkResult, isHomeworkRoute, needsMaxForHomework } from '../src/lib/classHomework';

const task = (type: Assignment['type'], fields: Partial<Assignment> = {}): Assignment =>
  ({ id: 'homework', type, title: 'Homework', classId: 'class', teacherUid: 'teacher', createdAt: 1, ...fields });

test('only the assigned activity can use homework access or submit a result', () => {
  const reading = task('reading', { passageId: 'b2' });
  expect(isHomeworkRoute(reading, 'reading', ['practice'])).toBe(true);
  expect(isHomeworkRoute(reading, 'reading', ['menu'])).toBe(false);
  expect(isHomeworkRoute(task('lesson', { lessonId: 'b2' }), 'lessons', ['bite', 'en', 'b3', '0'])).toBe(false);
  const done = { id: 'record', timestamp: 2, type: 'reading-pronunciation' as const, accuracy: 90 };
  expect(homeworkResult(reading, { ...done, data: { textId: 'b2', wordsRead: 0 } })).toBeUndefined();
  expect(homeworkResult(reading, { ...done, data: { textId: 'b1', wordsRead: 6 } })).toBeUndefined();
  expect(homeworkResult(reading, { ...done, data: { textId: 'b2', wordsRead: 6, mistakeWords: ['book'] } })).toEqual({ score: 90, accuracy: 90, wordsRead: 6, errors: ['book'] });
});

test('a selected comprehension assignment only accepts the expected passage, and AI scoring has an explicit entitlement', () => {
  const reading = task('comp-reading', { compReadingPassageTitle: 'My Cat' });
  const done = { id: 'record', timestamp: 2, type: 'comprehensive-reading' as const, accuracy: 80 };
  expect(homeworkResult(reading, { ...done, title: 'Other passage' })).toBeUndefined();
  expect(homeworkResult(reading, { ...done, title: 'My Cat' })).toEqual({ accuracy: 80, score: 80 });
  expect(needsMaxForHomework('reading')).toBe(false);
  expect(needsMaxForHomework('speaking')).toBe(true);
});

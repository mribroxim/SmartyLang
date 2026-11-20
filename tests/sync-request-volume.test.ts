import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../src/lib/selfHostedApi', () => ({ dataRequest: vi.fn(async () => null) }));
vi.mock('../src/firebase', () => ({ auth: { currentUser: { uid: 'reader' } } }));
import { dataRequest } from '../src/lib/selfHostedApi';
import { vocabularyChanges, syncVocabulary } from '../src/lib/vocabularySync';
import { loadLessonUnlock, updateLessonUnlock } from '../src/lib/lessonProgress';
import { scopedKey, setStorageUid } from '../src/lib/userStorage';

beforeEach(() => { vi.mocked(dataRequest).mockClear(); setStorageUid('reader'); });
afterEach(() => vi.restoreAllMocks());
const vocabulary = (count: number) => Object.fromEntries(Array.from({ length: count }, (_, index) => [`word${index}`, { definition: `Meaning ${index}`, timestamp: index, srs: { due: 100, interval: 1 } }]));

test('restoring 500 words with new identities and reordered JSON keys causes zero writes', async () => {
  const local = vocabulary(500);
  const remote = Object.fromEntries(Object.entries(local).map(([word, value]) => [word, { srs: { interval: 1, due: 100 }, timestamp: value.timestamp, definition: value.definition }]));
  const changes = vocabularyChanges(local, remote);
  expect(changes).toEqual({ upserts: [], deletes: [] });
  await syncVocabulary('reader', 'en', changes);
  expect(dataRequest).not.toHaveBeenCalled();
});

test('first upload of 500 words uses five sequential batches instead of 500 requests', async () => {
  await syncVocabulary('reader', 'en', vocabularyChanges({}, vocabulary(500)));
  expect(dataRequest).toHaveBeenCalledTimes(5);
  for (const [action, args] of vi.mocked(dataRequest).mock.calls) {
    expect(action).toBe('vocab.sync');
    expect(args).toMatchObject({ uid: 'reader', lang: 'en', deletes: [] });
    expect((args!.upserts as unknown[])).toHaveLength(100);
  }
});

test('real edits and deletions remain scoped to their account and learning language', async () => {
  const previous = vocabulary(3);
  const current: typeof previous = { ...previous, word1: { ...previous.word1, definition: 'Updated meaning' } };
  delete current.word2;
  await syncVocabulary('reader', 'uz', vocabularyChanges(previous, current));
  expect(dataRequest).toHaveBeenCalledTimes(2);
  expect(dataRequest).toHaveBeenNthCalledWith(1, 'vocab.sync', { uid: 'reader', lang: 'uz', upserts: [{ word: 'word1', data: current.word1 }], deletes: [] });
  expect(dataRequest).toHaveBeenNthCalledWith(2, 'vocab.sync', { uid: 'reader', lang: 'uz', upserts: [], deletes: ['word2'] });
});

test('large Unicode definitions are split below the server body limit', async () => {
  const words = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`word${index}`, { definition: '語'.repeat(5000) }]));
  await syncVocabulary('reader', 'ja', vocabularyChanges({}, words));
  expect(dataRequest).toHaveBeenCalledTimes(3);
  for (const [, args] of vi.mocked(dataRequest).mock.calls) expect(new TextEncoder().encode(JSON.stringify(args)).length).toBeLessThan(256 * 1024);
});

test('scanning 500 legacy lesson records normalizes locally without network writes', () => {
  for (let index = 0; index < 500; index++) {
    localStorage.setItem(scopedKey(`readmaster_lesson_unlock_en_lesson${index}`), JSON.stringify({ readingBest: 8000, exerciseBest: { cloze: 9000 } }));
    const result = loadLessonUnlock('en', `lesson${index}`);
    expect(result.readingBest).toBe(80);
    expect(result.exerciseBest.cloze).toBe(90);
  }
  expect(dataRequest).not.toHaveBeenCalled();
  expect(loadLessonUnlock('en', 'lesson0').readingBest).toBe(80);
});

test('finishing a lesson still saves progress to the server', () => {
  updateLessonUnlock('en', 'lesson1', { readingBest: 95 });
  expect(dataRequest).toHaveBeenCalledTimes(1);
  expect(dataRequest).toHaveBeenCalledWith('lesson.upsert', expect.objectContaining({ uid: 'reader', lang: 'en', passageId: 'lesson1', data: expect.objectContaining({ readingBest: 95 }) }));
});

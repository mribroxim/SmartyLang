import { describe, expect, it } from 'vitest';
import { challengeWinner, lowerLevel, pickChallengeWords } from '../src/lib/challenge';
import { mergeClassBoard, readLiveResults } from '../src/lib/classBoard';

const vocab = (words: string[]) => [{ vocabulary: words.map(word => ({ word, definition: `meaning of ${word}` })) }];

describe('challenge words', () => {
  it('uses the lower of the two levels and prefers learned words', () => {
    const textsByLevel = { Beginner: vocab(['cat', 'dog', 'sun', 'moon', 'star', 'tree']), Advanced: vocab(['ubiquitous', 'ephemeral']) };
    expect(lowerLevel('Advanced', 'Beginner')).toBe('Beginner');
    const words = pickChallengeWords({ myLevel: 'Advanced', friendLevel: 'Beginner', textsByLevel, learned: { star: { definition: 'x' }, tree: { definition: 'y' } }, count: 4, rand: () => 0.5 });
    expect(words).toHaveLength(4);
    expect(words.map(w => w.word)).toEqual(expect.arrayContaining(['star', 'tree']));
    expect(words.some(w => w.word === 'ubiquitous')).toBe(false);
  });
  it('keeps spelling words to single letters-only words and de-duplicates', () => {
    const textsByLevel = { Beginner: vocab(['ice cream', 'Cat', 'cat', 'dog', 'sun', 'moon']) };
    const words = pickChallengeWords({ myLevel: 'Beginner', friendLevel: 'Beginner', textsByLevel, learned: {}, spelling: true });
    expect(words.map(w => w.word.toLowerCase()).sort()).toEqual(['cat', 'dog', 'moon', 'sun']);
  });
});

describe('challenge result', () => {
  it('scores higher points first, then speed', () => {
    expect(challengeWinner({ score: 500, ms: 9000 }, { score: 400, ms: 1000 })).toBe('a');
    expect(challengeWinner({ score: 400, ms: 9000 }, { score: 400, ms: 8000 })).toBe('b');
    expect(challengeWinner({ score: 400, ms: 8000 }, { score: 400, ms: 8000 })).toBe('tie');
  });
});

describe('class board', () => {
  const rows = [
    { uid: 'a', displayName: 'Ann', homeworkDone: 2, accuracy: 90, points: 38 },
    { uid: 'b', displayName: 'Ben', homeworkDone: 1, accuracy: 80, points: 18 },
  ];
  it('ranks by homework alone when live results are missing', () => {
    expect(mergeClassBoard(rows, null).map(r => r.uid)).toEqual(['a', 'b']);
  });
  it('adds live-game points from a tolerant payload', () => {
    const live = readLiveResults({ players: [{ uid: 'b', points: 5000, games: 2 }] });
    const merged = mergeClassBoard(rows, live);
    expect(merged[0]).toMatchObject({ uid: 'b', livePoints: 50, liveGames: 2, total: 68 });
  });
});

/** Shared by the Challenge UI and the /api/challenges server code. */
export const CHALLENGE_MODES = ['quiz', 'spelling', 'match'] as const;
export type ChallengeMode = typeof CHALLENGE_MODES[number];
export const CHALLENGE_LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'] as const;
export type ChallengeLevel = typeof CHALLENGE_LEVELS[number];
export type ChallengeWord = { word: string; meaning: string };
export type ChallengeScore = { score: number; correct: number; ms: number };
export const CHALLENGE_WORDS = 8;

export const lowerLevel = (a: string, b: string): ChallengeLevel => {
  const rank = (level: string) => Math.max(0, CHALLENGE_LEVELS.indexOf(level as ChallengeLevel));
  return CHALLENGE_LEVELS[Math.min(rank(a), rank(b))];
};

/** Win = more points; ties go to the faster player. */
export function challengeWinner(a: { score: number; ms: number }, b: { score: number; ms: number }): 'a' | 'b' | 'tie' {
  if (a.score !== b.score) return a.score > b.score ? 'a' : 'b';
  if (a.ms !== b.ms) return a.ms < b.ms ? 'a' : 'b';
  return 'tie';
}

function shuffled<T>(items: T[], rand: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

/**
 * Vocabulary suited to both players: the lower of the two levels, preferring words the
 * challenger has already learned, then the rest of that level's reading vocabulary.
 */
export function pickChallengeWords(opts: {
  myLevel: string; friendLevel: string;
  textsByLevel: Partial<Record<string, { vocabulary?: { word: string; definition: string }[] }[]>>;
  learned: Record<string, { definition?: string }>;
  count?: number; rand?: () => number; spelling?: boolean;
}): ChallengeWord[] {
  const { textsByLevel, learned, count = CHALLENGE_WORDS, rand = Math.random, spelling = false } = opts;
  const level = lowerLevel(opts.myLevel, opts.friendLevel);
  const fits = (word: string, meaning: string) => !!word && !!meaning && word.length <= 18 && meaning.length <= 110 && (!spelling || /^[\p{L}'-]+$/u.test(word));
  const learnedKeys = new Set(Object.keys(learned).map(word => word.trim().toLowerCase()));
  const seen = new Set<string>();
  const levelPool: ChallengeWord[] = [];
  for (const text of textsByLevel[level] || []) for (const item of text.vocabulary || []) {
    const word = (item.word || '').trim(), meaning = (item.definition || '').trim(), key = word.toLowerCase();
    if (!fits(word, meaning) || seen.has(key)) continue;
    seen.add(key);
    levelPool.push({ word, meaning });
  }
  const known = shuffled(levelPool.filter(item => learnedKeys.has(item.word.toLowerCase())), rand);
  const rest = shuffled(levelPool.filter(item => !learnedKeys.has(item.word.toLowerCase())), rand);
  let picked = [...known, ...rest].slice(0, count);
  if (picked.length < 4) { // thin level data: top up from the challenger's own saved words
    for (const [word, value] of Object.entries(learned)) {
      const clean = word.trim(), meaning = (value.definition || '').trim();
      if (!fits(clean, meaning) || seen.has(clean.toLowerCase())) continue;
      seen.add(clean.toLowerCase());
      picked.push({ word: clean, meaning });
      if (picked.length >= count) break;
    }
  }
  return picked;
}

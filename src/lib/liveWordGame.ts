/**
 * Shared (client + server) rules for live word games.
 * Everything that decides points, box twists, rope position and who is still
 * standing is a pure function here so it can be unit-tested and so the host
 * screen, the phones and the server never disagree.
 */
export const ROUND_SECONDS = 20;
export const MIN_GAME_WORDS = 4;
export const MAX_GAME_WORDS = 12;
export const MAX_GAME_PLAYERS = 60;
/** "3 – 2 – 1" before every question. */
export const COUNTDOWN_MS = 3000;
export const MATCH_PAIRS = 4;
export const TUG_LIMIT = 30;

export type GameWord = { word: string; meaning: string };
export type GameTeam = 'gold' | 'purple';
export const TEAM_IDS: GameTeam[] = ['gold', 'purple'];

export type GameKind = 'quiz' | 'mystery' | 'match' | 'spelling' | 'listen' | 'tf' | 'scramble' | 'tug' | 'elimination';
/** `solo` and `teams` are the original two modes (both are the quiz race). */
export type GameMode = GameKind | 'solo' | 'teams';
/** `standings` is the leaderboard shown between the answer reveal and the next question. */
export type GamePhase = 'lobby' | 'pick' | 'question' | 'reveal' | 'standings' | 'finished';
/** Seconds the between-games results stay up before the next game starts on its own. */
export const NEXT_GAME_SECONDS = 12;
export const STANDINGS_TOP = 5;
export type QuestionType = 'choice' | 'type' | 'match';
export type BoxTwist = 'plain' | 'big' | 'double' | 'steal' | 'lose' | 'bomb' | 'swap';

export const GAME_KINDS: Record<GameKind, { teams: 'optional' | 'always' | 'never'; seconds: number; question: QuestionType }> = {
  quiz: { teams: 'optional', seconds: 20, question: 'choice' },
  mystery: { teams: 'always', seconds: 25, question: 'choice' },
  match: { teams: 'optional', seconds: 60, question: 'match' },
  spelling: { teams: 'optional', seconds: 30, question: 'type' },
  listen: { teams: 'optional', seconds: 15, question: 'choice' },
  tf: { teams: 'optional', seconds: 8, question: 'choice' },
  scramble: { teams: 'optional', seconds: 30, question: 'type' },
  tug: { teams: 'always', seconds: 15, question: 'choice' },
  elimination: { teams: 'never', seconds: 15, question: 'choice' },
};
export const GAME_KIND_IDS = Object.keys(GAME_KINDS) as GameKind[];
export const FRIEND_GAME_KINDS = ['quiz', 'tf', 'scramble'] as const;
export type FriendGameKind = typeof FRIEND_GAME_KINDS[number];
export const FRIEND_GAME_LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'] as const;

export type FriendGame = {
  code: string;
  mode: FriendGameKind;
  phase: GamePhase;
  name: string;
  incoming: boolean;
  joined: boolean;
  ready?: boolean;
  level?: string;
};

/** Original rooms stored `solo` / `teams`; map them (and new kinds) to kind + teams. */
export function resolveMode(mode: unknown, teams?: unknown): { kind: GameKind; teams: boolean } | null {
  if (mode === 'solo') return { kind: 'quiz', teams: false };
  if (mode === 'teams') return { kind: 'quiz', teams: true };
  if (typeof mode !== 'string' || !(mode in GAME_KINDS)) return null;
  const kind = mode as GameKind;
  const rule = GAME_KINDS[kind].teams;
  return { kind, teams: rule === 'always' ? true : rule === 'never' ? false : teams === true };
}

export type TeacherGame = {
  code: string;
  /** Always a `GameKind` from the server; typed wide so older callers comparing with 'teams' still compile. */
  mode: GameMode;
  phase: GamePhase;
  playerCount: number;
  round: number;
  rounds: number;
};

export type PublicQuestion = {
  type: QuestionType;
  seconds: number;
  /** Word shown for quiz / true-false, scrambled letters for scramble. */
  prompt?: string;
  /** Meaning shown with true/false statements, or as a hint for typing modes. */
  statement?: string;
  hint?: string;
  tf?: boolean;
  speak?: string;
  options?: string[];
  length?: number;
  pairs?: { left: string[]; right: string[]; key: number[] };
};

export type BoxView = { n: number; taken: boolean; twist?: BoxTwist };
export type LiveGameView = {
  code: string;
  mode: GameKind;
  teamPlay: boolean;
  host: boolean;
  friendMatch?: { opponent: string };
  phase: GamePhase;
  round: number;
  rounds: number;
  serverTime: number;
  /** When the question appears (end of the 3-2-1). */
  startsAt: number | null;
  deadline: number | null;
  nextRoundAt?: number;
  willFinish?: boolean;
  question?: PublicQuestion;
  selected?: number | string;
  correct?: number;
  correctText?: string;
  answered: number;
  active: number;
  hostSpeaks: boolean;
  players: {
    /** Stable seat number, so the screens can animate a player moving up or down. */
    id: number; name: string; team?: GameTeam; you: boolean; score?: number; streak?: number; alive?: boolean; gained?: number;
    /** 1-based place now and before this round (standings only). */
    rank?: number; prevRank?: number;
  }[];
  teams: { id: GameTeam; players: number; points: number }[];
  me?: {
    score: number; streak: number; gained: number; correct: boolean | null; rank: number; alive: boolean; prevRank?: number;
    /** The player one place above you and how far ahead they are. */
    above?: { name: string; points: number };
    /** The player right behind you and your lead over them. */
    below?: { name: string; points: number };
  };
  /** Several games in a row: which one this is, what comes next and when it starts by itself. */
  playlist?: { index: number; total: number; kinds: GameKind[]; next?: GameKind; nextAt?: number };
  /** Combined points over the finished games (shown between games and at the very end). */
  overall?: { id: number; name: string; score: number; you: boolean; rank: number }[];
  tug?: { position: number; limit: number };
  mystery?: {
    boxes: BoxView[];
    turn: GameTeam;
    picker: string;
    youPick: boolean;
    youAnswer: boolean;
    box?: number;
    twist?: BoxTwist;
    effect?: string;
    scores: Record<GameTeam, number>;
  };
};

/* ---------- text helpers ---------- */

export const squash = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\s\-'’.,!?]/g, '');
export const sameWord = (a: string, b: string) => !!squash(a) && squash(a) === squash(b);

/** Scramble a word's letters so the result never equals the word (unless that is impossible). */
export function scrambleWord(word: string, rand: () => number = Math.random): string {
  const letters = [...word.normalize('NFKC').replace(/\s+/g, '').toUpperCase()];
  if (new Set(letters).size < 2) return letters.join('');
  for (let attempt = 0; attempt < 20; attempt++) {
    const copy = [...letters];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.join('') !== letters.join('')) return copy.join('');
  }
  return [...letters].reverse().join('');
}

/* ---------- scoring ---------- */

export type ScoringRound = {
  type: QuestionType;
  correct: number;
  answer?: string;
  seconds: number;
  pairs?: number;
};

export function isCorrect(round: ScoringRound, answer: number | string | null | undefined): boolean {
  if (answer == null) return false;
  if (round.type === 'choice') return answer === round.correct;
  if (round.type === 'type') return typeof answer === 'string' && sameWord(answer, round.answer ?? '');
  const [matched] = parseMatch(answer);
  return matched >= (round.pairs ?? MATCH_PAIRS);
}

export const encodeMatch = (matched: number, mistakes: number) => `${matched}|${mistakes}`;
export function parseMatch(answer: number | string): [number, number] {
  const [m, x] = String(answer).split('|').map(Number);
  return [Number.isFinite(m) ? m : 0, Number.isFinite(x) ? x : 0];
}

/** Kahoot-style: 600 for being right, up to 400 for being fast, +50 per streak step (max 5). */
export function pointsFor(opts: { correct: boolean; ms: number; seconds: number; streak: number }): number {
  if (!opts.correct) return 0;
  const left = 1 - Math.min(Math.max(opts.ms, 0), opts.seconds * 1000) / (opts.seconds * 1000);
  return 600 + Math.round(400 * left) + Math.min(Math.max(opts.streak, 0), 5) * 50;
}

export function matchPoints(opts: { matched: number; mistakes: number; ms: number; seconds: number; pairs: number }): number {
  const base = Math.max(0, opts.matched * 150 - opts.mistakes * 50);
  if (opts.matched < opts.pairs) return base;
  const left = 1 - Math.min(Math.max(opts.ms, 0), opts.seconds * 1000) / (opts.seconds * 1000);
  return base + Math.round(300 * left);
}

export type StandingPlayer = { answers: (number | string | null | undefined)[]; times: (number | null | undefined)[] };
export type Standing = { score: number; streak: number; gained: number; correct: boolean | null; alive: boolean };

/**
 * Totals after rounds 0..upTo. `eliminate` removes players the first time they miss
 * (unless everybody missed, in which case nobody is out).
 */
export function computeStandings(rounds: ScoringRound[], players: StandingPlayer[], upTo: number, eliminate = false): Standing[] {
  const state: Standing[] = players.map(() => ({ score: 0, streak: 0, gained: 0, correct: null, alive: true }));
  const last = Math.min(upTo, rounds.length - 1);
  for (let r = 0; r <= last; r++) {
    const round = rounds[r];
    const hits = players.map((p, i) => state[i].alive && isCorrect(round, p.answers[r]));
    const anyoneHit = hits.some(Boolean);
    players.forEach((p, i) => {
      const s = state[i];
      if (!s.alive) { s.gained = 0; s.correct = null; return; }
      const ms = p.times[r] ?? round.seconds * 1000;
      const hit = hits[i];
      let gained = 0;
      if (round.type === 'match' && p.answers[r] != null) {
        const [matched, mistakes] = parseMatch(p.answers[r] as string);
        gained = matchPoints({ matched, mistakes, ms, seconds: round.seconds, pairs: round.pairs ?? MATCH_PAIRS });
      } else gained = pointsFor({ correct: hit, ms, seconds: round.seconds, streak: s.streak });
      s.score += gained;
      s.gained = gained;
      s.correct = hit;
      s.streak = hit ? s.streak + 1 : 0;
      if (eliminate && !hit && anyoneHit) s.alive = false;
    });
  }
  return state;
}

export const aliveCount = (standings: Standing[]) => standings.filter(s => s.alive).length;

/* ---------- team tug of war ---------- */

/** Each team pulls with its share of correct answers (0..10) per round; positive = gold side. */
export function tugPull(correct: number, teamSize: number): number {
  return teamSize <= 0 ? 0 : Math.round(Math.min(correct, teamSize) * 10 / teamSize);
}
export function tugPosition(pulls: Record<GameTeam, number>[], limit = TUG_LIMIT): number {
  let position = 0;
  for (const pull of pulls) {
    position = Math.max(-limit, Math.min(limit, position + pull.gold - pull.purple));
    if (Math.abs(position) >= limit) break;
  }
  return position;
}
export const tugWon = (position: number, limit = TUG_LIMIT): GameTeam | null =>
  position >= limit ? 'gold' : position <= -limit ? 'purple' : null;

/* ---------- mystery boxes ---------- */

export const BOX_POINTS = { plain: 100, big: 300, lose: 150 } as const;
export const GOOD_TWISTS: BoxTwist[] = ['plain', 'big', 'double', 'steal'];

/** Distribute twists over `count` boxes: mostly points, a few surprises. */
export function buildBoxes(count: number, rand: () => number = Math.random): BoxTwist[] {
  // At least 40% plain boxes; surprises are added in order of importance.
  const specials = (['steal', 'bomb', 'double', 'lose', 'big', 'swap', 'steal', 'big'] as BoxTwist[]).slice(0, Math.floor(count * 0.6));
  const boxes: BoxTwist[] = [...specials];
  while (boxes.length < count) boxes.push('plain');
  boxes.length = count;
  for (let i = boxes.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
  }
  return boxes;
}

export type TwistOutcome = { scores: Record<GameTeam, number>; effect: string };
const other = (team: GameTeam): GameTeam => (team === 'gold' ? 'purple' : 'gold');

/**
 * Good boxes only pay out when the team answered correctly.
 * Traps (lose, bomb, swap) hit whether or not the answer was right, so every pick is a risk.
 */
export function applyTwist(scores: Record<GameTeam, number>, team: GameTeam, twist: BoxTwist, correct: boolean): TwistOutcome {
  const next = { ...scores };
  const foe = other(team);
  switch (twist) {
    case 'lose':
      next[team] = Math.max(0, next[team] - BOX_POINTS.lose);
      return { scores: next, effect: 'lose' };
    case 'bomb':
      next[team] = Math.floor(next[team] / 2);
      return { scores: next, effect: 'bomb' };
    case 'swap':
      return { scores: { gold: next.purple, purple: next.gold } as Record<GameTeam, number>, effect: 'swap' };
    default:
  }
  if (!correct) return { scores: next, effect: 'miss' };
  if (twist === 'big') next[team] += BOX_POINTS.big;
  else if (twist === 'double') next[team] = Math.max(next[team] * 2, next[team] + BOX_POINTS.plain);
  else if (twist === 'steal') {
    const taken = Math.min(BOX_POINTS.plain, next[foe]);
    next[foe] -= taken;
    next[team] += BOX_POINTS.plain + taken;
  } else next[team] += BOX_POINTS.plain;
  return { scores: next, effect: twist };
}

export type MysteryTurn = { team: GameTeam; twist: BoxTwist; correct: boolean };
export function mysteryScores(turns: MysteryTurn[]): { scores: Record<GameTeam, number>; effects: string[] } {
  let scores: Record<GameTeam, number> = { gold: 0, purple: 0 };
  const effects: string[] = [];
  for (const turn of turns) {
    const result = applyTwist(scores, turn.team, turn.twist, turn.correct);
    scores = result.scores;
    effects.push(result.effect);
  }
  return { scores, effects };
}

/** Teams alternate; inside a team the pickers rotate. Returns the index into `members`. */
export const mysteryTeamForTurn = (turn: number): GameTeam => TEAM_IDS[turn % 2];
export const mysteryPickerIndex = (turn: number, memberCount: number) => memberCount ? Math.floor(turn / 2) % memberCount : 0;

/** A game a teacher prepared ahead of time (the "My games" library). */
export type GameKit = {
  id: string;
  title: string;
  mode: GameKind;
  /** Playlist: games played one after another with the same words. Older kits only have `mode`. */
  modes?: GameKind[];
  teams: boolean;
  hostSpeaks: boolean;
  words: GameWord[];
  color: string;
  emoji: string;
  updatedAt?: number;
};
export const KIT_COLORS = ['rose', 'violet', 'sky', 'amber', 'teal', 'emerald', 'fuchsia', 'orange'] as const;
export const kitModes = (kit: { mode: GameKind; modes?: GameKind[] }): GameKind[] => kit.modes?.length ? kit.modes : [kit.mode];

/* ---------- building the word set (Term | Definition rows) ---------- */

export type WordIssue = 'few' | 'many' | 'half' | 'dupWord' | 'dupMeaning' | 'long';
export type WordCheck = { words: GameWord[]; issues: WordIssue[]; badRows: number[] };

/** Rows with both fields filled are words, rows with neither are ignored, rows with one are a mistake. */
export function checkWordRows(rows: { term: string; def: string }[]): WordCheck {
  const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
  const words: GameWord[] = [];
  const bad = new Set<number>();
  const issues = new Set<WordIssue>();
  const seenWord = new Map<string, number>();
  const seenMeaning = new Map<string, number>();
  rows.forEach((row, index) => {
    const word = clean(row.term), meaning = clean(row.def);
    if (!word && !meaning) return;
    if (!word || !meaning) { bad.add(index); issues.add('half'); return; }
    if (word.length > 100 || meaning.length > 200) { bad.add(index); issues.add('long'); return; }
    const wordKey = word.normalize('NFKC').toLowerCase(), meaningKey = meaning.normalize('NFKC').toLowerCase();
    if (seenWord.has(wordKey)) { bad.add(index); issues.add('dupWord'); }
    if (seenMeaning.has(meaningKey)) { bad.add(index); issues.add('dupMeaning'); }
    seenWord.set(wordKey, index); seenMeaning.set(meaningKey, index);
    words.push({ word, meaning });
  });
  if (words.length < MIN_GAME_WORDS) issues.add('few');
  if (words.length > MAX_GAME_WORDS) issues.add('many');
  return { words, issues: [...issues], badRows: [...bad] };
}

/**
 * Parse pasted lines into pairs. Separator, first match wins: tab, colon, then a dash
 * (" - ", en or em dash). Lines without a separator are counted in `skipped`.
 */
export function parseImportText(text: string): { words: GameWord[]; skipped: number } {
  const words: GameWord[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let parts: [string, string] | null = null;
    const tab = line.indexOf('\t');
    if (tab > 0) parts = [line.slice(0, tab), line.slice(tab + 1)];
    else {
      const match = /^(.+?)\s*(?::|\s[-–—]\s|[–—])\s*(.+)$/.exec(line);
      if (match) parts = [match[1], match[2]];
    }
    const term = parts?.[0].trim(), def = parts?.[1].replace(/\t+/g, ' ').trim();
    if (term && def) words.push({ word: term, meaning: def }); else skipped++;
  }
  return { words, skipped };
}

/** Standard 1-based places for a list sorted best-first: a tie shares the place. */
export function sharedRanks(scores: number[]): number[] {
  return scores.map((score, index) => (index > 0 && score === scores[index - 1] ? 0 : index + 1)).reduce<number[]>((acc, rank, index) => {
    acc.push(rank || acc[index - 1]);
    return acc;
  }, []);
}

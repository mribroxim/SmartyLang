import { randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Express, Request, RequestHandler, Response } from 'express';
import { requireRole, requireUser, type AuthUser } from './auth.ts';
import { query, withTransaction } from './db.ts';
import { rateLimit } from './security.ts';
import {
  COUNTDOWN_MS, GAME_KIND_IDS, FRIEND_GAME_KINDS, NEXT_GAME_SECONDS, FRIEND_GAME_LEVELS, GAME_KINDS, KIT_COLORS, MATCH_PAIRS, MAX_GAME_PLAYERS, MAX_GAME_WORDS, MIN_GAME_WORDS, TEAM_IDS, TUG_LIMIT,
  aliveCount, buildBoxes, computeStandings, encodeMatch, isCorrect, mysteryPickerIndex, mysteryScores, mysteryTeamForTurn,
  resolveMode, scrambleWord, tugPosition, tugPull, tugWon, squash,
  type BoxTwist, type FriendGame, type FriendGameKind, type GameKind, type GameKit, type GameMode, type GamePhase, type GameTeam, type GameWord, type LiveGameView,
  type MysteryTurn, type PublicQuestion, type QuestionType, type ScoringRound, type TeacherGame,
} from '../src/lib/liveWordGame.ts';
import { isContentLang } from '../src/lib/contentLang.ts';

export type Round = {
  type: QuestionType;
  correct: number;
  answer?: string;
  seconds: number;
  prompt?: string;
  statement?: string;
  hint?: string;
  tf?: boolean;
  speak?: string;
  options?: string[];
  length?: number;
  pairs?: { left: string[]; right: string[]; key: number[] };
};
export type ResultRow = { uid: string; name: string; team?: GameTeam; score: number; rank: number };
export type PlayedGame = { kind: GameKind; teams: boolean; finishedAt: number; rows: ResultRow[] };
type Player = { uid: string; name: string; team?: GameTeam; answers: (number | string | null)[]; times?: (number | null)[] };
export type Game = {
  /** Original rooms stored `solo` / `teams`; new ones store the game kind. */
  mode: GameMode;
  teams?: boolean;
  hostSpeaks?: boolean;
  phase: 'lobby' | 'pick' | 'question' | 'finished';
  round: number;
  startsAt?: number | null;
  deadline: number | null;
  revealedAt?: number;
  /** Last round counted in the final scores when the host ended the game early. */
  upTo?: number;
  rounds: Round[];
  players: Player[];
  invitedName?: string;
  friendLang?: string;
  friendLevel?: string;
  boxes?: BoxTwist[];
  /** Mystery boxes: the box index picked on each turn. */
  turns?: number[];
  /** Playlist: every game of the room (same words, same players), and which one is on now. */
  playlist?: GameKind[];
  playlistIndex?: number;
  words?: GameWord[];
  /** What the teacher asked for; each game resolves its own team rule from it. */
  teamsPref?: boolean;
  /** Leaderboard between the reveal and the next question (set by the host). */
  showStandings?: boolean;
  finishedAt?: number;
  /** Final scores of the games already played in this room. */
  results?: PlayedGame[];
};
export type Room = { code: string; class_id: string | null; host_uid: string; opponent_uid?: string | null; game: Game };
const roomColumns = 'code, class_id, host_uid, opponent_uid, game';

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
const codeOf = (value: unknown) => {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-F0-9]{6}$/.test(code)) throw fail('Enter the six-character room code.');
  return code;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const rand = () => randomInt(1_000_000) / 1_000_000;

export const kindOf = (game: Game): GameKind => resolveMode(game.mode, game.teams)?.kind ?? 'quiz';
export const teamPlayOf = (game: Game): boolean => resolveMode(game.mode, game.teams)?.teams ?? false;
const timesOf = (player: Player) => player.times ?? [];
const nextFriendRoundAt = (game: Game, now: number) => (game.revealedAt ?? game.deadline ?? now) + 2800;

export function parseWords(input: unknown): GameWord[] {
  if (!Array.isArray(input) || input.length < MIN_GAME_WORDS || input.length > MAX_GAME_WORDS) {
    throw fail(`Choose ${MIN_GAME_WORDS}–${MAX_GAME_WORDS} words and their meanings.`);
  }
  const words: GameWord[] = input.map(item => {
    const word = typeof item?.word === 'string' ? item.word.replace(/\s+/g, ' ').trim() : '';
    const meaning = typeof item?.meaning === 'string' ? item.meaning.replace(/\s+/g, ' ').trim() : '';
    if (!word || !meaning || word.length > 100 || meaning.length > 200) throw fail('Use a short word and meaning on each line.');
    return { word, meaning };
  });
  const unique = (key: 'word' | 'meaning') => new Set(words.map(item => item[key].normalize('NFKC').toLowerCase())).size;
  if (unique('word') !== words.length || unique('meaning') !== words.length) throw fail('Give each word a different meaning.');
  return words;
}

/** One game or a playlist: `modes` (new) or `mode` (older clients / kits). Exported for tests. */
export function parseModes(body: Record<string, unknown>): GameKind[] {
  const raw = Array.isArray(body.modes) ? body.modes : [body.mode];
  if (raw.length > GAME_KIND_IDS.length) throw fail('Choose up to ' + GAME_KIND_IDS.length + ' games.');
  const kinds: GameKind[] = [];
  for (const item of raw) {
    const resolved = resolveMode(item, body.teams);
    if (!resolved) throw fail('Choose at least one game.');
    if (!kinds.includes(resolved.kind)) kinds.push(resolved.kind);
  }
  if (!kinds.length) throw fail('Choose at least one game.');
  return kinds;
}

/** Build the questions for a game kind. Exported for tests. */
export function makeRounds(kind: GameKind, words: GameWord[]): Round[] {
  const seconds = GAME_KINDS[kind].seconds;
  const meaningChoice = (item: GameWord): Round => {
    const distractors = shuffle(words.filter(w => w.word !== item.word).map(w => w.meaning)).slice(0, 3);
    const options = shuffle([item.meaning, ...distractors]);
    return { type: 'choice', prompt: item.word, options, correct: options.indexOf(item.meaning), seconds };
  };
  switch (kind) {
    case 'listen':
      return shuffle(words).map(item => {
        const options = shuffle([item.word, ...shuffle(words.filter(w => w.word !== item.word).map(w => w.word)).slice(0, 3)]);
        return { type: 'choice', speak: item.word, options, correct: options.indexOf(item.word), seconds };
      });
    case 'tf': {
      const items = shuffle(words);
      return shuffle(items.map((item, i) => {
        const truth = i % 2 === 0;
        const wrong = items[(i + 1 + randomInt(items.length - 1)) % items.length];
        return { type: 'choice' as const, tf: true, prompt: item.word, statement: truth ? item.meaning : wrong.meaning,
          options: ['true', 'false'], correct: truth ? 0 : 1, seconds };
      }));
    }
    case 'scramble':
      return shuffle(words).map(item => ({ type: 'type', prompt: scrambleWord(item.word, rand), hint: item.meaning,
        answer: item.word, length: squash(item.word).length, correct: -1, seconds }));
    case 'spelling':
      return shuffle(words).map(item => ({ type: 'type', speak: item.word, hint: item.meaning,
        answer: item.word, length: squash(item.word).length, correct: -1, seconds }));
    case 'match': {
      const pool = shuffle(words);
      const groups: GameWord[][] = [];
      for (let i = 0; i < pool.length; i += MATCH_PAIRS) groups.push(pool.slice(i, i + MATCH_PAIRS));
      const lastGroup = groups[groups.length - 1];
      for (const extra of shuffle(pool)) {
        if (lastGroup.length >= MATCH_PAIRS) break;
        if (!lastGroup.includes(extra)) lastGroup.push(extra);
      }
      return groups.map(group => {
        const order = shuffle(group.map((_, i) => i));
        return { type: 'match' as const, correct: -1, seconds,
          pairs: { left: group.map(g => g.word), right: order.map(i => group[i].meaning), key: group.map((_, i) => order.indexOf(i)) } };
      });
    }
    case 'mystery': {
      const base = shuffle(words).map(meaningChoice);
      const total = Math.min(MAX_GAME_WORDS, Math.max(base.length, 8));
      const extra = shuffle(words).slice(0, total - base.length).map(meaningChoice);
      return [...base, ...extra];
    }
    default:
      return shuffle(words).map(meaningChoice);
  }
}

const toScoring = (round: Round): ScoringRound => ({
  type: round.type, correct: round.correct, answer: round.answer, seconds: round.seconds, pairs: round.pairs?.left.length,
});

/** The question played on a given round (mystery boxes map turn -> picked box). */
const roundAt = (game: Game, index: number): Round | undefined =>
  kindOf(game) === 'mystery' ? (game.turns?.[index] == null ? undefined : game.rounds[game.turns[index]]) : game.rounds[index];

const teamMembers = (game: Game, team: GameTeam) => game.players.filter(player => player.team === team);
const standingsAt = (game: Game, upTo: number) =>
  computeStandings(game.rounds.map(toScoring), game.players.map(p => ({ answers: p.answers, times: timesOf(p) })), upTo, kindOf(game) === 'elimination');

function mysteryTurns(game: Game, upTo: number): MysteryTurn[] {
  const turns: MysteryTurn[] = [];
  for (let i = 0; i <= upTo && i < (game.turns?.length ?? 0); i++) {
    const team = mysteryTeamForTurn(i);
    const round = roundAt(game, i)!;
    const answered = teamMembers(game, team).map(p => p.answers[i]).find(answer => answer != null);
    turns.push({ team, twist: game.boxes![game.turns![i]], correct: isCorrect(toScoring(round), answered) });
  }
  return turns;
}

/** Which players still have to answer this round before it can end early. */
function activeUids(game: Game): string[] {
  const kind = kindOf(game);
  if (kind === 'elimination') {
    const standings = standingsAt(game, game.round - 1);
    return game.players.filter((_, i) => standings[i].alive).map(p => p.uid);
  }
  if (kind === 'mystery') return teamMembers(game, mysteryTeamForTurn(Math.max(game.round, 0))).map(p => p.uid);
  return game.players.map(p => p.uid);
}

function phaseAt(game: Game, now: number): GamePhase {
  if (game.phase !== 'question') return game.phase;
  const revealed: GamePhase = game.showStandings ? 'standings' : 'reveal';
  if (now >= game.deadline!) return revealed;
  const active = new Set(activeUids(game));
  const entrants = game.players.filter(p => active.has(p.uid));
  if (!entrants.length) return revealed;
  const done = kindOf(game) === 'mystery'
    ? entrants.some(p => p.answers[game.round] != null)
    : entrants.every(p => p.answers[game.round] != null);
  return done ? revealed : 'question';
}

/** Rows for the final results of the game that just ended (players sorted best first). */
export function finalRows(game: Game, upTo: number): ResultRow[] {
  const mystery = kindOf(game) === 'mystery';
  const mysteryTotals = mystery ? mysteryScores(mysteryTurns(game, upTo)).scores : undefined;
  const standings = mystery ? [] : standingsAt(game, upTo);
  const rows = game.players.map((player, index) => ({
    uid: player.uid, name: player.name, team: player.team,
    score: mystery ? (player.team ? mysteryTotals![player.team] : 0) : standings[index].score, rank: 0,
  }));
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((row, index) => { row.rank = index > 0 && row.score === rows[index - 1].score ? rows[index - 1].rank : index + 1; });
  return rows;
}

const nextKind = (game: Game): GameKind | undefined => game.playlist?.[(game.playlistIndex ?? 0) + 1];

/** Combined points over every finished game, best first. */
export function overallTotals(results: PlayedGame[]): { uid: string; name: string; score: number }[] {
  const totals = new Map<string, { uid: string; name: string; score: number }>();
  for (const played of results) for (const row of played.rows) {
    const entry = totals.get(row.uid) ?? { uid: row.uid, name: row.name, score: 0 };
    entry.score += row.score;
    totals.set(row.uid, entry);
  }
  return [...totals.values()].sort((a, b) => b.score - a.score);
}

function publicQuestion(round: Round): PublicQuestion {
  const { type, seconds, prompt, statement, hint, tf, speak, options, length, pairs } = round;
  return { type, seconds, prompt, statement, hint, tf, speak, options, length, pairs };
}

function tugPulls(game: Game, upTo: number) {
  const sizes = { gold: teamMembers(game, 'gold').length, purple: teamMembers(game, 'purple').length };
  const pulls: Record<GameTeam, number>[] = [];
  for (let r = 0; r <= Math.min(upTo, game.rounds.length - 1); r++) {
    const round = toScoring(game.rounds[r]);
    const pull = { gold: 0, purple: 0 } as Record<GameTeam, number>;
    for (const team of TEAM_IDS) {
      pull[team] = tugPull(teamMembers(game, team).filter(p => isCorrect(round, p.answers[r])).length, sizes[team]);
    }
    pulls.push(pull);
  }
  return pulls;
}

function finishesAfterRound(game: Game): boolean {
  const kind = kindOf(game);
  if (kind === 'mystery') return (game.turns?.length ?? 0) >= (game.boxes?.length ?? game.rounds.length);
  return game.round + 1 >= game.rounds.length ||
    (kind === 'elimination' && game.players.length > 1 && aliveCount(standingsAt(game, game.round)) <= 1) ||
    (kind === 'tug' && tugWon(tugPosition(tugPulls(game, game.round))) !== null);
}

export function view(room: Room, uid: string, now = Date.now()): LiveGameView {
  const { game } = room;
  const kind = kindOf(game);
  const teamPlay = teamPlayOf(game);
  const phase = phaseAt(game, now);
  const revealed = phase === 'reveal' || phase === 'standings' || phase === 'finished';
  const r = game.round;
  const self = game.players.find(player => player.uid === uid);
  const countingDown = phase === 'question' && game.startsAt != null && now < game.startsAt;
  const current = r >= 0 ? roundAt(game, r) : undefined;
  const lastScored = phase === 'finished' ? (game.upTo ?? r) : revealed ? r : r - 1;
  const standings = kind === 'mystery' ? [] : standingsAt(game, lastScored);
  const showScores = revealed || phase === 'pick';
  const names = game.players.map((player, index) => ({
    name: player.name, team: player.team, you: player.uid === uid, index,
    standing: standings[index],
  }));
  const ordered = [...names];
  if (kind !== 'mystery' && showScores) ordered.sort((a, b) => b.standing.score - a.standing.score || a.index - b.index);
  // Places before this round, so the standings screen can show who moved.
  const before = kind !== 'mystery' && phase === 'standings'
    ? standingsAt(game, r - 1) : undefined;
  const prevPlace = new Map<number, number>();
  if (before) [...game.players.keys()].sort((a, b) => before[b].score - before[a].score || a - b).forEach((seat, place) => prevPlace.set(seat, place + 1));
  const players = ordered.map(({ name, team, you, standing, index }, place) => ({
    id: index, name, team, you,
    ...(phase === 'standings' && kind !== 'mystery' ? { rank: place + 1, prevRank: prevPlace.get(index) } : {}),
    ...(kind !== 'mystery' && standing ? {
      streak: standing.streak, ...(kind === 'elimination' ? { alive: standing.alive } : {}),
      ...(showScores ? { score: standing.score, gained: revealed ? standing.gained : undefined } : {}),
    } : {}),
  }));

  let teams: LiveGameView['teams'] = [];
  let tug: LiveGameView['tug'];
  let mystery: LiveGameView['mystery'];
  if (kind === 'tug') {
    const pulls = tugPulls(game, lastScored);
    const totals = TEAM_IDS.map(id => ({ id, players: teamMembers(game, id).length, points: pulls.reduce((sum, pull) => sum + pull[id], 0) }));
    teams = [...totals].sort((a, b) => b.points - a.points);
    tug = { position: tugPosition(pulls), limit: TUG_LIMIT };
  } else if (kind === 'mystery') {
    const { scores, effects } = mysteryScores(mysteryTurns(game, lastScored));
    teams = TEAM_IDS.map(id => ({ id, players: teamMembers(game, id).length, points: scores[id] })).sort((a, b) => b.points - a.points);
    const turnTeam = mysteryTeamForTurn(Math.max(r, 0));
    const members = teamMembers(game, turnTeam);
    const picker = members[mysteryPickerIndex(Math.max(r, 0), members.length)];
    const turns = game.turns ?? [];
    mystery = {
      boxes: (game.boxes ?? []).map((twist, i) => {
        const at = turns.indexOf(i);
        return { n: i + 1, taken: at >= 0, twist: at >= 0 && (at < r || at === r && revealed || phase === 'finished') ? twist : undefined };
      }),
      turn: turnTeam, picker: picker?.name ?? '', youPick: !!picker && picker.uid === uid,
      youAnswer: phase === 'question' && self?.team === turnTeam,
      box: turns[r] != null ? turns[r] + 1 : undefined,
      twist: revealed && turns[r] != null ? game.boxes![turns[r]] : undefined,
      effect: revealed && turns[r] != null ? effects[r] : undefined,
      scores,
    };
  } else if (teamPlay) {
    teams = TEAM_IDS.map(id => {
      const group = game.players.map((p, i) => ({ p, s: standings[i] })).filter(({ p }) => p.team === id);
      const total = group.reduce((sum, { s }) => sum + (s?.score ?? 0), 0);
      return { id, players: group.length, points: group.length && showScores ? Math.round(total / group.length) : 0 };
    }).sort((a, b) => b.points - a.points);
  }

  let me: LiveGameView['me'];
  const meIndex = game.players.findIndex(p => p.uid === uid);
  if (kind !== 'mystery' && meIndex >= 0) {
    const mine = standings[meIndex];
    const rankSource = [...game.players.keys()].sort((a, b) => standings[b].score - standings[a].score || a - b);
    me = { score: mine.score, streak: mine.streak, gained: revealed ? mine.gained : 0, correct: revealed ? mine.correct : null,
      rank: (room.opponent_uid ? standings.filter(player => player.score > mine.score).length : rankSource.indexOf(meIndex)) + 1, alive: mine.alive };
    if (phase === 'standings') {
      const place = rankSource.indexOf(meIndex);
      const above = rankSource[place - 1], below = rankSource[place + 1];
      me.prevRank = prevPlace.get(meIndex);
      if (above !== undefined) me.above = { name: game.players[above].name, points: standings[above].score - mine.score };
      if (below !== undefined) me.below = { name: game.players[below].name, points: mine.score - standings[below].score };
    }
  }

  const answer = r >= 0 ? self?.answers[r] : undefined;
  const active = new Set(activeUids(game));
  const friendMatch = room.opponent_uid ? { opponent: game.players.find(player => player.uid !== uid)?.name || game.invitedName || '' } : undefined;
  const next = nextKind(game);
  const playlist: LiveGameView['playlist'] = game.playlist && game.playlist.length > 1 ? {
    index: game.playlistIndex ?? 0, total: game.playlist.length, kinds: game.playlist, next,
    nextAt: phase === 'finished' && next && game.finishedAt ? game.finishedAt + NEXT_GAME_SECONDS * 1000 : undefined,
  } : undefined;
  let overall: LiveGameView['overall'];
  if (playlist && phase === 'finished') {
    const played = [...(game.results ?? [])];
    const totals = overallTotals(played);
    let place = 0;
    overall = totals.map((entry, index) => {
      if (!index || entry.score !== totals[index - 1].score) place = index + 1;
      return { id: game.players.findIndex(p => p.uid === entry.uid), name: entry.name, score: entry.score, you: entry.uid === uid, rank: place };
    });
  }
  return {
    code: room.code, host: room.host_uid === uid, friendMatch, mode: kind, teamPlay, phase, playlist, overall,
    round: r, rounds: kind === 'mystery' ? game.boxes?.length ?? game.rounds.length : game.rounds.length,
    serverTime: now, startsAt: phase === 'question' ? game.startsAt ?? null : null,
    deadline: phase === 'question' ? game.deadline : null,
    nextRoundAt: friendMatch && phase === 'reveal' ? nextFriendRoundAt(game, now) : undefined,
    willFinish: phase === 'reveal' && finishesAfterRound(game),
    question: current && (phase === 'question' && !countingDown || phase === 'reveal') ? publicQuestion(current) : undefined,
    selected: answer ?? undefined,
    correct: phase === 'reveal' && current?.type === 'choice' ? current.correct : undefined,
    correctText: phase === 'reveal' && current ? (current.type === 'choice' ? current.options?.[current.correct] : current.answer) : undefined,
    answered: r >= 0 && phase !== 'lobby' ? game.players.filter(player => active.has(player.uid) && player.answers[r] != null).length : 0,
    active: phase === 'lobby' ? game.players.length : [...active].length,
    hostSpeaks: game.hostSpeaks !== false,
    players, teams, me, tug, mystery,
  };
}

async function createRoom(user: AuthUser, body: Record<string, unknown>) {
  requireRole(user, ['educator', 'admin']);
  const classId = typeof body.classId === 'string' && body.classId.length <= 100 ? body.classId : '';
  const playlist = parseModes(body);
  const resolved = resolveMode(playlist[0], body.teams)!;
  const words = parseWords(body.words);
  const rounds = makeRounds(resolved.kind, words);
  return withTransaction(async tx => {
    const allowed = await tx.query('SELECT 1 FROM classes WHERE id=$1 AND (teacher_uid=$2 OR $3) FOR SHARE', [classId, user.uid, user.role === 'admin']);
    if (!allowed.rowCount) throw fail('You can only host games for your own class.', 403);
    await tx.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [classId, user.uid]);
    const existing = await tx.query<Room>(`SELECT ${roomColumns} FROM live_word_games
      WHERE class_id=$1 AND host_uid=$2 AND expires_at>NOW() AND game->>'phase'<>'finished' LIMIT 1`, [classId, user.uid]);
    if (existing.rows[0]) return view(existing.rows[0], user.uid);
    const game: Game = {
      mode: resolved.kind, teams: resolved.teams, hostSpeaks: body.hostSpeaks !== false, rounds, players: [],
      playlist, playlistIndex: 0, words, teamsPref: body.teams === true, results: [],
      phase: 'lobby', deadline: null, startsAt: null, round: -1,
      ...(resolved.kind === 'mystery' ? { boxes: buildBoxes(rounds.length, rand), turns: [] } : {}),
    };
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(3).toString('hex').toUpperCase();
      const created = await tx.query<Room>(`INSERT INTO live_word_games(code, class_id, host_uid, expires_at, game)
        VALUES ($1,$2,$3,NOW() + interval '4 hours',$4) ON CONFLICT DO NOTHING RETURNING ${roomColumns}`,
      [code, classId, user.uid, JSON.stringify(game)]);
      if (created.rows[0]) return view(created.rows[0], user.uid);
    }
    throw fail('Could not create a room. Try again.', 503);
  });
}

const friendRoomAccess = (uid: '$1' | '$2') => `(r.opponent_uid IS NOT NULL AND ${uid} IN (r.host_uid, r.opponent_uid) AND EXISTS (
  SELECT 1 FROM friendships f JOIN app_users peer ON peer.uid=CASE WHEN r.host_uid=${uid} THEN r.opponent_uid ELSE r.host_uid END
  WHERE f.first_uid=LEAST(r.host_uid,r.opponent_uid) AND f.second_uid=GREATEST(r.host_uid,r.opponent_uid)
    AND f.accepted AND NOT peer.disabled))`;
const roomAccess = `((r.opponent_uid IS NULL AND (r.host_uid=$2 OR ($3 AND EXISTS (
  SELECT 1 FROM class_members m WHERE m.class_id=r.class_id AND m.user_uid=$2)))) OR ${friendRoomAccess('$2')})`;
const noRoom = () => fail('Room unavailable. Check the class code or return to your friend invites.', 404);

/** Draw a private deck from the same published lesson packs that learners use. */
async function friendRounds(lang: string, level: string, kind: FriendGameKind) {
  const base = process.env.NODE_ENV === 'production' || process.env.SERVE_BUILT_APP === '1' ? 'dist' : 'public';
  const file = lang === 'en' ? 'level-texts.json' : `data/lang-packs/${lang}/level-texts.json`;
  const packs = JSON.parse(await readFile(path.join(process.cwd(), base, file), 'utf8')) as Record<string, { vocabulary?: { word: string; definition: string }[] }[]>;
  for (const lesson of shuffle(packs[level] ?? [])) {
    const words: GameWord[] = [];
    const wordKeys = new Set<string>();
    const meaningKeys = new Set<string>();
    for (const item of shuffle(lesson.vocabulary ?? [])) {
      const word = item.word?.replace(/\s+/g, ' ').trim();
      const meaning = item.definition?.replace(/\s+/g, ' ').trim();
      if (!word || !meaning || word.length > 100 || meaning.length > 200) continue;
      const wordKey = squash(word);
      const meaningKey = meaning.normalize('NFKC').toLowerCase();
      if (!wordKey || wordKeys.has(wordKey) || meaningKeys.has(meaningKey)) continue;
      if (kind === 'scramble' && new Set(wordKey).size < 2) continue;
      words.push({ word, meaning });
      wordKeys.add(wordKey);
      meaningKeys.add(meaningKey);
      if (words.length === 6) return makeRounds(kind, words);
    }
  }
  throw fail('There aren’t enough game words at this level. Try another level.', 422);
}

async function createFriendRoom(user: AuthUser, body: Record<string, unknown>) {
  const { friend, lang, level, mode } = body;
  if (typeof friend !== 'string' || !friend || friend.length > 160 || friend === user.uid) throw fail('Choose a friend.');
  if (typeof lang !== 'string' || !isContentLang(lang) || !FRIEND_GAME_LEVELS.some(item => item === level)) throw fail('Choose a game level.');
  const kind = FRIEND_GAME_KINDS.find(item => item === mode);
  if (!kind) throw fail('Choose a game mode.');
  return withTransaction(async tx => {
    const relationship = await tx.query<{ name: string }>(`SELECT peer.display_name AS name FROM friendships f
      JOIN app_users peer ON peer.uid=$2
      WHERE f.first_uid=LEAST($1::text,$2::text) AND f.second_uid=GREATEST($1::text,$2::text)
        AND f.accepted AND NOT peer.disabled FOR UPDATE OF f`, [user.uid, friend]);
    const peer = relationship.rows[0];
    if (!peer) throw fail('You can only challenge an accepted friend.', 403);
    const existing = await tx.query<Room>(`SELECT ${roomColumns} FROM live_word_games
      WHERE ((host_uid=$1 AND opponent_uid=$2) OR (host_uid=$2 AND opponent_uid=$1))
        AND expires_at>NOW() AND game->>'phase'<>'finished' LIMIT 1`, [user.uid, friend]);
    if (existing.rows[0]) return { code: existing.rows[0].code };
    const rounds = await friendRounds(lang, String(level), kind);
    const game: Game = { mode: kind, rounds, players: [{ uid: user.uid, name: user.displayName.slice(0, 72), answers: [], times: [] }],
      invitedName: peer.name.slice(0, 72), friendLang: lang, friendLevel: String(level), phase: 'lobby', round: -1, deadline: null };
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(3).toString('hex').toUpperCase();
      const created = await tx.query(`INSERT INTO live_word_games(code, host_uid, opponent_uid, expires_at, game)
        VALUES ($1,$2,$3,NOW() + interval '24 hours',$4) ON CONFLICT DO NOTHING RETURNING code`,
      [code, user.uid, friend, JSON.stringify(game)]);
      if (created.rowCount) return { code };
    }
    throw fail('Could not create a room. Try again.', 503);
  });
}

async function rematchFriendRoom(user: AuthUser, code: unknown) {
  const result = await query<Room>(`SELECT r.* FROM live_word_games r WHERE r.code=$1 AND r.expires_at>NOW() AND ${friendRoomAccess('$2')}`, [codeOf(code), user.uid]);
  const room = result.rows[0];
  if (!room || room.game.phase !== 'finished') throw noRoom();
  return createFriendRoom(user, { friend: room.host_uid === user.uid ? room.opponent_uid : room.host_uid,
    mode: kindOf(room.game), lang: room.game.friendLang ?? 'en', level: room.game.friendLevel ?? 'Beginner' });
}

function answerOf(round: Round, body: Record<string, unknown>): number | string {
  if (round.type === 'choice') {
    const option = body.option;
    if (typeof option !== 'number' || !Number.isInteger(option) || option < 0 || option >= (round.options?.length ?? 0)) throw fail('That is not an answer.');
    return option;
  }
  if (round.type === 'type') {
    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
    if (!text || text.length > 100) throw fail('Type your answer first.');
    return text;
  }
  const pairs = round.pairs!.left.length;
  const matched = body.matched, mistakes = body.mistakes;
  if (typeof matched !== 'number' || !Number.isInteger(matched) || matched < 0 || matched > pairs
    || typeof mistakes !== 'number' || !Number.isInteger(mistakes) || mistakes < 0 || mistakes > 99) throw fail('That is not an answer.');
  return encodeMatch(matched, mistakes);
}

async function changeRoom(user: AuthUser, body: Record<string, unknown>) {
  const code = codeOf(body.code);
  return withTransaction(async tx => {
    const selected = await tx.query<Room>(`SELECT r.* FROM live_word_games r
      WHERE r.code=$1 AND r.expires_at>NOW() AND ${roomAccess} FOR UPDATE`, [code, user.uid, user.role === 'student']);
    const room = selected.rows[0];
    if (!room) throw noRoom();
    const { game } = room;
    const kind = kindOf(game);
    const teamPlay = teamPlayOf(game);
    const host = room.host_uid === user.uid;
    const friendMatch = !!room.opponent_uid;
    const player = game.players.find(entry => entry.uid === user.uid);
    const now = Date.now();
    const phase = phaseAt(game, now);
    const startQuestion = () => {
      game.phase = 'question';
      delete game.revealedAt;
      delete game.showStandings;
      game.startsAt = now + (kind === 'mystery' ? 1200 : COUNTDOWN_MS);
      game.deadline = game.startsAt + (roundAt(game, game.round)?.seconds ?? 20) * 1000;
    };
    let recorded: PlayedGame | undefined;
    const finish = (scoredTo: number) => {
      game.phase = 'finished'; game.deadline = null; game.startsAt = null; game.upTo = scoredTo;
      delete game.showStandings;
      game.finishedAt = now;
      recorded = { kind, teams: teamPlay, finishedAt: now, rows: finalRows(game, scoredTo) };
      (game.results ??= []).push(recorded);
    };
    const assertCanStart = () => {
      const needTeams = teamPlay && (kind === 'tug' || kind === 'mystery');
      if (needTeams && TEAM_IDS.some(id => !teamMembers(game, id).length)) throw fail('Wait until both teams have a player.', 409);
      if (game.players.length < (friendMatch || teamPlay ? 2 : 1)) {
        throw fail(friendMatch ? 'Wait for your friend to join.' : teamPlay ? 'Wait for at least two players to join.' : 'Wait for a player to join.', 409);
      }
    };
    const firstRound = () => {
      game.round++;
      if (kind === 'mystery') { game.phase = 'pick'; game.deadline = null; game.startsAt = null; } else startQuestion();
    };
    switch (body.action) {
      case 'dismiss': {
        if (!friendMatch || phase !== 'lobby') throw fail('This invitation is no longer pending.', 409);
        await tx.query('DELETE FROM live_word_games WHERE code=$1', [code]);
        return null;
      }
      case 'join': {
        if (host || player) return view(room, user.uid, now);
        if (phase !== 'lobby' || game.players.length >= MAX_GAME_PLAYERS) throw fail('This room has already started or is full.', 409);
        const team = teamPlay ? (teamMembers(game, 'gold').length <= teamMembers(game, 'purple').length ? 'gold' : 'purple') : undefined;
        game.players.push({ uid: user.uid, name: user.displayName.slice(0, 72), team, answers: [], times: [] });
        break;
      }
      case 'answer': {
        if (!player) throw noRoom();
        const round = game.round >= 0 ? roundAt(game, game.round) : undefined;
        if (body.round !== game.round || !round) throw fail('That question has closed.', 409);
        if (player.answers[game.round] != null) return view(room, user.uid, now);
        if (phase !== 'question') throw fail('That question has closed.', 409);
        if (now < (game.startsAt ?? 0)) throw fail('Get ready — the question has not started yet.', 409);
        if (!activeUids(game).includes(player.uid)) throw fail(kind === 'mystery' ? 'It is the other team’s turn.' : 'You are out of this round. Cheer for the others!', 409);
        if (kind === 'mystery' && teamMembers(game, player.team!).some(p => p.answers[game.round] != null)) return view(room, user.uid, now);
        const ms = Math.max(0, now - (game.startsAt ?? now));
        const value = answerOf(round, body);
        player.answers[game.round] = value;
        (player.times ??= [])[game.round] = round.type === 'match' ? Math.max(ms, (round.pairs?.left.length ?? 0) * 700) : ms;
        if (friendMatch && phaseAt(game, now) === 'reveal') game.revealedAt = now;
        break;
      }
      case 'pick': {
        if (kind !== 'mystery' || phase !== 'pick') throw fail('Wait for the next turn.', 409);
        const members = teamMembers(game, mysteryTeamForTurn(game.round));
        const picker = members[mysteryPickerIndex(game.round, members.length)];
        if (!host && picker?.uid !== user.uid) throw fail('It is not your turn to pick.', 403);
        const box = body.box;
        if (typeof box !== 'number' || !Number.isInteger(box) || box < 0 || box >= game.boxes!.length || game.turns!.includes(box)) {
          throw fail('Choose a box that is still closed.', 409);
        }
        game.turns!.push(box);
        startQuestion();
        break;
      }
      case 'advance': {
        if (!host && !(friendMatch && player && phase !== 'lobby')) throw fail('Only the host can start the game.', 403);
        if (body.round !== game.round || phase === 'finished') return view(room, user.uid, now);
        if (phase !== 'lobby' && phase !== 'reveal' && phase !== 'standings') throw fail('Wait until this round ends.', 409);
        if (friendMatch && phase === 'reveal' && now < nextFriendRoundAt(game, now)) return view(room, user.uid, now);
        if (phase === 'lobby') assertCanStart();
        // Stop early when the game is decided; otherwise move on.
        if ((phase === 'reveal' || phase === 'standings') && finishesAfterRound(game)) { finish(game.round); break; }
        delete game.showStandings;
        firstRound();
        break;
      }
      case 'standings': {
        if (!host || friendMatch) throw fail('Only the host can show the standings.', 403);
        if (body.round !== game.round || phase !== 'reveal' || finishesAfterRound(game)) return view(room, user.uid, now);
        game.showStandings = true;
        break;
      }
      case 'nextGame': {
        if (!host || friendMatch) throw fail('Only the host can start the next game.', 403);
        const upcoming = nextKind(game);
        if (phase !== 'finished' || !upcoming || !game.words) return view(room, user.uid, now);
        const resolved = resolveMode(upcoming, game.teamsPref ?? game.teams)!;
        game.playlistIndex = (game.playlistIndex ?? 0) + 1;
        game.mode = resolved.kind; game.teams = resolved.teams;
        game.rounds = makeRounds(resolved.kind, game.words);
        delete game.boxes; delete game.turns; delete game.upTo; delete game.finishedAt; delete game.showStandings; delete game.revealedAt;
        if (resolved.kind === 'mystery') { game.boxes = buildBoxes(game.rounds.length, rand); game.turns = []; }
        game.players.forEach((entry, index) => {
          entry.answers = []; entry.times = [];
          entry.team = resolved.teams ? TEAM_IDS[index % 2] : undefined;
        });
        game.round = -1; game.phase = 'lobby'; game.deadline = null; game.startsAt = null;
        // Straight into the countdown when the next game can start; otherwise wait in its lobby.
        const nextTeams = resolved.teams && (resolved.kind === 'tug' || resolved.kind === 'mystery');
        const ready = game.players.length >= (resolved.teams ? 2 : 1) && !(nextTeams && TEAM_IDS.some(id => !teamMembers(game, id).length));
        if (ready && body.start !== false) {
          game.round = 0;
          if (resolved.kind === 'mystery') game.phase = 'pick';
          else {
            game.phase = 'question'; game.startsAt = now + COUNTDOWN_MS;
            game.deadline = game.startsAt + (game.rounds[0]?.seconds ?? 20) * 1000;
          }
        }
        break;
      }
      case 'skip':
        if (!host || friendMatch) throw fail('This round cannot be skipped.', 403);
        if (phase === 'question') { game.deadline = now; game.startsAt = Math.min(game.startsAt ?? now, now); }
        break;
      case 'end':
        if (!host || friendMatch) throw fail('This match cannot be ended early.', 403);
        if (phase === 'finished') return view(room, user.uid, now);
        finish(phase === 'reveal' ? game.round : game.round - 1);
        break;
      default: throw fail('Unknown game action.');
    }
    if (recorded && !friendMatch && room.class_id) {
      const rows = recorded.rows;
      await tx.query(`INSERT INTO live_game_results(room_code, game_index, uid, class_id, name, mode, score, rank, players, finished_at)
        SELECT $1, $2, u.uid, $3, u.name, $4, u.score, u.rank, $5, to_timestamp($6 / 1000.0)
        FROM unnest($7::text[], $8::text[], $9::int[], $10::int[]) AS u(uid, name, score, rank)
        ON CONFLICT DO NOTHING`,
      [code, game.playlistIndex ?? 0, room.class_id, recorded.kind, rows.length, recorded.finishedAt,
        rows.map(row => row.uid), rows.map(row => row.name), rows.map(row => row.score), rows.map(row => row.rank)]);
    }
    const renewExpiry = friendMatch && (phase === 'lobby' && game.phase === 'question' || game.phase === 'finished');
    await tx.query(`UPDATE live_word_games SET game=$2,
      expires_at=CASE WHEN $3 THEN NOW() + interval '24 hours' ELSE expires_at END WHERE code=$1`,
    [code, JSON.stringify(game), renewExpiry]);
    return view(room, user.uid, now);
  });
}

export type LiveGameResultRow = { roomCode: string; gameIndex: number; mode: string; uid: string; name: string; score: number; rank: number; players: number; finishedAt: number };
export type LiveGameTotals = { uid: string; name: string; totalScore: number; games: number; wins: number; bestRank: number; lastFinishedAt: number };

/**
 * Finished live games of one class. Educators (own class) and admins get every player; a student gets only their own rows.
 * `since` is epoch milliseconds or an ISO date. Totals cover every matching game, `results` the 500 most recent rows.
 */
export async function liveGameResults(user: AuthUser, classValue: unknown, sinceValue: unknown): Promise<{
  classId: string; since: number; players: LiveGameTotals[]; results: LiveGameResultRow[];
}> {
  const classId = typeof classValue === 'string' && classValue.length <= 100 ? classValue : '';
  if (!classId) throw fail('Choose a class.');
  const raw = typeof sinceValue === 'string' && sinceValue ? (/^\d+$/.test(sinceValue) ? Number(sinceValue) : Date.parse(sinceValue)) : 0;
  if (!Number.isFinite(raw) || raw < 0) throw fail('Use a valid start date.');
  const since = Math.min(raw, Date.now());
  const educator = (() => { try { requireRole(user, ['educator', 'admin']); return true; } catch { return false; } })();
  const access = educator
    ? await query('SELECT 1 FROM classes WHERE id=$1 AND (teacher_uid=$2 OR $3)', [classId, user.uid, user.role === 'admin'])
    : await query('SELECT 1 FROM class_members WHERE class_id=$1 AND user_uid=$2', [classId, user.uid]);
  if (!access.rowCount) throw fail('You do not have access to this class.', 403);
  const scope = educator ? '' : 'AND uid=$3';
  const args = educator ? [classId, since] : [classId, since, user.uid];
  const totals = await query<{ uid: string; name: string; total: number; games: number; wins: number; best: number; last: Date }>(
    `SELECT uid, (ARRAY_AGG(name ORDER BY finished_at DESC))[1] AS name, SUM(score)::int AS total, COUNT(*)::int AS games,
       COUNT(*) FILTER (WHERE rank=1)::int AS wins, MIN(rank)::int AS best, MAX(finished_at) AS last
     FROM live_game_results WHERE class_id=$1 AND finished_at >= to_timestamp($2 / 1000.0) ${scope}
     GROUP BY uid ORDER BY total DESC, uid LIMIT 500`, args);
  const rows = await query<{ room_code: string; game_index: number; mode: string; uid: string; name: string; score: number; rank: number; players: number; finished_at: Date }>(
    `SELECT room_code, game_index, mode, uid, name, score, rank, players, finished_at FROM live_game_results
     WHERE class_id=$1 AND finished_at >= to_timestamp($2 / 1000.0) ${scope} ORDER BY finished_at DESC, rank LIMIT 500`, args);
  return {
    classId, since,
    players: totals.rows.map(row => ({ uid: row.uid, name: row.name, totalScore: row.total, games: row.games, wins: row.wins, bestRank: row.best, lastFinishedAt: row.last.getTime() })),
    results: rows.rows.map(row => ({ roomCode: row.room_code, gameIndex: row.game_index, mode: row.mode, uid: row.uid, name: row.name,
      score: row.score, rank: row.rank, players: row.players, finishedAt: row.finished_at.getTime() })),
  };
}

export function registerLiveWordGames(app: Express) {
  const sendError = (res: Response, error: unknown) => {
    const status = Number((error as { status?: number })?.status || 500);
    if (status >= 500) console.error('[live-word-game]', error);
    res.status(status).json({ error: status >= 500 ? 'The game service is unavailable. Try again.' : (error as Error).message });
  };
  const authenticate: RequestHandler = async (req, res, next) => {
    try {
      res.locals.gameUser = await requireUser(req);
      next();
    } catch (error) { sendError(res, error); }
  };
  const perPlayer = (_req: Request, res: Response): string => res.locals.gameUser.uid;
  const pollLimit = rateLimit(75, 60_000, perPlayer);
  const playLimit = rateLimit(45, 60_000, perPlayer);
  app.get('/api/live-game', authenticate, pollLimit, async (req, res) => {
    try {
      const user: AuthUser = res.locals.gameUser;
      requireRole(user, ['educator', 'admin']);
      const classId = typeof req.query.classId === 'string' ? req.query.classId : '';
      const result = await query<Room>(`SELECT r.code, r.class_id, r.host_uid, r.game
        FROM live_word_games r JOIN classes c ON c.id = r.class_id
        WHERE r.host_uid = $1 AND r.class_id = $2 AND (c.teacher_uid = $1 OR $3) AND r.expires_at > NOW()
        ORDER BY (r.game->>'phase' = 'finished'), r.expires_at DESC LIMIT 20`, [user.uid, classId, user.role === 'admin']);
      const now = Date.now();
      res.json(result.rows.map(({ code, game }): TeacherGame => ({
        code, mode: kindOf(game), phase: phaseAt(game, now), playerCount: game.players.length,
        round: game.round + 1, rounds: kindOf(game) === 'mystery' ? game.boxes?.length ?? game.rounds.length : game.rounds.length,
      })));
    } catch (error) { sendError(res, error); }
  });
  app.get('/api/live-game/friends', authenticate, pollLimit, async (_req, res) => {
    try {
      const { uid }: AuthUser = res.locals.gameUser;
      const result = await query<Room & { name: string }>(`SELECT r.*, peer.display_name AS name FROM live_word_games r
        JOIN app_users peer ON peer.uid=CASE WHEN r.host_uid=$1 THEN r.opponent_uid ELSE r.host_uid END
        WHERE r.expires_at>NOW() AND ${friendRoomAccess('$1')}
        ORDER BY (r.game->>'phase'='finished'), r.expires_at DESC LIMIT 20`, [uid]);
      const now = Date.now();
      res.json(result.rows.map((room): FriendGame => ({ code: room.code, mode: kindOf(room.game) as FriendGameKind,
        phase: phaseAt(room.game, now), name: room.name, incoming: room.opponent_uid === uid,
        joined: room.game.players.some(player => player.uid === uid), ready: room.game.players.length === 2, level: room.game.friendLevel })));
    } catch (error) { sendError(res, error); }
  });
  app.get('/api/live-game/:code', authenticate, pollLimit, async (req, res) => {
    try {
      const user: AuthUser = res.locals.gameUser;
      const result = await query<Room>(`SELECT r.* FROM live_word_games r WHERE r.code=$1 AND r.expires_at>NOW() AND ${roomAccess}`,
        [codeOf(req.params.code), user.uid, user.role === 'student']);
      const room = result.rows[0];
      if (!room || room.host_uid !== user.uid && !room.game.players.some(player => player.uid === user.uid)) throw noRoom();
      res.json(view(room, user.uid));
    } catch (error) { sendError(res, error); }
  });
  app.post('/api/live-game', authenticate, playLimit, async (req, res) => {
    try {
      const user: AuthUser = res.locals.gameUser;
      const body = req.body ?? {};
      const result = await (body.action === 'create' ? createRoom(user, body)
        : body.action === 'challenge' ? createFriendRoom(user, body) : body.action === 'rematch' ? rematchFriendRoom(user, body.code) : changeRoom(user, body));
      if (result === null) res.sendStatus(204);
      else res.json(result);
    } catch (error) { sendError(res, error); }
  });
  /* ---- "My games": kits a teacher saves ahead of time ---- */
  const kitOf = (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title.replace(/\s+/g, ' ').trim() : '';
    if (!title || title.length > 80) throw fail('Give the game a title of up to 80 characters.');
    const modes = parseModes(body);
    const resolved = resolveMode(modes[0], body.teams)!;
    const color = typeof body.color === 'string' && KIT_COLORS.includes(body.color as never) ? body.color : 'sky';
    const emoji = typeof body.emoji === 'string' ? [...body.emoji.trim()].slice(0, 2).join('') : '';
    return { title, mode: resolved.kind, modes, teams: body.teams === true || resolved.teams, hostSpeaks: body.hostSpeaks !== false, words: parseWords(body.words), color, emoji: emoji || '🎮' };
  };
  const kitRow = (row: { id: string; data: Record<string, unknown>; updated_at: Date }): GameKit => ({ ...(row.data as Omit<GameKit, 'id'>), id: row.id, updatedAt: row.updated_at.getTime() });
  const kitLimit = rateLimit(60, 60_000, perPlayer);
  app.get('/api/game-kits', authenticate, kitLimit, async (_req, res) => {
    try {
      const user: AuthUser = res.locals.gameUser;
      requireRole(user, ['educator', 'admin']);
      const { rows } = await query<{ id: string; data: Record<string, unknown>; updated_at: Date }>(
        'SELECT id, data, updated_at FROM game_kits WHERE owner_uid=$1 ORDER BY updated_at DESC LIMIT 100', [user.uid]);
      res.json(rows.map(kitRow));
    } catch (error) { sendError(res, error); }
  });
  app.post('/api/game-kits', authenticate, kitLimit, async (req, res) => {
    try {
      const user: AuthUser = res.locals.gameUser;
      requireRole(user, ['educator', 'admin']);
      const body = req.body ?? {};
      const id = typeof body.id === 'string' && /^kit_[a-f0-9]{16}$/.test(body.id) ? body.id : '';
      if (body.action === 'delete') {
        if (!id) throw fail('Unknown game.', 404);
        await query('DELETE FROM game_kits WHERE id=$1 AND owner_uid=$2', [id, user.uid]);
        return void res.json({ ok: true });
      }
      if (body.action === 'duplicate') {
        const { rows } = await query<{ data: Record<string, unknown> }>('SELECT data FROM game_kits WHERE id=$1 AND owner_uid=$2', [id, user.uid]);
        if (!rows[0]) throw fail('Unknown game.', 404);
        const copy = { ...rows[0].data, title: `${String(rows[0].data.title).slice(0, 70)} (copy)` };
        const newId = 'kit_' + randomBytes(8).toString('hex');
        const inserted = await query<{ id: string; data: Record<string, unknown>; updated_at: Date }>(
          'INSERT INTO game_kits(id, owner_uid, data) VALUES ($1,$2,$3) RETURNING id, data, updated_at', [newId, user.uid, JSON.stringify(copy)]);
        return void res.json(kitRow(inserted.rows[0]));
      }
      const data = kitOf(body);
      if (id) {
        const updated = await query<{ id: string; data: Record<string, unknown>; updated_at: Date }>(
          'UPDATE game_kits SET data=$3, updated_at=NOW() WHERE id=$1 AND owner_uid=$2 RETURNING id, data, updated_at', [id, user.uid, JSON.stringify(data)]);
        if (!updated.rows[0]) throw fail('Unknown game.', 404);
        return void res.json(kitRow(updated.rows[0]));
      }
      const count = await query<{ n: number }>('SELECT COUNT(*)::int AS n FROM game_kits WHERE owner_uid=$1', [user.uid]);
      if (count.rows[0].n >= 100) throw fail('You can save up to 100 games. Delete one first.', 409);
      const created = await query<{ id: string; data: Record<string, unknown>; updated_at: Date }>(
        'INSERT INTO game_kits(id, owner_uid, data) VALUES ($1,$2,$3) RETURNING id, data, updated_at', ['kit_' + randomBytes(8).toString('hex'), user.uid, JSON.stringify(data)]);
      res.json(kitRow(created.rows[0]));
    } catch (error) { sendError(res, error); }
  });
  /* ---- per-player results of finished games (for leaderboards and the teacher's overview) ---- */
  app.get('/api/live-game-results', authenticate, pollLimit, async (req, res) => {
    try {
      res.json(await liveGameResults(res.locals.gameUser, req.query.classId, req.query.since));
    } catch (error) { sendError(res, error); }
  });
  // Expired codes stop working immediately. Purge saved rosters without waiting for another game.
  const purge = () => query('DELETE FROM live_word_games WHERE expires_at <= NOW()').catch(() => console.error('[live-word-game] expiry cleanup failed'));
  return () => { void purge(); setInterval(() => void purge(), 60 * 60_000).unref(); };
}

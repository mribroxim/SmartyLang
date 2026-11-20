import { describe, expect, it } from 'vitest';
import {
  GAME_KIND_IDS, TUG_LIMIT, applyTwist, buildBoxes, computeStandings, encodeMatch, isCorrect, matchPoints, mysteryScores,
  mysteryPickerIndex, mysteryTeamForTurn, pointsFor, resolveMode, sameWord, scrambleWord, tugPosition, tugPull, tugWon,
  checkWordRows, parseImportText, sharedRanks,
  type ScoringRound,
} from '../src/lib/liveWordGame';
import { finalRows, makeRounds, overallTotals, parseModes, parseWords, view, type Game, type Room } from '../server/liveWordGames';

const choice = (correct: number, seconds = 20): ScoringRound => ({ type: 'choice', correct, seconds });
const seq = (values: number[]) => () => { let i = 0; return () => values[i++ % values.length]; };

describe('modes', () => {
  it('maps legacy solo/teams to the quiz race and forces team rules', () => {
    expect(resolveMode('solo')).toEqual({ kind: 'quiz', teams: false });
    expect(resolveMode('teams')).toEqual({ kind: 'quiz', teams: true });
    expect(resolveMode('tug', false)).toEqual({ kind: 'tug', teams: true });
    expect(resolveMode('elimination', true)).toEqual({ kind: 'elimination', teams: false });
    expect(resolveMode('spelling', true)).toEqual({ kind: 'spelling', teams: true });
    expect(resolveMode('nope')).toBeNull();
    expect(GAME_KIND_IDS.length).toBeGreaterThanOrEqual(8);
  });
});

describe('scoring', () => {
  it('pays 600-1000 for speed and +50 per streak step up to 5', () => {
    expect(pointsFor({ correct: false, ms: 0, seconds: 20, streak: 4 })).toBe(0);
    expect(pointsFor({ correct: true, ms: 0, seconds: 20, streak: 0 })).toBe(1000);
    expect(pointsFor({ correct: true, ms: 20000, seconds: 20, streak: 0 })).toBe(600);
    expect(pointsFor({ correct: true, ms: 10000, seconds: 20, streak: 2 })).toBe(900);
    expect(pointsFor({ correct: true, ms: 0, seconds: 20, streak: 99 })).toBe(1250);
  });
  it('accepts typed answers ignoring case, spaces and punctuation', () => {
    expect(sameWord('Ice-Cream', 'ice cream')).toBe(true);
    expect(sameWord("don't", 'dont')).toBe(true);
    expect(sameWord('', '')).toBe(false);
    expect(isCorrect({ type: 'type', correct: -1, answer: 'Elephant', seconds: 30 }, ' elephant ')).toBe(true);
    expect(isCorrect({ type: 'type', correct: -1, answer: 'Elephant', seconds: 30 }, 'elefant')).toBe(false);
  });
  it('tracks streaks and resets them on a miss', () => {
    const rounds = [choice(1), choice(0), choice(2), choice(3)];
    const players = [{ answers: [1, 0, 0, 3], times: [0, 0, 0, 0] }];
    const [after3] = computeStandings(rounds, players, 2);
    expect(after3.streak).toBe(0);
    expect(after3.score).toBe(1000 + 1050);
    const [after4] = computeStandings(rounds, players, 3);
    expect(after4.streak).toBe(1);
    expect(after4.correct).toBe(true);
  });
  it('scores match rounds by pairs, mistakes and a finishing bonus', () => {
    expect(matchPoints({ matched: 4, mistakes: 0, ms: 0, seconds: 60, pairs: 4 })).toBe(900);
    expect(matchPoints({ matched: 4, mistakes: 2, ms: 60000, seconds: 60, pairs: 4 })).toBe(500);
    expect(matchPoints({ matched: 2, mistakes: 1, ms: 5000, seconds: 60, pairs: 4 })).toBe(250);
    expect(isCorrect({ type: 'match', correct: -1, seconds: 60, pairs: 4 }, encodeMatch(4, 1))).toBe(true);
    expect(isCorrect({ type: 'match', correct: -1, seconds: 60, pairs: 4 }, encodeMatch(3, 0))).toBe(false);
  });
});

describe('last one standing', () => {
  const rounds = [choice(0), choice(0), choice(0)];
  it('eliminates players who miss, and keeps everyone when all miss', () => {
    const players = [
      { answers: [0, 0, 1], times: [100, 100, 100] },
      { answers: [1, 0, 0], times: [100, 100, 100] },
      { answers: [0, 1, 1], times: [100, 100, 100] },
    ];
    const r1 = computeStandings(rounds, players, 0, true);
    expect(r1.map(s => s.alive)).toEqual([true, false, true]);
    const r2 = computeStandings(rounds, players, 1, true);
    expect(r2.map(s => s.alive)).toEqual([true, false, false]);
    const r3 = computeStandings(rounds, players, 2, true);
    expect(r3.map(s => s.alive)).toEqual([true, false, false]); // player 0 missed round 3 but everyone alive missed
    expect(r3[1].score).toBe(r1[1].score); // eliminated players stop scoring
  });
});

describe('tug of war', () => {
  it('pulls by share of the team that was right and clamps at the limit', () => {
    expect(tugPull(3, 6)).toBe(5);
    expect(tugPull(6, 6)).toBe(10);
    expect(tugPull(0, 0)).toBe(0);
    expect(tugPosition([{ gold: 10, purple: 4 }, { gold: 3, purple: 3 }])).toBe(6);
    const pulls = Array.from({ length: 8 }, () => ({ gold: 0, purple: 10 }));
    expect(tugPosition(pulls)).toBe(-TUG_LIMIT);
    expect(tugWon(-TUG_LIMIT)).toBe('purple');
    expect(tugWon(12)).toBeNull();
    expect(tugWon(TUG_LIMIT)).toBe('gold');
  });
  it('stops pulling once a team has won', () => {
    const pulls = [{ gold: 10, purple: 0 }, { gold: 10, purple: 0 }, { gold: 10, purple: 0 }, { gold: 0, purple: 10 }];
    expect(tugPosition(pulls)).toBe(TUG_LIMIT);
  });
});

describe('mystery boxes', () => {
  it('builds the requested number of boxes with traps and treasures', () => {
    for (const n of [4, 8, 12]) {
      const boxes = buildBoxes(n, Math.random);
      expect(boxes).toHaveLength(n);
      expect(boxes).toContain('bomb');
      expect(boxes).toContain('steal');
      expect(boxes).toContain('plain');
    }
    expect(buildBoxes(12, seq([0.3, 0.7, 0.1])())).toHaveLength(12);
  });
  it('pays good boxes only for correct answers', () => {
    const start = { gold: 200, purple: 500 };
    expect(applyTwist(start, 'gold', 'plain', true).scores).toEqual({ gold: 300, purple: 500 });
    expect(applyTwist(start, 'gold', 'plain', false).scores).toEqual(start);
    expect(applyTwist(start, 'gold', 'big', true).scores.gold).toBe(500);
    expect(applyTwist(start, 'gold', 'double', true).scores.gold).toBe(400);
    expect(applyTwist({ gold: 0, purple: 0 }, 'gold', 'double', true).scores.gold).toBe(100);
    expect(applyTwist(start, 'gold', 'steal', true).scores).toEqual({ gold: 400, purple: 400 });
    expect(applyTwist({ gold: 0, purple: 40 }, 'gold', 'steal', true).scores).toEqual({ gold: 140, purple: 0 });
  });
  it('hits with traps whether or not the answer was right', () => {
    const start = { gold: 200, purple: 500 };
    expect(applyTwist(start, 'gold', 'lose', true).scores.gold).toBe(50);
    expect(applyTwist(start, 'gold', 'lose', false).scores.gold).toBe(50);
    expect(applyTwist({ gold: 100, purple: 0 }, 'gold', 'lose', false).scores.gold).toBe(0);
    expect(applyTwist(start, 'purple', 'bomb', true).scores.purple).toBe(250);
    expect(applyTwist(start, 'gold', 'swap', false).scores).toEqual({ gold: 500, purple: 200 });
  });
  it('folds a whole game and alternates turns', () => {
    const { scores, effects } = mysteryScores([
      { team: 'gold', twist: 'big', correct: true },
      { team: 'purple', twist: 'steal', correct: true },
      { team: 'gold', twist: 'bomb', correct: true },
    ]);
    expect(scores).toEqual({ gold: 100, purple: 200 });
    expect(effects).toEqual(['big', 'steal', 'bomb']);
    expect([0, 1, 2, 3].map(mysteryTeamForTurn)).toEqual(['gold', 'purple', 'gold', 'purple']);
    expect([0, 2, 4, 6].map(turn => mysteryPickerIndex(turn, 3))).toEqual([0, 1, 2, 0]);
    expect(mysteryPickerIndex(5, 0)).toBe(0);
  });
});

describe('question builders', () => {
  const words = ['apple', 'bridge', 'candle', 'dragon', 'engine', 'forest', 'garden'].map(word => ({ word, meaning: `meaning of ${word}` }));
  it('scrambles into a different order', () => {
    for (let i = 0; i < 20; i++) expect(scrambleWord('garden')).not.toBe('GARDEN');
    expect(scrambleWord('aaa')).toBe('AAA');
  });
  it('rejects duplicate meanings and bad sizes', () => {
    expect(() => parseWords(words.slice(0, 3))).toThrow();
    expect(() => parseWords([...words.slice(0, 4), { word: 'zoo', meaning: 'meaning of apple' }])).toThrow();
    expect(parseWords(words)).toHaveLength(7);
  });
  it('builds every mode from the same word list', () => {
    for (const kind of GAME_KIND_IDS) {
      const rounds = makeRounds(kind, words);
      expect(rounds.length).toBeGreaterThanOrEqual(words.length > 7 ? 7 : 2);
      for (const round of rounds) {
        if (round.type === 'choice') expect(round.options![round.correct]).toBeTruthy();
        if (round.type === 'type') expect(isCorrect({ type: 'type', correct: -1, answer: round.answer, seconds: 30 }, round.answer)).toBe(true);
        if (round.type === 'match') {
          const { left, right, key } = round.pairs!;
          expect(left).toHaveLength(4);
          expect(new Set(left).size).toBe(4);
          left.forEach((word, i) => expect(right[key[i]]).toBe(`meaning of ${word}`));
        }
      }
    }
    expect(makeRounds('mystery', words.slice(0, 4))).toHaveLength(8);
    const tf = makeRounds('tf', words);
    expect(tf.filter(r => r.correct === 0).length).toBeGreaterThan(0);
    for (const round of tf) expect((round.statement === `meaning of ${round.prompt}`) === (round.correct === 0)).toBe(true);
    for (const round of makeRounds('listen', words)) expect(round.options![round.correct]).toBe(round.speak);
  });
});

describe('room view', () => {
  const words = ['a1', 'b2', 'c3', 'd4'].map(word => ({ word, meaning: `m ${word}` }));
  const room = (game: Partial<Game>): Room => ({ code: 'ABC123', class_id: 'c', host_uid: 'host', game: {
    mode: 'quiz', teams: false, phase: 'question', round: 0, startsAt: 1000, deadline: 21000, rounds: makeRounds('quiz', words),
    players: [{ uid: 'p1', name: 'Ann', answers: [], times: [] }, { uid: 'p2', name: 'Bo', answers: [], times: [] }], ...game } });
  it('hides the question during the 3-2-1 and shows it afterwards', () => {
    const r = room({});
    expect(view(r, 'p1', 500).question).toBeUndefined();
    expect(view(r, 'p1', 1500).question?.options).toHaveLength(4);
    expect(view(r, 'p1', 1500).correct).toBeUndefined();
  });
  it('reveals when everyone answered or time ran out, with speed points', () => {
    const r = room({});
    const right = r.game.rounds[0].correct;
    r.game.players[0].answers[0] = right; r.game.players[0].times = [0];
    expect(view(r, 'p1', 2000).phase).toBe('question');
    r.game.players[1].answers[0] = (right + 1) % 4; r.game.players[1].times = [500];
    const v = view(r, 'p1', 2000);
    expect(v.phase).toBe('reveal');
    expect(v.correct).toBe(right);
    expect(v.me).toMatchObject({ score: 1000, rank: 1, correct: true });
    expect(view(r, 'p2', 2000).me).toMatchObject({ score: 0, correct: false, rank: 2 });
    expect(view(room({}), 'p1', 22000).phase).toBe('reveal');
  });
  it('shows scores to both friends, holds the reveal, and gives equal scores equal rank', () => {
    const r = { ...room({ revealedAt: 2000 }), class_id: null, host_uid: 'p1', opponent_uid: 'p2' };
    const correct = r.game.rounds[0].correct;
    r.game.players.forEach(player => { player.answers = [correct]; player.times = [1000]; });
    const host = view(r, 'p1', 2000);
    const guest = view(r, 'p2', 2000);
    expect(host).toMatchObject({ host: true, friendMatch: { opponent: 'Bo' }, phase: 'reveal', nextRoundAt: 4800 });
    expect(guest).toMatchObject({ host: false, friendMatch: { opponent: 'Ann' }, phase: 'reveal', nextRoundAt: 4800 });
    expect(host.me).toMatchObject({ score: 980, rank: 1, correct: true });
    expect(guest.me).toEqual(host.me);
  });
  it('still understands rooms created before the new modes existed', () => {
    const legacy = room({ mode: 'teams', startsAt: undefined, teams: undefined });
    legacy.game.players[0].team = 'gold';
    const v = view(legacy, 'p1', 5000);
    expect(v.mode).toBe('quiz');
    expect(v.teamPlay).toBe(true);
    expect(v.question?.prompt).toBeTruthy();
  });
  it('labels an early elimination result as the end of the match', () => {
    const r = room({ mode: 'elimination' });
    const correct = r.game.rounds[0].correct;
    r.game.players[0].answers[0] = correct;
    r.game.players[1].answers[0] = (correct + 1) % 4;
    expect(view(r, 'host', 2000)).toMatchObject({ phase: 'reveal', willFinish: true });
  });
  it('runs a mystery turn from pick to scored reveal', () => {
    const boxes = buildBoxes(8, () => 0.5);
    const game = room({ mode: 'mystery', teams: true, round: 0, phase: 'pick', boxes, turns: [], rounds: makeRounds('mystery', words) });
    game.game.players[0].team = 'gold'; game.game.players[1].team = 'purple';
    let v = view(game, 'p1', 100);
    expect(v.phase).toBe('pick');
    expect(v.mystery).toMatchObject({ turn: 'gold', youPick: true, picker: 'Ann' });
    expect(v.mystery!.boxes.every(b => !b.twist)).toBe(true);
    game.game.turns = [2]; game.game.phase = 'question'; game.game.startsAt = 0; game.game.deadline = 99999;
    const q = game.game.rounds[2];
    game.game.players[0].answers[0] = q.correct;
    v = view(game, 'p2', 200);
    expect(v.phase).toBe('reveal');
    expect(v.mystery!.twist).toBe(boxes[2]);
    expect(v.mystery!.scores.gold + v.mystery!.scores.purple).toBeGreaterThanOrEqual(0);
    expect(v.mystery!.boxes[2].twist).toBe(boxes[2]);
  });
});

describe('word set builder', () => {
  it('parses tab, colon and dash separated lines and counts the rest as skipped', () => {
    const { words, skipped } = parseImportText('apple\ta round fruit\nbread: baked from flour\nice-cream - frozen dessert\nsun – a star\nnonsense line\n\n');
    expect(words).toEqual([
      { word: 'apple', meaning: 'a round fruit' }, { word: 'bread', meaning: 'baked from flour' },
      { word: 'ice-cream', meaning: 'frozen dessert' }, { word: 'sun', meaning: 'a star' },
    ]);
    expect(skipped).toBe(1);
  });
  it('validates rows with friendly issue codes', () => {
    const row = (term: string, def: string) => ({ term, def });
    expect(checkWordRows([row('a', 'x'), row('b', 'y')]).issues).toEqual(['few']);
    const full = ['a', 'b', 'c', 'd'].map(c => row(c, c + '!'));
    expect(checkWordRows(full)).toMatchObject({ issues: [], badRows: [] });
    expect(checkWordRows([...full, row('', '')]).words).toHaveLength(4);
    expect(checkWordRows([...full, row('e', '')])).toMatchObject({ issues: ['half'], badRows: [4] });
    expect(checkWordRows([...full, row('A', 'z')]).issues).toContain('dupWord');
    expect(checkWordRows([...full, row('e', 'C!')]).issues).toContain('dupMeaning');
    expect(checkWordRows(Array.from({ length: 13 }, (_, i) => row('w' + i, 'm' + i))).issues).toEqual(['many']);
  });
  it('shares places between tied scores', () => {
    expect(sharedRanks([900, 900, 500, 400, 400, 100])).toEqual([1, 1, 3, 4, 4, 6]);
  });
});

describe('playlist and standings', () => {
  const words = ['a', 'b', 'c', 'd'].map(w => ({ word: w, meaning: w + '!' }));
  const make = (phase: 'question' | 'finished', extra: Partial<Game> = {}): Room => {
    const rounds = makeRounds('quiz', words);
    const answerFor = (good: boolean) => rounds.map(r => (good ? r.correct : (r.correct + 1) % 4));
    return { code: 'ABC123', class_id: 'c1', host_uid: 'teacher', game: {
      mode: 'quiz', rounds, phase, round: 1, startsAt: 0, deadline: 1, playlist: ['quiz', 'spelling'], playlistIndex: 0, words,
      players: [
        { uid: 'u1', name: 'Ali', answers: answerFor(false), times: [0, 0, 0, 0] },
        { uid: 'u2', name: 'Bo', answers: answerFor(true), times: [0, 0, 0, 0] },
        { uid: 'u3', name: 'Cy', answers: [rounds[0].correct, (rounds[1].correct + 1) % 4], times: [5000, 0] },
      ], ...extra } };
  };
  it('accepts one mode or a playlist and drops duplicates', () => {
    expect(parseModes({ mode: 'quiz' })).toEqual(['quiz']);
    expect(parseModes({ modes: ['tf', 'quiz', 'tf'] })).toEqual(['tf', 'quiz']);
    expect(() => parseModes({ modes: [] })).toThrow();
    expect(() => parseModes({ modes: ['nope'] })).toThrow();
  });
  it('shows the leaderboard phase with places before and after the round', () => {
    const room = make('question', { showStandings: true });
    const host = view(room, 'teacher', 10);
    expect(host.phase).toBe('standings');
    expect(host.players.map(p => p.name)).toEqual(['Bo', 'Cy', 'Ali']);
    expect(host.players.map(p => p.rank)).toEqual([1, 2, 3]);
    expect(host.players.find(p => p.name === 'Ali')!.prevRank).toBe(3);
    expect(host.question).toBeUndefined();
    const cy = view(room, 'u3', 10);
    expect(cy.me).toMatchObject({ rank: 2, above: { name: 'Bo' }, below: { name: 'Ali' } });
    expect(cy.me!.above!.points).toBeGreaterThan(0);
    expect(view(room, 'u2', 10).me!.above).toBeUndefined();
  });
  it('records final scores and combines them across the playlist', () => {
    const room = make('finished', { upTo: 1, finishedAt: 1000 });
    const rows = finalRows(room.game, 1);
    expect(rows.map(r => r.name)).toEqual(['Bo', 'Cy', 'Ali']);
    expect(rows.map(r => r.rank)).toEqual([1, 2, 3]);
    expect(rows[2].score).toBe(0);
    const totals = overallTotals([{ kind: 'quiz', teams: false, finishedAt: 1, rows }, { kind: 'tf', teams: false, finishedAt: 2, rows: [{ uid: 'u1', name: 'Ali', score: 5000, rank: 1 }] }]);
    expect(totals[0]).toMatchObject({ uid: 'u1', score: 5000 });
    room.game.results = [{ kind: 'quiz', teams: false, finishedAt: 1, rows }];
    const done = view(room, 'u1', 5000);
    expect(done.playlist).toMatchObject({ index: 0, total: 2, next: 'spelling' });
    expect(done.playlist!.nextAt).toBeGreaterThan(1000);
    expect(done.overall![0]).toMatchObject({ name: 'Bo', rank: 1 });
  });
});

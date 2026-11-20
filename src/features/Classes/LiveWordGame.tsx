import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, FastForward, Flame, Gamepad2, Headphones, Music, Play, SkipForward, Trophy, VolumeX } from 'lucide-react';
import { ScreenShell, seCard } from '../../components/ScreenShell';
import { useUiLang } from '../../contexts/UiLangContext';
import { ApiError, apiRequest } from '../../lib/selfHostedApi';
import {
  TEAM_IDS, checkWordRows,
  type GameKind, type GameTeam, type LiveGameView,
} from '../../lib/liveWordGame';
import {
  isGameMusicOn, playGameSfx, setGameMusicOn, startGameMusic, stopGameMusic, type GameSfx,
} from '../../lib/gameAudio';
import { playWord } from '../../lib/speech';
import { ChunkyButton } from '../Bites/lesson/chunky';
import {
  Confetti, CountdownBurst, MODE_META, Mascot, Panel, Podium, StreakFlame, TEAM_STYLE, TWIST_META, TimerRing, TugRope,
  useGameClock, type PodiumEntry,
} from './liveGameKit';
import { ChoiceGrid, MatchBoard, MysteryBoxes, TypeAnswer } from './livePlay';
import { setupField, GameOptions, GamePicker, WordSetBuilder, rowsFromWords, useWordMessage, type WordRow } from './GameSetup';
import { MyStanding, StandingsBoard, TeamStandings } from './liveStandings';

const field = setupField;
const request = (body: object, signal?: AbortSignal) => apiRequest<LiveGameView>('/api/live-game', {
  method: 'POST', body: JSON.stringify(body), signal,
});

export function LiveGameJoin({ onJoin }: { onJoin: (code: string) => void }) {
  const { t } = useUiLang();
  const [code, setCode] = useState('');
  return <form className={`${seCard} mb-5 overflow-hidden p-4`} onSubmit={event => { event.preventDefault(); onJoin(code); }}>
    <label className="mb-2 flex items-center gap-2 font-serif font-extrabold" htmlFor="live-code">
      <Gamepad2 className="h-5 w-5" />{t('class.live.join')}
    </label>
    <div className="flex gap-2">
      <input id="live-code" aria-label={t('class.live.code')} placeholder={t('class.live.code')} className={`${field} min-w-0 font-serif tracking-widest`}
        autoComplete="off" autoCapitalize="characters" maxLength={6} value={code}
        onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))} />
      <ChunkyButton type="submit" disabled={code.length !== 6}>{t('class.live.joinButton')}</ChunkyButton>
    </div>
  </form>;
}

export function LiveWordGame({ classId, code, friendMatch, onRoom, onBack }: {
  classId?: string;
  code?: string;
  friendMatch?: boolean;
  onRoom: (code: string) => void;
  onBack: () => void;
}) {
  const { t } = useUiLang();
  const backLabel = t(friendMatch ? 'update.friends' : classId ? 'teacher.games' : 'nav.myClasses');
  // A running class game takes the whole screen area (app nav hidden) and sizes itself to fit without scrolling.
  if (code && !friendMatch) return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col overflow-y-auto overflow-x-hidden px-3 py-[clamp(0.5rem,1.5dvh,1.25rem)] sm:px-6">
      <Room key={code} code={code} onBack={onBack} backLabel={backLabel} onRoom={onRoom} />
    </div>
  );
  return (
    <ScreenShell title={friendMatch ? undefined : t('class.live.title')} stickers={friendMatch ? undefined : ['game.quiz-show-host']} size={friendMatch ? 'narrow' : classId && !code ? 'default' : 'wide'} className="overflow-x-hidden">
      <button type="button" className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-bold" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />{backLabel}
      </button>
      {code ? <Room key={code} code={code} onBack={onBack} backLabel={backLabel} friendRoom={friendMatch} onRoom={onRoom} />
        : classId ? <HostSetup classId={classId} onRoom={onRoom} /> : <LiveGameJoin onJoin={onRoom} />}
    </ScreenShell>
  );
}

/* ====================== host setup ====================== */

function HostSetup({ classId, onRoom }: { classId: string; onRoom: (code: string) => void }) {
  const { t } = useUiLang();
  const message = useWordMessage();
  const [modes, setModes] = useState<GameKind[]>(['quiz']);
  const [teams, setTeams] = useState(false);
  const [hostSpeaks, setHostSpeaks] = useState(true);
  const [rows, setRows] = useState<WordRow[]>(() => rowsFromWords([]));
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const launch = async () => {
    setError(''); setTried(true);
    const check = checkWordRows(rows);
    const problem = message(check);
    if (problem) { setError(problem); return; }
    if (!modes.length) { setError(t('game.pick.none')); return; }
    setBusy(true);
    try { onRoom((await request({ action: 'create', classId, mode: modes[0], modes, teams, hostSpeaks, words: check.words })).code); }
    catch (error) { setError(error instanceof ApiError ? error.message : t('class.live.connection')); }
    finally { setBusy(false); }
  };
  return <form className="space-y-6" onSubmit={event => { event.preventDefault(); void launch(); }}>
    <Panel><WordSetBuilder rows={rows} onChange={setRows} showProblems={tried} /></Panel>
    <Panel className="space-y-4">
      <GamePicker value={modes} onChange={setModes} />
      <GameOptions modes={modes} teams={teams} onTeams={setTeams} hostSpeaks={hostSpeaks} onHostSpeaks={setHostSpeaks} />
    </Panel>
    {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
    <ChunkyButton type="submit" className="w-full" disabled={busy}>{t('class.live.open')}</ChunkyButton>
  </form>;
}

/* ====================== the room ====================== */

function Room(props: { code: string; onBack: () => void; backLabel: string; friendRoom?: boolean; onRoom: (code: string) => void }) {
  return <RoomView {...props} />;
}

function RoomView({ code, onBack, backLabel, friendRoom, onRoom }: { code: string; onBack: () => void; backLabel: string; friendRoom?: boolean; onRoom: (code: string) => void }) {
  const { t } = useUiLang();
  const [game, setGame] = useState<LiveGameView>();
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const [auto, setAuto] = useState(false);
  const [musicOn, setMusicOn] = useState(isGameMusicOn);
  const generation = useRef(0);
  const changing = useRef(false);
  const teamName = (id: GameTeam) => t(id === 'gold' ? 'class.live.gold' : 'class.live.purple');

  useEffect(() => {
    const ctl = new AbortController();
    let timer: number;
    async function run(initial: boolean) {
      const version = generation.current;
      try {
        if (changing.current) return;
        const value = initial ? await request({ action: 'join', code }, ctl.signal)
          : await apiRequest<LiveGameView>(`/api/live-game/${encodeURIComponent(code)}`, { signal: ctl.signal });
        if (ctl.signal.aborted || version !== generation.current) return;
        setGame(value);
        setError('');
        // A finished game stops the polling unless another game of the playlist is coming.
        if (value.phase === 'finished' && !value.playlist?.next) { ctl.abort(); return; }
      } catch (error) {
        if (ctl.signal.aborted || version !== generation.current) return;
        setError(error instanceof ApiError ? error.message : t('class.live.connection'));
        if (friendRoom && error instanceof ApiError && error.status === 404) setClosed(true);
        if (initial || error instanceof ApiError && [401, 403, 404].includes(error.status)) { setGame(undefined); ctl.abort(); return; }
      } finally {
        if (!ctl.signal.aborted) timer = window.setTimeout(() => void run(false), 1400);
      }
    }
    void run(true);
    return () => { ctl.abort(); window.clearTimeout(timer); };
  }, [code, retry, friendRoom, t]);

  const clock = useGameClock(game?.serverTime, game?.nextRoundAt ?? game?.startsAt, game?.deadline);
  const counting = game?.phase === 'question' && clock.toStart > 0;
  const live = game?.phase === 'question' && !counting;

  const act = useCallback(async (action: string, extra: object = {}) => {
    if (!game || changing.current) return;
    changing.current = true;
    generation.current++;
    setBusy(true);
    setError('');
    try { setGame(await request({ action, code, round: game.round, ...extra })); }
    catch (error) { setError(error instanceof ApiError ? error.message : t('class.live.connection')); }
    finally { setBusy(false); changing.current = false; }
  }, [game, code, t]);
  const latestAct = useRef(act);
  latestAct.current = act;

  async function rematch() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const next = await apiRequest<{ code: string }>('/api/live-game', { method: 'POST', body: JSON.stringify({ action: 'rematch', code }) });
      onRoom(next.code);
    } catch (error) { setError(error instanceof ApiError ? error.message : t('class.live.connection')); }
    finally { setBusy(false); }
  }

  /* ---- audio ---- */
  const isHost = !!game?.host && !game.friendMatch;
  const prev = useRef({ phase: '', round: -9, players: 0, counting: false, tick: -1, count: 0 });
  const phase = game?.phase;
  useEffect(() => {
    if (!isHost) return;
    if (phase === 'lobby') startGameMusic('lobby');
    else if (live) startGameMusic('question');
    else stopGameMusic();
  }, [isHost, phase, live, musicOn]);
  useEffect(() => () => stopGameMusic(), []);
  useEffect(() => {
    if (!game) return;
    const p = prev.current;
    const play = (name: GameSfx, v?: number) => playGameSfx(name, v);
    if (isHost && game.players.length > p.players && p.players >= 0 && p.phase !== '') play('join');
    if (counting) {
      const n = Math.ceil(clock.toStart / 1000);
      if (n !== p.count) { play('countdown'); p.count = n; }
    } else if (p.counting && live) play('go');
    if (live && !game.selected && clock.left > 0 && clock.left <= 5000 && (isHost || game.selected === undefined)) {
      const second = Math.ceil(clock.left / 1000);
      if (second !== p.tick) { p.tick = second; play('last5'); }
    }
    if (phase !== p.phase || game.round !== p.round) {
      if (phase === 'reveal') {
        const m = game.mystery;
        if (m?.effect) play(({ bomb: 'bomb', lose: 'wrong', swap: 'steal', steal: 'steal', double: 'double', big: 'streak', plain: 'correct', miss: 'wrong' } as Record<string, GameSfx>)[m.effect] ?? 'reveal');
        else if (isHost) play('reveal');
        else if (game.me?.correct) play((game.me.streak ?? 0) >= 3 ? 'streak' : 'correct');
        else play(game.selected === undefined ? 'timeup' : 'wrong');
      }
      if (phase === 'finished') play('winner');
      if (phase === 'question' && game.question?.speak === undefined) { /* no audio prompt */ }
      p.phase = phase ?? ''; p.round = game.round;
    }
    p.players = game.players.length;
    p.counting = !!counting;
  }, [game, counting, live, clock.toStart, clock.left, isHost, phase]);

  const speakKey = game?.question?.speak ? `${game.round}:${game.question.speak}` : '';
  useEffect(() => {
    if (!game || !live || !game.question?.speak) return;
    if (game.host === game.hostSpeaks) playWord(game.question.speak, 0.9);
  }, [speakKey, live]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- host auto-advance: answer -> standings -> next question ---- */
  useEffect(() => {
    if (!auto || !isHost || (game?.phase !== 'reveal' && game?.phase !== 'standings')) return;
    const timer = window.setTimeout(() => void latestAct.current(game.phase === 'reveal' && !game.willFinish ? 'standings' : 'advance'), game.phase === 'reveal' ? 4200 : 6000);
    return () => window.clearTimeout(timer);
  }, [auto, isHost, game?.phase, game?.round, game?.willFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- between games of a playlist: the host's screen starts the next one when the countdown ends ---- */
  const nextAt = game?.playlist?.nextAt;
  const gameClock = useGameClock(game?.serverTime, nextAt ?? null, null);
  const nextIn = Math.ceil(gameClock.toStart / 1000);
  const nextGameKey = game?.playlist ? game.playlist.index : -1;
  useEffect(() => {
    if (!isHost || game?.phase !== 'finished' || !nextAt) return;
    const timer = window.setTimeout(() => void latestAct.current('nextGame'), Math.max(0, gameClock.toStart) + 150);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, game?.phase, nextGameKey, nextAt]);

  if (!game) return (
    <div className={`${seCard} p-5`}>
      <p role={error ? 'alert' : 'status'}>{closed ? t('friendGame.closed') : error || t('class.live.joining')}</p>
      {error && <ChunkyButton className="mt-3" onClick={closed ? onBack : () => { setError(''); setRetry(value => value + 1); }}>{t(closed ? 'friendGame.backInvites' : 'class.live.retry')}</ChunkyButton>}
      {!friendRoom && <ChunkyButton tone="secondary" className="ml-2 mt-3" onClick={onBack}>{backLabel}</ChunkyButton>}
    </div>
  );

  const reveal = game.phase === 'reveal';
  const standing = game.phase === 'standings';
  const finished = game.phase === 'finished';
  const playlist = game.playlist;
  const hasNext = !!playlist?.next;
  const lastOfPlaylist = !!playlist && !hasNext;
  const meta = MODE_META[game.mode];
  const question = game.question;
  const mine = game.players.find(player => player.you);
  const total = (question?.seconds ?? 20);
  const out = game.me?.alive === false;
  const canAnswer = !isHost && !out && (!game.mystery || game.mystery.youAnswer);
  const replay = question?.speak ? () => playWord(question.speak!, 0.85) : undefined;
  const hostBig = isHost;

  const entries: PodiumEntry[] = game.mode === 'tug' || game.mode === 'mystery' || game.teamPlay
    ? game.teams.map(team => ({ name: teamName(team.id), score: team.points, team: team.id }))
    : [...game.players].sort((a, b) => game.mode === 'elimination' ? Number(b.alive) - Number(a.alive) || (b.score ?? 0) - (a.score ?? 0) : 0)
      .map(player => ({ name: player.name, score: player.score ?? 0, you: player.you }));
  const overallEntries: PodiumEntry[] = (game.overall ?? []).map(entry => ({ name: entry.name, score: entry.score, you: entry.you }));
  const shown = lastOfPlaylist && overallEntries.length ? overallEntries : entries;
  const leaders = shown.filter(entry => entry.score === shown[0]?.score);
  const myOverall = game.overall?.find(entry => entry.you);

  const toggleMusic = () => { const next = !musicOn; setGameMusicOn(next); setMusicOn(next); };

  return <div className={`flex flex-col ${friendRoom ? 'gap-4' : 'min-h-full gap-[clamp(0.5rem,1.8dvh,1.5rem)]'}`}>
    <style>{`@keyframes lg-pop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}`}</style>
    {finished && !game.friendMatch && <Confetti />}
    {error && <p role="alert" className="font-semibold text-rose-700 dark:text-rose-300">{error}</p>}

    <div className="flex items-center justify-between gap-2">
      {!friendRoom && <button type="button" aria-label={backLabel} title={backLabel} className="inline-flex min-h-9 shrink-0 items-center gap-2 text-sm font-bold" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{backLabel}</span>
      </button>}
      {game.friendMatch && <h1 className="min-w-0 break-words text-lg font-extrabold">{game.friendMatch.opponent}</h1>}
      <p className="inline-flex min-w-0 items-center gap-2 truncate font-serif text-sm font-extrabold">
        <span className={`dark-keep flex h-7 w-7 items-center justify-center rounded-lg text-white ${meta.tint}`}><meta.icon className="h-4 w-4" aria-hidden /></span>
        {t(meta.title)}
        {playlist && <span className="ml-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-extrabold dark:bg-zinc-800">{t('game.playlist.of', { n: playlist.index + 1, total: playlist.total })}</span>}
      </p>
      <div className="flex items-center gap-2">
        {mine?.team && <span className={`rounded-full px-3 py-1 font-serif text-sm font-extrabold ${TEAM_STYLE[mine.team].card}`}>{t('class.live.yourTeam', { team: teamName(mine.team) })}</span>}
        {isHost && <button type="button" onClick={toggleMusic} aria-pressed={musicOn} aria-label={t(musicOn ? 'game.musicOff' : 'game.musicOn')}
          className="rounded-full border-2 border-zinc-300 p-2 dark:border-zinc-600">{musicOn ? <Music className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>}
      </div>
    </div>

    {/* ---------- lobby ---------- */}
    {game.phase === 'lobby' && <Panel className="space-y-5 text-center">
      {!game.friendMatch && <Mascot id="mood.party-time" size={hostBig ? 'clamp(64px, 14dvh, 120px)' : 'clamp(56px, 11dvh, 96px)'} />}
      {game.friendMatch ? <h2 className="font-serif text-2xl font-extrabold" aria-live="polite">{game.host
        ? t(game.players.length < 2 ? 'friendGame.waiting' : 'friendGame.ready', { name: game.friendMatch.opponent })
        : t('friendGame.waitingHost', { name: game.friendMatch.opponent })}</h2> : game.host ? <>
        <p className="font-serif text-sm font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('game.joinWith')}</p>
        <p className="font-serif text-[clamp(2.5rem,10dvh,6rem)] font-extrabold leading-none tracking-[.18em]" aria-label={game.code.split('').join(' ')}>{game.code}</p>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{t('game.joinWhere', { url: `${location.host}/#/classes/live/${game.code}` })}</p>
        <ChunkyButton tone="secondary" onClick={async () => {
          try { await navigator.clipboard.writeText(`${location.origin}/#/classes/live/${game.code}`); setCopied(true); }
          catch { setError(t('class.live.copyError')); }
        }}><Copy className="h-4 w-4" />{t(copied ? 'class.live.copied' : 'class.live.copy')}</ChunkyButton>
      </> : <>
        <h2 className="font-serif text-3xl font-extrabold">{t('game.youreIn')}</h2>
        <p className="font-serif text-xl font-extrabold" aria-label={mine?.name}>{mine?.name}</p>
        <p>{t('class.live.waitHost')}</p>
      </>}
      {playlist && <ol className="flex flex-wrap justify-center gap-2" aria-label={t('game.pick.title')}>
        {playlist.kinds.map((kind, index) => { const m = MODE_META[kind]; const Icon = m.icon; return <li key={kind} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold ${index === playlist.index ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          <Icon className="h-4 w-4" aria-hidden />{index + 1}. {t(m.title)}</li>; })}
      </ol>}
      {!game.friendMatch && <p className="font-serif text-lg font-extrabold" role="status">{t('class.live.playerCount', { n: game.players.length })}</p>}
      <ul className="flex flex-wrap justify-center gap-2" aria-label={t('class.live.players')}>
        {game.players.map((player, index) => <li key={index} style={{ animation: 'lg-pop .4s both' }}
          className={`max-w-full break-words rounded-full px-3 py-1.5 font-serif text-sm font-extrabold sm:text-lg ${player.team ? TEAM_STYLE[player.team].card : 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100'} ${player.you ? 'ring-2 ring-zinc-900 dark:ring-white' : ''}`}>
          {player.name}</li>)}
      </ul>
      {game.host && <ChunkyButton className="w-full sm:w-auto sm:px-12" disabled={busy || game.players.length < (game.friendMatch || game.teamPlay ? 2 : 1)}
        onClick={() => void act('advance')}><Play className="h-5 w-5" />{t('class.live.start')}</ChunkyButton>}
    </Panel>}

    {/* ---------- 3-2-1 ---------- */}
    {counting && game.mode !== 'mystery' && <CountdownBurst ms={clock.toStart} label={t('game.getReady')} />}

    {/* ---------- scores / rope ---------- */}
    {game.tug && <Panel><TugRope position={game.tug.position} limit={game.tug.limit} goldLabel={teamName('gold')} purpleLabel={teamName('purple')} /></Panel>}
    {game.mystery && !finished && <ul className="grid grid-cols-2 gap-3">
      {TEAM_IDS.map(id => <li key={id} className={`rounded-2xl p-3 text-center font-serif font-extrabold ${TEAM_STYLE[id].card} ${game.mystery!.turn === id && game.phase !== 'lobby' ? 'ring-4 ring-zinc-900 dark:ring-white' : ''}`}>
        <span className="block text-sm sm:text-lg">{teamName(id)}</span>
        <span className="block text-4xl tabular-nums sm:text-6xl">{game.mystery!.scores[id]}</span>
      </li>)}
    </ul>}

    {/* ---------- mystery pick ---------- */}
    {game.mystery && game.phase === 'pick' && <Panel className="space-y-3">
      <h2 className="text-center font-serif text-2xl font-extrabold sm:text-4xl">
        {t('game.mystery.turn', { team: teamName(game.mystery.turn), name: game.mystery.picker })}
      </h2>
      <MysteryBoxes boxes={game.mystery.boxes} canPick={game.mystery.youPick || game.host} teamLabel={teamName}
        youLabel={t(game.mystery.youPick ? 'game.mystery.pickYou' : 'game.mystery.pickHost')} onPick={box => { playGameSfx('box'); void act('pick', { box }); }} />
      <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">{t('game.mystery.rules')}</p>
    </Panel>}

    {/* ---------- question ---------- */}
    {(live || reveal) && question && <Panel className="space-y-[clamp(0.5rem,1.6dvh,1rem)]">
      <div className="flex items-center justify-between gap-3 font-serif font-extrabold">
        <div className="min-w-0">
          <p className="text-sm sm:text-xl">{t('class.live.round', { n: game.round + 1, total: game.rounds })}</p>
          {game.mystery?.box && <p className="text-sm text-violet-600 dark:text-violet-300 sm:text-lg">{t('game.mystery.box', { n: game.mystery.box })}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isHost && game.me && <span className="rounded-full bg-zinc-100 px-3 py-1 tabular-nums dark:bg-zinc-800">{game.me.score}</span>}
          {!isHost && game.me && <StreakFlame streak={game.me.streak} />}
          {live && <TimerRing left={clock.left} total={total} size={hostBig ? 80 : 56} />}
        </div>
      </div>

      {out && <p className="rounded-xl bg-zinc-100 p-3 text-center font-serif font-extrabold dark:bg-zinc-800" role="status">{t('game.out')}</p>}
      {game.mystery && !game.mystery.youAnswer && !game.host && live &&
        <p className="rounded-xl bg-zinc-100 p-3 text-center font-serif font-extrabold dark:bg-zinc-800" role="status">{t('game.otherTurn', { team: teamName(game.mystery.turn) })}</p>}

      {question.type === 'choice' && <>
        {question.prompt && <h2 className={`break-words text-center font-serif font-extrabold [overflow-wrap:anywhere] ${hostBig ? 'text-[clamp(1.75rem,min(8dvh,9vw),4.5rem)]' : 'text-[clamp(1.5rem,min(5.5dvh,8vw),2.5rem)]'} leading-tight`}>{question.prompt}</h2>}
        {question.statement && <p className={`break-words text-center font-serif font-bold text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-200 ${hostBig ? 'text-[clamp(1.25rem,4.5dvh,2.25rem)]' : 'text-[clamp(1.1rem,3.2dvh,1.5rem)]'}`}>= {question.statement}</p>}
        {question.speak && <button type="button" onClick={replay} className="dark-keep mx-auto flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-4 font-serif text-xl font-extrabold text-white shadow-[0_5px_0_0_#115e59] active:translate-y-[5px] active:shadow-none">
          <Headphones className="h-7 w-7" aria-hidden />{t('game.hear')}</button>}
        <ChoiceGrid question={question} selected={typeof game.selected === 'number' ? game.selected : undefined} correct={game.correct}
          reveal={reveal} locked={!canAnswer || busy || clock.left <= 0} big={hostBig}
          onPick={canAnswer ? option => void act('answer', { option }) : undefined} />
      </>}
      {question.type === 'type' && <TypeAnswer key={game.round} question={question} selected={typeof game.selected === 'string' ? game.selected : undefined}
        reveal={reveal} locked={!canAnswer || busy || clock.left <= 0} correctText={game.correctText} onReplay={replay}
        onSubmit={text => void act('answer', { text })} />}
      {question.type === 'match' && (game.host
        ? <p className="py-6 text-center font-serif text-2xl font-extrabold" role="status">{t('game.match.hostWait')}</p>
        : reveal ? <p className="text-center font-serif text-xl font-extrabold" role="status">{
          typeof game.selected === 'string' ? t('game.match.result', { n: game.selected.split('|')[0], x: game.selected.split('|')[1] }) : t('game.timeUp')}</p>
          : <MatchBoard key={game.round} question={question} locked={!canAnswer || clock.left <= 0 || typeof game.selected === 'string'} msLeft={clock.left}
            onFinish={(matched, mistakes) => void act('answer', { matched, mistakes })} />)}

      {live && <p role="status" className="text-center text-sm font-semibold sm:text-lg">
        {isHost || game.selected === undefined
          ? t('class.live.answersIn', { n: game.answered, total: game.active })
          : t('class.live.lockedAnswer')}
      </p>}
      {live && isHost && <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700" aria-hidden>
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${game.active ? game.answered * 100 / game.active : 0}%` }} />
      </div>}

      {/* feedback after each question */}
      {reveal && <div className="space-y-2 text-center" role="status">
        {!isHost && game.me && game.mode !== 'mystery' && <>
          {!game.friendMatch && <Mascot id={game.me.correct ? ((game.me.streak ?? 0) >= 3 ? 'reward.on-fire' : 'feed.nailed-it') : game.selected === undefined ? 'flow.thinking-time' : 'feed.oopsie'} size={96} />}
          <p className={`font-serif text-2xl font-extrabold ${game.me.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {game.me.correct ? t('game.correct') : game.selected === undefined ? t('game.timeUp') : t('game.wrong')}
            {game.me.gained > 0 ? ` +${game.me.gained}` : ''}
          </p>
          {!game.friendMatch && <p className="text-sm font-semibold">{t('game.rank', { n: game.me.rank, score: game.me.score })}</p>}
          {game.me.streak >= 2 && <p className="font-serif font-extrabold text-orange-600 dark:text-orange-300"><Flame className="mr-1 inline h-4 w-4" />{t('game.streak', { n: game.me.streak })}</p>}
        </>}
        {question.type === 'choice' && <p className="font-semibold">{t('class.live.answer', { answer: game.correctText ?? '' })}</p>}
        {game.mystery?.twist && <div className="flex flex-col items-center gap-1">
          {(() => { const meta = TWIST_META[game.mystery!.twist!]; const Icon = meta.icon;
            return <span className={`dark-keep inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-serif text-xl font-extrabold ${meta.tone}`}><Icon className="h-6 w-6" aria-hidden />{t(meta.label)}</span>; })()}
          <p className="font-serif font-bold">{t(`game.effect.${game.mystery.effect ?? 'miss'}` as 'game.effect.miss')}</p>
        </div>}
      </div>}

      {reveal && (game.host || game.friendMatch) && <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <ChunkyButton disabled={busy || !!game.friendMatch && clock.toStart > 0}
          onClick={() => void act(!game.friendMatch && !game.willFinish ? 'standings' : 'advance')}>
          {t(game.willFinish ? 'class.live.results' : game.friendMatch ? 'class.live.next' : 'game.stand.show')}
        </ChunkyButton>
        {isHost && <label className="inline-flex items-center gap-2 font-serif text-sm font-bold">
          <input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} /><FastForward className="h-4 w-4" aria-hidden />{t('game.auto')}
        </label>}
      </div>}
      {live && isHost && <div className="text-center"><button type="button" disabled={busy} onClick={() => void act('skip')}
        className="inline-flex items-center gap-1 font-serif text-sm font-extrabold underline"><SkipForward className="h-4 w-4" />{t('game.skip')}</button></div>}
    </Panel>}

    {/* ---------- standings after the answer ---------- */}
    {standing && <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3 font-serif font-extrabold">
        <h2 className="flex items-center gap-2 text-xl sm:text-3xl"><Trophy className="h-6 w-6" aria-hidden />{t('game.stand.title')}</h2>
        <p className="text-sm sm:text-xl">{t('class.live.round', { n: game.round + 1, total: game.rounds })}</p>
      </div>
      {isHost ? <>
        {game.teams.length > 0 && <TeamStandings teams={game.teams} big teamName={teamName} />}
        {game.mode !== 'mystery' && <StandingsBoard players={game.players} big teamName={teamName} />}
      </> : <>
        <MyStanding game={game} teamName={teamName} />
        {game.teams.length > 0 && !game.me && <TeamStandings teams={game.teams} teamName={teamName} />}
        {game.mode !== 'mystery' && <StandingsBoard players={game.players} teamName={teamName} />}
      </>}
      {isHost && <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <ChunkyButton disabled={busy} onClick={() => void act('advance')}>{t('class.live.next')}</ChunkyButton>
        <label className="inline-flex items-center gap-2 font-serif text-sm font-bold">
          <input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} /><FastForward className="h-4 w-4" aria-hidden />{t('game.auto')}
        </label>
      </div>}
      {!isHost && <p className="text-center text-sm font-semibold text-zinc-600 dark:text-zinc-300" role="status">{t('game.stand.waitHost')}</p>}
    </Panel>}

    {/* ---------- finished ---------- */}
    {finished && <Panel className="space-y-[clamp(0.5rem,1.8dvh,1.25rem)] text-center">
      {!game.friendMatch && <Mascot id={mine && leaders.some(l => l.you || l.team === mine.team && game.teamPlay) ? 'reward.champion' : 'mood.yay'} size={hostBig ? 'clamp(48px, 9dvh, 140px)' : 'clamp(44px, 8dvh, 100px)'} />}
      <h2 className="font-serif text-[clamp(1.5rem,5dvh,3rem)] font-extrabold leading-tight">{t(lastOfPlaylist ? 'game.final.title' : 'class.live.finished')}</h2>
      {playlist && <p className="font-serif text-sm font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('game.playlist.done', { n: playlist.index + 1, total: playlist.total, name: t(meta.title) })}</p>}
      {game.round >= 0 && leaders.length > 0 && shown[0]?.score >= 0 && <p className="font-serif text-[clamp(1.1rem,3.4dvh,1.875rem)] font-bold">
        {t(leaders.length > 1 ? 'class.live.tie' : 'class.live.winner', { names: leaders.map(l => l.name).join(', ') })}
      </p>}
      {game.friendMatch ? <ul className="mx-auto max-w-sm divide-y divide-slate-200 text-left dark:divide-zinc-700">
        {entries.map((entry, index) => <li key={index} className="flex items-center justify-between gap-3 py-3 font-bold">
          <span className="min-w-0 break-words">{entry.name}{entry.you ? ` · ${t('site.identity.you')}` : ''}</span><span className="tabular-nums">{entry.score}</span>
        </li>)}
      </ul> : <Podium entries={shown} />}
      {!game.friendMatch && !isHost && (lastOfPlaylist ? myOverall : game.me && game.mode !== 'mystery') &&
        <p className="font-serif text-lg font-extrabold">{lastOfPlaylist ? t('game.rank', { n: myOverall!.rank, score: myOverall!.score }) : t('game.rank', { n: game.me!.rank, score: game.me!.score })}</p>}

      {playlist && overallEntries.length > (lastOfPlaylist ? 3 : 0) && <section className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-1.5" aria-label={t('game.overall.title')}>
        <h3 className="mr-1 font-serif text-sm font-extrabold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('game.overall.title')}</h3>
        {(game.overall ?? []).slice(lastOfPlaylist ? 3 : 0, lastOfPlaylist ? 8 : 3).map(entry => <span key={entry.id}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${entry.you ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          <span className="font-serif font-extrabold tabular-nums">{entry.rank}.</span><span className="max-w-[9rem] truncate">{entry.name}</span><span className="font-serif font-extrabold tabular-nums">{entry.score}</span>
        </span>)}
      </section>}

      {hasNext && playlist?.next && <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800" role="status">
        <div className="min-w-0 text-left">
          <p className="font-serif text-lg font-extrabold sm:text-2xl">{t('game.next.title', { name: t(MODE_META[playlist.next].title) })}</p>
          <p className="font-serif text-sm font-extrabold tabular-nums text-zinc-600 dark:text-zinc-300">{t('game.next.in', { n: Math.max(0, nextIn) })}</p>
        </div>
        {isHost && <ChunkyButton disabled={busy} onClick={() => void act('nextGame')}><SkipForward className="h-5 w-5" aria-hidden />{t('game.next.start')}</ChunkyButton>}
      </div>}
    </Panel>}

    {/* ---------- standings ---------- */}
    {game.players.length > 0 && game.friendMatch && (reveal || finished) && <Panel className="space-y-3">
      <h2 className="flex items-center gap-2 font-serif font-extrabold sm:text-2xl"><Trophy className="h-5 w-5" />{t(reveal || finished || game.phase === 'pick' ? 'class.live.standings' : 'class.live.players')}</h2>
      {game.teams.length > 0 && (reveal || finished || game.phase === 'pick') && game.mode !== 'mystery' && <ul className="grid grid-cols-2 gap-3">
        {game.teams.map(team => <li key={team.id} className={`flex justify-between gap-2 rounded-xl p-3 font-serif font-extrabold sm:text-2xl ${TEAM_STYLE[team.id].card}`}>
          <span className="min-w-0 break-words">{teamName(team.id)}</span><span className="tabular-nums">{team.points}</span>
        </li>)}
      </ul>}
      {game.mode !== 'mystery' && <ol className="space-y-2">
        {game.players.slice(0, finished || game.host ? 60 : 8).map((player, index) => <li key={index}
          className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold sm:text-xl ${player.you ? 'bg-zinc-100 dark:bg-zinc-800' : ''} ${player.alive === false ? 'opacity-50 line-through' : ''}`}>
          <span className="min-w-0 break-words">
            {player.score !== undefined && <span className="mr-2 font-serif font-extrabold tabular-nums">{game.friendMatch && player.score === game.players[0]?.score ? 1 : index + 1}.</span>}
            {player.name}{player.you ? ` · ${t('site.identity.you')}` : ''}{player.team ? ` · ${teamName(player.team)}` : ''}
          </span>
          <span className="flex items-center gap-2">
            {reveal && player.gained ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{player.gained}</span> : null}
            <StreakFlame streak={player.streak ?? 0} />
            {player.score !== undefined && <span className="font-serif font-extrabold tabular-nums">{player.score}</span>}
          </span>
        </li>)}
      </ol>}
      {game.mode === 'mystery' && <ul className="flex flex-wrap gap-2">
        {game.players.map((player, index) => <li key={index} className={`rounded-full px-3 py-1 text-sm font-bold ${player.team ? TEAM_STYLE[player.team].card : ''}`}>{player.name}</li>)}
      </ul>}
    </Panel>}

    {/* mystery boxes stay visible while the question is on, so everyone sees what is left */}
    {game.mystery && (live || reveal) && <Panel><MysteryBoxes boxes={game.mystery.boxes} canPick={false} youLabel="" activeBox={game.mystery.box} teamLabel={teamName} onPick={() => undefined} /></Panel>}

    {finished ? game.friendMatch ? <ChunkyButton className="w-full" disabled={busy} onClick={() => void rematch()}>{t('friendGame.rematch')}</ChunkyButton>
      : hasNext ? null : <ChunkyButton className="w-full" onClick={onBack}>{backLabel}</ChunkyButton>
      : isHost && <button type="button" disabled={busy} onClick={() => void act('end')} className="font-serif text-sm font-extrabold underline">{t('class.live.end')}</button>}
  </div>;
}

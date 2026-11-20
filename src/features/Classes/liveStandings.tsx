import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Flame, Trophy } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { prefersReducedMotion } from '../../lib/gameAudio';
import { STANDINGS_TOP, type GameTeam, type LiveGameView } from '../../lib/liveWordGame';
import { TEAM_STYLE } from './liveGameKit';

type Row = LiveGameView['players'][number];

const MEDAL = ['bg-amber-400 text-zinc-900', 'bg-zinc-300 text-zinc-900', 'bg-orange-400 text-zinc-900'];

/** Top five with animated rank changes: rows start at last round's place, then slide to the new one. */
export function StandingsBoard({ players, big, teamName }: { players: Row[]; big?: boolean; teamName: (id: GameTeam) => string }) {
  const { t } = useUiLang();
  const top = [...players].filter(p => p.rank != null && p.rank <= STANDINGS_TOP).sort((a, b) => a.rank! - b.rank!);
  const still = prefersReducedMotion();
  const [settled, setSettled] = useState(still);
  useEffect(() => {
    if (still) return;
    const timer = window.setTimeout(() => setSettled(true), 900);
    return () => window.clearTimeout(timer);
  }, [still]);
  const height = big ? 84 : 60;
  const gap = big ? 12 : 8;
  const slot = (place: number) => place * (height + gap);
  return <ol aria-label={t('game.stand.title')} className="relative" style={{ height: Math.max(1, top.length) * (height + gap) - gap }}>
    {top.map(player => {
      const from = Math.min((player.prevRank ?? player.rank!) - 1, STANDINGS_TOP);
      const place = settled ? player.rank! - 1 : from;
      const moved = (player.prevRank ?? player.rank!) - player.rank!;
      const medal = MEDAL[player.rank! - 1] ?? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100';
      return <li key={player.id} className={`absolute inset-x-0 flex items-center gap-3 rounded-2xl border-2 px-3 sm:px-5 ${player.you ? 'border-zinc-900 dark:border-white' : 'border-slate-200 dark:border-zinc-700'} bg-white dark:bg-zinc-900`}
        style={{ height, transform: `translateY(${slot(place)}px)`, opacity: !settled && from >= STANDINGS_TOP ? 0 : 1,
          transition: still ? undefined : 'transform .8s cubic-bezier(.22,1,.36,1), opacity .5s', zIndex: 10 - player.rank! }}>
        <span className={`dark-keep flex shrink-0 items-center justify-center rounded-full font-serif font-extrabold ${medal} ${big ? 'h-12 w-12 text-2xl' : 'h-9 w-9 text-lg'}`}>{player.rank}</span>
        <span className={`min-w-0 flex-1 break-words font-serif font-extrabold leading-tight [overflow-wrap:anywhere] ${big ? 'text-2xl sm:text-4xl' : 'text-base sm:text-xl'}`}>
          {player.name}{player.you ? ` · ${t('site.identity.you')}` : ''}
          {player.team && <span className={`ml-2 text-xs font-bold ${TEAM_STYLE[player.team].text}`}>{teamName(player.team)}</span>}
        </span>
        {moved !== 0 && settled && <span className={`inline-flex shrink-0 items-center text-xs font-extrabold sm:text-base ${moved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {moved > 0 ? <ArrowUp className="h-4 w-4" aria-label={t('game.stand.up', { n: moved })} /> : <ArrowDown className="h-4 w-4" aria-label={t('game.stand.down', { n: -moved })} />}{Math.abs(moved)}</span>}
        {(player.streak ?? 0) >= 2 && <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-extrabold text-orange-600 dark:text-orange-300"><Flame className="h-4 w-4" aria-hidden />{player.streak}</span>}
        <span className="flex shrink-0 flex-col items-end leading-tight">
          <span className={`font-serif font-extrabold tabular-nums ${big ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-xl'}`}>{player.score ?? 0}</span>
          {!!player.gained && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:text-base">+{player.gained}</span>}
        </span>
      </li>;
    })}
  </ol>;
}

/** Team modes: both teams, leader first, with the gap. */
export function TeamStandings({ teams, big, teamName }: { teams: LiveGameView['teams']; big?: boolean; teamName: (id: GameTeam) => string }) {
  const { t } = useUiLang();
  if (!teams.length) return null;
  const gap = teams.length > 1 ? teams[0].points - teams[1].points : 0;
  return <div className="space-y-3">
    <ul className="grid grid-cols-2 gap-3">
      {teams.map((team, index) => <li key={team.id} className={`rounded-2xl p-3 text-center font-serif font-extrabold sm:p-5 ${TEAM_STYLE[team.id].card} ${index === 0 && gap > 0 ? 'ring-4 ring-zinc-900 dark:ring-white' : ''}`}>
        <span className={`block ${big ? 'text-xl sm:text-3xl' : 'text-sm sm:text-lg'}`}>{index === 0 && gap > 0 ? '👑 ' : ''}{teamName(team.id)}</span>
        <span className={`block tabular-nums ${big ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl'}`}>{team.points}</span>
      </li>)}
    </ul>
    <p className={`text-center font-serif font-extrabold ${big ? 'text-xl sm:text-3xl' : 'text-base'}`} role="status">
      {gap > 0 ? t('game.stand.teamLead', { team: teamName(teams[0].id), points: gap }) : t('game.stand.teamTie')}
    </p>
  </div>;
}

/** The student's phone: "You're #3 — 120 points behind Ali". */
export function MyStanding({ game, teamName }: { game: LiveGameView; teamName: (id: GameTeam) => string }) {
  const { t } = useUiLang();
  const me = game.me;
  const mine = game.players.find(p => p.you);
  const myTeam = mine?.team ? game.teams.find(team => team.id === mine.team) : undefined;
  if (!me) {
    // Mystery boxes have no personal score: show how the team is doing.
    if (!myTeam) return null;
    const rival = game.teams.find(team => team.id !== myTeam.id);
    const diff = rival ? myTeam.points - rival.points : 0;
    return <div className={`rounded-3xl p-5 text-center ${TEAM_STYLE[myTeam.id].card}`} role="status">
      <p className="font-serif text-3xl font-extrabold">{teamName(myTeam.id)} · {myTeam.points}</p>
      <p className="mt-1 font-serif text-lg font-bold">{diff > 0 ? t('game.stand.teamLead', { team: teamName(myTeam.id), points: diff })
        : diff < 0 ? t('game.stand.teamLead', { team: teamName(rival!.id), points: -diff }) : t('game.stand.teamTie')}</p>
    </div>;
  }
  const moved = me.prevRank ? me.prevRank - me.rank : 0;
  return <div className="rounded-3xl border-2 border-zinc-900 bg-white p-5 text-center shadow-[0_5px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[0_5px_0_0_#f4f4f5]" role="status">
    <p className="flex items-center justify-center gap-2 font-serif text-5xl font-extrabold sm:text-6xl">
      <Trophy className="h-8 w-8 text-amber-500" aria-hidden />{t('game.stand.you', { n: me.rank })}
    </p>
    <p className="mt-2 font-serif text-xl font-extrabold">
      {me.above ? t('game.stand.behind', { points: me.above.points, name: me.above.name })
        : me.below ? t('game.stand.first', { points: me.below.points, name: me.below.name }) : t('game.stand.alone')}
    </p>
    <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold text-zinc-600 dark:text-zinc-300">
      <span className="tabular-nums">{t('game.points', { n: me.score })}</span>
      {me.gained > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{me.gained}</span>}
      {moved !== 0 && <span className={`inline-flex items-center ${moved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {moved > 0 ? <ArrowUp className="h-4 w-4" aria-hidden /> : <ArrowDown className="h-4 w-4" aria-hidden />}{moved > 0 ? t('game.stand.up', { n: moved }) : t('game.stand.down', { n: -moved })}</span>}
      {me.streak >= 2 && <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-300"><Flame className="h-4 w-4" aria-hidden />{t('game.streak', { n: me.streak })}</span>}
    </p>
  </div>;
}

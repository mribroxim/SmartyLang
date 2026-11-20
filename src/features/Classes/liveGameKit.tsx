import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import {
  Bomb, Coins, Crown, Flame, Gem, Headphones, Keyboard, Shuffle, Skull, Sparkles, Timer, TrendingDown, Users, Zap,
} from 'lucide-react';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { prefersReducedMotion } from '../../lib/gameAudio';
import type { BoxTwist, GameKind, GameTeam } from '../../lib/liveWordGame';
import type { UiStringKey } from '../../lib/uiStrings';

/* ---------- game modes (host picker + labels) ---------- */

export const MODE_META: Record<GameKind, {
  icon: ElementType; sticker: StickerId; tint: string; title: UiStringKey; blurb: UiStringKey;
}> = {
  quiz: { icon: Zap, sticker: 'game.quiz-show-host', tint: 'bg-rose-500', title: 'game.mode.quiz', blurb: 'game.mode.quiz.d' },
  mystery: { icon: Gem, sticker: 'game.mystery-box', tint: 'bg-violet-500', title: 'game.mode.mystery', blurb: 'game.mode.mystery.d' },
  match: { icon: Shuffle, sticker: 'game.memory-match', tint: 'bg-sky-500', title: 'game.mode.match', blurb: 'game.mode.match.d' },
  spelling: { icon: Keyboard, sticker: 'write.spelling-bee', tint: 'bg-amber-400', title: 'game.mode.spelling', blurb: 'game.mode.spelling.d' },
  listen: { icon: Headphones, sticker: 'listen.sound-catcher', tint: 'bg-teal-500', title: 'game.mode.listen', blurb: 'game.mode.listen.d' },
  tf: { icon: Timer, sticker: 'game.time-attack', tint: 'bg-emerald-500', title: 'game.mode.tf', blurb: 'game.mode.tf.d' },
  scramble: { icon: Sparkles, sticker: 'game.puzzle-solver', tint: 'bg-fuchsia-500', title: 'game.mode.scramble', blurb: 'game.mode.scramble.d' },
  tug: { icon: Users, sticker: 'social.friendly-rivalry', tint: 'bg-orange-500', title: 'game.mode.tug', blurb: 'game.mode.tug.d' },
  elimination: { icon: Skull, sticker: 'game.boss-battle', tint: 'bg-zinc-700', title: 'game.mode.elimination', blurb: 'game.mode.elimination.d' },
};

/* ---------- answer colours: shape + colour so colour-blind players can tell tiles apart ---------- */

export const ANSWER_TILES = [
  { bg: 'bg-rose-600 shadow-[0_5px_0_0_#9f1239]', shape: '▲' },
  { bg: 'bg-blue-600 shadow-[0_5px_0_0_#1e3a8a]', shape: '◆' },
  { bg: 'bg-amber-400 text-zinc-900 shadow-[0_5px_0_0_#b45309]', shape: '●' },
  { bg: 'bg-emerald-600 shadow-[0_5px_0_0_#065f46]', shape: '■' },
] as const;

export const TEAM_STYLE: Record<GameTeam, { card: string; solid: string; text: string }> = {
  gold: { card: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100', solid: 'bg-amber-400 text-zinc-900', text: 'text-amber-600 dark:text-amber-300' },
  purple: { card: 'bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-100', solid: 'bg-violet-600 text-white', text: 'text-violet-600 dark:text-violet-300' },
};

export const TWIST_META: Record<BoxTwist, { icon: ElementType; label: UiStringKey; tone: string }> = {
  plain: { icon: Coins, label: 'game.twist.plain', tone: 'bg-emerald-500 text-white' },
  big: { icon: Gem, label: 'game.twist.big', tone: 'bg-sky-500 text-white' },
  double: { icon: Sparkles, label: 'game.twist.double', tone: 'bg-fuchsia-500 text-white' },
  steal: { icon: Zap, label: 'game.twist.steal', tone: 'bg-orange-500 text-white' },
  lose: { icon: TrendingDown, label: 'game.twist.lose', tone: 'bg-rose-500 text-white' },
  bomb: { icon: Bomb, label: 'game.twist.bomb', tone: 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' },
  swap: { icon: Shuffle, label: 'game.twist.swap', tone: 'bg-indigo-500 text-white' },
};

/* ---------- confetti (CSS only; skipped for reduced motion) ---------- */

const CONFETTI = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#fb923c'];
export function Confetti({ count = 54 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: (i * 37 + Math.random() * 30) % 100,
    delay: Math.random() * 1.6,
    dur: 2.6 + Math.random() * 2.4,
    size: 7 + Math.random() * 7,
    color: CONFETTI[i % CONFETTI.length],
    round: i % 3 === 0,
    drift: Math.random() * 120 - 60,
  })), [count]);
  if (prefersReducedMotion()) return null;
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
    <style>{`@keyframes lg-fall{0%{transform:translate3d(0,-12vh,0) rotate(0)}100%{transform:translate3d(var(--dx),108vh,0) rotate(720deg)}}`}</style>
    {pieces.map((p, i) => <span key={i} className={`absolute top-0 block ${p.round ? 'rounded-full' : 'rounded-[2px]'}`}
      style={{ left: `${p.left}%`, width: p.size, height: p.size * (p.round ? 1 : 1.6), background: p.color,
        ['--dx' as string]: `${p.drift}px`, animation: `lg-fall ${p.dur}s ${p.delay}s linear infinite` }} />)}
  </div>;
}

/* ---------- clock: counts toward startsAt and deadline using the server's offset ---------- */

export function useGameClock(serverTime: number | undefined, startsAt: number | null | undefined, deadline: number | null | undefined) {
  const [now, setNow] = useState(() => performance.now());
  const anchor = useMemo(() => performance.now(), [serverTime]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!deadline && !startsAt) return;
    const timer = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(timer);
  }, [deadline, startsAt]);
  const at = (stamp: number | null | undefined) => stamp == null || serverTime == null ? 0 : Math.max(0, stamp - serverTime - (now - anchor));
  return { toStart: at(startsAt), left: at(deadline) };
}

/* ---------- big countdown "3 2 1" ---------- */

export function CountdownBurst({ ms, label }: { ms: number; label: string }) {
  const n = Math.max(1, Math.ceil(ms / 1000));
  return <div role="status" aria-live="assertive" className="flex min-h-[46vh] flex-col items-center justify-center text-center">
    <style>{`@keyframes lg-pop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}`}</style>
    <p className="font-serif text-lg font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{label}</p>
    <p key={n} className="font-serif text-[9rem] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 sm:text-[12rem]"
      style={{ animation: 'lg-pop .45s cubic-bezier(.22,1,.36,1)' }}>{n}</p>
  </div>;
}

/* ---------- circular timer ---------- */

export function TimerRing({ left, total, size = 72 }: { left: number; total: number; size?: number }) {
  const secs = Math.ceil(left / 1000);
  const fraction = total > 0 ? Math.min(1, Math.max(0, left / (total * 1000))) : 0;
  const hot = secs <= 5;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative shrink-0" style={{ width: size, height: size }} role="timer" aria-label={`${secs}`}>
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-zinc-200 dark:stroke-zinc-700" />
      <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" strokeLinecap="round"
        className={hot ? 'stroke-rose-500' : 'stroke-emerald-500'}
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fraction)} />
    </svg>
    <span className={`absolute inset-0 flex items-center justify-center font-serif font-extrabold tabular-nums ${hot ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-50'}`}
      style={{ fontSize: size * 0.4 }}>{secs}</span>
  </div>;
}

export function StreakFlame({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 font-serif text-sm font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
    <Flame className="h-4 w-4" aria-hidden />{streak}
  </span>;
}

export function Mascot({ id, size = 84, className = '' }: { id: StickerId; size?: number | string; className?: string }) {
  return <Sticker id={id} size={size} mode="auto" priority="ambient" className={`mx-auto shrink-0 ${className}`} />;
}

/* ---------- tug of war ---------- */

export function TugRope({ position, limit, goldLabel, purpleLabel }: { position: number; limit: number; goldLabel: string; purpleLabel: string }) {
  const knob = 50 - (position / limit) * 46;
  return <div className="select-none" role="img" aria-label={`${goldLabel} ${position} ${purpleLabel}`}>
    <div className="mb-2 flex justify-between font-serif text-sm font-extrabold sm:text-lg">
      <span className={TEAM_STYLE.gold.text}>{goldLabel}</span><span className={TEAM_STYLE.purple.text}>{purpleLabel}</span>
    </div>
    <div className="relative h-14 sm:h-20">
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-amber-700/70 dark:bg-amber-200/60" />
      <div className="absolute left-0 top-1/2 h-14 w-[4%] -translate-y-1/2 rounded-l-xl bg-amber-400 sm:h-20" />
      <div className="absolute right-0 top-1/2 h-14 w-[4%] -translate-y-1/2 rounded-r-xl bg-violet-600 sm:h-20" />
      <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-y-1/2 bg-zinc-400 dark:bg-zinc-500" />
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out" style={{ left: `${knob}%` }}>
        <div className="h-9 w-9 rounded-full border-4 border-white bg-rose-500 shadow-lg dark:border-zinc-900 sm:h-12 sm:w-12" />
      </div>
    </div>
  </div>;
}

/* ---------- podium ---------- */

export type PodiumEntry = { name: string; score: number; team?: GameTeam; you?: boolean };
export function Podium({ entries, sharedRanks = false }: { entries: PodiumEntry[]; sharedRanks?: boolean }) {
  const top = entries.slice(0, 3);
  if (!top.length) return null;
  // visual order: 2nd, 1st, 3rd
  const order = [1, 0, 2].filter(i => top[i]);
  const heights = ['h-[clamp(4.5rem,15dvh,12rem)]', 'h-[clamp(3.25rem,10dvh,8rem)]', 'h-[clamp(2.25rem,7dvh,6rem)]'];
  const colors = ['bg-amber-400 text-zinc-900', 'bg-zinc-300 text-zinc-900', 'bg-orange-400 text-zinc-900'];
  return <ol className="mx-auto flex max-w-xl items-end justify-center gap-2 sm:gap-4" aria-label="Podium">
    {order.map(i => {
      const rankIndex = sharedRanks ? top.findIndex(entry => entry.score === top[i].score) : i;
      return <li key={i} className="flex min-w-0 flex-1 flex-col items-center">
      {rankIndex === 0 && <Crown className="mb-1 h-7 w-7 text-amber-500" aria-hidden />}
      <p className={`max-w-full break-words px-1 text-center font-serif text-sm font-extrabold sm:text-xl ${top[i].you ? 'underline decoration-2' : ''}`}>{top[i].name}</p>
      <p className="mb-1 font-serif text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300 sm:text-base">{top[i].score}</p>
      <div className={`flex w-full items-start justify-center rounded-t-2xl pt-2 font-serif text-3xl font-extrabold dark-keep sm:text-5xl ${heights[rankIndex]} ${colors[rankIndex]}`}>{rankIndex + 1}</div>
    </li>;
    })}
  </ol>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#27272a] sm:p-6 ${className}`}>{children}</section>;
}


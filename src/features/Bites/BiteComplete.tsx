import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Target, Timer, Zap } from 'lucide-react';
import type { BiteResult } from '../../lib/bites/types';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import { getSmartyCtx, learnerName, timeOfDay } from '../../lib/smarty/context';
import { getPrefs } from '../../lib/smarty/prefs';
import { goalXpForMinutes } from '../../lib/bites/xp';
import type { UiStringKey } from '../../lib/uiStrings';
import { ChunkyButton } from './lesson/chunky';
import { FishMeal } from '../../components/smarty/FishMeal';
import type { FishPart } from '../../lib/smarty/pantry';
import { useOptionalProgress } from '../../contexts/ProgressContext';

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) { setV(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** End-of-bite reward: Smarty celebrates, XP counts up, streak + goal, a personal recap line. */
export interface BiteAward {
  xp: number; xpToday: number; goal: number; streak: number; goalDone: boolean; heartGained?: number; dailyReplay?: boolean;
  /** Piece of Smarty's fish earned by this bite (see lib/smarty/pantry). */
  fish?: { part: FishPart; mealCompleted: boolean; pieces: number; meals: number };
}

export function BiteComplete({
  result, award, onContinue, continueLabel, onBack, title,
}: { result: BiteResult; award: BiteAward | null; onContinue: () => void; continueLabel?: string; onBack: () => void; title: string }) {
  const { t } = useUiLang();
  const progress = useOptionalProgress();
  const ctx = getSmartyCtx();
  const a: BiteAward = award ?? { xp: 0, xpToday: ctx.xpToday, goal: goalXpForMinutes(getPrefs().dailyMinutes), streak: ctx.streak, goalDone: ctx.goalDone };
  const xpShown = useCountUp(a.xp);
  const name = learnerName();
  const goal = a.goal;
  const goalPct = Math.min(100, Math.round((a.xpToday / goal) * 100));
  const mins = Math.max(1, Math.round(result.ms / 60000));

  const { sticker, line } = useMemo<{ sticker: StickerId; line: { key: UiStringKey; vars?: Record<string, string | number> } }>(() => {
    const night = timeOfDay() === 'night';
    if (result.perfect) return { sticker: 'mood.perfect-score', line: { key: 'bites.recap.perfect' } };
    if (result.recovered) return { sticker: 'feed.comeback-king', line: { key: 'bites.recap.comeback' } };
    if (result.accuracy < 50) return { sticker: 'pers.awkward', line: { key: 'bites.recap.tough' } };
    if (result.mistakes.length) return { sticker: night ? 'state.night-owl' : pickOne<StickerId>(['mood.party-time', 'feed.mistake-eraser']), line: { key: 'bites.recap.weakWord', vars: { word: result.mistakes[0] } } };
    if (night) return { sticker: 'state.night-owl', line: { key: 'bites.recap.night' } };
    return { sticker: pickOne<StickerId>(['mood.party-time', 'flow.finish-line', 'reward.snack-time', 'flow.next-lesson']), line: { key: name ? 'smarty.complete.named.1' : 'smarty.complete.1' } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = async () => {
    const text = t('bites.shareText', { title, n: result.accuracy });
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch { /* cancelled */ }
  };

  // Stat card: a solid label strip over a white value box (green/amber only for accuracy).
  const stat = (icon: React.ReactNode, label: string, value: string, strip: string, delay: number) => (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, type: 'spring', stiffness: 320, damping: 20 }}
      className={`flex-1 overflow-hidden rounded-2xl border-2 ${strip}`}>
      <div className="px-2 py-1 font-serif text-[11px] font-extrabold uppercase tracking-wider text-white">{label}</div>
      <div className="m-[2px] mt-0 flex items-center justify-center gap-1.5 rounded-[13px] bg-white py-3 font-serif text-xl font-extrabold text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {icon}{value}
      </div>
    </motion.div>
  );
  const accStrip = result.accuracy >= 80 ? 'border-emerald-500 bg-emerald-500' : result.accuracy >= 50 ? 'border-amber-500 bg-amber-500' : 'border-rose-500 bg-rose-500';
  const accWord = result.perfect ? t('lesson.accuracy.perfect') : result.accuracy >= 90 ? t('lesson.accuracy.great') : result.accuracy >= 70 ? t('lesson.accuracy.good') : t('lesson.stat.accuracy');

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-5 py-10 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <Sticker id={sticker} size={220} priority="hero" />
      </motion.div>
      <h1 className="mt-2 font-serif text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">{t('lesson.complete')}</h1>
      <p className="mt-2 max-w-sm text-[15px] font-semibold text-slate-600 dark:text-zinc-300">{t(line.key, { ...(name ? { name } : {}), ...(line.vars || {}) })}</p>

      <div className="mt-6 flex w-full max-w-md gap-2.5">
        {stat(<Zap className="h-5 w-5 fill-current" />, t('lesson.stat.xp'), String(xpShown), 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:[&>div:first-child]:text-zinc-900', 0.15)}
        {stat(<Target className="h-5 w-5" />, accWord, `${result.accuracy}%`, accStrip, 0.3)}
        {stat(<Timer className="h-5 w-5" />, t('lesson.stat.time'), t('bites.minutes', { n: mins }), 'border-slate-400 bg-slate-400 dark:border-zinc-600 dark:bg-zinc-600', 0.45)}
      </div>

      {a.fish && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-4 flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3 text-left shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
          <FishMeal filled={a.fish.mealCompleted ? 4 : a.fish.pieces} fresh={a.fish.part} size={104} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">
              {a.fish.mealCompleted ? t('kitchen.mealReady') : t('kitchen.gotPiece', { part: t(`kitchen.part.${a.fish.part}` as UiStringKey) })}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {a.fish.mealCompleted ? t('kitchen.mealReadyBody') : t('kitchen.pieceProgress', { n: a.fish.pieces, total: 4 })}
            </div>
            {a.fish.mealCompleted && (
              <button type="button" onClick={() => progress?.navigate({ tab: 'profile', path: [] })} className="mt-1 font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-900 underline underline-offset-4 dark:text-zinc-50">
                {t('kitchen.goFeed')}
              </button>
            )}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-4 flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 p-3 text-left">
        <Sticker id={a.goalDone ? (a.streak % 2 ? 'streak.daily-goal-reached' : 'reward.bloom') : a.streak >= 14 ? 'streak.consistency-champ' : a.streak >= 3 ? 'reward.skater' : 'reward.on-fire'} size={56} mode="once" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm font-black text-zinc-900 dark:text-zinc-50"><Flame className="w-4 h-4 text-orange-500" /> {t('celebrate.streakChip', { n: Math.max(1, a.streak) })}</div>
          <div className="mt-1.5 h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
            <motion.div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ delay: 0.6, duration: 0.8 }} />
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">{a.goalDone ? t('smarty.title.goal') : t('bites.goalProgress', { n: a.xpToday, goal })}</div>
        </div>
      </motion.div>

      <div className="mt-8 flex w-full max-w-md flex-col gap-2">
        {!!a.heartGained && <div className="mb-3 flex items-center justify-center gap-2"><Sticker id={a.heartGained > 1 ? 'game.mystery-box' : 'game.lucky-spin'} size={48} mode="once" /><p className="text-sm font-black text-rose-600 dark:text-rose-300">{t('hearts.earned', { n: a.heartGained })}</p></div>}
        {a.dailyReplay && <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('today.replayBody')}</p>}
        <ChunkyButton autoFocus onClick={onContinue} className="w-full">{continueLabel ?? t('smarty.continue')}</ChunkyButton>
        <div className="mt-1 flex gap-2.5">
          <ChunkyButton tone="secondary" onClick={onBack} className="flex-1 !px-3 !text-[13px]">{t('bites.backToPath')}</ChunkyButton>
          <ChunkyButton tone="secondary" onClick={share} className="flex-1 !px-3 !text-[13px]"><Sticker id="social.sharing-success" size={26} mode="still" /> {t('bites.share')}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

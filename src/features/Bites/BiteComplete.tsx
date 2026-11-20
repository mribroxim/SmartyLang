import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Target, Timer, X, Zap } from 'lucide-react';
import type { BiteResult } from '../../lib/bites/types';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import { getSmartyCtx, learnerName, timeOfDay } from '../../lib/smarty/context';
import { getPrefs } from '../../lib/smarty/prefs';
import { goalXpForMinutes } from '../../lib/bites/xp';
import type { UiStringKey } from '../../lib/uiStrings';
import { ChunkyButton } from './lesson/chunky';
import { useOptionalProgress } from '../../contexts/ProgressContext';
import type { WorkshopAward } from '../../lib/workshop/lessonHooks';
import { QuestRow, useDailyQuests } from '../Quests/dailyQuests';
import { Overlay, RewardBox, type Reward } from '../../components/RewardPopup';

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
  /** Coins earned by this bite (they buy Smarty's food and furniture). */
  coins?: number;
  /** Lesson bites: words refined, the next house delivery, unit gifts. */
  workshop?: WorkshopAward;
  /** A food boost that multiplied this bite's XP or coins. */
  boost?: { kind: 'xp' | 'coins'; mult: number };
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

  // Coin box first (if this bite paid coins), then the quest popup.
  // Quests need the progress context (absent in isolated previews).
  const quests = !!progress;
  const [popup, setPopup] = useState<'coins' | 'quests' | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setPopup(a.coins ? 'coins' : quests ? 'quests' : null), 1300);
    return () => window.clearTimeout(id);
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
    <div className="relative flex h-dvh flex-col items-center overflow-hidden bg-white px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-[max(env(safe-area-inset-top),12px)] text-center dark:bg-zinc-950">
      <button type="button" onClick={onBack} aria-label={t('complete.close')}
        className="absolute left-3 top-[max(env(safe-area-inset-top),12px)] z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
        <X className="h-6 w-6" />
      </button>

      {/* Everything fits one screen: the sticker shrinks on short phones. */}
      <div className="flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="min-h-0">
          <Sticker id={sticker} size="clamp(120px, 28dvh, 230px)" priority="hero" />
        </motion.div>
        <h1 className="mt-1 font-serif text-[clamp(1.6rem,4.2dvh,2.25rem)] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t('lesson.complete')}</h1>
        <p className="mt-1 max-w-sm text-[15px] font-semibold text-slate-600 dark:text-zinc-300">{t(line.key, { ...(name ? { name } : {}), ...(line.vars || {}) })}</p>

        <div className="mt-[clamp(12px,3dvh,28px)] flex w-full gap-2.5">
          {stat(<Zap className="h-5 w-5 fill-current" />, t('lesson.stat.xp'), String(xpShown), 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:[&>div:first-child]:text-zinc-900', 0.15)}
          {stat(<Target className="h-5 w-5" />, accWord, `${result.accuracy}%`, accStrip, 0.3)}
          {stat(<Timer className="h-5 w-5" />, t('lesson.stat.time'), t('bites.minutes', { n: mins }), 'border-slate-400 bg-slate-400 dark:border-zinc-600 dark:bg-zinc-600', 0.45)}
        </div>
        {!!a.heartGained && <div className="mt-3 flex items-center justify-center gap-2"><Sticker id={a.heartGained > 1 ? 'game.mystery-box' : 'game.lucky-spin'} size={40} mode="once" /><p className="text-sm font-black text-rose-600 dark:text-rose-300">{t('hearts.earned', { n: a.heartGained })}</p></div>}
        {a.boost && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 font-serif text-sm font-extrabold text-zinc-900"><Zap className="h-4 w-4 fill-current" />{t('rewards.boosted', { n: a.boost.mult, what: t(a.boost.kind === 'xp' ? 'rewards.what.xp' : 'rewards.what.coins') })}</p>}
        {a.dailyReplay && <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('today.replayBody')}</p>}
      </div>

      <div className="flex w-full max-w-md shrink-0 gap-2.5 pt-3">
        <ChunkyButton autoFocus onClick={onContinue} className="flex-[2]">{continueLabel ?? t('smarty.continue')}</ChunkyButton>
        <ChunkyButton tone="secondary" onClick={share} className="flex-1 !px-3"><Sticker id="social.sharing-success" size={26} mode="still" /> {t('bites.share')}</ChunkyButton>
      </div>

      {/* Rewards after the screen settles: first the coin box, then today's quests. */}
      <AnimatePresence>
        {popup === 'coins' && <RewardBox reward={{ coins: a.coins ?? 0 }} onDone={() => setPopup(quests ? 'quests' : null)} />}
        {popup === 'quests' && quests && <QuestPopup onDone={() => setPopup(null)} />}
      </AnimatePresence>
    </div>
  );
}

/** Today's three quests: finished ones open a reward box when tapped. */
function QuestPopup({ onDone }: { onDone: () => void }) {
  const { t } = useUiLang();
  const data = useDailyQuests();
  const [won, setWon] = useState<Reward | null>(null);
  return (
    <Overlay onClose={onDone}>
      <h2 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('complete.questsTitle')}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {data.quests.map((q) => (
          <li key={q.id}><QuestRow compact q={q} have={data.progress[q.metric] ?? 0} claimed={data.claimed.includes(q.id)} onOpen={() => { const r = data.claim(q.id); if (r) setWon(r); }} /></li>
        ))}
      </ul>
      <ChunkyButton autoFocus onClick={onDone} className="mt-5 w-full">{t('smarty.continue')}</ChunkyButton>
      <AnimatePresence>{won && <RewardBox z={60} reward={won} onDone={() => setWon(null)} />}</AnimatePresence>
    </Overlay>
  );
}

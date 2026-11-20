import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check, Gift } from 'lucide-react';
import { questsFor, type Quest, type QuestMetric } from '../../lib/quests';
import type { Reward } from '../../components/RewardPopup';
import { BOOST_MINUTES } from '../../lib/smarty/food';
import { useWorkshop } from '../../lib/workshop/store';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { seCard } from '../../components/ScreenShell';
import { Sticker } from '../../components/stickers/Sticker';
import { loadLocalCompletions } from '../../lib/completions';
import { getQuests, saveQuests, useQuests } from '../../lib/questState';
import { normalizeHabit, todayKey } from '../../lib/habitEngine';
import { fedToday, giveBoost, giveFood, todayCounts, usePantry } from '../../lib/smarty/pantry';
import { canPractice } from '../../lib/access';

// ── daily quests ────────────────────────────────────────────────────────
/** Called by the room when the learner talks to Smarty (for the "talk" quests). */
export function noteTalkedToSmarty() {
  const day = todayKey();
  const s = getQuests();
  const cur = s.date === day ? s : { date: day, claimed: [], talked: 0 };
  saveQuests({ ...cur, talked: cur.talked + 1 });
}

/** Turn a quest's reward into what the popup shows (a boost is always 2× for 15 min). */
export function rewardOf(q: Quest): Reward {
  const r = q.reward;
  return { coins: r.coins, xp: r.xp, food: r.food, foodCount: r.foodCount, boost: r.boost ? { kind: r.boost, mult: 2 } : undefined };
}

/** Today's three quests, how far each is, and a claim action (used by the Quests page and the lesson-complete popup). */
export function useDailyQuests() {
  const { habit, savedVocab, accountProfile, contentLang, earnCoins, earnXP } = useProgress();
  const pantry = usePantry();
  const questState = useQuests();
  const workshop = useWorkshop();
  const day = todayKey();
  const claimed = questState.date === day ? questState.claimed : [];
  const h = normalizeHabit(habit);
  const all = useMemo(() => loadLocalCompletions(), [claimed.length, h.dailyGoal.xpEarned]);
  const bitesToday = all.filter((c) => todayKey(new Date(c.timestamp)) === day && c.type === 'lesson-bite');
  const kindCount = (k: string) => bitesToday.filter((c) => (c.data as { kind?: string } | undefined)?.kind === k).length;
  const counts = todayCounts(pantry);
  const progress: Record<QuestMetric, number> = {
    xp: h.dailyGoal.xpEarned || 0,
    bites: bitesToday.length,
    perfect: bitesToday.filter((c) => (c.accuracy ?? 0) >= 100).length,
    accuracy: bitesToday.some((c) => (c.accuracy ?? 0) >= 90) ? 1 : 0,
    minutes: Math.floor(bitesToday.reduce((sum, c) => sum + ((c.data as { ms?: number } | undefined)?.ms ?? 0), 0) / 60000),
    mission: kindCount('listen-speak') + kindCount('mission'),
    daily: kindCount('today'),
    feed: Math.max(counts.fed, fedToday(pantry) ? 1 : 0),
    buy: counts.bought,
    words: (Object.values(savedVocab) as { timestamp?: number }[]).filter((v) => todayKey(new Date(v.timestamp ?? 0)) === day).length,
    streak: (h.dailyGoal.xpEarned || 0) > 0 ? 1 : 0,
    practice: kindCount('practice'),
    talk: questState.date === day ? questState.talked ?? 0 : 0,
    refined: Object.values(workshop.items[contentLang] ?? {}).filter((i) => i.stage >= 3 && todayKey(new Date(i.updatedAt)) === day).length,
  };
  const quests = questsFor(day, canPractice(accountProfile));
  /** Pay a finished quest once; returns what was won (for the reward popup) or null. */
  const claim = (id: string): Reward | null => {
    const q = quests.find((x) => x.id === id);
    if (!q || (progress[q.metric] ?? 0) < q.target) return null;
    if (getQuests().date === day && getQuests().claimed.includes(id)) return null;
    const reward = rewardOf(q);
    if (reward.coins) earnCoins(reward.coins);
    if (reward.xp) earnXP?.(reward.xp);
    if (reward.food) giveFood(reward.food, reward.foodCount ?? 1);
    if (reward.boost) giveBoost({ kind: reward.boost.kind, mult: reward.boost.mult, until: Date.now() + BOOST_MINUTES * 60_000 });
    const cur = getQuests();
    saveQuests({ ...cur, date: day, claimed: [...(cur.date === day ? cur.claimed : []), id] });
    return reward;
  };
  return { quests, progress, claimed, claim, all, h, pantry, workshop };
}

/** One quest row: sticker, title, progress bar, and an Open button once finished. */
export function QuestRow({ q, have, claimed, onOpen, compact }: { q: Quest; have: number; claimed: boolean; onOpen: () => void; compact?: boolean }) {
  const { t } = useUiLang();
  const done = have >= q.target;
  const shown = Math.min(q.target, have);
  return (
    <div className={`flex items-center gap-3 ${compact ? 'rounded-2xl border-2 border-slate-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900' : `${seCard} p-3`}`}>
      <Sticker id={q.sticker} size={compact ? 44 : 56} mode="still" className="shrink-0" />
      <div className="min-w-0 flex-1 text-left">
        <div className={`font-serif font-extrabold text-zinc-900 dark:text-zinc-50 ${compact ? 'text-sm' : 'text-[15px]'}`}>{t(`quests.q.${q.id}` as UiStringKey, { n: q.target })}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950">
            <motion.div className="h-full bg-amber-400" initial={{ width: 0 }} animate={{ width: `${(100 * shown) / q.target}%` }} transition={{ duration: 0.7 }} />
          </div>
          <span className="shrink-0 text-xs font-extrabold tabular-nums text-slate-500">{shown}/{q.target}</span>
        </div>
      </div>
      {claimed ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"><Check className="h-5 w-5" /></span>
      ) : done ? (
        <motion.button type="button" onClick={onOpen} animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.8 }}
          className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold uppercase text-zinc-900 shadow-[0_3px_0_0_#b45309] active:translate-y-[3px] active:shadow-none">
          {t('complete.questClaim')}
        </motion.button>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800"><Gift className="h-5 w-5 text-slate-400" /></span>
      )}
    </div>
  );
}


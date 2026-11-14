import { questsFor, type QuestId } from '../../lib/quests';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Lock } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { ScreenShell, seCard, seChipOff, seChipOn } from '../../components/ScreenShell';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { loadLocalCompletions } from '../../lib/completions';
import { getQuests, saveQuests, useQuests } from '../../lib/questState';
import { normalizeHabit, todayKey, visibleStreak, LEAGUE_TIERS, leagueMeta } from '../../lib/habitEngine';
import { earnFishPiece, fedToday, usePantry } from '../../lib/smarty/pantry';
import { canPractice } from '../../lib/access';
import { playSound } from '../../lib/audio';

// ── daily quests ────────────────────────────────────────────────────────
/** Called by the room when the learner talks to Smarty (for the "talk" quest). */
export function noteTalkedToSmarty() {
  const day = todayKey();
  const s = getQuests();
  const cur = s.date === day ? s : { date: day, claimed: [], talked: 0 };
  saveQuests({ ...cur, talked: cur.talked + 1 });
}

// ── achievements ────────────────────────────────────────────────────────
type Ach = { id: string; sticker: StickerId; tiers: number[]; value: number };

/**
 * Quests & achievements: three daily quests (each pays a fish piece for
 * Smarty's bowl) and tiered achievements that level up as you learn.
 */
export function QuestsView({ xp, league }: { xp: number; league: string }) {
  const { t } = useUiLang();
  const { habit, savedVocab, accountProfile } = useProgress();
  const pantry = usePantry();
  const [tab, setTab] = useState<'quests' | 'achievements'>('quests');
  const questState = useQuests();
  const claimed = questState.date === todayKey() ? questState.claimed : [];

  const day = todayKey();
  const h = normalizeHabit(habit);
  const max = canPractice(accountProfile);
  const all = useMemo(() => loadLocalCompletions(), [claimed.length]);
  const today = all.filter((c) => todayKey(new Date(c.timestamp)) === day);
  const bitesToday = today.filter((c) => c.type === 'lesson-bite');
  const talked = questState;

  const progress: Record<QuestId, number> = {
    xp: h.dailyGoal.xpEarned || 0,
    bites: bitesToday.length,
    feed: fedToday(pantry) ? 1 : 0,
    perfect: bitesToday.some((c) => (c.accuracy ?? 0) >= 100) ? 1 : 0,
    words: (Object.values(savedVocab) as { timestamp?: number }[]).filter((v) => todayKey(new Date(v.timestamp ?? 0)) === day).length,
    streak: (h.dailyGoal.xpEarned || 0) > 0 ? 1 : 0,
    practice: bitesToday.some((c) => (c.data as { kind?: string } | undefined)?.kind === 'practice') ? 1 : 0,
    talk: talked.date === day ? talked.talked ?? 0 : 0,
  };
  const quests = questsFor(day, max);
  const claim = (id: string) => {
    if (claimed.includes(id)) return;
    earnFishPiece();
    playSound('level-up', { mascot: false });
    const next = [...claimed, id];
    saveQuests({ ...getQuests(), date: day, claimed: next });
  };
  const msLeft = (() => { const n = new Date(); const end = new Date(n); end.setHours(24, 0, 0, 0); return end.getTime() - n.getTime(); })();
  const hoursLeft = Math.floor(msLeft / 3_600_000), minsLeft = Math.floor((msLeft % 3_600_000) / 60_000);

  const bites = all.filter((c) => c.type === 'lesson-bite');
  const achievements: Ach[] = [
    { id: 'streak', sticker: 'streak.consistency-champ', tiers: [3, 7, 30, 100], value: Math.max(h.globalStreak.max || 0, visibleStreak(h)) },
    { id: 'bites', sticker: 'flow.learning-path', tiers: [10, 50, 200, 500], value: bites.length },
    { id: 'perfect', sticker: 'mood.perfect-score', tiers: [1, 10, 50, 150], value: bites.filter((c) => (c.accuracy ?? 0) >= 100).length },
    { id: 'words', sticker: 'vocab.word-collector', tiers: [10, 50, 200, 500], value: Object.keys(savedVocab).length },
    { id: 'meals', sticker: 'reward.snack-time', tiers: [1, 10, 50, 200], value: pantry.eaten },
    { id: 'xp', sticker: 'achieve.xp-collector', tiers: [500, 2000, 10000, 50000], value: xp },
    { id: 'league', sticker: 'achieve.rank-promotion', tiers: [2, 3, 4, 5], value: LEAGUE_TIERS.findIndex((l) => l.id === leagueMeta(league).id) + 1 },
    { id: 'certificate', sticker: 'season.graduation-day', tiers: [1], value: h.badges?.includes('certificate') ? 1 : 0 },
    { id: 'goalWeek', sticker: 'streak.daily-goal-reached', tiers: [1], value: h.badges?.includes('goalWeek') ? 1 : 0 },
  ];

  return (
    <ScreenShell stickers={['game.challenge-accepted', 'achieve.trophy-lift']} title={t('nav.quests')} subtitle={tab === 'quests' ? t('quests.subtitle') : t('ach.subtitle')}>
      <div className="mb-4 flex gap-2" role="tablist">
        {(['quests', 'achievements'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`flex-1 rounded-2xl py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[2px] ${tab === k ? seChipOn : seChipOff}`}>
            {t(`quests.tab.${k}` as UiStringKey)}
          </button>
        ))}
      </div>

      {tab === 'quests' ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{t('quests.daily')}</h2>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"><Clock className="h-3.5 w-3.5" />{t('quests.left', { h: hoursLeft, m: minsLeft })}</span>
          </div>
          <ul className="space-y-3">
            {quests.map((q) => {
              const value = Math.min(progress[q.id], q.target);
              const done = value >= q.target;
              const got = claimed.includes(q.id);
              return (
                <li key={q.id} className={`${seCard} flex items-center gap-3 p-3.5`}>
                  <Sticker id={q.sticker} size={56} mode="still" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">{t(`quests.q.${q.id}` as UiStringKey, { n: q.target })}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-zinc-900 bg-slate-100 dark:border-zinc-100 dark:bg-zinc-800">
                        <motion.div className={`h-full rounded-full ${done ? 'bg-amber-400' : 'bg-zinc-900 dark:bg-zinc-100'}`} initial={false} animate={{ width: `${(value / q.target) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-extrabold tabular-nums text-slate-500">{value}/{q.target}</span>
                    </div>
                  </div>
                  {got ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Check className="h-5 w-5" strokeWidth={3} /></span>
                  ) : done ? (
                    <motion.button type="button" onClick={() => claim(q.id)} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="dark-keep shrink-0 rounded-xl bg-zinc-900 px-3 py-2.5 font-serif text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#000] active:translate-y-[3px] active:shadow-none dark:bg-zinc-100 dark:text-zinc-900">
                      {t('quests.claim')}
                    </motion.button>
                  ) : (
                    <img src="/room3d/fish.webp" alt="" className="h-10 w-10 shrink-0 object-contain opacity-80" title={t('quests.reward')} />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-center text-xs font-semibold text-slate-400">{t('quests.reward')}</p>
        </>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {achievements.map((a) => {
            const level = a.tiers.filter((n) => a.value >= n).length;
            const maxed = level >= a.tiers.length;
            const next = a.tiers[Math.min(level, a.tiers.length - 1)];
            const prev = level > 0 ? a.tiers[level - 1] : 0;
            const pct = maxed ? 100 : Math.max(0, Math.min(100, ((a.value - prev) / Math.max(1, next - prev)) * 100));
            return (
              <li key={a.id} className={`${seCard} flex items-center gap-3 p-3.5`}>
                <div className={`relative shrink-0 ${level === 0 ? 'opacity-50 grayscale' : ''}`}>
                  <Sticker id={a.sticker} size={58} mode="still" />
                  {level === 0 && <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-white"><Lock className="h-3 w-3" /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-serif text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">{t(`ach.${a.id}.title` as UiStringKey)}</span>
                    {a.tiers.length > 1 && <span className="shrink-0 text-[11px] font-extrabold uppercase text-slate-400">{t('ach.level', { n: level, max: a.tiers.length })}</span>}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{maxed ? t('ach.maxed') : t(`ach.${a.id}.desc` as UiStringKey, { n: next })}</div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div className={`h-full rounded-full ${maxed ? 'bg-amber-400' : 'bg-zinc-900 dark:bg-zinc-100'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ScreenShell>
  );
}

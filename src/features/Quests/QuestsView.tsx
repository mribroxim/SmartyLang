import { RewardBox, type Reward } from '../../components/RewardPopup';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronRight, Clock, Lock } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { ScreenShell, seCard, seChipOff, seChipOn } from '../../components/ScreenShell';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { todayKey, visibleStreak, LEAGUE_TIERS, leagueMeta } from '../../lib/habitEngine';
import { useRoom } from '../../lib/smarty/room';
import { useHouse } from '../../lib/house/store';
import { PHASES, phaseProgress } from '../../lib/house/phases';
import { ProgressView } from '../Progress/ProgressView';

export { noteTalkedToSmarty, rewardOf, useDailyQuests, QuestRow } from './dailyQuests';
import { useDailyQuests, QuestRow } from './dailyQuests';

// ── achievements ────────────────────────────────────────────────────────
type Ach = { id: string; sticker: StickerId; tiers: number[]; value: number };

/**
 * Quests & achievements: three daily quests (each pays coins for
 * Smarty's bowl) and tiered achievements that level up as you learn.
 */
export function QuestsView({ xp, league, onOpenProgress }: { xp: number; league: string; onOpenProgress?: () => void }) {
  const { t } = useUiLang();
  const { savedVocab, contentLang, userProfile } = useProgress();
  const [tab, setTab] = useState<'quests' | 'achievements'>('quests');
  const { quests, progress, claimed, claim: claimQuest, all, h, pantry, workshop } = useDailyQuests();
  const [won, setWon] = useState<Reward | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const claim = (id: string) => { const r = claimQuest(id); if (r) setWon(r); };
  const room = useRoom();
  const house = useHouse();
  const msLeft = (() => { const n = new Date(); const end = new Date(n); end.setHours(24, 0, 0, 0); return end.getTime() - n.getTime(); })();
  const hoursLeft = Math.floor(msLeft / 3_600_000), minsLeft = Math.floor((msLeft % 3_600_000) / 60_000);

  const bites = all.filter((c) => c.type === 'lesson-bite');
  const kindCount = (k: string) => bites.filter((c) => (c.data as { kind?: string } | undefined)?.kind === k).length;
  const hourCount = (test: (h: number) => boolean) => bites.filter((c) => test(new Date(c.timestamp).getHours())).length;
  const items = Object.values(workshop.items[contentLang] ?? {});
  const lessons = new Set(bites.map((c) => (c.data as { passageId?: string } | undefined)?.passageId).filter(Boolean)).size;
  const days = new Set(all.map((c) => todayKey(new Date(c.timestamp)))).size;
  const roomsBuilt = PHASES.filter((ph) => phaseProgress(house.delivered, contentLang, ph).done).length;
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
    { id: 'lessons', sticker: 'flow.finish-line', tiers: [5, 25, 100, 300], value: lessons },
    { id: 'days', sticker: 'streak.daily-check-in', tiers: [7, 30, 100, 365], value: days },
    { id: 'practice', sticker: 'game.challenge-accepted', tiers: [5, 25, 100, 300], value: kindCount('practice') },
    { id: 'review', sticker: 'vocab.memory-refresh', tiers: [5, 25, 100, 300], value: kindCount('refine') + kindCount('today') },
    { id: 'mastered', sticker: 'achieve.mastery-aura', tiers: [10, 50, 200, 500], value: items.filter((i) => i.stage >= 5).length },
    { id: 'speaker', sticker: 'speak.mic-ready', tiers: [10, 50, 200, 500], value: items.filter((i) => i.stage >= 4).length },
    { id: 'earlyBird', sticker: 'state.wake-up', tiers: [1, 10, 50], value: hourCount((x) => x >= 5 && x < 8) },
    { id: 'nightOwl', sticker: 'state.night-owl', tiers: [1, 10, 50], value: hourCount((x) => x >= 21 || x < 2) },
    { id: 'weekend', sticker: 'reward.bloom', tiers: [5, 25, 100], value: bites.filter((c) => [0, 6].includes(new Date(c.timestamp).getDay())).length },
    { id: 'speedy', sticker: 'pose.zoomies', tiers: [5, 25, 100], value: bites.filter((c) => { const ms = (c.data as { ms?: number } | undefined)?.ms; return typeof ms === 'number' && ms > 0 && ms < 120_000; }).length },
    { id: 'coins', sticker: 'reward.champion', tiers: [100, 500, 2000, 10000], value: userProfile.coins },
    { id: 'decorator', sticker: 'state2.saved', tiers: [10, 20, 35, 60], value: room.owned.length },
    { id: 'builder', sticker: 'achieve.trophy-lift', tiers: [1, 3, 6, 12], value: roomsBuilt },
    { id: 'chef', sticker: 'reward.snack-time', tiers: [3, 7, 30], value: pantry.feedStreak },
  ];

  if (showProgress) return <ProgressView onBack={() => setShowProgress(false)} />;

  return (
    <ScreenShell stickers={['game.challenge-accepted', 'achieve.trophy-lift']} title={t('nav.quests')}>
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
            {quests.map((q) => (
              <li key={q.id}><QuestRow q={q} have={progress[q.metric] ?? 0} claimed={claimed.includes(q.id)} onOpen={() => claim(q.id)} /></li>
            ))}
          </ul>
          <AnimatePresence>{won && <RewardBox reward={won} onDone={() => setWon(null)} />}</AnimatePresence>
        </>
      ) : (
        <>
        <button type="button" onClick={() => (onOpenProgress ? onOpenProgress() : setShowProgress(true))}
          className={`${seCard} mb-3 flex w-full items-center justify-between gap-3 p-3.5 text-start active:translate-y-[2px]`}>
          <span className="min-w-0">
            <span className="block font-serif text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">{t('progress.link')}</span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-zinc-400">{t('progress.link.sub')}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 rtl:rotate-180" />
        </button>
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
        </>
      )}
    </ScreenShell>
  );
}

import { DialogSurface } from './DialogSurface';
import React from 'react';
import { motion } from 'motion/react';
import { Flame, Target, X, Medal } from 'lucide-react';
import { BADGE_META } from '../lib/habitEngine';
import { Smarty } from './mascot/Smarty';
import { useUiLang } from '../contexts/UiLangContext';
import { learnerName } from '../lib/smarty/context';

interface Props {
  open: boolean;
  onClose: () => void;
  goalJustCompleted?: boolean;
  streakTicked?: boolean;
  streak?: number;
  newBadges?: string[];
}

export function HabitCelebrateModal({
  open,
  onClose,
  goalJustCompleted,
  streakTicked,
  streak = 0,
  newBadges = [],
}: Props) {
  const { t, tText } = useUiLang();
  if (!open) return null;
  const name = learnerName();
  const sticker = goalJustCompleted ? 'streak.daily-goal-reached' : streakTicked ? 'streak.streak-growing' : 'reward.badge-earned';

  return (
    <DialogSurface onClose={onClose} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 pt-20 md:pt-20 mt-16 max-w-sm w-full relative border-2 dark:border-zinc-700 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]"
      >
        {/* Smarty jumps out of the top of the card */}
        <div className="absolute left-1/2 -top-20 -translate-x-1/2">
          <Smarty sticker={sticker} size={150} priority="hero" title={t("core.habitcelebratemodal.smarty_celebrating_2c99b1")} />
        </div>
        <button aria-label={t('a11y.close')}
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          {goalJustCompleted && (
            <div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-black text-zinc-900 dark:text-zinc-50">{t('smarty.title.goal')}</h2>
              <p className="text-slate-500 text-sm mt-1">{name ? t('celebrate.goal.named', { name }) : t('celebrate.goal')}</p>
            </div>
          )}

          {streakTicked && (
            <div className={`${goalJustCompleted ? 'pt-2 border-t border-slate-100 dark:border-zinc-800' : ''}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 font-bold">
                <Flame className="w-5 h-5" /> {t('celebrate.streakChip', { n: streak })}
              </div>
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="space-y-2 pt-2">
              {newBadges.map(id => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-left">
                  <Medal className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-900 text-sm">{tText(BADGE_META[id]?.label || id)}</div>
                    <div className="text-xs text-amber-700/80">{tText(BADGE_META[id]?.desc || '')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 py-3 rounded-2xl bg-zinc-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
          >
            {t('celebrate.keepGoing')}
          </button>
        </div>
      </motion.div>
    </DialogSurface>
  );
}

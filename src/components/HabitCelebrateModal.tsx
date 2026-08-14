import React from 'react';
import { Flame, Target, X, Medal } from 'lucide-react';
import { BADGE_META, DAILY_GOAL_XP } from '../lib/habitEngine';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative border border-slate-200 dark:border-zinc-700">
        <button
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
              <h2 className="text-2xl font-serif font-black text-zinc-900 dark:text-zinc-50">Daily goal done!</h2>
              <p className="text-slate-500 text-sm mt-1">You hit {DAILY_GOAL_XP} XP today. Come back tomorrow.</p>
            </div>
          )}

          {streakTicked && (
            <div className={`${goalJustCompleted ? 'pt-2 border-t border-slate-100 dark:border-zinc-800' : ''}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 font-bold">
                <Flame className="w-5 h-5" /> {streak}-day streak
              </div>
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="space-y-2 pt-2">
              {newBadges.map(id => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-left">
                  <Medal className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-900 text-sm">{BADGE_META[id]?.label || id}</div>
                    <div className="text-xs text-amber-700/80">{BADGE_META[id]?.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 py-3 rounded-full bg-zinc-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-colors"
          >
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}

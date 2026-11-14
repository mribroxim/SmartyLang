import { createContext, useContext, type ReactNode } from 'react';
import type { HabitState } from '../lib/habitEngine';
import type { ContentLang } from '../lib/contentLang';
import type { BiteResult } from '../lib/bites/types';
import type { BiteAward } from '../features/Bites/BiteComplete';
import type { AppRoute } from '../lib/appRoute';
import type { UserAccountProfile } from '../firebase';
import type { ReviewVocab } from '../lib/bites/dailySession';
import type { Level } from '../lib/reading-logic';

export interface ProgressValue {
  userProfile: { xp: number; coins: number; level: number; league: string };
  habit: HabitState;
  contentLang: ContentLang;
  previewMode: boolean;
  unlimitedHearts: boolean;
  accountProfile: UserAccountProfile | null;
  savedVocab: ReviewVocab;
  problemWords: Record<string, { count: number; lastMissed: number }>;
  history: Record<string, any[]>;
  level: Level;
  navigate: (route: AppRoute) => void;
  spendCoins: (amount: number) => boolean;
  saveWord: (word: string, definition: string) => void;
  awardBiteXP: (result: BiteResult, title: string) => BiteAward;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ value, children }: { value: ProgressValue; children: ReactNode }) {
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('ProgressProvider is missing');
  return value;
}

/** Same as useProgress, but null outside the provider (for screens that also render standalone). */
export function useOptionalProgress() {
  return useContext(ProgressContext);
}

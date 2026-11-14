/**
 * Pools of Smarty's hand-written lines (keys in src/locales/ui.en.json).
 * `named` lines use {name} and are only picked when Smarty knows the learner's name.
 */
import type { UiStringKey } from '../uiStrings';

const seq = (prefix: string, n: number, from = 1) =>
  Array.from({ length: n }, (_, i) => `${prefix}.${i + from}` as UiStringKey);

export interface Pool { plain: UiStringKey[]; named?: UiStringKey[] }

export const POOLS = {
  correct: { plain: [...seq('mascot.correct', 5), ...seq('smarty.correct', 7)], named: seq('smarty.correct.named', 4) },
  wrong: { plain: [...seq('mascot.wrong', 3), ...seq('smarty.wrong', 5)], named: seq('smarty.wrong.named', 3) },
  combo: { plain: ['mascot.combo' as UiStringKey, ...seq('smarty.combo', 2)] },
  close: { plain: seq('smarty.close', 3) },
  fixed: { plain: seq('smarty.fixed', 3) },
  hint: { plain: seq('smarty.hint', 2) },
  fast: { plain: seq('smarty.fast', 2) },
  closeCall: { plain: seq('smarty.closeCall', 2) },
  dizzy: { plain: seq('smarty.dizzy', 3) },
  facepalm: { plain: seq('smarty.facepalm', 2) },
  oopsie: { plain: seq('smarty.oopsie', 2) },
  complete: { plain: [...seq('mascot.complete', 3), ...seq('smarty.complete', 3)], named: seq('smarty.complete.named', 2) },
  goal: { plain: ['mascot.goal' as UiStringKey, ...seq('smarty.goal', 2)] },
  streakMilestone: { plain: ['mascot.streak' as UiStringKey, ...seq('smarty.streak.milestone', 2)] },
  streakKept: { plain: seq('smarty.streak.kept', 3), named: seq('smarty.streak.kept.named', 1) },
  streakLost: { plain: seq('smarty.streak.lost', 3) },
  freeze: { plain: seq('smarty.streak.freeze', 1) },
  levelUp: { plain: seq('smarty.levelUp', 2) },
  badge: { plain: seq('smarty.badge', 2) },
  league: { plain: seq('smarty.league', 2) },
  offline: { plain: seq('smarty.offline', 1) },
  online: { plain: seq('smarty.online', 1) },
  error: { plain: seq('smarty.error', 2) },
  saved: { plain: seq('smarty.vocabSaved', 3) },
  removed: { plain: seq('smarty.vocabRemoved', 1) },
  vocabMilestone: { plain: seq('smarty.vocabMilestone', 1) },
  lang: { plain: seq('smarty.lang', 2) },
  meow: { plain: seq('smarty.egg.meow', 2) },
  blink: { plain: seq('smarty.egg.blink', 1), named: seq('smarty.egg.blink.named', 1) },
  idlePage: { plain: seq('smarty.idle.page', 3) },
  dream: { plain: seq('smarty.idle.dream', 1) },
  idleSession: { plain: seq('smarty.idle.session', 2) },
  heartsLost: { plain: seq('smarty.hearts.lost', 3) },
  heartsLast: { plain: seq('smarty.hearts.last', 1), named: seq('smarty.hearts.last.named', 1) },
  heartsEmpty: { plain: seq('smarty.hearts.empty', 2) },
  heartsRefill: { plain: seq('smarty.hearts.refill', 2) },
  premium: { plain: seq('smarty.premium', 1) },
  returnBack: { plain: seq('smarty.return', 3), named: seq('smarty.return.named', 1) },
  prefsName: { plain: seq('smarty.prefs.name', 1), named: seq('smarty.prefs.name.named', 1) },
  prefsSaved: { plain: seq('smarty.prefs.saved', 1) },
  update: { plain: seq('smarty.update', 1) },
  download: { plain: seq('smarty.download', 2) },
  cert: { plain: ['mascot.cert' as UiStringKey, ...seq('smarty.cert', 1)] },
} satisfies Record<string, Pool>;

export type PoolName = keyof typeof POOLS;

/** Titles for toasts and full-screen celebrations. */
export const TITLES = {
  levelUp: 'smarty.title.levelUp',
  streak: 'smarty.title.streak',
  league: 'smarty.title.league',
  badge: 'smarty.title.badge',
  goal: 'smarty.title.goal',
  cert: 'smarty.title.cert',
  premium: 'smarty.title.premium',
  lang: 'smarty.title.lang',
  offline: 'smarty.title.offline',
  online: 'smarty.title.online',
  error: 'smarty.title.error',
  saved: 'smarty.title.saved',
  removed: 'smarty.title.removed',
  vocabMilestone: 'smarty.title.vocabMilestone',
  streakLost: 'smarty.title.streakLost',
  freeze: 'smarty.title.freeze',
  heartsRefill: 'smarty.title.heartsRefill',
  update: 'smarty.title.update',
  download: 'smarty.title.download',
} as const satisfies Record<string, UiStringKey>;

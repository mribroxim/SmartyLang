/** Everything Smarty can react to. Emitted with emitSmarty() from anywhere. */
export type SmartyEvent =
  | { type: 'answer'; correct: boolean; questionId?: string; word?: string; close?: boolean; retry?: boolean; usedHint?: boolean; ms?: number; msLeft?: number }
  | { type: 'session.complete'; accuracy?: number; perfect?: boolean; mistakes?: number }
  | { type: 'session.start' }
  | { type: 'goal.complete' }
  | { type: 'streak.kept'; n: number }
  | { type: 'streak.milestone'; n: number }
  | { type: 'streak.lost'; prev: number }
  | { type: 'streak.freezeUsed' }
  | { type: 'xp.levelUp'; level: number }
  | { type: 'badge'; id: string }
  | { type: 'league.promoted'; to: string }
  | { type: 'hearts.lost'; left: number }
  | { type: 'hearts.empty' }
  | { type: 'hearts.refill'; n: number }
  | { type: 'vocab.saved'; word: string }
  | { type: 'vocab.removed'; word: string; undo?: () => void }
  | { type: 'vocab.milestone'; n: number }
  | { type: 'lang.switch'; to: string }
  | { type: 'net'; online: boolean }
  | { type: 'error'; where?: string }
  | { type: 'idle'; ms: number; where: 'session' | 'page' }
  | { type: 'tap.smarty'; count: number }
  | { type: 'premium.activated' }
  | { type: 'return'; daysAway: number }
  | { type: 'prefs.saved'; name?: boolean }
  | { type: 'app.update' }
  | { type: 'download' }
  | { type: 'certificate'; level: string };

export type SmartyEventType = SmartyEvent['type'];

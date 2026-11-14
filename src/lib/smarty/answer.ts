import { playSound } from '../audio';
import { emitSmarty } from './bus';

/** Only graded learner answers belong here. Recording/network failures use ordinary sounds. */
export function answerFeedback(correct: boolean, meta: { questionId: string; word?: string; close?: boolean; retry?: boolean; usedHint?: boolean }) {
  playSound(correct ? 'success' : 'fail', { mascot: false });
  emitSmarty({ type: 'answer', correct, ...meta });
}

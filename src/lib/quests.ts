import type { StickerId } from '../components/stickers/Sticker';
export type QuestId = 'xp' | 'bites' | 'feed' | 'perfect' | 'words' | 'practice' | 'talk' | 'streak';
export type Quest = { id: QuestId; target: number; sticker: StickerId; max?: boolean };
export const QUEST_POOL: Quest[] = [
  { id: 'xp', target: 30, sticker: 'achieve.xp-collector' },
  { id: 'bites', target: 2, sticker: 'flow.finish-line' },
  { id: 'feed', target: 1, sticker: 'reward.snack-time' },
  { id: 'perfect', target: 1, sticker: 'mood.perfect-score' },
  { id: 'words', target: 3, sticker: 'vocab.word-collector' },
  { id: 'streak', target: 1, sticker: 'streak.streak-keeper' },
  { id: 'practice', target: 1, sticker: 'game.challenge-accepted', max: true },
  { id: 'talk', target: 1, sticker: 'speak.conversation-partner', max: true },
];

/** Three quests a day, the same all day, different tomorrow. */
export function questsFor(date: string, max: boolean): Quest[] {
  const pool = QUEST_POOL.filter((q) => max || !q.max);
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out: Quest[] = [];
  const left = [...pool];
  while (out.length < 3 && left.length) { h = (h * 1103515245 + 12345) >>> 0; out.push(left.splice(h % left.length, 1)[0]); }
  return out;
}


import type { StickerId } from '../components/stickers/Sticker';

/** What a quest measures (how far today's progress is). */
export type QuestMetric =
  | 'xp' | 'bites' | 'perfect' | 'accuracy' | 'minutes' | 'mission' | 'daily'
  | 'feed' | 'buy' | 'words' | 'streak' | 'practice' | 'talk' | 'refined';

/** What a finished quest pays: any mix of coins, XP, food for the fridge, or a lucky boost. */
export interface QuestReward { coins?: number; xp?: number; food?: string; foodCount?: number; boost?: 'xp' | 'coins' }

export type Quest = { id: string; metric: QuestMetric; target: number; sticker: StickerId; reward: QuestReward; max?: boolean };

export const QUEST_POOL: Quest[] = [
  { id: 'xp', metric: 'xp', target: 30, sticker: 'achieve.xp-collector', reward: { coins: 10 } },
  { id: 'xp-big', metric: 'xp', target: 80, sticker: 'achieve.xp-collector', reward: { boost: 'xp' } },
  { id: 'bites', metric: 'bites', target: 2, sticker: 'flow.finish-line', reward: { coins: 15 } },
  { id: 'bites-big', metric: 'bites', target: 5, sticker: 'flow.finish-line', reward: { food: 'salmon' } },
  { id: 'perfect', metric: 'perfect', target: 1, sticker: 'mood.perfect-score', reward: { xp: 20 } },
  { id: 'perfect-2', metric: 'perfect', target: 2, sticker: 'mood.perfect-score', reward: { boost: 'coins' } },
  { id: 'accuracy', metric: 'accuracy', target: 1, sticker: 'game.challenge-accepted', reward: { xp: 15, coins: 5 } },
  { id: 'minutes', metric: 'minutes', target: 10, sticker: 'flow.next-lesson', reward: { coins: 15 } },
  { id: 'mission', metric: 'mission', target: 1, sticker: 'speak.mic-ready', reward: { food: 'cheese' } },
  { id: 'daily', metric: 'daily', target: 1, sticker: 'vocab.memory-refresh', reward: { food: 'egg', foodCount: 2 } },
  { id: 'feed', metric: 'feed', target: 1, sticker: 'reward.snack-time', reward: { food: 'kibble', foodCount: 2 } },
  { id: 'feed-3', metric: 'feed', target: 3, sticker: 'reward.snack-time', reward: { coins: 20 } },
  { id: 'buy', metric: 'buy', target: 2, sticker: 'reward.snack-time', reward: { food: 'tuna' } },
  { id: 'words', metric: 'words', target: 3, sticker: 'vocab.word-collector', reward: { coins: 10 } },
  { id: 'streak', metric: 'streak', target: 1, sticker: 'streak.streak-keeper', reward: { coins: 5, xp: 10 } },
  { id: 'refined', metric: 'refined', target: 8, sticker: 'vocab.word-magnet', reward: { xp: 25 } },
  { id: 'practice', metric: 'practice', target: 1, sticker: 'game.challenge-accepted', reward: { coins: 15 }, max: true },
  { id: 'practice-2', metric: 'practice', target: 2, sticker: 'game.challenge-accepted', reward: { boost: 'xp' }, max: true },
  { id: 'talk', metric: 'talk', target: 1, sticker: 'speak.conversation-partner', reward: { food: 'catnip' }, max: true },
  { id: 'talk-3', metric: 'talk', target: 3, sticker: 'speak.conversation-partner', reward: { coins: 20 }, max: true },
];

/** Three quests a day, the same all day, different tomorrow; never two of the same kind. */
export function questsFor(date: string, max: boolean): Quest[] {
  const pool = QUEST_POOL.filter((q) => max || !q.max);
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out: Quest[] = [];
  let left = [...pool];
  while (out.length < 3 && left.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    const q = left.splice(h % left.length, 1)[0];
    out.push(q);
    left = left.filter((o) => o.metric !== q.metric);
  }
  return out;
}

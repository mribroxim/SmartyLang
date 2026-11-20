import { apiRequest } from '../../lib/selfHostedApi';
import type { ChallengeMode, ChallengeScore, ChallengeWord } from '../../lib/challenge';

export interface FriendProfile { uid: string; name: string; xp: number; level: string; league: string | null; streak: number; weeklyXp: number; vocabCount: number }
export interface ChallengeRow {
  id: string; mode: ChallengeMode; level: string; words: ChallengeWord[]; createdAt: number;
  incoming: boolean; opponentUid: string; opponentName: string; expired: boolean; status: 'open' | 'done';
  me: ChallengeScore | null; them: ChallengeScore | null; result: 'win' | 'lose' | 'tie' | null;
}

const call = <T,>(action: string, fields: object = {}) =>
  apiRequest<T>('/api/challenges', { method: 'POST', body: JSON.stringify({ action, ...fields }) });

export const loadFriendProfile = (friend: string) => call<FriendProfile>('profile', { friend });
export const listChallenges = () => call<ChallengeRow[]>('list');
export const sendChallenge = (fields: { friend: string; mode: ChallengeMode; level: string; words: ChallengeWord[] } & ChallengeScore) => call<{ id: string }>('create', fields);
export const submitChallenge = (id: string, score: ChallengeScore) => call<{ result: 'win' | 'lose' | 'tie' }>('submit', { id, ...score });
export const declineChallenge = (id: string) => call('decline', { id });

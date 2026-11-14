import { normalizeRoom } from '../src/lib/smarty/roomModel.ts';
export const LEGACY_LEAGUE: Record<string, string> = { Sapphire: 'Gold', Platinum: 'Gold', Pearl: 'Emerald', Ruby: 'Emerald', Amethyst: 'Emerald', Obsidian: 'Diamond' };
const LEAGUES = ['Bronze', 'Silver', 'Gold', 'Emerald', 'Diamond'];
export function normalizeProgressDocument(raw: Record<string, any>): Record<string, any> {
  const next = { ...raw };
  if (next.room2 !== undefined || next.room !== undefined) next.room2 = { ...normalizeRoom(next.room2), updatedAt: Math.max(1, normalizeRoom(next.room2).updatedAt) };
  if (typeof next.league === 'string') next.league = LEGACY_LEAGUE[next.league] || (LEAGUES.includes(next.league) ? next.league : 'Bronze');
  if (next.coins !== undefined) next.coins = Number.isFinite(next.coins) ? Math.max(0, Math.floor(next.coins)) : 0;
  return next;
}
export function mergeRoomProgress(a: any, b: any) {
  const old = normalizeRoom(a), incoming = normalizeRoom(b);
  const newest = incoming.updatedAt > old.updatedAt ? incoming : old;
  return { ...newest, owned: [...new Set([...old.owned, ...incoming.owned])] };
}
export function mergeQuestProgress(a: any, b: any) {
  if (!a || !b || a.date !== b.date) return !b || a?.date > b.date ? a : b;
  return { date: b.date, claimed: [...new Set([...(Array.isArray(a.claimed) ? a.claimed : []), ...(Array.isArray(b.claimed) ? b.claimed : [])])], talked: Math.max(Number(a.talked) || 0, Number(b.talked) || 0) };
}

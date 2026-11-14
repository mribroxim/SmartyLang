import { test, expect } from 'vitest';
import { normalizeProgressDocument, LEGACY_LEAGUE } from '../server/progressCompatibility';
import { mergeProgressData } from '../server/progressMerge';
import { applySyncedStores, syncedSnapshot } from '../src/lib/syncedStores';
import { getRoom } from '../src/lib/smarty/room';
import { getQuests } from '../src/lib/questState';
import { passedJumpIndex } from '../src/lib/bites/sections';
test('existing progress upgrades old room/leagues and round-trips claims and unlocks', () => {
  const legacy = { coins: 137, league: 'Sapphire', room: { bed: 'old-bed' }, smarty_quests_v1: { date: '2026-11-14', claimed: ['xp'], talked: 2 }, section_jumps_v1: { en: 3, fr: 1 } };
  const next = normalizeProgressDocument(legacy); applySyncedStores(next);
  expect(next.coins).toBe(137); expect(next.league).toBe('Gold'); expect(getRoom().bed).toBe('bed.cat-ears');
  expect(getQuests().claimed).toEqual(['xp']); expect(passedJumpIndex('en')).toBe(3);
  const persisted = mergeProgressData(next, syncedSnapshot());
  expect(persisted.room2.owned).toContain('bed.cat-ears'); expect(persisted.section_jumps_v1.fr).toBe(1); expect(persisted.coins).toBe(137);
  expect(legacy.league).toBe('Sapphire');
  for (const [old, current] of Object.entries(LEGACY_LEAGUE)) expect(normalizeProgressDocument({ league: old }).league).toBe(current);
});
test('stale devices cannot erase furniture ownership, quest claims or section tests', () => {
  const a = { room2: { owned: ['bed.paw'], bed: 'bed.paw', updatedAt: 20 }, smarty_quests_v1: { date: '2026-11-14', claimed: ['xp'], talked: 2 }, section_jumps_v1: { en: 3 } };
  const b = { room2: { owned: ['desk.study'], desk: 'desk.study', updatedAt: 10 }, smarty_quests_v1: { date: '2026-11-14', claimed: ['feed'], talked: 1 }, section_jumps_v1: { en: 1, fr: 2 } };
  const result = mergeProgressData(a, b);
  expect(result.room2.bed).toBe('bed.paw'); expect(result.room2.owned).toContain('desk.study');
  expect(new Set(result.smarty_quests_v1.claimed)).toEqual(new Set(['xp', 'feed'])); expect(result.smarty_quests_v1.talked).toBe(2);
  expect(result.section_jumps_v1).toEqual({ en: 3, fr: 2 });
});

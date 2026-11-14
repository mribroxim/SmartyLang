import assert from 'node:assert/strict';
import { query, closeDatabase } from '../server/db.ts';
import { normalizeProgressDocument } from '../server/progressCompatibility.ts';
import { mergeProgressData } from '../server/progressMerge.ts';
try {
  const result = process.env.MIGRATION_ACCOUNT_UID
    ? await query('SELECT data FROM user_progress WHERE user_uid = $1', [process.env.MIGRATION_ACCOUNT_UID])
    : await query('SELECT data FROM user_progress ORDER BY updated_at DESC LIMIT 1');
  assert.ok(result.rows[0], 'An existing progress document is required');
  const before = result.rows[0].data, upgraded = normalizeProgressDocument(before);
  const synced = mergeProgressData(upgraded, upgraded);
  assert.equal(synced.coins, upgraded.coins);
  if (upgraded.room2) assert.deepEqual(synced.room2.owned, upgraded.room2.owned);
  if (upgraded.smarty_quests_v1) assert.deepEqual(synced.smarty_quests_v1.claimed, upgraded.smarty_quests_v1.claimed);
  if (upgraded.section_jumps_v1) assert.deepEqual(synced.section_jumps_v1, upgraded.section_jumps_v1);
  console.log('PASS: existing account progress loads and round-trips without writes. No account data or identifier logged.');
} catch (error) { console.error(error instanceof assert.AssertionError ? error.message : 'Existing progress check unavailable; verify local database access'); process.exitCode = 1; }
finally { await closeDatabase(); }

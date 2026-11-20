import { randomBytes } from 'node:crypto';
import type { Express } from 'express';
import { requireUser } from './auth.ts';
import { query } from './db.ts';
import { rateLimit } from './security.ts';
import { CHALLENGE_LEVELS as CHALLENGE_LEVELS_LIST, CHALLENGE_MODES as CHALLENGE_MODES_LIST, challengeWinner } from '../src/lib/challenge.ts';
import { FRIEND_CODE_ALPHABET, FRIEND_CODE_LENGTH, isFriendCode, normalizeFriendCode } from '../src/lib/friendCode.ts';

function newFriendCode(): string {
  return Array.from(randomBytes(FRIEND_CODE_LENGTH), byte => FRIEND_CODE_ALPHABET[byte % FRIEND_CODE_ALPHABET.length]).join('');
}


const CHALLENGE_MODES: readonly string[] = CHALLENGE_MODES_LIST;
const CHALLENGE_LEVELS: readonly string[] = CHALLENGE_LEVELS_LIST;
const CHALLENGE_TTL = 14 * 86_400_000;

function levelFromXp(xp: number): string {
  return xp < 300 ? 'Beginner' : xp < 1500 ? 'Elementary' : xp < 4000 ? 'Pre-Intermediate' : xp < 9000 ? 'Intermediate' : 'Advanced';
}

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const count = (value: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));

async function areFriends(a: string, b: string): Promise<boolean> {
  const found = await query('SELECT 1 FROM friendships WHERE accepted AND first_uid=LEAST($1::text,$2::text) AND second_uid=GREATEST($1::text,$2::text)', [a, b]);
  return !!found.rowCount;
}

async function notify(uid: string, title: string, message: string): Promise<void> {
  const id = `notif_${randomBytes(9).toString('hex')}`;
  const now = Date.now();
  await query(`INSERT INTO notifications (id, user_uid, created_at, data) VALUES ($1,$2,$3,$4)
    ON CONFLICT (user_uid, id) DO NOTHING`, [id, uid, now, JSON.stringify({ id, type: 'system', title, message, read: false, createdAt: now, link: 'gamification' })]);
}

export function registerChallenges(app: Express) {
  app.post('/api/challenges', rateLimit(40, 60_000), async (req, res) => {
    try {
      const { uid } = await requireUser(req);
      const body = req.body || {};
      const action = body.action;
      if (action === 'profile') {
        const friend = text(body.friend, 80);
        if (!friend || friend === uid || !await areFriends(uid, friend)) return res.sendStatus(403);
        const row = (await query(`SELECT u.display_name AS name, s.data FROM app_users u
          LEFT JOIN student_summaries s ON s.user_uid=u.uid WHERE u.uid=$1 AND NOT u.disabled`, [friend])).rows[0];
        if (!row) return res.sendStatus(404);
        const xp = Number(row.data?.xp) || 0;
        const level = CHALLENGE_LEVELS.includes(row.data?.level) ? row.data.level : levelFromXp(xp);
        return res.json({ uid: friend, name: row.name, xp, level, league: row.data?.league || null,
          streak: Number(row.data?.globalStreak?.current ?? row.data?.streak?.current) || 0,
          weeklyXp: Number(row.data?.weeklyXp) || 0, vocabCount: Number(row.data?.vocabCount) || 0 });
      }
      if (action === 'list') {
        const { rows } = await query(`SELECT c.*, cu.display_name AS challenger_name, fu.display_name AS friend_name
          FROM friend_challenges c JOIN app_users cu ON cu.uid=c.challenger_uid JOIN app_users fu ON fu.uid=c.friend_uid
          WHERE $1 IN (c.challenger_uid, c.friend_uid) AND c.status<>'declined' AND c.created_at > $2
          ORDER BY c.created_at DESC LIMIT 40`, [uid, Date.now() - CHALLENGE_TTL * 2]);
        return res.json(rows.map(row => {
          const mine = row.challenger_uid === uid;
          const me = mine ? { score: row.challenger_score, correct: row.challenger_correct, ms: row.challenger_ms } : row.friend_score == null ? null : { score: row.friend_score, correct: row.friend_correct, ms: row.friend_ms };
          const them = mine ? (row.friend_score == null ? null : { score: row.friend_score, correct: row.friend_correct, ms: row.friend_ms }) : { score: row.challenger_score, correct: row.challenger_correct, ms: row.challenger_ms };
          const done = row.status === 'done' && me && them;
          return { id: row.id, mode: row.mode, level: row.level, words: row.words, createdAt: Number(row.created_at),
            incoming: !mine, opponentUid: mine ? row.friend_uid : row.challenger_uid, opponentName: mine ? row.friend_name : row.challenger_name,
            expired: row.status === 'open' && Number(row.created_at) < Date.now() - CHALLENGE_TTL,
            status: row.status, me, them, result: done ? ({ a: 'win', b: 'lose', tie: 'tie' } as const)[challengeWinner(me, them)] : null };
        }));
      }
      if (action === 'create') {
        const friend = text(body.friend, 80);
        const mode = body.mode, level = body.level;
        if (!friend || friend === uid || !CHALLENGE_MODES.includes(mode) || !CHALLENGE_LEVELS.includes(level)) return res.sendStatus(400);
        if (!await areFriends(uid, friend)) return res.sendStatus(403);
        const words = (Array.isArray(body.words) ? body.words : []).slice(0, 12)
          .map((item: any) => ({ word: text(item?.word, 40), meaning: text(item?.meaning, 120) })).filter((item: any) => item.word && item.meaning);
        if (words.length < 4) return res.sendStatus(400);
        const open = await query(`SELECT COUNT(*)::int AS n FROM friend_challenges WHERE challenger_uid=$1 AND friend_uid=$2 AND status='open' AND created_at > $3`, [uid, friend, Date.now() - CHALLENGE_TTL]);
        if (open.rows[0].n >= 5) return res.status(429).json({ error: 'Too many open challenges for this friend.' });
        const id = `ch_${randomBytes(9).toString('hex')}`;
        await query(`INSERT INTO friend_challenges(id, challenger_uid, friend_uid, mode, level, words, challenger_score, challenger_correct, challenger_ms, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [id, uid, friend, mode, level, JSON.stringify(words),
          count(body.score, 100_000), count(body.correct, words.length), count(body.ms, 3_600_000), Date.now()]);
        const name = (await query('SELECT display_name FROM app_users WHERE uid=$1', [uid])).rows[0]?.display_name || 'A friend';
        await notify(friend, 'New challenge!', `${name} challenged you to a word game. Can you beat their score?`);
        return res.json({ id });
      }
      const id = text(body.id, 40);
      if (action === 'submit' && id) {
        const row = (await query('UPDATE friend_challenges SET friend_score=$2, friend_correct=$3, friend_ms=$4, status=\'done\', finished_at=$5 WHERE id=$1 AND friend_uid=$6 AND status=\'open\' AND friend_score IS NULL AND created_at > $7 RETURNING challenger_uid, challenger_score, challenger_ms, friend_score, friend_ms, jsonb_array_length(words) AS total',
          [id, count(body.score, 100_000), count(body.correct, 12), count(body.ms, 3_600_000), Date.now(), uid, Date.now() - CHALLENGE_TTL])).rows[0];
        if (!row) return res.sendStatus(409);
        const outcome = challengeWinner({ score: row.challenger_score, ms: row.challenger_ms }, { score: row.friend_score, ms: row.friend_ms });
        const name = (await query('SELECT display_name FROM app_users WHERE uid=$1', [uid])).rows[0]?.display_name || 'Your friend';
        await notify(row.challenger_uid, 'Challenge finished', outcome === 'a' ? `You beat ${name}!` : outcome === 'b' ? `${name} beat your score. Time for a rematch?` : `You and ${name} tied!`);
        return res.json({ result: ({ a: 'lose', b: 'win', tie: 'tie' } as const)[outcome] });
      }
      if (action === 'decline' && id) {
        await query(`UPDATE friend_challenges SET status='declined' WHERE id=$1 AND friend_uid=$2 AND status='open'`, [id, uid]);
        return res.sendStatus(204);
      }
      return res.sendStatus(400);
    } catch (error: any) { return res.sendStatus(error.status || 503); }
  });
}

export function registerFriends(app: Express) {
  registerChallenges(app);
  app.post('/api/friends', rateLimit(40, 60_000), async (req, res) => {
    try {
      const { uid } = await requireUser(req);
      const { action, code, friend } = req.body || {};
      if (action === 'list') {
        const result = await query(`SELECT u.uid, u.display_name AS name, f.accepted, f.requested_by=$1 AS outgoing
          FROM friendships f JOIN app_users u ON u.uid=CASE WHEN f.first_uid=$1 THEN f.second_uid ELSE f.first_uid END
          WHERE $1 IN (f.first_uid, f.second_uid) AND NOT u.disabled ORDER BY u.display_name`, [uid]);
        const codes = await query('SELECT code FROM friend_codes WHERE uid=$1', [uid]);
        return res.json({ friends: result.rows, code: codes.rows[0]?.code });
      }
      if (action === 'code') {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const result = await query(`INSERT INTO friend_codes(uid, code) VALUES($1,$2)
              ON CONFLICT(uid) DO UPDATE SET code=EXCLUDED.code RETURNING code`, [uid, newFriendCode()]);
            return res.json({ code: result.rows[0].code });
          } catch (error) {
            if ((error as { code?: string }).code !== '23505') throw error;
          }
        }
        return res.sendStatus(503);
      }
      const submittedCode = typeof code === 'string' && code.length <= 40 ? normalizeFriendCode(code) : '';
      if (action === 'request' && isFriendCode(submittedCode)) {
        const result = await query(`INSERT INTO friendships(first_uid, second_uid, requested_by)
          SELECT LEAST(uid,$1), GREATEST(uid,$1), $1 FROM friend_codes WHERE code=$2 AND uid<>$1
          ON CONFLICT DO NOTHING RETURNING first_uid`, [uid, submittedCode]);
        if (!result.rowCount) return res.status(400).json({ error: 'Code unavailable or request already exists.' });
        return res.sendStatus(204);
      }
      if ((action === 'accept' || action === 'remove') && typeof friend === 'string' && friend !== uid) {
        const pair = 'first_uid=LEAST($1::text,$2::text) AND second_uid=GREATEST($1::text,$2::text)';
        if (action === 'accept') await query(`UPDATE friendships SET accepted=true WHERE ${pair} AND requested_by<>$1`, [uid, friend]);
        else await query(`DELETE FROM friendships WHERE ${pair}`, [uid, friend]);
        return res.sendStatus(204);
      }
      return res.sendStatus(400);
    } catch (error: any) { return res.sendStatus(error.status || 503); }
  });
}

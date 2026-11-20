import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const { generateVAPIDKeys } = createRequire(import.meta.url)('web-push');

const state = path.resolve('.tmp-local-demo');
const data = path.join(state, 'postgres');
const windows = process.platform === 'win32';
const binaries = process.env.DEMO_POSTGRES_BIN || (windows ? 'C:/Program Files/PostgreSQL/17/bin' : '');
const databasePort = '55433';
mkdirSync(state, { recursive: true });

function persistentSecret(filename, generate) {
  const file = path.join(state, filename);
  if (!existsSync(file)) writeFileSync(file, `${generate()}\n`, { mode: 0o600, flag: 'wx' });
  return { file, value: readFileSync(file, 'utf8').trim() };
}

function postgres(command, args, quiet = false) {
  const executable = `${command}${windows ? '.exe' : ''}`;
  const result = spawnSync(binaries ? path.join(binaries, executable) : executable, args, {
    stdio: quiet ? 'ignore' : 'inherit', windowsHide: true,
  });
  if (result.error) throw new Error(`Cannot run ${command}. Set DEMO_POSTGRES_BIN to the PostgreSQL bin directory.`, { cause: result.error });
  if (quiet) return result.status === 0;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

const secret = () => randomBytes(32).toString('hex');
const password = persistentSecret('postgres-password', secret);
if (!existsSync(path.join(data, 'PG_VERSION'))) {
  postgres('initdb', ['-D', data, '-U', 'smarty_demo', '-A', 'scram-sha-256', '--pwfile', password.file, '-E', 'UTF8', '--locale=C']);
}
if (!postgres('pg_ctl', ['status', '-D', data], true)) {
  postgres('pg_ctl', ['start', '-w', '-D', data, '-l', path.join(state, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${databasePort}`]);
}

const vapid = JSON.parse(persistentSecret('push-keys.json', () => JSON.stringify(generateVAPIDKeys())).value);
for (const name of Object.keys(process.env)) {
  if (/^(DODO_|GOOGLE_OAUTH_)/.test(name)) process.env[name] = '';
}
Object.assign(process.env, {
  NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '3000', APP_URL: 'http://localhost:3000',
  DEV_ALLOWED_ORIGINS: 'http://127.0.0.1:3000', DEMO_LOGIN: '1', TRUST_PROXY: '0', SERVE_BUILT_APP: '0',
  DATABASE_URL: `postgresql://smarty_demo:${password.value}@127.0.0.1:${databasePort}/postgres`,
  DATABASE_SSL: 'false', AGE_PROOF_SECRET: persistentSecret('age-proof-secret', secret).value,
  PUSH_VAPID_PUBLIC_KEY: vapid.publicKey, PUSH_VAPID_PRIVATE_KEY: vapid.privateKey, PUSH_VAPID_CONTACT: 'mailto:demo@example.com',
});

const { closeDatabase, runMigrations, withTransaction } = await import('../../server/db.ts');
try {
  await runMigrations();
  await withTransaction(async (db) => {
    const now = Date.now();
    for (const [kind, displayName, role] of [
      ['max', 'Demo Max', 'student'],
      ['free', 'Demo Free', 'student'],
      ['teacher', 'Demo Teacher', 'teacher'],
      ['business', 'Demo School', 'business'],
      ['admin', 'Demo Admin', 'admin'],
    ]) {
      const uid = `dev_demo_${kind}`;
      const email = `${kind}@demo.test`;
      const profile = {
        displayName, email, role, createdAt: now, startingLevel: 'Beginner',
        onboardingCompletedAt: now, dailyMinutes: 10, agePolicyVersion: 1, ageVerifiedAt: now, adultAgeCheck: true,
      };
      if (kind === 'max') Object.assign(profile, { plan: 'smarty-max', planStartedAt: now, planExpiresAt: now + 365 * 86400000 });
      if (kind === 'business') Object.assign(profile, { plan: 'business', planSeats: 25, planLanguages: 1, planStartedAt: now, planExpiresAt: now + 365 * 86400000 });
      await db.query(`INSERT INTO app_users (uid, email, display_name, role, created_at, profile)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (uid) DO NOTHING`, [uid, email, displayName, role, now, JSON.stringify(profile)]);
      // Older demo databases made the teacher a business account; teachers are their own free role now.
      if (kind === 'teacher') await db.query(`UPDATE app_users SET role = 'teacher', profile = profile || '{"role":"teacher"}'::jsonb WHERE uid = $1 AND role <> 'teacher'`, [uid]);
      if (kind === 'max') await db.query(`UPDATE app_users SET profile = profile || $2::jsonb WHERE uid = $1
        AND COALESCE((profile->>'planExpiresAt')::bigint, 0) <= $3`, [uid, JSON.stringify({ plan: profile.plan, planStartedAt: profile.planStartedAt, planExpiresAt: profile.planExpiresAt }), now]);
      await db.query(`INSERT INTO user_progress (user_uid, data, updated_at) VALUES ($1, $2, $3)
        ON CONFLICT (user_uid) DO NOTHING`, [uid, JSON.stringify({ xp: kind === 'max' ? 1800 : 30, coins: 60, section_jumps_v1: { en: 1 } }), now]);
    }
    const demoClass = 'dev_demo_class';
    await db.query(`INSERT INTO classes (id, teacher_uid, created_at, data)
      VALUES ($1, 'dev_demo_teacher', $2, $3) ON CONFLICT (id) DO NOTHING`,
      [demoClass, now, JSON.stringify({ name: 'Demo Classroom', inviteCode: 'DEMO42', createdAt: now })]);
    await db.query(`INSERT INTO class_members (class_id, user_uid)
      VALUES ($1, 'dev_demo_free'), ($1, 'dev_demo_max') ON CONFLICT DO NOTHING`, [demoClass]);
  });
} catch (error) {
  await closeDatabase();
  throw error;
}

await import('../../server.ts');

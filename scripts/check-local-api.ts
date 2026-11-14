// Integration checks with disposable fixtures, exclusively on the local QA DB.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { query, closeDatabase } from '../server/db.ts';
const base = process.env.QA_APP_URL || 'http://localhost:3001';
const db = new URL(process.env.DATABASE_URL || '');
if (!['127.0.0.1', 'localhost'].includes(db.hostname) || db.pathname !== '/smartylang' || !/^http:\/\/localhost:300[12]$/.test(base)) throw new Error('Local QA database and server required');
const prefix = `qa_release_${crypto.randomBytes(6).toString('hex')}`;
const fixtures = ['student', 'teacher-a', 'teacher-b', 'admin', 'minor'].map(role => ({ uid: `${prefix}_${role}`, role: role.startsWith('teacher') ? 'business' : role === 'minor' ? 'student' : role, token: crypto.randomBytes(32).toString('hex') }));
let checks = 0;
async function request(path: string, body?: any, fixture = fixtures[0], method = 'POST') {
  return fetch(base + path, { method, headers: { Origin: base, 'Content-Type': 'application/json', Cookie: `smarty_session=${fixture.token}` }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}
async function status(response: Response, expected: number) { assert.equal(response.status, expected); checks++; }
try {
  for (const f of fixtures) {
    await query('INSERT INTO app_users (uid,email,display_name,role,created_at,profile) VALUES ($1,$2,$3,$4,$5,$6)', [f.uid, `${f.uid}@example.test`, 'QA fixture', f.role, Date.now(), JSON.stringify({ agePolicyVersion: 1, ageVerifiedAt: Date.now(), plan: f.role === 'business' ? 'business' : null, planSeats: 1 })]);
    await query("INSERT INTO sessions (token_hash,user_uid,expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')", [crypto.createHash('sha256').update(f.token).digest('hex'), f.uid]);
  }
  const classId = `${prefix}_class`, assignmentId = `${prefix}_assignment`;
  await query('INSERT INTO classes (id,teacher_uid,created_at,data) VALUES ($1,$2,$3,$4)', [classId, fixtures[1].uid, Date.now(), JSON.stringify({ name: 'QA class' })]);
  await query('INSERT INTO class_members (class_id,user_uid) VALUES ($1,$2)', [classId, fixtures[0].uid]);
  await query('INSERT INTO assignments (id,class_id,teacher_uid,created_at,data) VALUES ($1,$2,$3,$4,$5)', [assignmentId, classId, fixtures[1].uid, Date.now(), JSON.stringify({ classId, title: 'QA assignment' })]);
  await status(await fetch(base + '/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'profile.list' }) }), 401);
  await status(await fetch(base + '/api/data', { method: 'POST', headers: { Origin: 'https://foreign.example', 'Content-Type': 'application/json' }, body: '{}' }), 403);
  for (const path of ['/api/tts', '/api/dictionary', '/api/translate-fallback']) await status(await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }), 401);
  await status(await request('/api/data', { action: 'profile.update', args: { uid: fixtures[0].uid, patch: { plan: 'smarty-max' } } }), 403);
  await status(await request('/api/data', { action: 'profile.update', args: { uid: fixtures[0].uid, patch: { role: 'admin' } } }), 403);
  await status(await request('/api/data', { action: 'assignment.list', args: { classId } }, fixtures[2]), 403);
  await status(await request('/api/data', { action: 'assignment.submissions', args: { assignmentId } }, fixtures[2]), 403);
  await status(await request('/api/data', { action: 'assignment.list', args: { classId } }), 200);
  await status(await request('/api/data', { action: 'assignment.submissions', args: { assignmentId } }, fixtures[1]), 200);
  await status(await request('/api/data', { action: 'summary.get', args: { uid: fixtures[0].uid } }, fixtures[2]), 403);
  await status(await request('/api/data', { action: 'notification.add', args: { uid: fixtures[0].uid, notification: {} } }, fixtures[2]), 403);
  const minor = await request('/api/safety/age', { year: 2020, month: 1, day: 1 });
  assert.equal((await minor.json()).parentalConsentRequired, true); checks++;
  const adult = await request('/api/safety/age', { year: 1990, month: 1, day: 1 });
  assert.equal((await adult.json()).ready, true); checks++;
  const unknown = await fetch(base + '/api/does-not-exist'); assert.equal(unknown.status, 404); assert.match(unknown.headers.get('content-type') || '', /json/); checks++;
  const exported = await request('/api/account/export', undefined, fixtures[0], 'GET'); await status(exported, 200); assert.equal((await exported.json()).profile.uid, fixtures[0].uid); checks++;
  const issued = await request('/api/safety/parent-consent/issue', { verificationMethod: 'signed-form', verificationReceipt: `${prefix}_disposable_test_receipt`, noticeVersion: 1 }, fixtures[3]);
  await status(issued, 200); const { code } = await issued.json();
  await status(await request('/api/safety/parent-consent', { code }, fixtures[4]), 200);
  await status(await request('/api/safety/parent-consent', { code }, fixtures[0]), 403);
  const consentId = (await query('SELECT profile FROM app_users WHERE uid = $1', [fixtures[4].uid])).rows[0].profile.parentalConsentId;
  await status(await request('/api/safety/parent-consent/revoke', { consentId }, fixtures[3]), 200);
  await status(await request('/api/data', { action: 'profile.get', args: { uid: fixtures[4].uid } }, fixtures[4]), 401);
  await status(await request('/api/account', { email: `${fixtures[0].uid}@example.test` }, fixtures[0], 'DELETE'), 200);
  assert.equal((await query('SELECT 1 FROM app_users WHERE uid = $1', [fixtures[0].uid])).rowCount, 0); checks++;
  console.log(`PASS: ${checks} local HTTP checks (auth, role/ownership, CORS, age, one-use parent consent/revocation, export, deletion, JSON 404). No paid provider requests made.`);
} finally {
  // Cleanup only identities created by this invocation.
  for (const f of fixtures) {
    assert.ok(f.uid.startsWith(prefix + '_'));
    await query('DELETE FROM smarty_max_invites WHERE sponsor_uid = $1 OR invitee_uid = $1', [f.uid]);
    await query('DELETE FROM assignments WHERE teacher_uid = $1', [f.uid]);
    await query('DELETE FROM classes WHERE teacher_uid = $1', [f.uid]);
    await query('DELETE FROM app_users WHERE uid = $1', [f.uid]);
    await query('DELETE FROM account_deletions WHERE uid_hash = $1', [crypto.createHash('sha256').update(f.uid).digest('hex')]);
  }
  await closeDatabase();
}

import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getSessionUser, requireRole } from './auth.ts';
import { query, withTransaction } from './db.ts';

const cookie = 'smarty_age';
const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex');
function key(): string {
  const value = process.env.AGE_PROOF_SECRET || '';
  if (value.length < 32) throw Object.assign(new Error('Age verification is unavailable'), { status: 503 });
  return value;
}
export function ageAt(year: number, month: number, day: number, now = new Date()): number {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date > now || year < now.getUTCFullYear() - 120) return -1;
  return now.getUTCFullYear() - year - (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day) ? 1 : 0);
}
function setProof(req: Request, res: Response, consentId?: string) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 30 * 60_000, consentId, version: 1 })).toString('base64url');
  const signature = crypto.createHmac('sha256', key()).update(payload).digest('base64url');
  res.cookie(cookie, `${payload}.${signature}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production' || req.secure, sameSite: 'lax', maxAge: 30 * 60_000, path: '/' });
  return { exp: Date.now() + 30 * 60_000, consentId };
}
export function ageProof(req: Request): { exp: number; consentId?: string } | null {
  try {
    const value = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${cookie}=`))?.slice(cookie.length + 1);
    const [payload, sig] = decodeURIComponent(value || '').split('.');
    const expected = crypto.createHmac('sha256', key()).update(payload).digest();
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'base64url'), expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.version === 1 && Number.isFinite(data.exp) && data.exp > Date.now() ? data : null;
  } catch { return null; }
}
export async function attachAgeConsent(req: Request, uid: string, proof = ageProof(req)): Promise<void> {
  if (!proof) throw Object.assign(new Error('Age check required'), { status: 403 });
  await withTransaction(async tx => {
    if (proof.consentId) {
      const claimed = await tx.query('UPDATE parental_consents SET child_uid = $2 WHERE id = $1 AND child_uid IS NULL AND revoked_at IS NULL AND expires_at > NOW() RETURNING id', [proof.consentId, uid]);
      if (!claimed.rowCount) throw Object.assign(new Error('Parent consent is no longer available'), { status: 403 });
    }
    await tx.query('UPDATE app_users SET profile = profile || $2::jsonb WHERE uid = $1', [uid, JSON.stringify({ ageVerifiedAt: Date.now(), agePolicyVersion: 1, ...(proof.consentId ? { parentalConsentId: proof.consentId } : { adultAgeCheck: true }) })]);
  });
}
export function registerAgeSafety(app: Express): void {
  app.get('/api/legal', (_req, res) => res.json({ operator: process.env.LEGAL_OPERATOR || '', contact: process.env.LEGAL_CONTACT_EMAIL || '', ageReady: (process.env.AGE_PROOF_SECRET || '').length >= 32 }));
  app.get('/api/safety/age', (req, res) => res.json({ ready: !!ageProof(req) }));
  app.post('/api/safety/age', async (req, res) => {
    try {
      const age = ageAt(Number(req.body?.year), Number(req.body?.month), Number(req.body?.day));
      if (age < 0) return res.status(400).json({ error: 'Invalid date' });
      if (age < 16) { res.clearCookie(cookie, { path: '/' }); return res.json({ parentalConsentRequired: true }); }
      setProof(req, res);
      const user = await getSessionUser(req);
      if (user) await query('UPDATE app_users SET profile = profile || $2::jsonb WHERE uid = $1', [user.uid, JSON.stringify({ ageVerifiedAt: Date.now(), agePolicyVersion: 1, adultAgeCheck: true })]);
      return res.json({ ready: true });
    } catch { return res.status(503).json({ error: 'Age verification unavailable' }); }
  });
  app.post('/api/safety/parent-consent', async (req, res) => {
    try {
      const result = await query('SELECT id FROM parental_consents WHERE token_hash = $1 AND child_uid IS NULL AND revoked_at IS NULL AND expires_at > NOW()', [hash(String(req.body?.code || ''))]);
      if (!result.rows[0]) return res.status(403).json({ error: 'Consent code invalid or expired' });
      const proof = setProof(req, res, result.rows[0].id);
      const user = await getSessionUser(req);
      if (user) await attachAgeConsent(req, user.uid, proof);
      return res.json({ ready: true });
    } catch { return res.status(503).json({ error: 'Parent consent unavailable' }); }
  });
  // Only staff can issue a code AFTER externally verifying the parent. A checkbox
  // or email click is never recorded as verified consent by this application.
  app.post('/api/safety/parent-consent/issue', async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.sendStatus(401);
      requireRole(user, ['admin']);
      const method = String(req.body?.verificationMethod || '');
      const receipt = String(req.body?.verificationReceipt || '');
      if (!['identity-provider', 'video-call', 'signed-form'].includes(method) || receipt.length < 16 || req.body?.noticeVersion !== 1) return res.status(400).json({ error: 'Verified parent receipt and privacy notice acknowledgement required' });
      const code = crypto.randomBytes(32).toString('base64url');
      await query('INSERT INTO parental_consents (id, token_hash, verification_method, receipt_hash, notice_version, verified_by, expires_at) VALUES ($1, $2, $3, $4, 1, $5, NOW() + INTERVAL \'7 days\')', [crypto.randomUUID(), hash(code), method, hash(receipt), user.uid]);
      return res.json({ code });
    } catch { return res.status(403).json({ error: 'Not authorized' }); }
  });
  app.post('/api/safety/parent-consent/revoke', async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.sendStatus(401);
      requireRole(user, ['admin']);
      await withTransaction(async tx => {
        const result = await tx.query('UPDATE parental_consents SET revoked_at = NOW() WHERE id = $1 RETURNING child_uid', [String(req.body?.consentId || '')]);
        if (result.rows[0]?.child_uid) await tx.query('DELETE FROM sessions WHERE user_uid = $1', [result.rows[0].child_uid]);
      });
      return res.json({ revoked: true });
    } catch { return res.sendStatus(403); }
  });
}

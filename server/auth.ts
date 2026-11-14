import 'dotenv/config';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { query, withTransaction } from './db.ts';

export const SESSION_COOKIE = 'smarty_session';
const SESSION_DAYS = 30;

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  profile: Record<string, any>;
};

type StoredUser = {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string | null;
  role: string;
  profile: Record<string, any>;
  disabled: boolean;
};

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function userFromRow(row: StoredUser): AuthUser {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name || row.email.split('@')[0] || 'User',
    ...(row.photo_url ? { photoURL: row.photo_url } : {}),
    role: row.role,
    profile: { ...(row.profile || {}), uid: row.uid, role: row.role, email: row.email },
  };
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie || '';
  const prefix = `${name}=`;
  const raw = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw.slice(prefix.length));
  } catch {
    return raw.slice(prefix.length);
  }
}

export function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function setSession(res: Response, req: Request, uid: string): Promise<void> {
  const token = crypto.randomBytes(48).toString('base64url');
  await query(
    `INSERT INTO sessions (token_hash, user_uid, expires_at, user_agent, ip_address)
     VALUES ($1, $2, NOW() + INTERVAL '30 days', $3, $4)`,
    [tokenHash(token), uid, req.get('user-agent') || null, req.ip || null],
  );
  const options = cookieOptions(req);
  const attributes = [
    `Path=${options.path}`,
    `Max-Age=${Math.floor(options.maxAge / 1000)}`,
    'HttpOnly',
    `SameSite=${options.sameSite}`,
    ...(options.secure ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${attributes.join('; ')}`);
}

export async function clearSession(req: Request, res: Response): Promise<void> {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${cookieOptions(req).secure ? '; Secure' : ''}`);
}

export async function getSessionUser(req: Request): Promise<AuthUser | null> {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const result = await query<StoredUser>(
    `SELECT u.uid, u.email, u.display_name, u.photo_url, u.role, u.profile, u.disabled
       FROM sessions s
       JOIN app_users u ON u.uid = s.user_uid
      WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.disabled = FALSE`,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  await query('UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1', [tokenHash(token)]);
  return userFromRow(row);
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getSessionUser(req);
  if (!user) {
    const error = new Error('Sign in required');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
  return user;
}

function roleMatches(userRole: string, roles: string[]): boolean {
  const expanded = new Set(roles);
  if (expanded.has('business')) {
    expanded.add('teacher');
    expanded.add('organization');
  }
  return expanded.has(userRole);
}

export function requireRole(user: AuthUser, roles: string[]): void {
  if (!roleMatches(user.role, roles)) {
    const error = new Error('You do not have permission to perform this action');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string | null, password: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function registerUser(
  req: Request,
  res: Response,
  input: { email: string; password: string; displayName?: string },
): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes('@')) throw Object.assign(new Error('Please enter a valid email address.'), { status: 400 });
  if (String(input.password || '').length < 6) throw Object.assign(new Error('Password must be at least 6 characters.'), { status: 400 });

  const uid = `local_${crypto.randomBytes(16).toString('hex')}`;
  const displayName = String(input.displayName || '').trim() || email.split('@')[0];
  const profile = {
    displayName,
    email,
    // Public registration must never grant a privileged role from an unverified email.
    role: 'student',
    createdAt: Date.now(),
  };
  const passwordHash = await hashPassword(input.password);
  try {
    await query(
      `INSERT INTO app_users (uid, email, password_hash, display_name, role, created_at, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uid, email, passwordHash, displayName, profile.role, profile.createdAt, profile],
    );
  } catch (error: any) {
    if (error?.code === '23505') throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    throw error;
  }
  const user = userFromRow({
    uid,
    email,
    display_name: displayName,
    role: profile.role,
    profile,
    disabled: false,
  });
  await setSession(res, req, uid);
  return user;
}

export async function loginUser(
  req: Request,
  res: Response,
  emailInput: string,
  password: string,
): Promise<AuthUser> {
  const email = normalizeEmail(emailInput);
  const result = await query<StoredUser & { password_hash: string | null }>(
    `SELECT uid, email, password_hash, display_name, photo_url, role, profile, disabled
       FROM app_users WHERE lower(email) = $1 LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row || row.disabled || !(await verifyPassword(row.password_hash, password))) {
    throw Object.assign(new Error('Incorrect email or password.'), { status: 401 });
  }
  const user = userFromRow(row);
  await setSession(res, req, user.uid);
  return user;
}

export async function getProfile(uid: string): Promise<Record<string, any> | null> {
  const result = await query<StoredUser>(
    `SELECT uid, email, display_name, photo_url, role, profile, disabled FROM app_users WHERE uid = $1`,
    [uid],
  );
  return result.rows[0] ? userFromRow(result.rows[0]).profile : null;
}

export async function updateProfile(uid: string, patch: Record<string, any>): Promise<Record<string, any>> {
  const result = await query<StoredUser>(
    `UPDATE app_users
        SET display_name = COALESCE($2, display_name),
            photo_url = COALESCE($3, photo_url),
            profile = profile || $4::jsonb
      WHERE uid = $1
      RETURNING uid, email, display_name, photo_url, role, profile, disabled`,
    [
      uid,
      patch.displayName == null ? null : String(patch.displayName),
      patch.photoURL == null ? null : String(patch.photoURL),
      JSON.stringify(patch),
    ],
  );
  if (!result.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return userFromRow(result.rows[0]).profile;
}

export function googleClient(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
    || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
  if (!clientId || !clientSecret) return null;
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function googleAuthUrl(req: Request, res: Response): string {
  const client = googleClient();
  if (!client) throw Object.assign(new Error('Google OAuth is not configured'), { status: 503 });
  const state = crypto.randomBytes(24).toString('base64url');
  res.setHeader('Set-Cookie', `smarty_oauth_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${cookieOptions(req).secure ? '; Secure' : ''}`);
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
    state,
  });
}

export async function loginGoogleUser(
  req: Request,
  res: Response,
  code: string,
  state: string,
): Promise<AuthUser> {
  const client = googleClient();
  if (!client) throw Object.assign(new Error('Google OAuth is not configured'), { status: 503 });
  const expectedState = getCookie(req, 'smarty_oauth_state');
  if (!state || !expectedState || state !== expectedState) {
    throw Object.assign(new Error('Invalid Google sign-in state'), { status: 400 });
  }
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw Object.assign(new Error('Google did not return an identity token'), { status: 401 });
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const providerId = payload?.sub;
  const email = normalizeEmail(payload?.email);
  if (!providerId || !email || payload?.email_verified !== true) {
    throw Object.assign(new Error('Google account email could not be verified'), { status: 401 });
  }

  const user = await withTransaction(async (tx) => {
    const identity = await tx.query<StoredUser>(
      `SELECT u.uid, u.email, u.display_name, u.photo_url, u.role, u.profile, u.disabled
         FROM auth_identities i JOIN app_users u ON u.uid = i.user_uid
        WHERE i.provider = 'google' AND i.provider_id = $1`,
      [providerId],
    );
    if (identity.rows[0]) {
      if (identity.rows[0].disabled) throw Object.assign(new Error('Account disabled'), { status: 403 });
      return userFromRow(identity.rows[0]);
    }

    const existing = await tx.query<StoredUser>(
      `SELECT uid, email, display_name, photo_url, role, profile, disabled
         FROM app_users WHERE lower(email) = $1`,
      [email],
    );
    let row = existing.rows[0];
    if (row?.disabled) throw Object.assign(new Error('Account disabled'), { status: 403 });
    if (!row) {
      const uid = `local_${crypto.randomBytes(16).toString('hex')}`;
      const displayName = payload?.name || email.split('@')[0];
      const profile = { displayName, email, role: 'student', createdAt: Date.now() };
      const created = await tx.query<StoredUser>(
        `INSERT INTO app_users (uid, email, display_name, photo_url, role, created_at, profile)
         VALUES ($1, $2, $3, $4, 'student', $5, $6)
         RETURNING uid, email, display_name, photo_url, role, profile, disabled`,
        [uid, email, displayName, payload?.picture || null, profile.createdAt, profile],
      );
      row = created.rows[0];
    }
    await tx.query(
      `INSERT INTO auth_identities (provider, provider_id, user_uid, email)
       VALUES ('google', $1, $2, $3)
       ON CONFLICT (provider, provider_id) DO NOTHING`,
      [providerId, row.uid, email],
    );
    return userFromRow(row);
  });
  await setSession(res, req, user.uid);
  return user;
}

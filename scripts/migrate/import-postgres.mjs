#!/usr/bin/env node

/**
 * Idempotently import the Firebase Auth JSON and Firestore NDJSON produced by
 * export-firebase.mjs. Unknown documents are retained in
 * legacy_firestore_documents so the migration never silently drops data.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/migrate/import-postgres.mjs backups/firebase-export-*
 */

import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Pool } = pg;
const exportDir = path.resolve(process.argv[2] || '');
if (!exportDir || exportDir === path.parse(process.cwd()).root) {
  throw new Error('Pass the Firebase export directory as the first argument.');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sqlPath = path.resolve('server/migrations/001_initial.sql');
await pool.query(readFileSync(sqlPath, 'utf8'));

function decodeValue(value) {
  if (!value || typeof value !== 'object') return value;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) {
    const time = Date.parse(value.timestampValue);
    return Number.isFinite(time) ? time : value.timestampValue;
  }
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return value;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)]));
}

function pathParts(documentPath) {
  return documentPath.split('/').filter(Boolean);
}

function firestoreId(documentPath) {
  const parts = pathParts(documentPath);
  return parts[parts.length - 1];
}

async function importAuth() {
  const file = path.join(exportDir, 'auth-users.json');
  const auth = JSON.parse(readFileSync(file, 'utf8'));
  for (const account of auth.users || []) {
    const email = String(account.email || `${account.localId}@migrated.invalid`).toLowerCase();
    const createdAt = Number(account.createdAt || Date.now());
    const profile = {
      email,
      displayName: account.displayName || email.split('@')[0],
      createdAt,
      ...(account.photoUrl ? { photoURL: account.photoUrl } : {}),
      ...(account.emailVerified ? { emailVerified: true } : {}),
      ...(account.passwordHash ? { firebasePasswordHash: account.passwordHash } : {}),
      ...(account.salt ? { firebasePasswordSalt: account.salt } : {}),
    };
    await pool.query(
      `INSERT INTO app_users
        (uid, email, password_hash, password_algorithm, password_salt, display_name, photo_url, role, created_at, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (uid) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = COALESCE(EXCLUDED.password_hash, app_users.password_hash),
         password_algorithm = EXCLUDED.password_algorithm,
         password_salt = COALESCE(EXCLUDED.password_salt, app_users.password_salt),
         display_name = EXCLUDED.display_name,
         photo_url = COALESCE(EXCLUDED.photo_url, app_users.photo_url),
         profile = app_users.profile || EXCLUDED.profile`,
      [
        account.localId,
        email,
        account.passwordHash || null,
        account.passwordHash ? 'firebase-scrypt' : 'none',
        account.salt || null,
        profile.displayName,
        account.photoUrl || null,
        email === String(process.env.ADMIN_EMAIL || 'abduraxmonovibroxim16@gmail.com').toLowerCase() ? 'admin' : 'student',
        createdAt,
        JSON.stringify(profile),
      ],
    );
    for (const identity of account.providerUserInfo || []) {
      await pool.query(
        `INSERT INTO auth_identities (provider, provider_id, user_uid, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, provider_id) DO UPDATE SET user_uid = EXCLUDED.user_uid, email = EXCLUDED.email`,
        [identity.providerId, identity.rawId || account.localId, account.localId, email],
      );
    }
  }
  return auth.users?.length || 0;
}

async function ensureUser(uid, profile = {}) {
  const email = String(profile.email || `${uid}@migrated.invalid`).toLowerCase();
  await pool.query(
    `INSERT INTO app_users (uid, email, display_name, role, created_at, profile)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (uid) DO NOTHING`,
    [uid, email, profile.displayName || email.split('@')[0], profile.role || 'student', profile.createdAt || Date.now(), JSON.stringify(profile)],
  );
}

async function importDocument(document) {
  const parts = pathParts(document.path);
  const data = decodeFields(document.fields);
  const root = parts[0];
  const id = firestoreId(document.path);

  await pool.query(
    `INSERT INTO legacy_firestore_documents (path, exported_fields, decoded_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (path) DO UPDATE SET exported_fields = EXCLUDED.exported_fields, decoded_data = EXCLUDED.decoded_data, imported_at = NOW()`,
    [document.path, JSON.stringify(document.fields || {}), JSON.stringify(data)],
  );

  if (root === 'userProfiles' && parts.length === 2) {
    await ensureUser(id, data);
    await pool.query(
      `UPDATE app_users SET email = COALESCE($2, email), display_name = COALESCE($3, display_name),
        photo_url = COALESCE($4, photo_url), role = COALESCE($5, role), profile = profile || $6::jsonb
       WHERE uid = $1`,
      [id, data.email || null, data.displayName || null, data.photoURL || null, data.role || null, JSON.stringify(data)],
    );
    return;
  }

  if (root === 'users' && parts.length >= 4) {
    const uid = parts[1];
    await ensureUser(uid);
    const collection = parts[2];
    if (collection === 'data' && parts[3] === 'progress') {
      await pool.query(
        `INSERT INTO user_progress (user_uid, data, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (user_uid) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [uid, JSON.stringify(data), Date.now()],
      );
      return;
    }
    if (collection === 'completions' && parts.length === 4) {
      await pool.query(
        `INSERT INTO completions (user_uid, id, timestamp, data) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_uid, id) DO UPDATE SET timestamp = EXCLUDED.timestamp, data = EXCLUDED.data`,
        [uid, id, Number(data.timestamp || Date.now()), JSON.stringify(data)],
      );
      return;
    }
    if (collection === 'lessonUnlocks' && parts.length === 4) {
      await pool.query(
        `INSERT INTO lesson_unlocks (user_uid, lang, passage_id, data, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_uid, lang, passage_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [uid, data.lang || 'en', data.passageId || id, JSON.stringify(data), Date.now()],
      );
      return;
    }
    if (collection.startsWith('vocabulary') && parts.length === 4) {
      const lang = collection === 'vocabulary' ? 'en' : collection.slice('vocabulary_'.length);
      await pool.query(
        `INSERT INTO user_vocab (user_uid, lang, word, data, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_uid, lang, word) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [uid, lang, id, JSON.stringify(data), Date.now()],
      );
      return;
    }
  }

  if (root === 'studentSummaries') {
    await ensureUser(id, data);
    await pool.query(
      `INSERT INTO student_summaries (user_uid, data, updated_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_uid) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, JSON.stringify(data), Date.now()],
    );
    return;
  }
  if (root === 'classes') {
    await ensureUser(data.teacherUid);
    for (const uid of data.studentUids || []) await ensureUser(uid);
    await pool.query(
      `INSERT INTO classes (id, teacher_uid, organization_id, created_at, data) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET teacher_uid = EXCLUDED.teacher_uid, organization_id = EXCLUDED.organization_id, data = EXCLUDED.data`,
      [id, data.teacherUid, data.organizationId || null, Number(data.createdAt || Date.now()), JSON.stringify(data)],
    );
    for (const uid of data.studentUids || []) {
      await pool.query('INSERT INTO class_members (class_id, user_uid) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, uid]);
    }
    return;
  }
  if (root === 'assignments' && parts.length === 2) {
    await ensureUser(data.teacherUid);
    await pool.query(
      `INSERT INTO assignments (id, class_id, teacher_uid, created_at, data) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [id, data.classId, data.teacherUid, Number(data.createdAt || Date.now()), JSON.stringify(data)],
    );
    return;
  }
  if (root === 'assignments' && parts.length === 4 && parts[2] === 'submissions') {
    await ensureUser(parts[3]);
    await pool.query(
      `INSERT INTO submissions (assignment_id, student_uid, data, completed_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, student_uid) DO UPDATE SET data = EXCLUDED.data, completed_at = EXCLUDED.completed_at`,
      [parts[1], parts[3], JSON.stringify(data), Number(data.completedAt || Date.now())],
    );
    return;
  }
  if (root === 'studentActivity' && parts.length === 4 && parts[2] === 'events') {
    await pool.query(
      `INSERT INTO student_activity (id, student_uid, timestamp, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, timestamp = EXCLUDED.timestamp`,
      [id, parts[1], Number(data.timestamp || Date.now()), JSON.stringify(data)],
    );
    return;
  }
  if (root === 'notifications' && parts.length === 4 && parts[2] === 'items') {
    await pool.query(
      `INSERT INTO notifications (id, user_uid, created_at, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_uid, id) DO UPDATE SET data = EXCLUDED.data, created_at = EXCLUDED.created_at`,
      [id, parts[1], Number(data.createdAt || Date.now()), JSON.stringify(data)],
    );
    return;
  }

  const simpleTables = {
    payments: ['payments', 'paidAt'],
    smartyMaxInvites: ['smarty_max_invites', 'createdAt'],
    announcements: ['announcements', 'createdAt'],
    auditLog: ['audit_log', 'timestamp'],
    cmsContent: ['cms_content', 'updatedAt'],
    vocabMisses: ['vocab_misses', 'count'],
    ieltsTests: ['ielts_tests', 'createdAt'],
    ieltsListeningTests: ['ielts_listening_tests', 'createdAt'],
    sharedVocabCache: ['shared_vocab_cache', 'updatedAt'],
    ttsCache: ['tts_cache', 'updatedAt'],
  };
  const tableInfo = simpleTables[root];
  if (tableInfo && parts.length === 2) {
    const [table, timeKey] = tableInfo;
    if (table === 'payments') {
      await pool.query(`INSERT INTO ${table} (id, uid, paid_at, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, data.uid || null, Number(data[timeKey] || Date.now()), JSON.stringify(data)]);
    } else if (table === 'smarty_max_invites') {
      await pool.query(`INSERT INTO ${table} (id, sponsor_uid, invitee_uid, invitee_email, status, created_at, data) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, data.sponsorUid, data.inviteeUid || null, data.inviteeEmail || '', data.status || 'pending', Number(data.createdAt || Date.now()), JSON.stringify(data)]);
    } else if (table === 'announcements') {
      await pool.query(`INSERT INTO ${table} (id, author_uid, target_type, target_id, created_at, data) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, data.authorUid || null, data.targetType || null, data.targetId || null, Number(data.createdAt || Date.now()), JSON.stringify(data)]);
    } else if (table === 'audit_log') {
      await pool.query(`INSERT INTO ${table} (id, actor_uid, timestamp, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, data.actorUid || null, Number(data.timestamp || Date.now()), JSON.stringify(data)]);
    } else if (table === 'cms_content') {
      await pool.query(`INSERT INTO ${table} (doc_id, updated_at, data) VALUES ($1, $2, $3) ON CONFLICT (doc_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`, [id, Number(data.updatedAt || Date.now()), JSON.stringify(data)]);
    } else if (table === 'vocab_misses') {
      await pool.query(`INSERT INTO ${table} (id, count, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET count = EXCLUDED.count, data = EXCLUDED.data`, [id, Number(data.count || 0), JSON.stringify(data)]);
    } else if (table === 'tts_cache') {
      await pool.query(`INSERT INTO ${table} (id, updated_at, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`, [id, Number(data.updatedAt || Date.now()), JSON.stringify(data)]);
    } else {
      await pool.query(`INSERT INTO ${table} (id, created_at, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, Number(data[timeKey] || Date.now()), JSON.stringify(data)]);
    }
  }
}

const authCount = await importAuth();
let documentCount = 0;
const firestorePath = path.join(exportDir, 'firestore-documents.ndjson');
if (existsSync(firestorePath)) {
  const input = createReadStream(firestorePath, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    await importDocument(JSON.parse(line));
    documentCount += 1;
  }
}

await pool.end();
console.log(JSON.stringify({ authUsers: authCount, firestoreDocuments: documentCount, exportDir }, null, 2));

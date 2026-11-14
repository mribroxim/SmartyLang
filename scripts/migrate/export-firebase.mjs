#!/usr/bin/env node

/**
 * Export Firebase Auth and Firestore without requiring a paid Firestore
 * managed-export operation. Firestore documents are stored as newline JSON
 * using the REST API's native Value encoding so timestamps, arrays, maps, and
 * document IDs survive the import unchanged.
 *
 * Usage:
 *   node scripts/migrate/export-firebase.mjs
 *   node scripts/migrate/export-firebase.mjs --out backups/firebase-export
 */

import { mkdirSync, writeFileSync, existsSync, createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const projectId = process.env.FIREBASE_PROJECT_ID || 'smarty-english-c0532';
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
const outArgIndex = process.argv.indexOf('--out');
const outputDir = resolve(
  outArgIndex >= 0 && process.argv[outArgIndex + 1]
    ? process.argv[outArgIndex + 1]
    : `backups/firebase-export-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

function command(commandName, args) {
  const executable = process.platform === 'win32' && !commandName.endsWith('.cmd')
    ? `${commandName}.cmd`
    : commandName;
  const result = spawnSync(executable, args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function accessToken() {
  const token = process.env.GCLOUD_ACCESS_TOKEN || command('gcloud', ['auth', 'print-access-token']);
  if (!token) throw new Error('No Google Cloud access token available.');
  return token;
}

const token = accessToken();
const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`Firestore REST ${response.status} ${response.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function listCollectionIds(parent) {
  const ids = [];
  let pageToken = '';
  do {
    const body = { pageSize: 300 };
    if (pageToken) body.pageToken = pageToken;
    const result = await request(`${parent}:listCollectionIds`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    ids.push(...(result.collectionIds || []));
    pageToken = result.nextPageToken || '';
  } while (pageToken);
  return ids;
}

async function listDocuments(collectionUrl) {
  const documents = [];
  let pageToken = '';
  do {
    const query = new URLSearchParams({ pageSize: '300', showMissing: 'true' });
    if (pageToken) query.set('pageToken', pageToken);
    const result = await request(`${collectionUrl}?${query}`);
    documents.push(...(result.documents || []));
    pageToken = result.nextPageToken || '';
  } while (pageToken);
  return documents;
}

mkdirSync(outputDir, { recursive: true });
const authPath = resolve(outputDir, 'auth-users.json');
if (!existsSync(authPath)) {
  const authResult = process.platform === 'win32'
    ? spawnSync(
      'cmd.exe',
      ['/d', '/c', `firebase.cmd auth:export auth-users.json --project=${projectId} --format=json`],
      { cwd: outputDir, encoding: 'utf8', windowsHide: true },
    )
    : spawnSync('firebase', ['auth:export', authPath, `--project=${projectId}`, '--format=json'], { encoding: 'utf8', windowsHide: true });
  if (authResult.status !== 0) {
    throw new Error(`Firebase Auth export failed:\n${authResult.error?.message || authResult.stderr || authResult.stdout}`);
  }
}

const documentsPath = resolve(outputDir, 'firestore-documents.ndjson');
const stream = createWriteStream(documentsPath, { encoding: 'utf8' });
const counts = {};
let documentCount = 0;

async function walkCollection(collectionId, parentUrl) {
  const collectionUrl = `${parentUrl}/${encodeURIComponent(collectionId)}`;
  const documents = await listDocuments(collectionUrl);
  counts[collectionId] = (counts[collectionId] || 0) + documents.length;
  for (const document of documents) {
    const path = document.name.split('/documents/')[1];
    stream.write(`${JSON.stringify({ path, fields: document.fields || {} })}\n`);
    documentCount += 1;

    const childIds = await listCollectionIds(document.name);
    for (const childId of childIds) {
      await walkCollection(childId, document.name);
    }
  }
}

const rootCollectionIds = await listCollectionIds(root);
for (const collectionId of rootCollectionIds) {
  await walkCollection(collectionId, root);
}

await new Promise((resolvePromise, rejectPromise) => {
  stream.once('error', rejectPromise);
  stream.end(resolvePromise);
});

const manifest = {
  projectId,
  databaseId,
  exportedAt: new Date().toISOString(),
  documentCount,
  countsByCollection: counts,
  files: {
    auth: 'auth-users.json',
    firestore: 'firestore-documents.ndjson',
  },
};
writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir, ...manifest }, null, 2));

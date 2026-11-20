import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';

vi.mock('../server/db.ts', () => ({ databaseConfigured: true, query: vi.fn(), withTransaction: vi.fn() }));
vi.mock('../server/auth.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../server/auth.ts')>();
  return { ...actual, requireUser: vi.fn() };
});
import { query, withTransaction } from '../server/db';
import { requireUser } from '../server/auth';
import { registerDataApi } from '../server/dataApi';
import { parseHash } from '../src/lib/appRoute';

let server: ReturnType<ReturnType<typeof express>['listen']>;
let base: string;
beforeEach(async () => {
  vi.mocked(query).mockReset();
  vi.mocked(withTransaction).mockImplementation(async fn => fn({ query } as any));
  vi.mocked(requireUser).mockResolvedValue({ uid: 'admin', email: 'admin@example.test', displayName: 'Admin', role: 'admin', profile: {} });
  const app = express();
  app.use(express.json());
  registerDataApi(app);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  vi.restoreAllMocks();
});
const request = (action: string, args = {}) => fetch(base + '/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, args }) });

test('admin lists accounts even when names, dates and suspension are absent from profile JSON', async () => {
  vi.mocked(query).mockResolvedValue({ rows: [
    { uid: 'new', email: 'new@example.test', display_name: 'New learner', photo_url: null, role: 'student', created_at: '12345', disabled: true, profile: {}, password_hash: 'private' },
    { uid: 'imported', email: 'old@example.test', display_name: '', role: 'student', profile: { displayName: 'Imported learner', plan: 'smarty-max', createdAt: 100 } },
  ], rowCount: 2 } as any);
  const response = await request('profile.list');
  expect(response.status).toBe(200);
  const { result } = await response.json();
  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({ uid: 'new', displayName: 'New learner', createdAt: 12345, suspended: true });
  expect(result[1]).toMatchObject({ uid: 'imported', displayName: 'Imported learner', plan: 'smarty-max', createdAt: 100 });
  expect(result[0]).not.toHaveProperty('password_hash');
  expect(vi.mocked(query).mock.calls[0][0]).toContain('created_at, disabled');
});

test('a genuine empty database is a successful empty list', async () => {
  vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);
  expect(await (await request('profile.list')).json()).toEqual({ result: [] });
});

test('free learners can read their vocabulary without a paid plan', async () => {
  vi.mocked(requireUser).mockResolvedValue({ uid: 'free', email: 'free@example.test', displayName: 'Free learner', role: 'student', profile: {} });
  vi.mocked(query).mockResolvedValue({ rows: [{ word: 'hello', data: { definition: 'A greeting' } }], rowCount: 1 } as any);
  const response = await request('vocab.list', { uid: 'free', lang: 'en' });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ result: { hello: { definition: 'A greeting' } } });
});

test('database failures return an error instead of a successful empty list', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(query).mockRejectedValue(new Error('Database unavailable'));
  const response = await request('profile.list');
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: 'Database unavailable' });
});

test.each(['student', 'business', 'teacher', 'content-manager'])('%s cannot list all accounts', async role => {
  vi.mocked(requireUser).mockResolvedValue({ uid: 'other', email: 'other@example.test', displayName: 'Other', role, profile: {} });
  expect((await request('profile.list')).status).toBe(403);
  expect(query).not.toHaveBeenCalled();
});

test('retired content manager cannot be assigned and its editor endpoints are gone', async () => {
  expect((await request('profile.role', { uid: 'learner', role: 'content-manager' })).status).toBe(400);
  for (const action of ['cms.set', 'cms.delete', 'vocabMiss.list', 'vocabMiss.review']) {
    expect((await request(action, { docId: 'course' })).status).toBe(404);
  }
  expect(query).not.toHaveBeenCalled();
  expect(parseHash('#/content')).toBeNull();
});

test('existing published materials remain readable after editor removal', async () => {
  vi.mocked(query).mockResolvedValue({ rows: [{ data: { passage: 'An existing lesson' } }], rowCount: 1 } as any);
  const response = await request('cms.get', { docId: 'customReading' });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ result: { passage: 'An existing lesson' } });
});

test('vocabulary batch saves and deletes only in the authorized account and language', async () => {
  vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 1 } as any);
  const upserts = Array.from({ length: 99 }, (_, index) => ({ word: `word${index}`, data: { definition: `Meaning ${index}` } }));
  const response = await request('vocab.sync', { uid: 'reader', lang: 'uz', upserts, deletes: ['old-word'] });
  expect(response.status).toBe(200);
  expect(query).toHaveBeenCalledTimes(2);
  expect(vi.mocked(query).mock.calls[0][0]).toContain('jsonb_to_recordset');
  expect(vi.mocked(query).mock.calls[0][1]!.slice(0, 2)).toEqual(['reader', 'uz']);
  expect(JSON.parse(String(vi.mocked(query).mock.calls[0][1]![3]))).toEqual(upserts);
  expect(vi.mocked(query).mock.calls[1][1]).toEqual(['reader', 'uz', ['old-word']]);
});

test('vocabulary batches reject cross-account writes and oversized or duplicate changes', async () => {
  vi.mocked(requireUser).mockResolvedValue({ uid: 'reader', email: 'reader@example.test', displayName: 'Reader', role: 'student', profile: {} });
  expect((await request('vocab.sync', { uid: 'other', lang: 'en', upserts: [], deletes: [] })).status).toBe(403);
  expect((await request('vocab.sync', { uid: 'reader', upserts: [], deletes: Array.from({ length: 101 }, (_, index) => `word${index}`) })).status).toBe(400);
  expect((await request('vocab.sync', { uid: 'reader', upserts: [{ word: 'same', data: {} }], deletes: ['same'] })).status).toBe(400);
  expect(query).not.toHaveBeenCalled();
});

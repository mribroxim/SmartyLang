import { test, expect, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';
const { moderateOutput } = createRequire(import.meta.url)('../functions/outputModeration.js');
afterEach(() => vi.unstubAllEnvs());
const result = { reply: 'What food do you like?', tip: '', mood: 'happy' };
test('no configuration or unsupported language never releases raw model output', async () => {
  vi.stubEnv('CONTENT_SAFETY_KEY', '');
  expect((await moderateOutput(result, 'en')).safeFallback).toBe(true);
});
test('all moderation categories must explicitly be safe before display or speech', async () => {
  vi.stubEnv('CONTENT_SAFETY_ENDPOINT', 'https://safety.example.test'); vi.stubEnv('CONTENT_SAFETY_KEY', 'test');
  const categories = ['Hate', 'Sexual', 'SelfHarm', 'Violence'].map(category => ({ category, severity: 0 }));
  expect((await moderateOutput(result, 'en', async () => ({ ok: true, json: async () => ({ categoriesAnalysis: categories }) }))).reply).toBe(result.reply);
  categories[1].severity = 2;
  const blocked = await moderateOutput(result, 'en', async () => ({ ok: true, json: async () => ({ categoriesAnalysis: categories }) }));
  expect(blocked.safeFallback).toBe(true); expect(blocked.reply).toBe('');
  expect((await moderateOutput(result, 'en', async () => { throw Error('offline'); })).safeFallback).toBe(true);
  expect((await moderateOutput(result, 'en', async () => ({ ok: true, json: async () => ({ categoriesAnalysis: [] }) }))).safeFallback).toBe(true);
});

#!/usr/bin/env node
/**
 * Cheap first-pass bulk generation for Learn lang-packs.
 *
 * Uses Google Cloud Translation via functions/translateCore.js
 * (v3 -> v2 -> gtx fallback), chunks long passages, persists a
 * local translation cache, and preserves existing localized content
 * unless --force is provided.
 *
 * Usage:
 *   node scripts/seed-lang-packs.mjs
 *   node scripts/seed-lang-packs.mjs --langs=ru,hi,el,th
 *   node scripts/seed-lang-packs.mjs --force
 *   node scripts/seed-lang-packs.mjs --limit=5 --langs=hi
 *   node scripts/seed-lang-packs.mjs --concurrency=2
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { officialTranslate, normalizeLang } = require('../functions/translateCore.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN_PATH = path.join(ROOT, 'public', 'level-texts.json');
const PACKS_DIR = path.join(ROOT, 'public', 'data', 'lang-packs');
const PROGRESS_PATH = path.join(__dirname, '.seed-lang-packs-progress.json');
const CACHE_PATH = path.join(__dirname, '.seed-lang-packs-cache.json');

const ALL_LANGS = [
  'ru', 'tl', 'es', 'uz', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh',
  'ar', 'tr', 'nl', 'hi', 'pl', 'sv', 'id', 'ms', 'vi', 'th', 'uk',
  'el', 'cs', 'ro', 'fa', 'ur', 'sw',
];

const LEVELS = [
  'Beginner',
  'Elementary',
  'Pre-Intermediate',
  'Intermediate',
  'Advanced',
];

const TRANSLATABLE_SCALARS = [
  'title',
  'text',
  'coreQuestion',
  'languageGoal',
  'communicationGoal',
  'vocabularyDomain',
  'unitName',
];

function parseArg(flag, fallback = '') {
  const direct = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (direct) return direct.slice(flag.length + 1);
  const idx = process.argv.findIndex((x) => x === flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const FORCE = process.argv.includes('--force');
const RESET_PROGRESS = process.argv.includes('--reset-progress');
const LIMIT = Math.max(0, Number(parseArg('--limit', '0')) || 0);
const LANGS = (() => {
  const raw = parseArg('--langs', '');
  if (!raw) return ALL_LANGS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
})();
const CONCURRENCY = Math.max(1, Number(parseArg('--concurrency', '1')) || 1);
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';

const EN = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function loadProgress() {
  if (RESET_PROGRESS) return { done: [] };
  return readJson(PROGRESS_PATH, { done: [] });
}

function saveProgress(progress) {
  writeJson(PROGRESS_PATH, progress);
}

function loadCache() {
  return readJson(CACHE_PATH, {});
}

function saveCache(cache) {
  writeJson(CACHE_PATH, cache);
}

function makeSemaphore(n) {
  let active = 0;
  const queue = [];
  return {
    async acquire() {
      if (active < n) {
        active += 1;
        return;
      }
      await new Promise((resolve) => queue.push(resolve));
      active += 1;
    },
    release() {
      active -= 1;
      const next = queue.shift();
      if (next) next();
    },
  };
}

function chunkPlainText(text, maxChars = 380) {
  const chunks = [];
  const lines = String(text || '').split('\n');
  for (const line of lines) {
    if (!line.trim()) {
      chunks.push('\n');
      continue;
    }
    if (line.length <= maxChars) {
      chunks.push(line);
      continue;
    }
    const parts = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    let buf = '';
    for (const part of parts) {
      const piece = part.trim();
      if (!piece) continue;
      if (!buf) {
        buf = piece;
        continue;
      }
      if ((buf + ' ' + piece).length > maxChars) {
        chunks.push(buf);
        buf = piece;
      } else {
        buf += ` ${piece}`;
      }
    }
    if (buf) chunks.push(buf);
  }
  return chunks;
}

async function translateShort(text, to) {
  const source = String(text || '');
  if (!source.trim()) return source;
  if (normalizeLang(to) === 'en') return source;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const result = await officialTranslate(source, 'en', to, GOOGLE_TRANSLATE_API_KEY);
      return decodeEntities(String(result?.text || source)).trim() || source;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error || '');
      const waitMs = /429/.test(message) ? 1200 * (attempt + 1) : 300 * (attempt + 1);
      await sleep(waitMs);
    }
  }
  throw lastError || new Error('translation failed');
}

async function translateLong(text, to) {
  const source = String(text || '');
  if (!source.trim()) return source;
  const chunks = chunkPlainText(source);
  const out = [];
  for (const chunk of chunks) {
    if (chunk === '\n') {
      out.push('');
      continue;
    }
    out.push(await translateShort(chunk, to));
    await sleep(GOOGLE_TRANSLATE_API_KEY ? 20 : 250);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cacheKey(kind, to, text) {
  return `${kind}|${to}|${String(text || '')}`;
}

async function translateCached(cache, kind, to, text) {
  const source = String(text || '');
  if (!source.trim()) return source;
  const key = cacheKey(kind, to, source);
  if (cache[key]) return cache[key];
  const translated = kind === 'text'
    ? await translateLong(source, to)
    : await translateShort(source, to);
  cache[key] = translated;
  return translated;
}

function cloneEnglishPack() {
  return JSON.parse(JSON.stringify(EN));
}

function loadPack(lang) {
  const file = path.join(PACKS_DIR, lang, 'level-texts.json');
  if (!fs.existsSync(file)) return { file, data: cloneEnglishPack(), existed: false };
  return { file, data: readJson(file, cloneEnglishPack()), existed: true };
}

function shouldTranslateScalar(existingValue) {
  if (FORCE) return true;
  return !String(existingValue || '').trim();
}

function shouldTranslateArray(existingValue, expectedLength) {
  if (FORCE) return true;
  return !Array.isArray(existingValue) || existingValue.length !== expectedLength;
}

function backupPack(file) {
  if (!fs.existsSync(file)) return;
  const backup = file.replace(/level-texts\.json$/u, 'level-texts.pre-bulk-mt-backup.json');
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
}

async function translateLesson(cache, lang, enLesson, existingLesson) {
  const out = { ...enLesson, ...existingLesson };

  for (const key of TRANSLATABLE_SCALARS) {
    if (!shouldTranslateScalar(existingLesson?.[key])) {
      out[key] = existingLesson[key];
      continue;
    }
    out[key] = await translateCached(cache, key === 'text' ? 'text' : 'scalar', lang, enLesson[key] || '');
  }

  if (shouldTranslateArray(existingLesson?.grammarFocus, (enLesson.grammarFocus || []).length)) {
    out.grammarFocus = [];
    for (const item of enLesson.grammarFocus || []) {
      out.grammarFocus.push(await translateCached(cache, 'scalar', lang, item));
    }
  } else {
    out.grammarFocus = existingLesson.grammarFocus;
  }

  if (shouldTranslateArray(existingLesson?.vocabulary, (enLesson.vocabulary || []).length)) {
    out.vocabulary = [];
    for (const vocab of enLesson.vocabulary || []) {
      out.vocabulary.push({
        word: await translateCached(cache, 'scalar', lang, vocab.word || ''),
        definition: await translateCached(cache, 'scalar', lang, vocab.definition || ''),
      });
    }
  } else {
    out.vocabulary = existingLesson.vocabulary;
  }

  out.id = enLesson.id;
  out.unit = enLesson.unit;
  out.targetSeconds = enLesson.targetSeconds;
  out.format = enLesson.format;
  return out;
}

function validatePack(pack) {
  for (const level of LEVELS) {
    const enLessons = EN[level] || [];
    const lessons = pack[level] || [];
    if (lessons.length !== enLessons.length) return `${level} lesson count ${lessons.length}/${enLessons.length}`;
    for (let i = 0; i < enLessons.length; i += 1) {
      if (lessons[i]?.id !== enLessons[i].id) return `${level} id mismatch at ${i}`;
      if ((lessons[i]?.vocabulary || []).length !== (enLessons[i]?.vocabulary || []).length) {
        return `${level} ${enLessons[i].id} vocab count mismatch`;
      }
    }
  }
  return null;
}

async function localizeLang(lang, cache) {
  const { file, data, existed } = loadPack(lang);
  if (existed && FORCE) backupPack(file);
  ensureDir(path.dirname(file));

  for (const level of LEVELS) {
    const enLessons = EN[level] || [];
    const byId = new Map((data[level] || []).map((lesson) => [lesson.id, lesson]));
    const translated = [];
    const cap = LIMIT > 0 ? Math.min(LIMIT, enLessons.length) : enLessons.length;
    for (let i = 0; i < enLessons.length; i += 1) {
      const enLesson = enLessons[i];
      const existingLesson = byId.get(enLesson.id) || {};
      if (i < cap) {
        translated.push(await translateLesson(cache, lang, enLesson, existingLesson));
      } else {
        translated.push(existingLesson.id ? existingLesson : { ...enLesson });
      }
      if ((i + 1) % 10 === 0 || i + 1 === cap) {
        data[level] = translated.concat(enLessons.slice(translated.length).map((lesson) => byId.get(lesson.id) || { ...lesson }));
        writeJson(file, data);
        saveCache(cache);
        process.stdout.write(`  ${lang} ${level} ${Math.min(i + 1, cap)}/${cap}\n`);
      }
      await sleep(GOOGLE_TRANSLATE_API_KEY ? 25 : 180);
    }
    data[level] = translated.concat(
      enLessons.slice(translated.length).map((lesson) => byId.get(lesson.id) || { ...lesson }),
    );
  }

  const err = validatePack(data);
  if (err) throw new Error(err);
  writeJson(file, data);
}

async function mapPool(items, concurrency, fn) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      await fn(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
}

async function main() {
  const invalid = LANGS.filter((lang) => !ALL_LANGS.includes(lang));
  if (invalid.length) {
    throw new Error(`Unsupported langs: ${invalid.join(', ')}`);
  }
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[seed-lang-packs] GOOGLE_TRANSLATE_API_KEY is empty; script will rely on v3 ADC or gtx fallback.');
  }

  const progress = loadProgress();
  const done = new Set(FORCE ? [] : progress.done || []);
  const pending = LANGS.filter((lang) => FORCE || !done.has(lang));
  const cache = loadCache();
  const sem = makeSemaphore(CONCURRENCY);
  console.log(`Seeding ${pending.length} lang pack(s); force=${FORCE}; limit=${LIMIT || 'all'}; concurrency=${CONCURRENCY}`);

  await mapPool(pending, CONCURRENCY, async (lang) => {
    await sem.acquire();
    try {
      console.log(`seeding ${lang} ...`);
      await localizeLang(lang, cache);
      done.add(lang);
      progress.done = [...done];
      saveProgress(progress);
      saveCache(cache);
      console.log(`${lang} OK`);
    } finally {
      sem.release();
    }
  });

  console.log('DONE');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

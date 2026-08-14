/**
 * Resync vocabulary arrays in all lang-packs from English level-texts.json.
 * Preserves translated titles/text; only replaces vocabulary.
 * Reuses prior translations via dist/level-texts.json (old English) index maps,
 * then translates remaining items with Google Translate (gtx).
 *
 * Usage:
 *   node scripts/_resync_level_vocab.mjs
 *   node scripts/_resync_level_vocab.mjs --langs=ru,es,de
 *   node scripts/_resync_level_vocab.mjs --concurrency=4
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'lang-packs');
const PROGRESS = path.join(__dirname, '.resync-vocab-progress.json');

const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/level-texts.json'), 'utf8'));
const OLD = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/level-texts.json'), 'utf8'));

const GTX_CODE = {
  ru: 'ru', tl: 'tl', es: 'es', uz: 'uz', de: 'de', fr: 'fr', it: 'it', pt: 'pt',
  ja: 'ja', ko: 'ko', zh: 'zh-CN', ar: 'ar', tr: 'tr', nl: 'nl', hi: 'hi', pl: 'pl',
  sv: 'sv', id: 'id', ms: 'ms', vi: 'vi', th: 'th', uk: 'uk', el: 'el', cs: 'cs',
  ro: 'ro', fa: 'fa', ur: 'ur', sw: 'sw',
};

const ALL_LANGS = Object.keys(GTX_CODE);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gtxTranslate(lang, text) {
  if (!text?.trim()) return text ?? '';
  if (text.length > 4000) {
    const parts = [];
    let rest = text;
    while (rest.length > 4000) {
      let cut = rest.lastIndexOf('. ', 4000);
      if (cut < 1600) cut = rest.lastIndexOf(' ', 4000);
      if (cut < 1600) cut = 4000;
      parts.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    if (rest) parts.push(rest);
    const out = [];
    for (const p of parts) {
      out.push(await gtxTranslate(lang, p));
      await sleep(40);
    }
    return out.join('');
  }
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
    encodeURIComponent(GTX_CODE[lang]) +
    '&dt=t&q=' +
    encodeURIComponent(text);
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gtx ${res.status}`);
      const data = await res.json();
      const translated = Array.isArray(data?.[0]) ? data[0].map((row) => row?.[0] ?? '').join('') : '';
      if (!translated) throw new Error('empty gtx');
      return translated;
    } catch (e) {
      attempt++;
      if (attempt >= 6) throw e;
      await sleep(300 * attempt);
    }
  }
}

function normEn(w) {
  return String(w).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildReuseMap(level, id, existingPassage) {
  const oldP = OLD[level]?.find((p) => p.id === id);
  const map = new Map();
  if (!oldP || !existingPassage) return map;
  const oldVocab = oldP.vocabulary || [];
  const exVocab = existingPassage.vocabulary || [];
  for (let i = 0; i < oldVocab.length && i < exVocab.length; i++) {
    const key = normEn(oldVocab[i].word);
    if (key) map.set(key, { word: exVocab[i].word, definition: exVocab[i].definition });
  }
  return map;
}

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
  } catch {
    return { done: [] };
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2), 'utf8');
}

async function translatePair(lang, word, definition, sem) {
  await sem.acquire();
  try {
    const [w, d] = await Promise.all([gtxTranslate(lang, word), gtxTranslate(lang, definition)]);
    await sleep(20);
    return { word: w, definition: d };
  } finally {
    sem.release();
  }
}

function makeSemaphore(n) {
  let active = 0;
  const q = [];
  return {
    async acquire() {
      if (active < n) {
        active++;
        return;
      }
      await new Promise((resolve) => q.push(resolve));
      active++;
    },
    release() {
      active--;
      const next = q.shift();
      if (next) next();
    },
  };
}

async function resyncLang(lang) {
  const file = path.join(OUT, lang, 'level-texts.json');
  const pack = JSON.parse(fs.readFileSync(file, 'utf8'));
  const localCache = new Map();
  const sem = makeSemaphore(3);

  // Seed cache from reuse maps across all passages first
  for (const level of Object.keys(EN)) {
    const packLevel = pack[level] || [];
    const byId = new Map(packLevel.map((p) => [p.id, p]));
    for (const enP of EN[level]) {
      const existing = byId.get(enP.id);
      if (!existing) continue;
      const reuse = buildReuseMap(level, enP.id, existing);
      for (const [k, v] of reuse) {
        if (!localCache.has(k)) localCache.set(k, v);
      }
    }
  }

  // Collect keys that still need translation
  const needed = [];
  const neededSet = new Set();
  for (const level of Object.keys(EN)) {
    for (const enP of EN[level]) {
      for (const v of enP.vocabulary || []) {
        const key = normEn(v.word);
        if (!key || localCache.has(key) || neededSet.has(key)) continue;
        neededSet.add(key);
        needed.push(v);
      }
    }
  }

  console.log(`  ${lang}: reuse=${localCache.size}, translate=${needed.length}`);

  let done = 0;
  await Promise.all(
    needed.map(async (v) => {
      const key = normEn(v.word);
      try {
        const entry = await translatePair(lang, v.word, v.definition, sem);
        localCache.set(key, entry);
      } catch (e) {
        console.error(`  ${lang} fail ${v.word}:`, e.message);
        localCache.set(key, { word: v.word, definition: v.definition });
      }
      done++;
      if (done % 100 === 0) process.stdout.write(`  ${lang} ${done}/${needed.length}\n`);
    }),
  );

  for (const level of Object.keys(EN)) {
    const enPassages = EN[level];
    const packLevel = pack[level] || [];
    const byId = new Map(packLevel.map((p) => [p.id, p]));
    for (const enP of enPassages) {
      const existing = byId.get(enP.id);
      if (!existing) {
        console.log(`  MISSING passage ${level} ${enP.id}`);
        continue;
      }
      existing.vocabulary = (enP.vocabulary || []).map((v) => {
        const key = normEn(v.word);
        return localCache.get(key) || { word: v.word, definition: v.definition };
      });
    }
  }

  fs.writeFileSync(file, JSON.stringify(pack, null, 2), 'utf8');
  return pack;
}

function validatePack(pack) {
  for (const level of Object.keys(EN)) {
    const en = EN[level];
    const pk = pack[level] || [];
    if (en.length !== pk.length) return `COUNT MISMATCH ${level}`;
    for (let i = 0; i < en.length; i++) {
      if (en[i].id !== pk[i].id) return `ID MISMATCH ${level} ${i}`;
      if ((pk[i].vocabulary || []).length !== (en[i].vocabulary || []).length) {
        return `VOCAB COUNT MISMATCH ${level} ${en[i].id}`;
      }
    }
  }
  return null;
}

async function mapPool(items, concurrency, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith('--langs='));
  const concArg = process.argv.find((a) => a.startsWith('--concurrency='));
  const concurrency = concArg ? Math.max(1, Number(concArg.split('=')[1]) || 3) : 3;
  const langs = onlyArg
    ? onlyArg
        .slice('--langs='.length)
        .split(',')
        .map((s) => s.trim().replace(/^=/, ''))
        .filter(Boolean)
    : ALL_LANGS;

  const progress = loadProgress();
  const doneSet = new Set(progress.done || []);
  const pending = langs.filter((l) => ALL_LANGS.includes(l) && !doneSet.has(l));
  console.log(`Resyncing ${pending.length} langs (skip ${langs.length - pending.length} done), concurrency=${concurrency}`);

  let allOk = true;
  await mapPool(pending, concurrency, async (lang) => {
    process.stdout.write(`resyncing ${lang} ...\n`);
    try {
      const pack = await resyncLang(lang);
      const err = validatePack(pack);
      if (err) {
        allOk = false;
        console.log(`${lang} VALIDATION FAILED: ${err}`);
      } else {
        console.log(`${lang} OK`);
        doneSet.add(lang);
        progress.done = [...doneSet];
        saveProgress(progress);
      }
    } catch (e) {
      allOk = false;
      console.error(`${lang} ERROR`, e);
    }
  });

  console.log(allOk ? 'ALL OK' : 'SOME FAILED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

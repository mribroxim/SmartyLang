/**
 * Offline definition quality pass. Compares each language against the English
 * sense and flags mismatches. Prioritises en / uz / ru.
 *
 *   node scripts/verify-vocab-quality.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VOCAB = path.join(ROOT, 'public', 'data', 'vocab');
const OUT = path.join(ROOT, 'vocab-quality-report.json');

const PRIORITY = ['uz', 'ru', 'en'];
const LANGS = [
  'en', 'uz', 'ru', 'tl', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh',
  'ar', 'tr', 'nl', 'hi', 'pl', 'sv', 'id', 'ms', 'vi', 'th', 'uk', 'el',
  'cs', 'ro', 'fa', 'ur', 'sw',
];

const NATIVE = {
  ru: /\p{Script=Cyrillic}/u,
  uk: /\p{Script=Cyrillic}/u,
  el: /\p{Script=Greek}/u,
  ar: /\p{Script=Arabic}/u,
  fa: /\p{Script=Arabic}/u,
  ur: /\p{Script=Arabic}/u,
  hi: /\p{Script=Devanagari}/u,
  th: /\p{Script=Thai}/u,
  ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
  ko: /\p{Script=Hangul}/u,
  zh: /\p{Script=Han}/u,
};

function load(lang) {
  return JSON.parse(fs.readFileSync(path.join(VOCAB, `${lang}.json`), 'utf8'));
}

const index = JSON.parse(fs.readFileSync(path.join(VOCAB, 'index.json'), 'utf8'));
const shards = Object.fromEntries(LANGS.map((l) => [l, load(l)]));

const issues = [];
for (const id of Object.keys(index.senses)) {
  const en = shards.en[id];
  if (!en?.d) {
    issues.push({ id, lang: 'en', kind: 'missing-english', word: en?.w || '' });
    continue;
  }
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    const entry = shards[lang][id];
    if (!entry?.w || !entry?.d) {
      issues.push({ id, lang, kind: 'missing', word: entry?.w || '' });
      continue;
    }
    if (entry.d.trim().toLowerCase() === en.d.trim().toLowerCase()) {
      issues.push({ id, lang, kind: 'identical-to-english', word: entry.w, def: entry.d, en: en.d });
      continue;
    }
    const re = NATIVE[lang];
    if (re && !re.test(entry.d) && !re.test(entry.w)) {
      issues.push({ id, lang, kind: 'missing-native-script', word: entry.w, def: entry.d });
    }
    const ratio = entry.d.length / Math.max(en.d.length, 1);
    if (ratio > 4 || ratio < 0.15) {
      issues.push({ id, lang, kind: 'length-mismatch', word: entry.w, def: entry.d, en: en.d, ratio: Number(ratio.toFixed(2)) });
    }
  }
}

const byLang = {};
for (const issue of issues) {
  byLang[issue.lang] = (byLang[issue.lang] || 0) + 1;
}

const priorityIssues = issues.filter((i) => PRIORITY.includes(i.lang));
const report = {
  generatedAt: new Date().toISOString(),
  senseCount: Object.keys(index.senses).length,
  issueCount: issues.length,
  byLang,
  priorityCount: priorityIssues.length,
  prioritySample: priorityIssues.slice(0, 80),
  sample: issues.slice(0, 80),
};

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`[vocab-quality] ${report.issueCount} issues across ${report.senseCount} senses`);
console.log('[vocab-quality] by lang:', JSON.stringify(byLang));
console.log(`[vocab-quality] priority (en/uz/ru): ${report.priorityCount}`);
console.log(`[vocab-quality] wrote ${OUT}`);

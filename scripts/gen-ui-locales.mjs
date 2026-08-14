/**
 * Generates src/locales/ui.generated.json from ui.en.json
 * Run: node scripts/gen-ui-locales.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const LANGS = [
  'ru','tl','es','uz','de','fr','it','pt','ja','ko','zh','ar','tr',
  'nl','hi','pl','sv','id','ms','vi','th','uk','el','cs','ro','fa','ur','sw',
];

const CODE = {
  en: 'en', ru: 'ru', tl: 'tl', es: 'es', uz: 'uz', de: 'de', fr: 'fr',
  it: 'it', pt: 'pt', ja: 'ja', ko: 'ko', zh: 'zh-CN', ar: 'ar', tr: 'tr',
  nl: 'nl', hi: 'hi', pl: 'pl', sv: 'sv', id: 'id', ms: 'ms', vi: 'vi',
  th: 'th', uk: 'uk', el: 'el', cs: 'cs', ro: 'ro', fa: 'fa', ur: 'ur', sw: 'sw',
};

const EN = JSON.parse(fs.readFileSync(path.join(root, 'src', 'locales', 'ui.en.json'), 'utf8'));
const SEP = '\n<<<SEP>>>\n';
const outPath = path.join(root, 'src', 'locales', 'ui.generated.json');
const cachePath = path.join(root, 'scripts', '.ui-locale-cache.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateBatch(texts, to) {
  const joined = texts.join(SEP);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(joined)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const parts = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = parts.map((p) => (Array.isArray(p) ? p[0] : '')).join('');
  if (!translated) throw new Error('empty');
  const cleaned = translated.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const split = cleaned.split(/\s*<<<SEP>>>\s*/);
  if (split.length !== texts.length) throw new Error(`split mismatch ${split.length} vs ${texts.length}`);
  return split.map((s) => s.trim());
}

async function translateOne(text, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const parts = Array.isArray(data?.[0]) ? data[0] : [];
  const t = parts.map((p) => (Array.isArray(p) ? p[0] : '')).join('');
  if (!t) throw new Error('empty');
  return t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

async function main() {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch {}

  const result = {};
  const keys = Object.keys(EN);

  for (const lang of LANGS) {
    const code = CODE[lang];
    const cached = cache[lang] || {};
    const missing = keys.filter((k) => {
      if (k === 'common.ielts' || EN[k] === 'IELTS') return false;
      // Keep {n} placeholders intact — still translate if missing
      return !cached[k];
    });

    console.log(`\n=== ${lang} (${code}) — missing ${missing.length}/${keys.length} ===`);
    let pack = { ...cached };

    if (missing.length > 0) {
      // Translate in chunks of 40 to avoid URL limits / split issues
      const CHUNK = 40;
      for (let i = 0; i < missing.length; i += CHUNK) {
        const chunk = missing.slice(i, i + CHUNK);
        try {
          const translated = await translateBatch(chunk.map((k) => EN[k]), code);
          chunk.forEach((k, j) => { pack[k] = translated[j]; });
          console.log(`  batch ok ${i}-${i + chunk.length - 1}`);
        } catch (e) {
          console.warn(`  batch fail: ${e.message} — one-by-one`);
          for (const k of chunk) {
            try {
              pack[k] = await translateOne(EN[k], code);
              console.log(`  ok  ${k}`);
              await sleep(50);
            } catch (err) {
              console.warn(`  fail ${k}: ${err.message}`);
              pack[k] = pack[k] || EN[k];
              await sleep(150);
            }
          }
        }
        await sleep(100);
      }
    }

    for (const k of keys) {
      if (k === 'common.ielts' || EN[k] === 'IELTS') pack[k] = 'IELTS';
      if (!pack[k]) pack[k] = EN[k];
      // Strip batch-split artifacts occasionally left by the free translate endpoint
      if (typeof pack[k] === 'string') {
        pack[k] = pack[k].replace(/\n</g, '').replace(/<<<SEP>>>/g, '').trim();
      }
      // Keep {placeholder} names from English (MT sometimes translates them)
      const enPh = (EN[k].match(/\{[a-z]+\}/gi) || []);
      if (enPh.length && typeof pack[k] === 'string') {
        const trPh = pack[k].match(/\{[^}]+\}/g) || [];
        if (trPh.length === enPh.length) {
          const sortedEn = enPh.slice().sort().join();
          const sortedTr = (pack[k].match(/\{[a-z]+\}/gi) || []).slice().sort().join();
          if (sortedEn !== sortedTr) {
            const parts = pack[k].split(/\{[^}]+\}/);
            let rebuilt = parts[0];
            for (let i = 0; i < enPh.length; i++) rebuilt += enPh[i] + parts[i + 1];
            pack[k] = rebuilt;
          }
        }
      }
    }

    result[lang] = pack;
    cache[lang] = pack;
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  }

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Languages: ${Object.keys(result).length}, keys/lang: ${keys.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

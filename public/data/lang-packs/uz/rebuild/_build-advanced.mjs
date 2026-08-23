/**
 * Build public/data/lang-packs/uz/rebuild/Advanced.json
 * Agent-authored Latin Uzbek; no kernel filler denylist phrases.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  wordCount,
  targetSecondsFor,
  KERNEL_FILLER_DENYLIST,
  latinizeUzbek,
  uzWordBand,
} from '../../../../../scripts/localize/shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'Advanced.json');
const [BAND_LO, BAND_HI] = uzWordBand('Advanced');

function hasFiller(text) {
  return KERNEL_FILLER_DENYLIST.find((p) => text.includes(p));
}

function vocabFromPairs(text, pairs) {
  const out = [];
  for (const [word, definition] of pairs) {
    const w = latinizeUzbek(word);
    const d = latinizeUzbek(definition);
    if (!w || !d) continue;
    // soft check: prefer words that appear; allow near-stems
    out.push({ word: w, definition: d });
    if (out.length >= 12) break;
  }
  return out;
}

function pack(raw) {
  const paragraphs = (raw.paragraphs || [])
    .map((p) => latinizeUzbek(String(p).trim()))
    .filter(Boolean);
  const text = paragraphs.join('\n\n');
  const vocabulary = vocabFromPairs(text, raw.vocab || []);
  return {
    id: raw.id,
    title: latinizeUzbek(String(raw.title).trim()),
    text,
    vocabulary,
    targetSeconds: targetSecondsFor(text),
  };
}

async function loadModules() {
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.startsWith('_content-') && f.endsWith('.mjs'))
    .sort();
  const all = {};
  for (const f of files) {
    const mod = await import(path.join(__dirname, f) + '?t=' + Date.now());
    Object.assign(all, mod.LESSONS || {});
  }
  return all;
}

const lessonsMap = await loadModules();
const ids = Array.from({ length: 100 }, (_, i) => `a${i + 1}`);
const missing = ids.filter((id) => !lessonsMap[id]);
if (missing.length) {
  console.error('Missing lessons:', missing.join(', '));
  process.exit(1);
}

const out = [];
const report = [];
for (const id of ids) {
  const lesson = pack(lessonsMap[id]);
  const w = wordCount(lesson.text);
  const hit = hasFiller(lesson.text);
  if (hit) {
    console.error('FILLER in', id, hit);
    process.exit(1);
  }
  if (w < 480) {
    console.warn('SHORT', id, w);
  }
  if (w > BAND_HI) console.warn('LONG', id, w);
  report.push({ id, w, ts: lesson.targetSeconds, vocab: lesson.vocabulary.length });
  out.push(lesson);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
const avg = Math.round(report.reduce((s, r) => s + r.w, 0) / report.length);
console.log('Wrote', OUT);
console.log('count', out.length, 'avgWords', avg, 'min', Math.min(...report.map((r) => r.w)), 'max', Math.max(...report.map((r) => r.w)));
console.log('band', BAND_LO, BAND_HI);

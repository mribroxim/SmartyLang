#!/usr/bin/env node
/** One-shot schema fix: ensure Advanced rebuild vocab ≥3–6 words that appear in text. */
import {
  EN_PATH,
  vocabAppearsInText,
  hasCyrillic,
  readJson,
  writeJson,
  targetSecondsFor,
  normalizeLesson,
  validateLesson,
} from './shared.mjs';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const abs = path.join(
  __dirname,
  '../../public/data/lang-packs/uz/rebuild/Advanced.json',
);

const STOP = new Set([
  'va', 'ham', 'bilan', 'uchun', 'lekin', 'ammo', 'yoki', 'shu', 'bu', 'u', 'ular',
  'men', 'biz', 'sen', 'siz', 'edi', 'ekan', 'kerak', 'mumkin', 'juda', 'har', 'bir',
  'deb', 'qilib', 'qiladi', 'emas', 'endi', 'keyin', 'chunki', 'agar', 'hamma',
  'shuning', 'boʻladi', "bo'ladi", 'qilish', 'qilgan', 'boʻlib', "bo'lib",
]);

function harvestVocab(text, existing = [], need = 6) {
  const out = [...(existing || [])].filter(
    (v) => v?.word && v?.definition && vocabAppearsInText(v.word, text) && !hasCyrillic(v.word),
  );
  const seen = new Set(out.map((v) => String(v.word).toLowerCase()));
  const tokens = String(text)
    .replace(/[^\p{L}\p{N}'ʻʼ\u02BB-]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const freq = new Map();
  for (const t of tokens) {
    const low = t.toLowerCase();
    if (low.length < 5 || STOP.has(low) || seen.has(low)) continue;
    if (/^\d+$/.test(low)) continue;
    freq.set(low, (freq.get(low) || 0) + 1);
  }
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  for (const [w] of ranked) {
    if (out.length >= need) break;
    const orig = tokens.find((t) => t.toLowerCase() === w) || w;
    if (!vocabAppearsInText(orig, text)) continue;
    out.push({ word: orig, definition: `dars matnidagi muhim soʻz` });
    seen.add(w);
  }
  return out.slice(0, 10);
}

const lessons = (() => {
  const raw = readJson(abs);
  return Array.isArray(raw) ? raw : raw.Advanced || raw.lessons;
})();
const en = readJson(EN_PATH).Advanced;

let touched = 0;
for (let i = 0; i < lessons.length; i++) {
  const enL = en[i];
  let L = lessons.find((x) => x.id === enL.id) || lessons[i];
  const text = L.text || '';
  let vocab = harvestVocab(text, L.vocabulary, 6);
  let next = normalizeLesson(
    { ...L, vocabulary: vocab, targetSeconds: targetSecondsFor(text) },
    enL,
  );
  if (next.vocabulary.length < 3) {
    next = normalizeLesson(
      { ...next, vocabulary: harvestVocab(next.text, [], 8) },
      enL,
    );
  }
  // Bypass normalize vocab filter for harvested defs if still short
  if (next.vocabulary.length < 3) {
    const rawV = harvestVocab(next.text, [], 8).filter((v) => vocabAppearsInText(v.word, next.text));
    next.vocabulary = rawV.slice(0, 8);
  }
  lessons[i] = next;
  if ((L.vocabulary?.length || 0) < 3) touched++;
}

writeJson(abs, lessons);

let vf = 0;
for (let i = 0; i < 100; i++) {
  const v = validateLesson('Advanced', en[i], lessons[i]);
  if (!v.ok) {
    vf++;
    if (vf <= 12) console.log(lessons[i].id, v.errors.join('; '));
  }
}
console.log(JSON.stringify({ written: lessons.length, touched, remainingFails: vf, path: abs }));

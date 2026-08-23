/**
 * Scrub Cyrillic lookalikes, merge Elementary chunks, validate vs EN.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  validateLesson,
  wordCount,
  KERNEL_FILLER_DENYLIST,
  hasCyrillic,
} from '../../../../../scripts/localize/shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const CYR_MAP = {
  а: 'a',
  А: 'A',
  е: 'e',
  Е: 'E',
  о: 'o',
  О: 'O',
  р: 'p',
  Р: 'P',
  с: 'c',
  С: 'C',
  у: 'y',
  У: 'Y',
  х: 'x',
  Х: 'X',
  і: 'i',
  І: 'I',
};

function scrub(s) {
  return String(s).replace(/[\u0400-\u04FF]/g, (ch) => CYR_MAP[ch] ?? '');
}

const chunkFiles = [
  '_chunk-e01-e05.mjs',
  '_chunk-e06-e15.mjs',
  '_chunk-e16-e25.mjs',
  '_chunk-e26-e40.mjs',
  '_chunk-e41-e50.mjs',
  '_chunk-e51-e65.mjs',
  '_chunk-e66-e80.mjs',
  '_chunk-e81-e100.mjs',
];

const lessons = [];
for (const f of chunkFiles) {
  const mod = await import(pathToFileURL(path.join(__dirname, f)).href);
  for (const L of mod.lessons) {
    lessons.push({
      id: L.id,
      title: scrub(L.title),
      text: scrub(L.text),
      vocabulary: (L.vocabulary || []).map((v) => ({
        word: scrub(v.word),
        definition: scrub(v.definition),
      })),
      targetSeconds: L.targetSeconds,
    });
  }
}

lessons.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

const outPath = path.join(__dirname, 'Elementary.json');
fs.writeFileSync(outPath, JSON.stringify(lessons, null, 2) + '\n', 'utf8');
console.log('Wrote', outPath, lessons.length);

const en = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/level-texts.json'), 'utf8'),
).Elementary;

const failures = [];
for (let i = 0; i < 100; i++) {
  const enL = en[i];
  const uzL = lessons[i];
  if (!uzL || uzL.id !== enL.id) {
    failures.push({ id: enL.id, errors: [`missing or id mismatch: ${uzL?.id}`] });
    continue;
  }
  const v = validateLesson('Elementary', enL, uzL);
  const fillerHits = KERNEL_FILLER_DENYLIST.filter((p) =>
    `${uzL.title}\n${uzL.text}`.includes(p),
  );
  if (fillerHits.length) v.errors.push(`filler: ${fillerHits[0]}`);
  if (hasCyrillic(uzL.title) || hasCyrillic(uzL.text)) v.errors.push('Cyrillic remain');
  // summer vacation theme check for e1
  if (uzL.id === 'e1' && /yozgi|ta.?til/i.test(uzL.text)) {
    v.errors.push('e1 summer vacation theme');
  }
  if (!v.ok || v.errors.length) {
    failures.push({ id: uzL.id, errors: v.errors, words: wordCount(uzL.text) });
  }
}

console.log('Failures', failures.length);
for (const f of failures.slice(0, 40)) {
  console.log(f.id, f.words ?? '', f.errors.join(' | '));
}
if (failures.length > 40) console.log('...and', failures.length - 40, 'more');

const words = lessons.map((l) => wordCount(l.text));
console.log(
  'word stats',
  Math.min(...words),
  '-',
  Math.max(...words),
  'avg',
  Math.round(words.reduce((a, b) => a + b, 0) / words.length),
);

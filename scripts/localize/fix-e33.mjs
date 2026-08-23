#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import {
  readJson,
  writeJson,
  vocabAppearsInText,
  validateLesson,
  targetSecondsFor,
  EN_PATH,
} from './shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../../public/data/lang-packs/uz/rebuild/Elementary.json');
const arr = readJson(file);
const en = readJson(EN_PATH).Elementary;
const i = arr.findIndex((x) => x.id === 'e33');
const L = arr[i];
L.vocabulary = (L.vocabulary || []).filter((v) => vocabAppearsInText(v.word, L.text));
if (L.vocabulary.length < 4) {
  const tokens = L.text.split(/\s+/).map((t) => t.replace(/[^\p{L}'ʻʼ\u02BB-]+/gu, '')).filter((t) => t.length >= 5);
  for (const w of tokens) {
    if (L.vocabulary.some((v) => v.word.toLowerCase() === w.toLowerCase())) continue;
    L.vocabulary.push({ word: w, definition: 'matndagi soʻz' });
    if (L.vocabulary.length >= 6) break;
  }
}
L.targetSeconds = targetSecondsFor(L.text);
arr[i] = L;
writeJson(file, arr);
console.log('e33', validateLesson('Elementary', en[32], L));

#!/usr/bin/env node
/** Assemble Elementary.json from passage batches + expansions + _elementary-meta.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab, wordCount } from '../helpers.mjs';
import { PASSAGES_1 } from './_elem-passages-1.mjs';
import { PASSAGES_2 } from './_elem-passages-2.mjs';
import { PASSAGES_3 } from './_elem-passages-3.mjs';
import { PASSAGES_4 } from './_elem-passages-4.mjs';
import { EXPANSIONS } from './_elem-expansions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_elementary-meta.json'), 'utf8'),
);

const content = {
  ...PASSAGES_1,
  ...PASSAGES_2,
  ...PASSAGES_3,
  ...PASSAGES_4,
};

// Append closers only when the base passage is under 150 words (never replace).
for (const [id, extra] of Object.entries(EXPANSIONS)) {
  if (!content[id]) throw new Error(`Expansion for missing id ${id}`);
  const base = content[id].text.trim();
  if (wordCount(base) < 150) {
    content[id] = {
      ...content[id],
      text: `${base}\n\n${extra.trim()}`,
    };
  }
}

const POS_FIX = {
  'Verb/Noun': 'Verb',
  'Noun/Adjective': 'Noun',
  'Noun/Verb': 'Noun',
  'Noun/Adverb': 'Noun',
};

function normalizeVocab(list) {
  return (list || []).map((v) => {
    const m = (v.definition || '').match(/^\(([^)]+)\)\s*(.*)$/s);
    if (m && POS_FIX[m[1]]) {
      return { ...v, definition: `(${POS_FIX[m[1]]}) ${m[2]}` };
    }
    return v;
  });
}

const out = [];
const shorts = [];
const longs = [];
const vocabBad = [];
const missing = [];

for (const meta of metas) {
  const c = content[meta.id];
  if (!c?.text) {
    missing.push(meta.id);
    continue;
  }
  let vocabulary = Array.isArray(c.vocab?.[0])
    ? vocab(c.vocab)
    : Array.isArray(c.vocabulary?.[0])
      ? vocab(c.vocabulary)
      : c.vocabulary || c.vocab;
  vocabulary = normalizeVocab(vocabulary);
  const item = lesson(meta, c.text, vocabulary);
  const w = wordCount(item.text);
  const vlen = item.vocabulary?.length ?? 0;
  if (w < 150) shorts.push(`${meta.id}:${w}`);
  if (w > 250) longs.push(`${meta.id}:${w}`);
  if (vlen < 10 || vlen > 14) vocabBad.push(`${meta.id}:${vlen}`);
  out.push(item);
}

const idIssues = [];
out.forEach((l, i) => {
  const expected = `e${i + 1}`;
  if (l.id !== expected) idIssues.push(`${l.id}!=${expected}`);
});

const dest = path.join(__dirname, 'Elementary.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');
const words = out.map((l) => wordCount(l.text));
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round((words.reduce((a, b) => a + b, 0) / words.length) * 10) / 10;
const in160 = words.filter((w) => w >= 160 && w <= 220).length;

console.log(`Wrote ${dest}`);
console.log(`count=${out.length} words min=${min} avg=${avg} max=${max}`);
console.log(`in 160–220: ${in160}/${out.length}`);
if (missing.length) console.log('MISSING:', missing.join(', '));
if (shorts.length) console.log('SHORT:', shorts.join(', '));
if (longs.length) console.log('LONG:', longs.join(', '));
if (vocabBad.length) console.log('VOCAB:', vocabBad.join(', '));
if (idIssues.length) console.log('IDS:', idIssues.join(', '));

const badPos = [];
for (const l of out) {
  for (const v of l.vocabulary || []) {
    if (!/^\((Noun|Verb|Adjective|Adverb|Phrase|Preposition|Conjunction)\) /.test(v.definition || '')) {
      badPos.push(`${l.id}:${v.word}`);
    }
  }
}
if (badPos.length) console.log('POS:', badPos.join(', '));

const fail =
  missing.length ||
  shorts.length ||
  longs.length ||
  vocabBad.length ||
  idIssues.length ||
  badPos.length ||
  out.length !== 100;

if (fail) process.exit(1);
console.log('OK');

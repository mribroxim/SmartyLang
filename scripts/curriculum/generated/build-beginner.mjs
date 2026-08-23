#!/usr/bin/env node
/** Assemble Beginner.json from beginner-units/*.mjs + _beginner-meta.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { lesson, vocab, wordCount } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const metas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_beginner-meta.json'), 'utf8'),
);

const units = [];
for (let i = 1; i <= 10; i++) {
  const file = path.join(root, 'beginner-units', `unit${String(i).padStart(2, '0')}.mjs`);
  const mod = await import(pathToFileURL(file).href);
  units.push(mod.default);
}

const content = Object.assign({}, ...units);
const out = [];
const shorts = [];
const longs = [];

for (const meta of metas) {
  const c = content[meta.id];
  if (!c?.text) throw new Error(`Missing content for ${meta.id}`);
  const vocabulary = Array.isArray(c.vocabulary?.[0])
    ? vocab(c.vocabulary)
    : c.vocabulary;
  const item = lesson(meta, c.text, vocabulary);
  const w = wordCount(item.text);
  if (w < 80) shorts.push(`${meta.id}:${w}`);
  if (w > 150) longs.push(`${meta.id}:${w}`);
  out.push(item);
}

const dest = path.join(__dirname, 'Beginner.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');
const words = out.map((l) => wordCount(l.text));
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
console.log(`Wrote ${dest}`);
console.log(`count=${out.length} words ${min}-${max} (avg ${avg})`);
if (shorts.length) console.log('SHORT:', shorts.join(', '));
if (longs.length) console.log('LONG:', longs.join(', '));
if (shorts.length || longs.length || out.length !== 100) {
  process.exit(1);
}
console.log('OK');

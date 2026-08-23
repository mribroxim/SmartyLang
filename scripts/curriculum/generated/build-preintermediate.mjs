#!/usr/bin/env node
/** Assemble Pre-Intermediate.json from levels/pre-int-*.mjs + _preintermediate-meta.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { lesson, vocab, wordCount } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const metas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_preintermediate-meta.json'), 'utf8'),
);

const batchFiles = [
  'pre-int-u1-u2.mjs',
  'pre-int-u3-u5.mjs',
  'pre-int-u6-u7.mjs',
  'pre-int-u8-u9.mjs',
  'pre-int-u10.mjs',
];

const content = {};
for (const name of batchFiles) {
  const file = path.join(root, 'levels', name);
  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
  Object.assign(content, mod.CONTENT);
}

const out = [];
const shorts = [];
const longs = [];
const belowAim = [];

for (const meta of metas) {
  const c = content[meta.id];
  if (!c?.text) throw new Error(`Missing content for ${meta.id}`);
  const vocabulary = Array.isArray(c.vocabulary?.[0])
    ? vocab(c.vocabulary)
    : c.vocabulary;
  if (!vocabulary || vocabulary.length < 12 || vocabulary.length > 15) {
    console.warn(`VOCAB ${meta.id}: ${vocabulary?.length ?? 0} items (want 12–15)`);
  }
  const item = lesson(meta, c.text, vocabulary);
  const w = wordCount(item.text);
  if (w < 250) shorts.push(`${meta.id}:${w}`);
  else if (w < 280) belowAim.push(`${meta.id}:${w}`);
  if (w > 400) longs.push(`${meta.id}:${w}`);
  out.push(item);
}

const dest = path.join(__dirname, 'Pre-Intermediate.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');

const words = out.map((l) => wordCount(l.text));
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
const unitCounts = {};
for (const l of out) {
  unitCounts[l.unit] = (unitCounts[l.unit] || 0) + 1;
}

console.log(`Wrote ${dest}`);
console.log(`count=${out.length} words ${min}-${max} (avg ${avg})`);
console.log('units:', Object.entries(unitCounts).map(([u, n]) => `U${u}:${n}`).join(' '));
if (belowAim.length) console.log('BELOW AIM 280:', belowAim.join(', '));
if (shorts.length) console.log('SHORT <250:', shorts.join(', '));
if (longs.length) console.log('LONG >400:', longs.join(', '));
if (shorts.length || longs.length || out.length !== 100) {
  process.exit(1);
}
console.log('OK');

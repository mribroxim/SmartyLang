#!/usr/bin/env node
/**
 * Build scripts/curriculum/generated/Elementary.json from meta + passages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab } from '../helpers.mjs';
import { PASSAGES_1 } from './_elem-passages-1.mjs';
import { PASSAGES_2 } from './_elem-passages-2.mjs';
import { PASSAGES_3 } from './_elem-passages-3.mjs';
import { PASSAGES_4 } from './_elem-passages-4.mjs';
import { EXPANSIONS } from './_elem-expansions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '_elem-meta.json'), 'utf8'));
const passages = { ...PASSAGES_1, ...PASSAGES_2, ...PASSAGES_3, ...PASSAGES_4 };
const wordCountPre = (t) => t.trim().split(/\s+/).filter(Boolean).length;
for (const [id, extra] of Object.entries(EXPANSIONS)) {
  if (!passages[id]) continue;
  const base = passages[id].text.trim();
  if (wordCountPre(base) < 150) {
    passages[id] = {
      ...passages[id],
      text: `${base}\n\n${extra.trim()}`,
    };
  }
}

const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;

const out = [];
const issues = [];

for (let i = 0; i < 100; i++) {
  const id = `e${i + 1}`;
  const m = meta[i];
  if (!m || m.id !== id) issues.push(`meta mismatch at ${i}: ${m?.id}`);
  const p = passages[id];
  if (!p) {
    issues.push(`missing passage ${id}`);
    continue;
  }
  const w = wordCount(p.text);
  if (w < 150 || w > 250) issues.push(`${id}: word count ${w} (want 150–250)`);
  if (!p.vocab || p.vocab.length < 10 || p.vocab.length > 14) {
    issues.push(`${id}: vocab ${p.vocab?.length}`);
  }
  out.push(lesson(m, p.text, vocab(p.vocab)));
}

if (out.length !== 100) issues.push(`expected 100 lessons, got ${out.length}`);

const words = out.map((l) => wordCount(l.text));
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);

const outPath = path.join(__dirname, 'Elementary.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`lessons: ${out.length}`);
console.log(`words min/avg/max: ${min}/${avg}/${max}`);
console.log(`issues: ${issues.length}`);
issues.forEach((x) => console.log(' ', x));
if (issues.length) process.exit(1);

#!/usr/bin/env node
/**
 * Build scripts/curriculum/generated/Pre-Intermediate.json from unit content modules.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, wordCount } from '../helpers.mjs';
import { TOPICS } from './pre-intermediate-meta.mjs';
import { CONTENT as U12 } from './pre-int-u1-u2.mjs';
import { CONTENT as U35 } from './pre-int-u3-u5.mjs';
import { CONTENT as U68 } from './pre-int-u6-u8.mjs';
import { CONTENT as U910 } from './pre-int-u9-u10.mjs';
import { EXPANSIONS } from './pre-int-expansions.mjs';
import { EXPANSIONS2 } from './pre-int-expansions2.mjs';
import { EXPANSIONS3 } from './pre-int-expansions3.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../generated/Pre-Intermediate.json');

const CONTENT = { ...U12, ...U35, ...U68, ...U910 };

function withExpansion(id, text) {
  const parts = [text.trim()];
  if (EXPANSIONS[id]) parts.push(EXPANSIONS[id].trim());
  if (EXPANSIONS2[id]) parts.push(EXPANSIONS2[id].trim());
  if (EXPANSIONS3[id]) parts.push(EXPANSIONS3[id].trim());
  return parts.join(' ');
}

const MIN = 250;
const MAX = 400;
const AIM_LO = 280;
const AIM_HI = 350;

const lessons = [];
const stats = [];

for (const meta of TOPICS) {
  const c = CONTENT[meta.id];
  if (!c) {
    console.error('Missing content for', meta.id);
    process.exit(1);
  }
  if (!c.vocabulary || c.vocabulary.length < 12 || c.vocabulary.length > 15) {
    console.warn(`WARN ${meta.id}: vocab count ${c.vocabulary?.length}`);
  }
  const L = lesson(meta, withExpansion(meta.id, c.text), c.vocabulary);
  const w = wordCount(L.text);
  stats.push({ id: meta.id, w, title: meta.title });
  if (w < MIN || w > MAX) {
    console.warn(`OUT OF RANGE ${meta.id}: ${w} words — ${meta.title}`);
  } else if (w < AIM_LO || w > AIM_HI) {
    console.warn(`outside aim ${meta.id}: ${w} words`);
  }
  lessons.push(L);
}

if (lessons.length !== 100) {
  console.error('Expected 100, got', lessons.length);
  process.exit(1);
}

// id continuity p1–p100
for (let i = 0; i < 100; i++) {
  const expected = `p${i + 1}`;
  if (lessons[i].id !== expected) {
    console.error(`id mismatch at ${i}: ${lessons[i].id} !== ${expected}`);
    process.exit(1);
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(lessons, null, 2) + '\n', 'utf8');

const words = stats.map((s) => s.w);
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
const inAim = stats.filter((s) => s.w >= AIM_LO && s.w <= AIM_HI).length;
const inRange = stats.filter((s) => s.w >= MIN && s.w <= MAX).length;

console.log(`Wrote ${outPath}`);
console.log(`Lessons: ${lessons.length}`);
console.log(`Words: min ${min}, max ${max}, avg ${avg}`);
console.log(`In range ${MIN}-${MAX}: ${inRange}/100`);
console.log(`In aim ${AIM_LO}-${AIM_HI}: ${inAim}/100`);

const short = stats.filter((s) => s.w < MIN).sort((a, b) => a.w - b.w);
const long = stats.filter((s) => s.w > MAX).sort((a, b) => b.w - a.w);
const belowAim = stats.filter((s) => s.w < AIM_LO).sort((a, b) => a.w - b.w);
const aboveAim = stats.filter((s) => s.w > AIM_HI).sort((a, b) => b.w - a.w);

if (short.length) console.log('SHORT', short.map((s) => `${s.id}:${s.w}`).join(', '));
if (long.length) console.log('LONG', long.map((s) => `${s.id}:${s.w}`).join(', '));
if (belowAim.length) console.log('below aim', belowAim.map((s) => `${s.id}:${s.w}`).join(', '));
if (aboveAim.length) console.log('above aim', aboveAim.map((s) => `${s.id}:${s.w}`).join(', '));

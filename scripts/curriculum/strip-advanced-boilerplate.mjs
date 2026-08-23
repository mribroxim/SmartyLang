#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'generated/Advanced.json');
const arr = JSON.parse(fs.readFileSync(file, 'utf8'));

const BOILER = [
  /Seen through the lens of[\s\S]*?without forcing a fake truce\./g,
  /Notice how the scene above resists a single moral[\s\S]*?and more actionable\./g,
  /The communication goal here is practical:[\s\S]*?not ornaments\./g,
  /Return, finally, to the core question:[\s\S]*?the adult form of strength\./g,
  /If this lesson has a lasting habit to offer[\s\S]*?argue with\./g,
  /The easy mistake is letting headlines about markets erase the texture of lived costs\./g,
];

function wc(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

const report = [];
for (const lesson of arr) {
  let text = lesson.text;
  const before = wc(text);
  for (const re of BOILER) text = text.replace(re, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  const after = wc(text);
  lesson.text = text;
  report.push({ id: lesson.id, before, after, dropped: before - after });
}

fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
const afters = report.map((r) => r.after);
console.log('stripped boilerplate');
console.log(
  'words now',
  Math.min(...afters),
  '-',
  Math.max(...afters),
  'avg',
  Math.round(afters.reduce((a, b) => a + b, 0) / afters.length),
);
const short = report.filter((r) => r.after < 580);
console.log('under 580:', short.length);
console.log(short.slice(0, 30).map((r) => `${r.id}:${r.after}(-${r.dropped})`).join(', '));

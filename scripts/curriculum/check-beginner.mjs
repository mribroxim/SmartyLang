#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-curriculum-plan.json'), 'utf8'));
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, 'generated/Beginner.json'), 'utf8'));
const issues = [];
const titles = new Map();
const words = [];

const planById = new Map();
for (const u of plan.levels.Beginner.units) {
  for (const t of u.topics) {
    planById.set(t.id, { ...t, unit: u.index, unitName: u.name });
  }
}

console.log('length', lessons.length);
for (let i = 0; i < lessons.length; i++) {
  const L = lessons[i];
  const id = `b${i + 1}`;
  if (L.id !== id) issues.push(`id mismatch ${L.id}`);
  const P = planById.get(id);
  if (!P) issues.push(`no plan ${id}`);
  else {
    for (const key of ['title', 'coreQuestion', 'languageGoal', 'communicationGoal', 'vocabularyDomain', 'format', 'unit', 'unitName']) {
      if (L[key] !== P[key]) issues.push(`${id} ${key} mismatch: ${JSON.stringify(L[key])} vs ${JSON.stringify(P[key])}`);
    }
    if (JSON.stringify(L.grammarFocus) !== JSON.stringify(P.grammarFocus)) {
      issues.push(`${id} grammar mismatch`);
    }
  }
  const w = wordCount(L.text);
  words.push(w);
  if (w < 80 || w > 150) issues.push(`${id} words ${w}`);
  const vc = L.vocabulary?.length ?? 0;
  if (vc < 8 || vc > 12) issues.push(`${id} vocab ${vc}`);
  if (typeof L.targetSeconds !== 'number' || L.targetSeconds < 45) {
    issues.push(`${id} targetSeconds ${L.targetSeconds}`);
  }
  if (/part\s*2|placeholder|TODO|lorem/i.test(`${L.title} ${L.text}`)) {
    issues.push(`${id} weak content`);
  }
  const k = L.title.trim().toLowerCase();
  if (titles.has(k)) issues.push(`dup title ${L.title}`);
  else titles.set(k, id);
  for (const v of L.vocabulary || []) {
    if (!v.word || !v.definition) issues.push(`${id} bad vocab`);
    else if (!v.definition.startsWith('(')) issues.push(`${id} vocab style ${v.word}`);
  }
}

const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
console.log(`words min/avg/max ${min} ${avg} ${max}`);
console.log(`targetSeconds range ${Math.min(...lessons.map((l) => l.targetSeconds))}–${Math.max(...lessons.map((l) => l.targetSeconds))}`);
console.log(`issues ${issues.length}`);
issues.slice(0, 40).forEach((x) => console.log(' ', x));
if (!issues.length) console.log('ALL GOOD');
else process.exit(1);

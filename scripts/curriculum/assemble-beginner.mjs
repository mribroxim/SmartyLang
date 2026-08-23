#!/usr/bin/env node
/**
 * Assemble Beginner curriculum lessons from unit modules + plan metadata.
 * Output: scripts/curriculum/generated/Beginner.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, wordCount, attachUnitMeta } from './helpers.mjs';

import unit01 from './beginner-units/unit01.mjs';
import unit02 from './beginner-units/unit02.mjs';
import unit03 from './beginner-units/unit03.mjs';
import unit04 from './beginner-units/unit04.mjs';
import unit05 from './beginner-units/unit05.mjs';
import unit06 from './beginner-units/unit06.mjs';
import unit07 from './beginner-units/unit07.mjs';
import unit08 from './beginner-units/unit08.mjs';
import unit09 from './beginner-units/unit09.mjs';
import unit10 from './beginner-units/unit10.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planPath = path.join(__dirname, 'en-curriculum-plan.json');
const outDir = path.join(__dirname, 'generated');
const outPath = path.join(outDir, 'Beginner.json');

const content = {
  ...unit01,
  ...unit02,
  ...unit03,
  ...unit04,
  ...unit05,
  ...unit06,
  ...unit07,
  ...unit08,
  ...unit09,
  ...unit10,
};

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const units = plan.levels.Beginner.units;

const lessons = [];
const issues = [];

for (const unit of units) {
  const topics = attachUnitMeta(unit.topics, unit.index, unit.name);
  for (const meta of topics) {
    const c = content[meta.id];
    if (!c) {
      issues.push(`MISSING content for ${meta.id}`);
      continue;
    }
    const w = wordCount(c.text);
    if (w < 80 || w > 150) {
      issues.push(`${meta.id} word count ${w} (need 80–150)`);
    }
    if (!Array.isArray(c.vocabulary) || c.vocabulary.length < 8 || c.vocabulary.length > 12) {
      issues.push(`${meta.id} vocab count ${c.vocabulary?.length ?? 0} (need 8–12)`);
    }
    lessons.push(lesson(meta, c.text, c.vocabulary));
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(lessons, null, 2) + '\n', 'utf8');

const words = lessons.map((l) => wordCount(l.text));
const min = Math.min(...words);
const max = Math.max(...words);
const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);

console.log(`Wrote ${lessons.length} lessons → ${outPath}`);
console.log(`Word counts: min=${min} avg=${avg} max=${max}`);
console.log(`IDs: ${lessons[0]?.id} … ${lessons[lessons.length - 1]?.id}`);

if (lessons.length !== 100) {
  console.error(`ERROR: expected 100 lessons, got ${lessons.length}`);
  process.exit(1);
}
for (let i = 0; i < 100; i++) {
  const expected = `b${i + 1}`;
  if (lessons[i].id !== expected) {
    console.error(`ERROR: index ${i} id=${lessons[i].id} expected=${expected}`);
    process.exit(1);
  }
}

if (issues.length) {
  console.log(`\nIssues (${issues.length}):`);
  issues.forEach((x) => console.log(' ', x));
  process.exit(1);
}

console.log('\nOK — all checks passed.');

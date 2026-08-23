#!/usr/bin/env node
import fs from 'fs';

const plan = JSON.parse(fs.readFileSync('scripts/curriculum/en-curriculum-plan.json', 'utf8'));
const PREFIX = {
  Beginner: 'b',
  Elementary: 'e',
  'Pre-Intermediate': 'p',
  Intermediate: 'i',
  Advanced: 'a',
};
const metaMap = {
  Elementary: 'scripts/curriculum/generated/_elementary-meta.json',
  'Pre-Intermediate': 'scripts/curriculum/generated/_preintermediate-meta.json',
  Intermediate: 'scripts/curriculum/generated/_intermediate-meta.json',
  Advanced: 'scripts/curriculum/generated/_advanced-meta.json',
};

const errors = [];
const counts = {};

for (const [level, prefix] of Object.entries(PREFIX)) {
  const units = plan.levels[level].units;
  const topics = units.flatMap((u) => u.topics);
  counts[level] = topics.length;
  if (units.length !== 10) errors.push(`${level} units ${units.length}`);
  if (topics.length !== 100) errors.push(`${level} topics ${topics.length}`);
  topics.forEach((t, i) => {
    if (t.id !== `${prefix}${i + 1}`) errors.push(`${level} bad id ${t.id}`);
    for (const k of [
      'title',
      'coreQuestion',
      'format',
      'grammarFocus',
      'vocabularyDomain',
      'languageGoal',
      'communicationGoal',
    ]) {
      if (t[k] == null || t[k] === '' || (Array.isArray(t[k]) && !t[k].length)) {
        errors.push(`${level}/${t.id} missing ${k}`);
      }
    }
  });
}

for (const [level, file] of Object.entries(metaMap)) {
  const metas = JSON.parse(fs.readFileSync(file, 'utf8'));
  const prefix = PREFIX[level];
  if (metas.length !== 100) errors.push(`${file} len ${metas.length}`);
  metas.forEach((m, i) => {
    if (m.id !== `${prefix}${i + 1}`) errors.push(`${file} id ${m.id}`);
    if (typeof m.unit !== 'number' || !m.unitName) {
      errors.push(`${file} ${m.id} missing unit meta`);
    }
  });
  counts[`${level} meta`] = metas.length;
}

const doc = fs.readFileSync('docs/CURRICULUM_EN.md', 'utf8');
const titleRe = new RegExp('^- `([a-z]\\d+)` ', '');
const titleCount = doc.split(/\n/).filter((l) => titleRe.test(l)).length;
const unitHeads = (doc.match(/^### Unit /gm) || []).length;
counts.docsTitles = titleCount;
counts.docsUnits = unitHeads;

console.log(JSON.stringify({ counts, errorCount: errors.length, errors: errors.slice(0, 20) }, null, 2));
if (errors.length || titleCount !== 500 || unitHeads !== 50) process.exit(1);
console.log('VALIDATION OK');

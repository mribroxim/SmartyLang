#!/usr/bin/env node
/**
 * Validate English level-texts.json against curriculum redesign rules.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const textsPath = path.join(root, 'public/level-texts.json');

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const ID_PREFIX = {
  Beginner: 'b',
  Elementary: 'e',
  'Pre-Intermediate': 'p',
  Intermediate: 'i',
  Advanced: 'a',
};
const WORD_TARGETS = {
  Beginner: [80, 150],
  Elementary: [200, 250],
  'Pre-Intermediate': [330, 400],
  Intermediate: [400, 650],
  Advanced: [600, 1100],
};

const WEAK_TITLE = /part\s*2|additional lesson|topic\s*\d|placeholder|lorem|TODO/i;

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function targetSecondsFor(words) {
  // ~130 wpm learner pace, clamped to sensible UI range
  return Math.max(45, Math.min(600, Math.round((words / 130) * 60)));
}

const data = JSON.parse(fs.readFileSync(textsPath, 'utf8'));
const errors = [];
const warnings = [];
const allTitles = new Map();

for (const level of LEVELS) {
  const arr = data[level];
  if (!Array.isArray(arr)) {
    errors.push(`${level}: missing array`);
    continue;
  }
  if (arr.length !== 100) errors.push(`${level}: expected 100 lessons, got ${arr.length}`);

  const prefix = ID_PREFIX[level];
  const [minW, maxW] = WORD_TARGETS[level];
  const words = [];

  arr.forEach((lesson, i) => {
    const expectedId = `${prefix}${i + 1}`;
    if (lesson.id !== expectedId) errors.push(`${level}[${i}]: id ${lesson.id} !== ${expectedId}`);
    if (!lesson.title?.trim()) errors.push(`${level}/${expectedId}: empty title`);
    if (WEAK_TITLE.test(lesson.title || '')) errors.push(`${level}/${expectedId}: weak title "${lesson.title}"`);
    if (!lesson.text?.trim()) errors.push(`${level}/${expectedId}: empty text`);
    const w = wordCount(lesson.text);
    words.push(w);
    if (w < minW - 15) warnings.push(`${level}/${expectedId}: short (${w} words, target ${minW}-${maxW})`);
    if (w > maxW + 80) warnings.push(`${level}/${expectedId}: long (${w} words, target ${minW}-${maxW})`);
    if (!Array.isArray(lesson.vocabulary) || lesson.vocabulary.length < 6) {
      warnings.push(`${level}/${expectedId}: vocab count ${lesson.vocabulary?.length ?? 0}`);
    }
    for (const v of lesson.vocabulary || []) {
      if (!v.word || !v.definition) errors.push(`${level}/${expectedId}: bad vocab item`);
    }
    if (typeof lesson.targetSeconds !== 'number') {
      errors.push(`${level}/${expectedId}: missing targetSeconds`);
    }
    const key = lesson.title.trim().toLowerCase();
    if (allTitles.has(key)) warnings.push(`duplicate title "${lesson.title}" (${allTitles.get(key)} & ${expectedId})`);
    else allTitles.set(key, expectedId);
  });

  const min = Math.min(...words);
  const max = Math.max(...words);
  const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
  console.log(`${level}: ${arr.length} lessons, words ${min}-${max} (avg ${avg}), target ${minW}-${maxW}`);
}

console.log(`\nerrors: ${errors.length}`);
errors.slice(0, 40).forEach((e) => console.log('  ERR', e));
console.log(`warnings: ${warnings.length}`);
warnings.slice(0, 40).forEach((w) => console.log('  WARN', w));

if (errors.length) process.exit(1);
console.log('\nOK');

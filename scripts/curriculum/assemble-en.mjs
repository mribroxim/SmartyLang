#!/usr/bin/env node
/**
 * Assemble public/level-texts.json from scripts/curriculum/generated/*.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const genDir = path.join(__dirname, 'generated');
const outPath = path.join(root, 'public/level-texts.json');

const LEVELS = [
  'Beginner',
  'Elementary',
  'Pre-Intermediate',
  'Intermediate',
  'Advanced',
];

const out = {};
for (const level of LEVELS) {
  const file = path.join(genDir, `${level}.json`);
  if (!fs.existsSync(file)) {
    console.error('Missing', file);
    process.exit(1);
  }
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(arr) || arr.length !== 100) {
    console.error(`${level}: expected 100, got ${arr?.length}`);
    process.exit(1);
  }
  out[level] = arr.map((lesson) => ({
    ...lesson,
    targetSeconds: targetSecondsFor(lesson.text),
  }));
  const words = out[level].map((l) => wordCount(l.text));
  console.log(
    'loaded',
    level,
    arr.length,
    'words',
    Math.min(...words) + '-' + Math.max(...words),
  );
}

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('Wrote', outPath);

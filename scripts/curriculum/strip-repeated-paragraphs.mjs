#!/usr/bin/env node
/**
 * Remove paragraphs that repeat across many lessons (template leftovers).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function paras(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function norm(p) {
  return p.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9' ]/g, '').slice(0, 220);
}

function processFile(name, minRepeat = 8, keepMinWords = 40) {
  const file = path.join(__dirname, 'generated', `${name}.json`);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const counts = new Map();
  for (const lesson of arr) {
    const seen = new Set();
    for (const p of paras(lesson.text)) {
      const k = norm(p);
      if (k.length < 80) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  const drop = new Set([...counts.entries()].filter(([, n]) => n >= minRepeat).map(([k]) => k));
  console.log(name, 'repeated paragraphs to drop:', drop.size);

  let changed = 0;
  for (const lesson of arr) {
    const kept = paras(lesson.text).filter((p) => {
      const k = norm(p);
      if (k.length < 80) return true;
      return !drop.has(k);
    });
    const next = kept.join('\n\n');
    if (next !== lesson.text.trim()) {
      lesson.text = next;
      lesson.targetSeconds = targetSecondsFor(next);
      changed++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
  const words = arr.map((l) => wordCount(l.text));
  const shorts = arr.filter((l) => wordCount(l.text) < keepMinWords);
  console.log(
    '  changed',
    changed,
    'words',
    Math.min(...words) + '-' + Math.max(...words),
    'avg',
    Math.round(words.reduce((a, b) => a + b, 0) / words.length),
  );
  return arr;
}

processFile('Intermediate', 8, 400);
processFile('Advanced', 8, 580);

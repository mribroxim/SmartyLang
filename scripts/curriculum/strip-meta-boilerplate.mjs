#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INTER_PATTERNS = [
  /In everyday talk about[\s\S]*?identity wars\./g,
  /people often reach for slogans because slogans travel faster than careful sentences\.[\s\S]*?identity wars\./g,
  /Learners working at intermediate level[\s\S]*?identity wars\./g,
  /What does it mean to [^?]{5,80}\? rewards a slower tempo\.[\s\S]*?identity wars\./g,
  /Discourse markers—however, in practice, at the same time—help speakers[\s\S]*?identity wars\./g,
  /Finally, talk evidence[\s\S]{0,400}/g,
];

const ADV_PATTERNS = [
  /Better work begins by slowing the claim[\s\S]*?collecting slogans\./g,
  /A common error is treating introspection as either oracle or fraud\. Better work begins by slowing the claim[\s\S]*?collecting slogans\./g,
  /asking what is asserted, by whom, with what evidence, and with what incentive to exaggerate\.[\s\S]*?collecting slogans\./g,
];

function clean(text, patterns) {
  let t = text;
  for (const re of patterns) t = t.replace(re, '');
  return t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function processFile(name, patterns, minWords) {
  const file = path.join(__dirname, 'generated', `${name}.json`);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;
  const shorts = [];
  for (const lesson of arr) {
    const before = lesson.text;
    const after = clean(before, patterns);
    if (after !== before.trim()) {
      lesson.text = after;
      lesson.targetSeconds = targetSecondsFor(after);
      changed++;
    }
    const w = wordCount(lesson.text);
    if (w < minWords) shorts.push(`${lesson.id}:${w}`);
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
  const words = arr.map((l) => wordCount(l.text));
  console.log(
    name,
    'stripped',
    changed,
    'words',
    Math.min(...words) + '-' + Math.max(...words),
    'avg',
    Math.round(words.reduce((a, b) => a + b, 0) / words.length),
    'under' + minWords,
    shorts.length,
  );
  if (shorts.length) console.log(' ', shorts.slice(0, 25).join(', '));
}

processFile('Intermediate', INTER_PATTERNS, 400);
processFile('Advanced', ADV_PATTERNS, 580);

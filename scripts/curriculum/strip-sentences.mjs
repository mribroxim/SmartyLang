#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SENTENCE_RES = {
  Advanced: [
    /Better work begins by slowing the claim[^.]*\./gi,
    /Advanced judgment ranks conditions of strength rather than collecting slogans\./gi,
    /Framed by knowing the mind, the title['’]s pressure is practical:[^.]*\./gi,
    /A common error is treating introspection as either oracle or fraud\./gi,
    /asking what is asserted, by whom, with what evidence, and with what incentive to exaggerate[^.]*\./gi,
    /The scene resists a single moral[\s\S]*?Monday morning\./gi,
    /Flatten it into villains and you get a rush of certainty[^.]*\./gi,
  ],
  Intermediate: [
    /In everyday talk about [^.]{0,120}, people often reach for slogans because slogans travel faster than careful sentences\./gi,
    /What does it mean to [^?\n]{5,120}\?/g,
    /rewards a slower tempo\./gi,
    /Discourse markers—however, in practice, at the same time—help speakers keep more than one truth in view without collapsing into contradiction\./gi,
    /That is not fence-sitting; it is adult cognition under social pressure\./gi,
    /Learners working at intermediate level[\s\S]*?identity wars\./gi,
    /None of these habits require perfection\. They require practice in ordinary rooms[\s\S]*?this unit trains\./gi,
    /A person who can stay analytical without becoming cold, and humane without becoming vague, is already doing the real work this unit trains\./gi,
    /What remains is method: notice the hidden assumption[\s\S]*?gullibility\./gi,
    /That method travels well beyond a single lesson and keeps curiosity from turning into either cynicism or gullibility\./gi,
  ],
};

function processLevel(name, minW) {
  const file = path.join(__dirname, 'generated', `${name}.json`);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const res = SENTENCE_RES[name];
  let changed = 0;
  for (const lesson of arr) {
    let t = lesson.text;
    const before = t;
    for (const re of res) t = t.replace(re, '');
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim();
    if (t !== before.trim()) {
      lesson.text = t;
      lesson.targetSeconds = targetSecondsFor(t);
      changed++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
  const words = arr.map((l) => wordCount(l.text));
  const shorts = arr.filter((l) => wordCount(l.text) < minW).map((l) => `${l.id}:${wordCount(l.text)}`);
  console.log(name, 'changed', changed, 'words', Math.min(...words) + '-' + Math.max(...words), 'avg', Math.round(words.reduce((a, b) => a + b, 0) / words.length), 'short', shorts.length);
  if (shorts.length) console.log(shorts.join(', '));
}

processLevel('Advanced', 580);
processLevel('Intermediate', 400);

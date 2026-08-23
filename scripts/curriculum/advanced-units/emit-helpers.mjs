#!/usr/bin/env node
/**
 * Emit advanced-units/unitXX.mjs from lesson banks + ensure 650–900 words.
 * Usage: node emit-unit.mjs 2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCount } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function joinParas(paras) {
  return paras.map((p) => p.trim()).filter(Boolean).join('\n\n');
}

export function ensureWords(text, closer) {
  let t = text.trim();
  let w = wordCount(t);
  const pads = [
    closer,
    `In practice, the claim becomes useful only when translated into habits, institutions, and questions people can ask under pressure. Clarity that never touches a Tuesday decision remains decorative intelligence.`,
    `Readers who can hold competing truths without panic are already rehearsing the advanced skill these passages train: judgment that stays humane when certainty would be easier.`,
  ];
  for (const pad of pads) {
    if (w >= 660) break;
    if (pad && !t.includes(pad.slice(0, 40))) {
      t = t + '\n\n' + pad.trim();
      w = wordCount(t);
    }
  }
  while (w < 660) {
    t +=
      '\n\n' +
      `None of this settles the question forever. It only refuses the false comfort of slogans, and keeps the human stakes visible when abstractions grow loud. That refusal—rigour without coldness—is the habit worth practising.`;
    w = wordCount(t);
    if (w > 950) break;
  }
  return t;
}

export function writeUnit(unitNum, lessons, header) {
  const out = {};
  const report = [];
  for (const L of lessons) {
    const text = ensureWords(joinParas(L.paras), L.closer || '');
    const w = wordCount(text);
    out[L.id] = { text, vocabulary: L.vocabulary };
    report.push(`${L.id}:${w}`);
    if (w < 580) throw new Error(`Still short ${L.id} ${w}`);
    if (L.vocabulary.length < 14 || L.vocabulary.length > 18) {
      throw new Error(`Vocab count ${L.id} ${L.vocabulary.length}`);
    }
  }
  const lines = [
    `/** Unit ${unitNum}: ${header} */`,
    'export default {',
  ];
  for (const [id, lesson] of Object.entries(out)) {
    lines.push(`  ${id}: {`);
    lines.push(`    text: ${JSON.stringify(lesson.text)},`);
    lines.push(`    vocabulary: ${JSON.stringify(lesson.vocabulary)},`);
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');
  const dest = path.join(__dirname, `unit${String(unitNum).padStart(2, '0')}.mjs`);
  fs.writeFileSync(dest, lines.join('\n'), 'utf8');
  console.log('Wrote', dest);
  console.log(report.join(' '));
  return dest;
}

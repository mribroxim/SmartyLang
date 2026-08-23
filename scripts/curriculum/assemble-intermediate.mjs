#!/usr/bin/env node
/** Assemble Intermediate unit modules into generated/Intermediate.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { wordCount, targetSecondsFor, vocab, lesson } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const unitsDir = path.join(__dirname, 'intermediate-units');
const outPath = path.join(__dirname, 'generated', 'Intermediate.json');

const files = fs
  .readdirSync(unitsDir)
  .filter((f) => f.endsWith('.mjs'))
  .sort();

const all = [];
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(unitsDir, f)).href);
  const items = mod.default || mod.lessons;
  if (!Array.isArray(items)) throw new Error(`${f}: expected default export array`);
  for (const raw of items) {
    const v = Array.isArray(raw.vocabulary?.[0])
      ? vocab(raw.vocabulary)
      : raw.vocabulary;
    const built = lesson(
      {
        id: raw.id,
        title: raw.title,
        coreQuestion: raw.coreQuestion,
        languageGoal: raw.languageGoal,
        communicationGoal: raw.communicationGoal,
        grammarFocus: raw.grammarFocus,
        vocabularyDomain: raw.vocabularyDomain,
        unit: raw.unit,
        unitName: raw.unitName,
        format: raw.format,
      },
      raw.text,
      v
    );
    all.push(built);
  }
}

all.sort((a, b) => {
  const na = parseInt(a.id.slice(1), 10);
  const nb = parseInt(b.id.slice(1), 10);
  return na - nb;
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n', 'utf8');

const words = all.map((l) => wordCount(l.text));
const short = all.filter((l) => wordCount(l.text) < 400);
const long = all.filter((l) => wordCount(l.text) > 650);
console.log(`Wrote ${all.length} lessons → ${outPath}`);
console.log(
  `words: min ${Math.min(...words)} max ${Math.max(...words)} avg ${Math.round(words.reduce((a, b) => a + b, 0) / words.length)}`
);
if (short.length) console.log('SHORT:', short.map((l) => `${l.id}:${wordCount(l.text)}`).join(', '));
if (long.length) console.log('LONG:', long.map((l) => `${l.id}:${wordCount(l.text)}`).join(', '));
if (all.length !== 100) process.exitCode = 1;
if (short.length) process.exitCode = 1;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'public/level-texts.json'), 'utf8')).Elementary;

const FILLER_RE =
  /If I could speak to myself|Practising the language|learners need|taught me that progress|I still make mistakes|When I talk about memories|What surprised me most was how ordinary|taught me that/;

function stripFiller(t) {
  const paras = t
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length >= 2) {
    const last = paras[paras.length - 1];
    if (FILLER_RE.test(last)) return paras.slice(0, -1).join('\n\n');
  }
  return t;
}

const outlines = en.map((x) => {
  const body = stripFiller(x.text);
  return {
    id: x.id,
    title: x.title,
    format: x.format || 'short story',
    coreQuestion: x.coreQuestion,
    unit: x.unit,
    unitName: x.unitName,
    vocab: (x.vocabulary || []).map((v) => v.word),
    enWords: body.trim().split(/\s+/).filter(Boolean).length,
    body,
    isDialogue:
      /^[A-Z][a-z]+:/m.test(body) || String(x.format || '').includes('dialogue'),
  };
});

fs.writeFileSync(
  path.join(__dirname, '_en-elementary-outlines.json'),
  JSON.stringify(outlines, null, 2),
);
console.log(
  'dialogues',
  outlines
    .filter((o) => o.isDialogue)
    .map((o) => o.id)
    .join(','),
);
console.log(
  'word range',
  Math.min(...outlines.map((o) => o.enWords)),
  Math.max(...outlines.map((o) => o.enWords)),
);
for (const o of outlines) {
  console.log(`${o.id} | ${o.title} | ${o.format} | ${o.enWords}`);
}

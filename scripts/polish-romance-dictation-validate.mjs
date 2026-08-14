/**
 * Light dictation polish + final Romance pack validation.
 * node scripts/polish-romance-dictation-validate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const LANGS = ['es', 'pt', 'fr', 'it', 'ro'];

for (const lang of LANGS) {
  const dir = path.join(PACKS, lang, 'dictation');
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.txt')) continue;
    const fp = path.join(dir, f);
    const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/);
    const out = lines.map((line) => {
      const m = line.match(/^(- \s*)(.*)$/) || line.match(/^(-\s*)(.*)$/);
      if (!m) return line;
      let body = m[2];
      if (body && /^[\p{Ll}]/u.test(body)) {
        body = body.charAt(0).toLocaleUpperCase(lang) + body.slice(1);
      }
      if (lang === 'es' && body === 'El sol está caliente.') {
        body = 'Hace sol y calor.';
      }
      return m[1] + body;
    });
    fs.writeFileSync(fp, out.join('\n'), 'utf8');
  }
}

const report = {};
const bugs = {
  es: ['español e español', 'llave española', 'puedes comunicarse', 'Resuma la información'],
  pt: ['chave portuguesa'],
  fr: ['de le français', 'environnements anglophones'],
  it: ['chiave italiano', 'ambienti anglofoni', 'Riassumere le'],
  ro: ['Educaţie'],
};

for (const lang of LANGS) {
  const base = path.join(PACKS, lang);
  const files = [
    'level-texts.json',
    'comprehensive-reading.json',
    'speaking-topics.json',
    'writing-topics.json',
    'task2.json',
    'task1.json',
  ];
  const counts = {};
  let blob = '';
  for (const f of files) {
    const fp = path.join(base, f);
    const raw = fs.readFileSync(fp, 'utf8');
    JSON.parse(raw); // validate
    blob += raw;
    counts[f] = raw.length;
  }
  const dictDir = path.join(base, 'dictation');
  const dictFiles = fs.readdirSync(dictDir).filter((x) => x.endsWith('.txt'));
  for (const f of dictFiles) blob += fs.readFileSync(path.join(dictDir, f), 'utf8');

  const lt = JSON.parse(fs.readFileSync(path.join(base, 'level-texts.json'), 'utf8'));
  let passages = 0;
  for (const k of Object.keys(lt)) passages += lt[k].length;
  const cr = JSON.parse(fs.readFileSync(path.join(base, 'comprehensive-reading.json'), 'utf8'));
  const sp = JSON.parse(fs.readFileSync(path.join(base, 'speaking-topics.json'), 'utf8'));
  let sn = 0;
  for (const k of Object.keys(sp)) sn += sp[k].length;
  const wr = JSON.parse(fs.readFileSync(path.join(base, 'writing-topics.json'), 'utf8'));
  let wn = 0;
  for (const k of Object.keys(wr)) wn += wr[k].length;
  const t2 = JSON.parse(fs.readFileSync(path.join(base, 'task2.json'), 'utf8'));
  let t2n = 0;
  for (const t of t2) for (const c of t.categories || []) t2n += (c.prompts || []).length;

  const bugHits = {};
  for (const b of bugs[lang] || []) bugHits[b] = blob.split(b).length - 1;

  report[lang] = {
    levelPassages: passages,
    comprehensiveReading: cr.length,
    speaking: sn,
    writing: wn,
    task2Prompts: t2n,
    dictationFiles: dictFiles.length,
    bytes: Object.values(counts).reduce((a, b) => a + b, 0),
    bugHits,
    jsonValid: true,
  };
}

console.log(JSON.stringify(report, null, 2));

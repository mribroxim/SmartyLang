/**
 * Extra Romance calque / flow sweep across all learner prose fields.
 * node scripts/polish-romance-calques.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

const PAIRS = {
  es: [
    ['hacer una decisión', 'tomar una decisión'],
    ['tomar un foto', 'tomar una foto'],
    ['en el fin de', 'al final de'],
    ['actualmente estoy', 'ahora mismo estoy'],
    ['Estoy teniendo', 'Tengo'],
    ['años de edad', 'años'],
    ['más y más', 'cada vez más'],
    ['el hecho de que', 'que'],
    ['Debido a las mejoras en la tecnología', 'Gracias a los avances tecnológicos'],
    ['se ha convertido en una tendencia global', 'se ha consolidado como una tendencia mundial'],
    ['a menudo se malinterpreta como', 'suele malinterpretarse como'],
    ['una simple falta de fuerza de voluntad', 'una mera falta de voluntad'],
    ['Háblame de tu ciudad natal. ¿Dónde está ubicada?', 'Háblame de tu ciudad natal. ¿Dónde queda?'],
    ['reportando las características', 'describiendo las características'],
  ],
  pt: [
    ['fazer uma decisão', 'tomar uma decisão'],
    ['cada vez mais e mais', 'cada vez mais'],
    ['Eu tenho', 'Tenho'],
    ['Eu gosto', 'Gosto'],
    ['Eu preciso', 'Preciso'],
    ['Eu quero', 'Quero'],
    ['Eu posso', 'Posso'],
    ['Eu vou', 'Vou'],
    ['Eu faço', 'Faço'],
    ['Eu sei', 'Sei'],
    ['no final do dia', 'no fim das contas'],
    ['Devido às melhorias na tecnologia', 'Graças aos avanços tecnológicos'],
  ],
  fr: [
    ['faire une décision', 'prendre une décision'],
    ['de plus en plus plus', 'de plus en plus'],
    ['Aujourd\'hui est un', 'Aujourd\'hui, c\'est un'],
    ['Je suis ayant', "J'ai"],
    ['manque de volonté', 'manque de volonté'],
    ['Grâce aux améliorations technologiques', 'Grâce aux progrès technologiques'],
    ['est devenu une tendance mondiale', 'est devenu une tendance mondiale'],
  ],
  it: [
    ['fare una decisione', 'prendere una decisione'],
    ['sempre di più e di più', 'sempre di più'],
    ['Grazie ai miglioramenti nella tecnologia', 'Grazie ai progressi tecnologici'],
    ['è diventato una tendenza globale', 'è diventata una tendenza globale'],
    ['Dentro la borsa', 'Nella borsa'],
    ['un cibo italiano simile ai noodles', 'un piatto italiano di pasta lunga'],
  ],
  ro: [
    ['a face o decizie', 'a lua o decizie'],
    ['din ce în ce mai și mai', 'din ce în ce mai'],
    ['Datorită îmbunătățirilor în tehnologie', 'Datorită progreselor tehnologice'],
    ['a devenit o tendință globală', 'a devenit o tendință mondială'],
    ['Unde este situat?', 'Unde se află?'],
  ],
};

function apply(text, lang) {
  if (typeof text !== 'string') return { text, n: 0 };
  let out = text;
  let n = 0;
  for (const [a, b] of PAIRS[lang] || []) {
    if (out.includes(a)) {
      out = out.split(a).join(b);
      n++;
    }
  }
  return { text: out, n };
}

function walk(node, lang, stats, skipKeys = new Set(['data', 'values', 'series', 'points', 'rows', 'cells', 'labels', 'datasets'])) {
  if (typeof node === 'string') {
    const { text, n } = apply(node, lang);
    stats.fixes += n;
    return text;
  }
  if (Array.isArray(node)) return node.map((v) => walk(v, lang, stats, skipKeys));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (skipKeys.has(k) && (Array.isArray(v) || typeof v !== 'object')) {
        out[k] = v;
        continue;
      }
      out[k] = walk(v, lang, stats, skipKeys);
    }
    return out;
  }
  return node;
}

for (const lang of Object.keys(PAIRS)) {
  const stats = { fixes: 0 };
  const base = path.join(PACKS, lang);
  for (const f of [
    'level-texts.json',
    'comprehensive-reading.json',
    'speaking-topics.json',
    'writing-topics.json',
    'task2.json',
  ]) {
    const fp = path.join(base, f);
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const next = walk(data, lang, stats);
    fs.writeFileSync(fp, JSON.stringify(next, null, 2) + '\n');
  }
  // task1 instructions only via string replace on file (safer for huge)
  const t1fp = path.join(base, 'task1.json');
  let t1 = fs.readFileSync(t1fp, 'utf8');
  for (const [a, b] of PAIRS[lang]) {
    if (t1.includes(a)) {
      t1 = t1.split(a).join(b);
      stats.fixes++;
    }
  }
  JSON.parse(t1);
  fs.writeFileSync(t1fp, t1);

  const dictDir = path.join(base, 'dictation');
  for (const f of fs.readdirSync(dictDir)) {
    if (!f.endsWith('.txt')) continue;
    const fp = path.join(dictDir, f);
    let t = fs.readFileSync(fp, 'utf8');
    const { text, n } = apply(t, lang);
    stats.fixes += n;
    fs.writeFileSync(fp, text);
  }
  console.log(lang, 'calque fixes', stats.fixes);
}

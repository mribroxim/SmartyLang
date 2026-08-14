/**
 * Deterministic high-confidence SEA (id/ms/tl) fixes before/alongside LLM polish.
 * Usage: node scripts/polish-sea-deterministic.mjs [--lang=id|ms|tl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const ONLY = (process.argv.find((a) => a.startsWith('--lang=')) || '').slice(7);

const FILES = [
  'level-texts.json',
  'comprehensive-reading.json',
  'speaking-topics.json',
  'writing-topics.json',
  'task2.json',
  'task1.json',
];

/** @type {Record<string, Array<[RegExp|string, string]>>} */
const PAIRS = {
  id: [
    // Malay → Indonesian (high confidence)
    [/\buniversiti\b/gi, 'universitas'],
    [/\baktiviti\b/gi, 'aktivitas'],
    [/\bautomatik\b/gi, 'otomatis'],
    [/\bkritikal\b/gi, 'kritis'],
    [/\bpenyepaduan\b/gi, 'integrasi'],
    [/\btenaga kerja\b/gi, 'angkatan kerja'],
    [/\bmempraktikkan\b/gi, 'mempraktikkan'],
    // self-ref practice language (careful: not factual Inggris as country/language topic)
    [/belajar bahasa Inggris setiap hari/gi, 'belajar bahasa Indonesia setiap hari'],
    [/Belajar Bahasa Inggris Setiap Hari/gi, 'Belajar Bahasa Indonesia Setiap Hari'],
    [/kelas bahasa Inggris/gi, 'kelas bahasa Indonesia'],
    [/guru bahasa Inggris/gi, 'guru bahasa Indonesia'],
    [/berbicara dalam bahasa Inggris/gi, 'berbicara dalam bahasa Indonesia'],
    [/bercakap dalam bahasa Inggris/gi, 'berbicara dalam bahasa Indonesia'],
    [/Speak in English/gi, 'Berbicara dalam bahasa Indonesia'],
    [/practice English/gi, 'berlatih bahasa Indonesia'],
  ],
  ms: [
    // Indonesian → Malay
    [/\buniversitas\b/gi, 'universiti'],
    [/\baktivitas\b/gi, 'aktiviti'],
    [/\botomatis\b/gi, 'automatik'],
    [/\bangkatan kerja\b/gi, 'tenaga kerja'],
    [/\bberbeda\b/gi, 'berbeza'],
    [/\bBerbeda\b/g, 'Berbeza'],
    [/\bkantor\b/gi, 'pejabat'],
    [/\bKantor\b/g, 'Pejabat'],
    [/\bmembutuhkan\b/gi, 'memerlukan'],
    [/\bMembutuhkan\b/g, 'Memerlukan'],
    [/belajar bahasa Inggris setiap hari/gi, 'belajar bahasa Melayu setiap hari'],
    [/Belajar Bahasa Inggris Setiap Hari/gi, 'Belajar Bahasa Melayu Setiap Hari'],
    [/kelas bahasa Inggris/gi, 'kelas bahasa Melayu'],
    [/guru bahasa Inggris/gi, 'guru bahasa Melayu'],
    [/berbicara dalam bahasa Inggris/gi, 'bercakap dalam bahasa Melayu'],
    [/Speak in English/gi, 'Bercakap dalam bahasa Melayu'],
    [/practice English/gi, 'berlatih bahasa Melayu'],
  ],
  tl: [
    [/ini-stretch/gi, 'iniuunat'],
    [/Ini-stretch/g, 'Iniuunat'],
    [/ini stretch/gi, 'iniuunat'],
    [/magpa-practice/gi, 'magsanay'],
    [/Magpa-practice/g, 'Magsanay'],
    [/mag-practice/gi, 'magsanay'],
    [/naka-enroll/gi, 'nakatala'],
    [/Naka-enroll/g, 'Nakatala'],
    [/deliberate practice/gi, 'sadyang pagsasanay'],
    [/growth mindset/gi, 'pag-iisip ng pag-unlad'],
    [/rush hour/gi, 'oras ng pagsisikip'],
    [/sa English/gi, 'sa Tagalog'],
    [/in English\b/gi, 'sa Tagalog'],
    [/Speak in English/gi, 'Magsalita sa Tagalog'],
    [/practice English/gi, 'magsanay sa Tagalog'],
    [/English class/gi, 'klase sa Tagalog'],
    [/English teacher/gi, 'guro sa Tagalog'],
  ],
};

function applyPairs(text, pairs) {
  let out = text;
  let n = 0;
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) {
      const next = out.replace(from, to);
      if (next !== out) n += (out.match(from) || []).length || 1;
      out = next;
    } else if (out.includes(from)) {
      const c = out.split(from).length - 1;
      out = out.split(from).join(to);
      n += c;
    }
  }
  return { text: out, n };
}

function walkStrings(node, fn, skipKeys = new Set(['chartData'])) {
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = walkStrings(node[i], fn, skipKeys);
    return node;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (skipKeys.has(k)) continue;
      node[k] = walkStrings(v, fn, skipKeys);
    }
    return node;
  }
  return node;
}

function processLang(lang) {
  const pairs = PAIRS[lang];
  if (!pairs) return;
  let total = 0;
  const base = path.join(PACKS, lang);
  for (const f of FILES) {
    const fp = path.join(base, f);
    if (!fs.existsSync(fp)) continue;
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let fileN = 0;
    walkStrings(data, (s) => {
      const { text, n } = applyPairs(s, pairs);
      fileN += n;
      return text;
    });
    if (fileN) {
      fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`[${lang}] ${f}: ${fileN} fixes`);
      total += fileN;
    } else {
      console.log(`[${lang}] ${f}: 0`);
    }
  }
  const dictDir = path.join(base, 'dictation');
  if (fs.existsSync(dictDir)) {
    for (const file of fs.readdirSync(dictDir).filter((x) => x.endsWith('.txt'))) {
      const fp = path.join(dictDir, file);
      const raw = fs.readFileSync(fp, 'utf8');
      const { text, n } = applyPairs(raw, pairs);
      if (n) {
        fs.writeFileSync(fp, text, 'utf8');
        console.log(`[${lang}] dictation/${file}: ${n} fixes`);
        total += n;
      } else {
        console.log(`[${lang}] dictation/${file}: 0`);
      }
    }
  }
  console.log(`[${lang}] TOTAL deterministic fixes: ${total}`);
}

const langs = ONLY ? [ONLY] : ['id', 'ms', 'tl'];
for (const lang of langs) processLang(lang);

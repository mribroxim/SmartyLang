/** Fix Swahili vocab entries that fell back to English due to GTX 500s. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/level-texts.json'), 'utf8'));
const FILE = path.join(ROOT, 'public/data/lang-packs/sw/level-texts.json');
const pack = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function norm(w) {
  return String(w).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gtx(text) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sw&dt=t&q=' +
    encodeURIComponent(text);
  for (let a = 0; a < 8; a++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('gtx ' + res.status);
      const data = await res.json();
      const out = data[0].map((r) => r[0] || '').join('');
      if (!out) throw new Error('empty');
      return out;
    } catch (e) {
      await sleep(500 * (a + 1));
      if (a === 7) throw e;
    }
  }
}

const need = new Map(); // enNorm -> en entry
for (const L of Object.keys(EN)) {
  for (let i = 0; i < EN[L].length; i++) {
    const ev = EN[L][i].vocabulary || [];
    const pv = pack[L][i].vocabulary || [];
    for (let j = 0; j < ev.length; j++) {
      if (pv[j] && pv[j].word === ev[j].word && pv[j].definition === ev[j].definition) {
        need.set(norm(ev[j].word), ev[j]);
      }
    }
  }
}

console.log('leftover identical EN entries:', need.size);
const translated = new Map();
for (const [k, v] of need) {
  const word = await gtx(v.word);
  await sleep(120);
  const definition = await gtx(v.definition);
  await sleep(120);
  translated.set(k, { word, definition });
  console.log(v.word, '->', word);
}

for (const L of Object.keys(EN)) {
  for (let i = 0; i < EN[L].length; i++) {
    const ev = EN[L][i].vocabulary || [];
    const pv = pack[L][i].vocabulary || [];
    pack[L][i].vocabulary = ev.map((v, j) => {
      const t = translated.get(norm(v.word));
      return t || pv[j] || { word: v.word, definition: v.definition };
    });
  }
}

fs.writeFileSync(FILE, JSON.stringify(pack, null, 2), 'utf8');
console.log('sw fixed');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'lang-packs');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/level-texts.json'), 'utf8'));
const LANGS = ['ru','tl','es','uz','de','fr','it','pt','ja','ko','zh','ar','tr','nl','hi','pl','sv','id','ms','vi','th','uk','el','cs','ro','fa','ur','sw'];

/**
 * UZ Learn pack is a native CEFR rewrite (scripts/localize/), so vocabulary
 * counts need not equal English. Other langs still require exact vocab parity.
 */
const SKIP_VOCAB_COUNT_MATCH = new Set(['uz']);

let allOk = true;
for (const lang of LANGS) {
  const file = path.join(OUT, lang, 'level-texts.json');
  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    allOk = false;
    console.log(`${lang}: JSON PARSE FAIL ${e.message}`);
    continue;
  }
  let ok = true, msg = [];
  for (const level of Object.keys(EN)) {
    const en = EN[level], pk = pack[level];
    if (!Array.isArray(pk) || pk.length !== en.length) { ok = false; msg.push(`${level} len ${pk?.length}/${en.length}`); continue; }
    for (let i = 0; i < en.length; i++) {
      if (!pk[i] || en[i].id !== pk[i].id) { ok = false; msg.push(`${level} id@${i}`); }
      if (!SKIP_VOCAB_COUNT_MATCH.has(lang)) {
        if ((pk[i].vocabulary || []).length !== (en[i].vocabulary || []).length) {
          ok = false;
          msg.push(`${level} ${en[i].id} vocab ${(pk[i].vocabulary||[]).length}/${(en[i].vocabulary||[]).length}`);
        }
      } else {
        const vc = (pk[i].vocabulary || []).length;
        if (vc < 4) {
          ok = false;
          msg.push(`${level} ${en[i].id} vocab too small (${vc})`);
        }
        if (!String(pk[i].title || '').trim() || !String(pk[i].text || '').trim()) {
          ok = false;
          msg.push(`${level} ${en[i].id} empty title/text`);
        }
      }
    }
  }
  if (!ok) allOk = false;
  const okMsg = SKIP_VOCAB_COUNT_MATCH.has(lang)
    ? 'OK - ids aligned (vocab count flexible)'
    : 'OK - all ids + vocab counts match English';
  console.log(`${lang}: ${ok ? okMsg : 'FAIL ' + msg.join('; ')}`);
}
console.log('\nRESULT:', allOk ? 'ALL 28 PACKS VALID' : 'SOME FAILED');

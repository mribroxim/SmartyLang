import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'lang-packs');
const SNAP = path.join(__dirname, '_snapshot_langpacks');
const LANGS = ['ru','tl','es','uz','de','fr','it','pt','ja','ko','zh','ar','tr','nl','hi','pl','sv','id','ms','vi','th','uk','el','cs','ro','fa','ur','sw'];

let allOk = true;
for (const lang of LANGS) {
  const snap = JSON.parse(fs.readFileSync(path.join(SNAP, lang + '.level-texts.json'), 'utf8'));
  const now = JSON.parse(fs.readFileSync(path.join(OUT, lang, 'level-texts.json'), 'utf8'));
  let title=0, text=0, ts=0, vocab=0, total=0;
  for (const lvl of Object.keys(now)) {
    const sMap = new Map((snap[lvl]||[]).map(p=>[p.id,p]));
    for (const p of now[lvl]||[]) {
      total++;
      const s = sMap.get(p.id);
      if (!s) continue;
      if (s.title !== p.title) title++;
      if (s.text !== p.text) text++;
      if (s.targetSeconds !== p.targetSeconds) ts++;
      if (JSON.stringify(s.vocabulary) !== JSON.stringify(p.vocabulary)) vocab++;
    }
  }
  const ok = title===0 && text===0 && ts===0;
  if (!ok) allOk = false;
  console.log(`${lang}: titleC=${title} textC=${text} tsC=${ts} vocabC=${vocab} total=${total} ${ok?'OK':'PRESERVATION FAIL'}`);
}
console.log('\nRESULT:', allOk ? 'ALL TITLE/TEXT/TS PRESERVED' : 'FAILURE');

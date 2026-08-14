import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function isMostlyEnglish(s) {
  if (!s || s.length < 80) return false;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const letters = (s.match(/\p{L}/gu) || []).length;
  if (letters < 40) return false;
  return latin / letters > 0.85 && /\b(the|and|of|to)\b/i.test(s);
}

for (const lang of ['sw', 'el', 'uz', 'ur', 'ar', 'fa', 'hi', 'tr']) {
  const cr = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/data/lang-packs', lang, 'comprehensive-reading.json'), 'utf8'),
  );
  const bad = cr
    .map((p, i) => ({ i, title: p.title, level: p.level, en: isMostlyEnglish(p.passage) }))
    .filter((x) => x.en);
  console.log(lang, 'EN CR passages', bad.length, bad.slice(0, 5));

  const lt = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/data/lang-packs', lang, 'level-texts.json'), 'utf8'),
  );
  let ltBad = 0;
  for (const level of Object.keys(lt)) {
    for (const t of lt[level]) {
      if (isMostlyEnglish(t.text)) ltBad++;
    }
  }
  console.log(lang, 'EN LT texts', ltBad);
}

const d = fs.readFileSync(path.join(ROOT, 'public/data/lang-packs/ar/dictation/Beginner.txt'), 'utf8');
console.log('AR dictation lines', d.split(/\r?\n/).filter((l) => l.trim()).length);

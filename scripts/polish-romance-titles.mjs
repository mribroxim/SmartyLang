/**
 * Normalize Romance titles to sentence case; fix ES a50/a100 se→te leftovers.
 * node scripts/polish-romance-titles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

/** Words that should stay capitalized mid-title */
const KEEP = new Set(
  [
    'B2',
    'C1',
    'C2',
    'PIB',
    'PISA',
    'CO₂',
    'CO2',
    'AM',
    'PM',
    'IELTS',
    'ONU',
    'UE',
    'USA',
    'UK',
    'NASA',
    'OTAN',
    'UNESCO',
    'COVID',
    'COVID-19',
    'Internet',
    'Wi-Fi',
    'AI',
    'IA',
  ].map((x) => x.toLowerCase())
);

const PROPER = new Set(
  [
    'María',
    'Maria',
    'John',
    'Sarah',
    'Temur',
    'Hasan',
    'Nico',
    'Tokio',
    'Tokyo',
    'París',
    'Paris',
    'Londres',
    'London',
    'Roma',
    'Madrid',
    'Lisboa',
    'Bucarest',
    'Bangkok',
    'Einstein',
    'Newton',
    'Darwin',
    'Shakespeare',
    'Leonardo',
    'Dante',
    'Petrarca',
    'Boccaccio',
    'África',
    'América',
    'Asia',
    'Europa',
    'Tierra',
    'Marte',
    'Luna',
    'Atlántico',
    'Pacífico',
    'Ártico',
    'Antártida',
    'Mediterráneo',
    'Renacimiento',
    'Ibérica',
    'Ibéria',
    'Galia',
    'Dacia',
    'Normandos',
    'Francia',
    'España',
    'Italia',
    'Portugal',
    'Rumanía',
    'Romania',
    'Brasil',
    'China',
    'Japón',
    'Japon',
    'India',
    'Inglaterra',
    'England',
    'Alemania',
    'Suica',
  ].map((x) => x.toLowerCase())
);

function sentenceCaseTitle(title, lang) {
  if (!title || typeof title !== 'string') return title;
  const parts = title.split(/(\s+|[:–—-])/);
  return parts
    .map((tok, i) => {
      if (!tok || /^\s+$/.test(tok) || /^[:–—-]$/.test(tok)) return tok;
      const lower = tok.toLocaleLowerCase(lang);
      const bare = lower.replace(/[^\p{L}\p{N}°-]/gu, '');
      if (KEEP.has(bare.toLowerCase()) || KEEP.has(tok)) return tok.toUpperCase() === tok && tok.length <= 4 ? tok : tok;
      if (PROPER.has(bare.toLowerCase())) {
        return tok.charAt(0).toLocaleUpperCase(lang) + tok.slice(1).toLocaleLowerCase(lang);
      }
      // First meaningful token → capitalize
      if (i === 0 || (i > 0 && /^[:–—]$/.test(parts[i - 1]))) {
        return tok.charAt(0).toLocaleUpperCase(lang) + tok.slice(1).toLocaleLowerCase(lang);
      }
      // After colon space
      if (i >= 2 && parts[i - 1] === ' ' && /^[:–—]$/.test(parts[i - 2])) {
        return tok.charAt(0).toLocaleUpperCase(lang) + tok.slice(1).toLocaleLowerCase(lang);
      }
      return lower;
    })
    .join('');
}

function fixEsClitics(text) {
  return text
    .replace(/puedes comunicarse/g, 'puedes comunicarte')
    .replace(/puedes comprenderse/g, 'puedes comprender')
    .replace(/has demostrado la capacidad de comprender y sintetizar/g, 'has demostrado la capacidad de comprender y sintetizar')
    .replace(/te permite conectar con otros/g, 'te permite conectar con los demás')
    .replace(/expresando tus ideas tanto sobre temas concretos como abstractos con sofisticación y matices/g, 'y expresar tus ideas sobre temas concretos y abstractos con sofisticación y matices');
}

let total = 0;
for (const lang of ['es', 'pt', 'fr', 'it', 'ro']) {
  // level-texts
  const ltFp = path.join(PACKS, lang, 'level-texts.json');
  const lt = JSON.parse(fs.readFileSync(ltFp, 'utf8'));
  for (const level of Object.keys(lt)) {
    for (const p of lt[level]) {
      const nt = sentenceCaseTitle(p.title, lang);
      if (nt !== p.title) {
        p.title = nt;
        total++;
      }
      if (lang === 'es' && (p.id === 'a50' || p.id === 'a100')) {
        const t = fixEsClitics(p.text);
        if (t !== p.text) {
          p.text = t;
          total++;
        }
      }
    }
  }
  fs.writeFileSync(ltFp, JSON.stringify(lt, null, 2) + '\n');

  // CR titles
  const crFp = path.join(PACKS, lang, 'comprehensive-reading.json');
  const cr = JSON.parse(fs.readFileSync(crFp, 'utf8'));
  for (const item of cr) {
    const nt = sentenceCaseTitle(item.title, lang);
    if (nt !== item.title) {
      item.title = nt;
      total++;
    }
  }
  fs.writeFileSync(crFp, JSON.stringify(cr, null, 2) + '\n');
  console.log(lang, 'title pass done');
}
console.log('total title/clitic fixes', total);

// verify
const es = JSON.parse(fs.readFileSync(path.join(PACKS, 'es', 'level-texts.json'), 'utf8'));
console.log('sample', es.Beginner.slice(0, 6).map((p) => p.title));
console.log('adv', es.Advanced.slice(0, 4).map((p) => p.title));
console.log('a50', es.Advanced.find((p) => p.id === 'a50').text.match(/puedes comunic\w+/));

/**
 * Audit UI locale packs for quality issues.
 * Run: node scripts/audit-ui-locales.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/ui.en.json'), 'utf8'));
const gen = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/ui.generated.json'), 'utf8'));
const enKeys = Object.keys(en);

const ENGLISH_WORD = /\bEnglish\b|\banglais\b|\binglés\b|\bingles\b|\bEnglisch\b|\binglese\b|\binglês\b|\binglesa\b|\b英語\b|\b영어\b|\bанглийск|\bанглійськ|\bİngiliz|\bالإنجليز|\bانگریزی|\bภาษาอังกฤษ\b|\btiếng Anh\b|\bBahasa Inggris\b|\bIngilizce\b|\bİngilizce\b/i;

console.log('EN keys:', enKeys.length);
console.log('Langs:', Object.keys(gen).length);

console.log('\n=== EN strings with "English" ===');
for (const k of enKeys) {
  if (/\bEnglish\b/i.test(en[k])) console.log(`  ${k}: ${en[k]}`);
}

for (const lang of Object.keys(gen)) {
  const pack = gen[lang];
  const issues = [];
  for (const k of enKeys) {
    const tr = pack[k];
    if (tr == null || String(tr).trim() === '') {
      issues.push({ k, type: 'missing' });
      continue;
    }
    if (/<<<SEP>>>|&#\d+;|&quot;|&amp;|&lt;|&gt;/.test(tr)) {
      issues.push({ k, type: 'entity', tr });
    }
    if (/\n</.test(tr) || /<[^a-zA-Z]*$/.test(tr) || /\n</.test(tr) || tr.includes('\n<')) {
      issues.push({ k, type: 'artifact', tr });
    }
    if (tr.includes('\n') && !en[k].includes('\n')) {
      issues.push({ k, type: 'newline', tr });
    }
    const enPh = (en[k].match(/\{[a-z]+\}/gi) || []).sort().join(',');
    const trPh = (tr.match(/\{[a-z]+\}/gi) || []).sort().join(',');
    if (enPh !== trPh) issues.push({ k, type: 'placeholder', en: en[k], tr });
    if (ENGLISH_WORD.test(tr) && k !== 'common.ielts') {
      issues.push({ k, type: 'english-mention', tr });
    }
    // suspiciously short vs EN
    if (en[k].length > 40 && tr.length < en[k].length * 0.25) {
      issues.push({ k, type: 'too-short', en: en[k], tr });
    }
  }
  const identical = enKeys.filter(
    (k) =>
      pack[k] === en[k] &&
      en[k] !== 'IELTS' &&
      !['common.7d', 'common.30d'].includes(k) &&
      en[k].length > 4,
  );
  if (issues.length || identical.length > 8) {
    console.log(`\n== ${lang} == issues:${issues.length} identical:${identical.length}`);
    const byType = {};
    for (const i of issues) {
      byType[i.type] = byType[i.type] || [];
      byType[i.type].push(i);
    }
    for (const [t, arr] of Object.entries(byType)) {
      console.log(`  [${t}] ${arr.length}`);
      for (const i of arr.slice(0, 12)) {
        console.log(`    ${i.k}: ${JSON.stringify(i.tr || i.en || '').slice(0, 120)}`);
      }
    }
    if (identical.length > 8) {
      console.log('  identical sample:', identical.slice(0, 10).join(', '));
    }
  }
}

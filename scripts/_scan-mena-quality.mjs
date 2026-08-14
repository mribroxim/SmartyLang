import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const langs = ['ar', 'fa', 'ur', 'hi', 'tr', 'uz', 'sw', 'el'];
const englishRe = /\b(English|english|learning English|speak English|in English)\b/g;

function walkStrings(obj, fn) {
  if (typeof obj === 'string') {
    fn(obj);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v) => walkStrings(v, fn));
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k === 'chartData' || k === 'vocabulary') continue;
      walkStrings(obj[k], fn);
    }
  }
}

for (const lang of langs) {
  const dir = path.join(ROOT, 'public', 'data', 'lang-packs', lang);
  let engHits = 0;
  const sampleEng = [];
  let scriptWeird = 0;
  const sampleWeird = [];
  const files = [
    'level-texts.json',
    'comprehensive-reading.json',
    'speaking-topics.json',
    'writing-topics.json',
    'task2.json',
    'task1.json',
  ];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    walkStrings(data, (s) => {
      if (englishRe.test(s)) {
        engHits++;
        if (sampleEng.length < 3) sampleEng.push(`${f}: ${s.slice(0, 140)}`);
      }
      englishRe.lastIndex = 0;
      if (['ar', 'fa', 'ur'].includes(lang) && /[A-Za-z]{5,}/.test(s) && /[\u0600-\u06FF]/.test(s)) {
        const lat = (s.match(/[A-Za-z]{4,}/g) || []).length;
        if (lat >= 3) {
          scriptWeird++;
          if (sampleWeird.length < 2) sampleWeird.push(`${f}: ${s.slice(0, 120)}`);
        }
      }
      if (lang === 'hi' && /[A-Za-z]{5,}/.test(s) && /[\u0900-\u097F]/.test(s)) {
        const lat = (s.match(/[A-Za-z]{4,}/g) || []).length;
        if (lat >= 3) {
          scriptWeird++;
          if (sampleWeird.length < 2) sampleWeird.push(`${f}: ${s.slice(0, 120)}`);
        }
      }
      if (lang === 'el' && /[A-Za-z]{5,}/.test(s) && /[\u0370-\u03FF]/.test(s)) {
        const lat = (s.match(/[A-Za-z]{4,}/g) || []).length;
        if (lat >= 3) {
          scriptWeird++;
          if (sampleWeird.length < 2) sampleWeird.push(`${f}: ${s.slice(0, 120)}`);
        }
      }
    });
  }
  for (const df of fs.readdirSync(path.join(dir, 'dictation'))) {
    const s = fs.readFileSync(path.join(dir, 'dictation', df), 'utf8');
    if (englishRe.test(s)) {
      engHits++;
      if (sampleEng.length < 3) sampleEng.push(`dictation/${df}: hit`);
    }
    englishRe.lastIndex = 0;
  }
  console.log(`${lang}: english-ish~${engHits} scriptMix~${scriptWeird}`);
  sampleEng.forEach((x) => console.log('  ENG:', x));
  sampleWeird.forEach((x) => console.log('  MIX:', x));
}

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('public/data/lang-packs');
const langs = ['id', 'ms', 'tl'];

function isMostlyEnglish(s) {
  const t = String(s || '').trim();
  if (t.length < 35) return false;
  // Latin letters dominate and looks like English sentence
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 25) return false;
  const ascii = (t.match(/[A-Za-z]/g) || []).length;
  if (ascii / Math.max(letters.length, 1) < 0.9) return false;
  // exclude if has strong Malay/ID/Tagalog markers
  if (/\b(yang|dan|atau|untuk|dengan|adalah|ini|itu|saya|aku|anda|kamu|mereka|tidak|bukan|pada|dari|ke|di|ng|mga|ang|sa|ay|ko|mo|naman|hindi|para|may|kung)\b/i.test(t)) {
    // still English if mostly English function words
  }
  const engHits = (t.match(/\b(the|and|with|that|this|from|have|has|was|were|are|is|for|not|you|your|they|their|about|when|which|while|because|into|over|under|between)\b/gi) || []).length;
  const words = t.split(/\s+/).length;
  return engHits >= 4 && engHits / words > 0.18;
}

const selfRef = {
  id: [/bahasa\s+Inggris/gi, /\bEnglish\b/g, /\bInggris\b/g],
  ms: [/bahasa\s+Inggeris/gi, /\bEnglish\b/g, /\bInggeris\b/g, /bahasa\s+Inggris/gi],
  tl: [/\bIngles\b/gi, /\bEnglish\b/g, /\bInglés\b/g],
};

const msIndo = [/universitas/gi, /aktivitas/gi, /\bkamu\b/gi, /\baku\b/gi, /membutuhkan/gi, /memerlukan/gi, /berbeda/gi, /menggunakan/gi];
const tlCalques = [/ini-stretch/gi, /magpa-practice/gi, /naka-enroll/gi, /ini-stretch/gi, /\bstretch\b/gi, /growth mindset/gi, /deliberate practice/gi, /rush hour/gi];

for (const lang of langs) {
  console.log(`\n======== ${lang} ========`);
  const base = path.join(ROOT, lang);
  // samples
  const lt = JSON.parse(fs.readFileSync(path.join(base, 'level-texts.json'), 'utf8'));
  console.log('Beginner[0]:', lt.Beginner[0].title);
  console.log(lt.Beginner[0].text.slice(0, 280));
  if (lt.Beginner[0].vocabulary?.[0]) {
    console.log('vocab0:', JSON.stringify(lt.Beginner[0].vocabulary[0]));
  }

  for (const f of ['level-texts.json', 'comprehensive-reading.json', 'speaking-topics.json', 'writing-topics.json', 'task2.json']) {
    const raw = fs.readFileSync(path.join(base, f), 'utf8');
    let eng = 0;
    let self = 0;
    const engSamples = [];
    const selfSamples = [];
    // crude walk via JSON
    const data = JSON.parse(raw);
    const walk = (node, trail) => {
      if (typeof node === 'string') {
        if (isMostlyEnglish(node)) {
          eng++;
          if (engSamples.length < 5) engSamples.push(`${trail} :: ${node.slice(0, 120)}`);
        }
        for (const re of selfRef[lang]) {
          if (re.test(node)) {
            self++;
            if (selfSamples.length < 5) selfSamples.push(`${trail} :: ${node.slice(0, 140)}`);
            re.lastIndex = 0;
          }
        }
      } else if (Array.isArray(node)) node.forEach((x, i) => walk(x, `${trail}[${i}]`));
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (k === 'chartData') continue;
          walk(v, `${trail}.${k}`);
        }
      }
    };
    walk(data, f);
    console.log(`${f}: leftoverEng≈${eng} selfref≈${self}`);
    engSamples.forEach((s) => console.log('  ENG', s));
    selfSamples.forEach((s) => console.log('  SELF', s));
  }

  // dictation
  const dictDir = path.join(base, 'dictation');
  for (const file of fs.readdirSync(dictDir)) {
    const raw = fs.readFileSync(path.join(dictDir, file), 'utf8');
    let self = 0;
    for (const re of selfRef[lang]) {
      const m = raw.match(re);
      if (m) self += m.length;
    }
    let calq = 0;
    if (lang === 'tl') {
      for (const re of tlCalques) {
        const m = raw.match(re);
        if (m) calq += m.length;
      }
    }
    console.log(`dictation/${file}: selfref=${self}` + (lang === 'tl' ? ` calques=${calq}` : ''));
  }

  if (lang === 'ms') {
    const raw = fs.readFileSync(path.join(base, 'level-texts.json'), 'utf8') +
      fs.readFileSync(path.join(base, 'comprehensive-reading.json'), 'utf8');
    for (const re of msIndo) {
      const m = raw.match(re);
      console.log('MS indo-lex', re, m ? m.length : 0);
    }
  }
  if (lang === 'tl') {
    const raw = fs.readFileSync(path.join(base, 'level-texts.json'), 'utf8');
    for (const re of tlCalques) {
      const m = raw.match(re);
      if (m) console.log('TL calque', String(re), m.length, 'e.g.', m[0]);
    }
  }
}

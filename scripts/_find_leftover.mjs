import fs from 'fs';
import path from 'path';

const base = 'public/data/lang-packs';
const langs = process.argv.slice(2);
const levels = new Set(['Beginner','Elementary','Pre-Intermediate','Intermediate','Advanced']);

// native script test
const nativeTest = {
  ar:/[\u0600-\u06FF]/, fa:/[\u0600-\u06FF]/, ur:/[\u0600-\u06FF]/,
  hi:/[\u0900-\u097F]/, el:/[\u0370-\u03FF]/,
  ja:/[\u3040-\u30FF\u4E00-\u9FFF]/, ko:/[\uAC00-\uD7AF\u1100-\u11FF]/,
  zh:/[\u4E00-\u9FFF]/, th:/[\u0E00-\u0E7F]/,
};
// For latin native languages, use english-word heuristics

function walkStr(o, out) {
  if (o === null || o === undefined) return;
  if (typeof o === 'string') { out.push(o); return; }
  if (Array.isArray(o)) { o.forEach(v=>walkStr(v, out)); return; }
  if (typeof o === 'object') for (const k in o) walkStr(o[k], out);
}

// count english words (common function words + hits)
const engWord = /\b(the|a|an|and|of|to|in|is|are|was|were|for|with|on|at|as|by|from|it|he|she|they|we|you|my|his|her|their|our|this|that|have|has|had|can|could|will|would|should|not|but|or|because|about|learn|speak|write|read|study|english|do|does|did|be|been|being|i|we'll|don't)\b/gi;

function englishWords(s){
  const m = s.match(engWord) || [];
  return m.length;
}

for (const lang of langs) {
  const dir = path.join(base, lang);
  const native = nativeTest[lang];
  console.log(`\n========== ${lang} ==========`);
  const jsonFiles = ['speaking-topics.json','writing-topics.json','level-texts.json','comprehensive-reading.json','task1.json','task2.json'];
  let allStrs = [];
  for (const f of jsonFiles) {
    const file = path.join(dir, f);
    if (!fs.existsSync(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(file,'utf8')); } catch(e){ console.log(`PARSE FAIL ${f}`); continue; }
    const strs = [];
    walkStr(data, strs);
    for (const s of strs) {
      if (s.length < 8) continue;
      if (levels.has(s)) continue;
      if (lang in nativeTest) {
        // non-native script with many english words
        if (!native.test(s) && englishWords(s) >= 3) {
          allStrs.push(s);
        }
      } else {
        // latin native languages: skip (handled by native word search)
        continue;
      }
    }
  }
  const seen = new Set();
  for (const s of allStrs) {
    if (seen.has(s)) continue; seen.add(s);
    console.log(`  > ${s.slice(0,200)}`);
  }
  if (allStrs.length===0) console.log('  (no multi-word English leftover)');
}

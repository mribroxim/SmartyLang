import fs from 'fs';

const en = JSON.parse(fs.readFileSync('public/level-texts.json', 'utf8'));

// Build definition dict from entire corpus: norm(word) -> preferred definition
// Prefer the most common definition (first occurrence weighted by frequency of the word across passages)
const defDict = {}; // norm -> {def, count}
for (const level of Object.keys(en)) {
  for (const p of en[level]) {
    for (const v of p.vocabulary || []) {
      const norm = String(v.word).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!norm) continue;
      if (!defDict[norm]) { defDict[norm] = { def: v.definition, count: 1 }; }
      else { defDict[norm].count++; }
    }
  }
}

const STOP = new Set('the a an and or but to of in on for with at by from into about as it its this that is are was were be been being have has had do does did will would can could should may might must shall not no so if then than when where which who whom what how why there here all any some most more much many very just also only own same such each every other another one two three four five six seven eight nine ten our your their his her its my we they he she i you me us'.split(' '));

// For each passage, list candidate content words present in text that lack a corpus definition
const missing = {};
for (const level of Object.keys(en)) {
  for (const p of en[level]) {
    for (const w of p.text.toLowerCase().split(/[^a-z0-9']+/)) {
      if (!w || w.length < 4) continue;
      if (STOP.has(w)) continue;
      // strip trailing plural s for lookup
      const base = w.replace(/s$/, '');
      const norm = w.replace(/[^a-z0-9]/g, '');
      if (defDict[norm] || defDict[base]) continue;
      if (!missing[w]) missing[w] = 0;
      missing[w]++;
    }
  }
}
const sorted = Object.entries(missing).sort((a,b) => b[1]-a[1]);
console.log('TOTAL unique candidate words lacking corpus definitions:', sorted.length);
console.log('Top 300 by frequency:');
sorted.slice(0, 300).forEach(([w, c]) => console.log(`${w}\t${c}`));

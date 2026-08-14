import fs from 'fs';

const en = JSON.parse(fs.readFileSync('public/level-texts.json', 'utf8'));

function inflections(base) {
  const forms = new Set([base, base+'s', base+'es', base+'ed', base+'d', base+'ing',
    base+'er', base+'est', base+'ers', base+'ies', base+'ied']);
  if (/[^aeiou]y$/.test(base)) {
    forms.add(base.slice(0,-1)+'ies'); forms.add(base.slice(0,-1)+'ied');
    forms.add(base.slice(0,-1)+'ier'); forms.add(base.slice(0,-1)+'iest');
  }
  if (base.endsWith('e')) {
    const noE = base.slice(0,-1);
    forms.add(noE+'ing'); forms.add(noE+'ed'); forms.add(noE+'er'); forms.add(noE+'est');
  }
  if (/[b-df-hj-np-tv-z][aeiou][b-df-hj-np-tv-z]$/.test(base) && !base.endsWith('s')) {
    forms.add(base+base.slice(-1)+'ing'); forms.add(base+base.slice(-1)+'ed');
    forms.add(base+base.slice(-1)+'er'); forms.add(base+base.slice(-1)+'est');
  }
  return forms;
}

function normalizeWord(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripPossessive(tok) {
  return tok.replace(/'s$/i, '').replace(/'$/, '');
}

function wordPresent(word, text) {
  const w = normalizeWord(word);
  if (!w) return true;
  const lower = text.toLowerCase();
  const raw = lower.split(/[^a-z0-9']+/).filter(Boolean);
  const tokens = new Set();
  for (const t of raw) {
    tokens.add(t);
    const s = stripPossessive(t);
    if (s) tokens.add(s);
  }
  const phrase = w.split(' ').filter(Boolean);
  if (phrase.length > 1) {
    if (lower.includes(phrase.join(' '))) return true;
    return phrase.every(wordPresentInTokens);
  }
  return wordPresentInTokens(phrase[0]);

  function wordPresentInTokens(token) {
    if (tokens.has(token)) return true;
    for (const f of inflections(token)) if (tokens.has(f)) return true;
    return false;
  }
}

let totalPass = 0, totalProblems = 0;
const problemList = [];
for (const level of Object.keys(en)) {
  for (const p of en[level]) {
    for (const v of p.vocabulary || []) {
      if (!wordPresent(v.word, p.text)) {
        totalProblems++;
        problemList.push(`${level} ${p.id}: "${v.word}" NOT in text`);
      }
    }
  }
}
console.log('Total vocab entries checked, problems:', totalProblems);
console.log(problemList.join('\n') || 'ALL PASS');

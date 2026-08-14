/**
 * Polish expanded English vocab: fix bad senses, drop weak filler lemmas,
 * top up passages that fell below level minima.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN_PATH = path.join(ROOT, 'public', 'level-texts.json');
const CACHE_PATH = path.join(__dirname, '.dict-cache.json');

const TARGET = {
  Beginner: { min: 8, max: 14, ideal: 11 },
  Elementary: { min: 10, max: 16, ideal: 13 },
  'Pre-Intermediate': { min: 12, max: 18, ideal: 15 },
  Intermediate: { min: 12, max: 20, ideal: 16 },
  Advanced: { min: 14, max: 22, ideal: 18 },
};

const WEAK = new Set(`
brought taken given gone been seen done made left held felt kept meant built
written spoken known thought become became began begun grew grown
rather quite somehow indeed merely really actually basically literally
perhaps maybe almost always never often sometimes usually
such same other another each every any some many much more most
`.trim().split(/\s+/));

const OVERRIDES = {
  frameworks: { pos: 'Noun', definition: 'Structures of rules, ideas, or systems used to organize work or thinking.' },
  framework: { pos: 'Noun', definition: 'A structure of rules, ideas, or systems used to organize work or thinking.' },
  crossroads: { pos: 'Noun', definition: 'A point where an important choice must be made; also where roads meet.' },
  reliant: { pos: 'Adjective', definition: 'Dependent on someone or something for support.' },
  unintended: { pos: 'Adjective', definition: 'Not planned or meant to happen.' },
  ethical: { pos: 'Adjective', definition: 'Relating to moral principles of right and wrong.' },
  tea: { pos: 'Noun', definition: 'A hot drink made by pouring boiling water onto dried leaves.' },
  teeth: { pos: 'Noun', definition: 'The hard white parts in your mouth used for biting and chewing.' },
  brush: { pos: 'Verb', definition: 'To clean or tidy something using a brush.' },
  arms: { pos: 'Noun', definition: 'The two upper limbs of the human body, from shoulder to hand.' },
  ensuring: { pos: 'Verb', definition: 'Making certain that something will happen or be true.' },
  consequences: { pos: 'Noun', definition: 'Results or effects that follow from an action or situation.' },
  progress: { pos: 'Noun', definition: 'Forward movement toward a goal; improvement or development.' },
  decision: { pos: 'Noun', definition: 'A choice made after thinking about possibilities.' },
  technological: { pos: 'Adjective', definition: 'Related to scientific and industrial technology.' },
  algorithmic: { pos: 'Adjective', definition: 'Related to step-by-step procedures used by computers.' },
  innovation: { pos: 'Noun', definition: 'A new idea, method, or product; the act of introducing something new.' },
  nation: { pos: 'Noun', definition: 'A country and its people.' },
  workers: { pos: 'Noun', definition: 'People who do a job, especially for pay.' },
};

function norm(w) {
  return String(w).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function capitalizeLemma(s) {
  const t = String(s).trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function stripPossessive(tok) {
  return tok.replace(/'s$/i, '').replace(/'$/, '');
}

function textTokens(text) {
  const lower = text.toLowerCase();
  const raw = lower.split(/[^a-z0-9']+/).filter(Boolean);
  const tokens = new Set();
  for (const t of raw) {
    tokens.add(t);
    const s = stripPossessive(t);
    if (s) tokens.add(s);
  }
  return { lower, tokens };
}

function inflections(base) {
  const forms = new Set([base, base + 's', base + 'es', base + 'ed', base + 'd', base + 'ing']);
  if (base.endsWith('s') && base.length > 3 && !base.endsWith('ss')) forms.add(base.slice(0, -1));
  if (base.endsWith('ing') && base.length > 5) {
    forms.add(base.slice(0, -3));
    forms.add(base.slice(0, -3) + 'e');
  }
  if (base.endsWith('ed') && base.length > 4) forms.add(base.slice(0, -2));
  if (/[^aeiou]y$/.test(base)) forms.add(base.slice(0, -1) + 'ies');
  return forms;
}

function wordInText(word, text) {
  const w = norm(word);
  if (!w) return true;
  const { lower, tokens } = textTokens(text);
  const phrase = w.split(' ').filter(Boolean);
  if (phrase.length > 1) return lower.includes(phrase.join(' ')) || phrase.every((t) => tokenOk(t, tokens));
  return tokenOk(phrase[0], tokens);
}

function tokenOk(token, tokens) {
  if (tokens.has(token)) return true;
  for (const f of inflections(token)) if (tokens.has(f)) return true;
  return false;
}

function format(word, pos, definition) {
  const def = definition.endsWith('.') ? definition : definition + '.';
  return { word: capitalizeLemma(word), definition: `(${pos}) ${def}` };
}

function applyOverride(entry) {
  const key = norm(entry.word);
  if (OVERRIDES[key]) {
    const o = OVERRIDES[key];
    return format(entry.word, o.pos, o.definition);
  }
  // Drop parenthetical dictionary noise like "(ditransitive)"
  let def = entry.definition.replace(/\([^)]*transitive[^)]*\)\s*/gi, '').replace(/\s+/g, ' ').trim();
  if (def !== entry.definition) return { word: entry.word, definition: def };
  return entry;
}

function isBadDef(definition) {
  const d = definition.toLowerCase();
  return /cannabis|euphoric|ethical drug|heraldry|branches of a tree/.test(d);
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function candidatesFromText(text, seen) {
  const seq = (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).map(stripPossessive).filter(Boolean);
  const tf = new Map();
  for (const t of seq) tf.set(t, (tf.get(t) || 0) + 1);
  return [...tf.entries()]
    .filter(([w]) => w.length >= 4 && !seen.has(w) && !WEAK.has(w))
    .sort((a, b) => b[0].length - a[0].length || b[1] - a[1])
    .map(([w]) => w);
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const cache = loadCache();

for (const level of Object.keys(en)) {
  const tgt = TARGET[level];
  for (const p of en[level]) {
    const seen = new Set();
    const next = [];
    for (const v of p.vocabulary || []) {
      if (!wordInText(v.word, p.text)) continue;
      const key = norm(v.word);
      if (seen.has(key)) continue;
      if (WEAK.has(key) && next.length >= tgt.min) continue;
      let entry = applyOverride(v);
      if (isBadDef(entry.definition) && OVERRIDES[key]) entry = applyOverride(entry);
      if (isBadDef(entry.definition)) continue;
      if (WEAK.has(key)) continue; // drop weak fillers when polishing
      seen.add(key);
      next.push(entry);
    }

    // Top up from cache/overrides
    if (next.length < tgt.ideal) {
      for (const w of candidatesFromText(p.text, seen)) {
        if (next.length >= tgt.ideal) break;
        if (level === 'Advanced' && w.length < 5) continue;
        if (level === 'Beginner' && w.length > 11) continue;
        const key = norm(w);
        let defObj = OVERRIDES[key];
        if (!defObj) {
          const c = cache[key];
          defObj = c?._v === 2 ? c.data : c?.pos ? c : null;
        }
        if (!defObj?.definition) continue;
        if (isBadDef(defObj.definition)) continue;
        if (/slang|obsolete|archaic|cannabis/.test(defObj.definition.toLowerCase())) continue;
        seen.add(key);
        next.push(format(w, defObj.pos || 'Noun', defObj.definition));
      }
    }

    p.vocabulary = next.slice(0, tgt.max);
  }
}

fs.writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + '\n', 'utf8');

const stats = {};
let problems = 0;
for (const level of Object.keys(en)) {
  const counts = en[level].map((p) => (p.vocabulary || []).length);
  stats[level] = {
    avg: +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2),
    min: Math.min(...counts),
    max: Math.max(...counts),
  };
  for (const p of en[level]) {
    for (const v of p.vocabulary || []) {
      if (!wordInText(v.word, p.text)) {
        problems++;
        console.log('MISSING', level, p.id, v.word);
      }
    }
  }
}
console.log(JSON.stringify(stats, null, 2));
console.log('Presence problems:', problems);
console.log('Advanced0 sample:', en.Advanced[0].vocabulary.map((v) => v.word).join(', '));

/**
 * Expand passage-specific vocabulary in public/level-texts.json.
 * Keeps existing items that appear in the passage; adds more content words/phrases.
 * Definitions from Free Dictionary API (cached), scored for learner-friendliness,
 * with overrides for common words that have misleading dictionary senses.
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

const STOP = new Set(`
a an the and or but if as at by for from in into of on onto to with without within
is am are was were be been being do does did done doing have has had having
i me my mine we us our you your he him his she her hers they them their
it its this that these those there here who whom whose which what when where why how
not no nor so than then too very just also only even still already yet
can could will would shall should may might must
about above across after against along among around before behind below beneath beside between beyond
during except inside near off over past since through under until upon via
up out down away back again once twice
oh yes yeah ok okay well um uh
mr mrs ms dr st
one two three four five six seven eight nine ten
rather quite somehow indeed merely really actually basically literally perhaps maybe
almost always never often sometimes usually
such same other another each every any some many much more most less least
own both few several either neither
`.trim().split(/\s+/));

const TOO_COMMON = new Set(`
get got getting make made making go goes went going gone
say says said saying know knew knowing think thought
see saw seen look looked looking come came coming
take took taken want wanted give gave given
tell told ask asked work worked working
use used using find found try tried
put call called keep kept let
feel felt need needed
day days time times year years people person man men woman women
thing things way ways part parts place places
good bad big small new old long short
like liked likes liking
`.trim().split(/\s+/));

const PARTICLES = new Set([
  'up', 'out', 'off', 'on', 'in', 'away', 'down', 'over', 'back', 'about',
  'along', 'through', 'around', 'together', 'apart', 'aside', 'ahead', 'forward',
]);

const POS_MAP = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  pronoun: 'Pronoun',
  interjection: 'Interjection',
  article: 'Article',
};

/** Learner-friendly overrides when Free Dictionary returns odd senses. */
const LEARNER_DEFS = {
  tea: { pos: 'Noun', definition: 'A hot drink made by pouring boiling water onto dried leaves' },
  teeth: { pos: 'Noun', definition: 'The hard white parts in your mouth used for biting and chewing' },
  tooth: { pos: 'Noun', definition: 'One of the hard white parts in your mouth used for biting and chewing' },
  brush: { pos: 'Verb', definition: 'To clean or tidy something using a brush' },
  arms: { pos: 'Noun', definition: 'The two upper limbs of the human body, from shoulder to hand' },
  arm: { pos: 'Noun', definition: 'One of the upper limbs of the human body, from shoulder to hand' },
  ethical: { pos: 'Adjective', definition: 'Relating to moral principles of right and wrong' },
  ethics: { pos: 'Noun', definition: 'Moral principles that guide behavior' },
  ensuring: { pos: 'Verb', definition: 'Making certain that something will happen or be true' },
  ensure: { pos: 'Verb', definition: 'To make certain that something will happen or be true' },
  progress: { pos: 'Noun', definition: 'Forward movement toward a goal; improvement or development' },
  decision: { pos: 'Noun', definition: 'A choice made after thinking about possibilities' },
  robust: { pos: 'Adjective', definition: 'Strong, healthy, and able to withstand difficult conditions' },
  systems: { pos: 'Noun', definition: 'Sets of connected parts that work together as a whole' },
  system: { pos: 'Noun', definition: 'A set of connected parts that work together as a whole' },
  economic: { pos: 'Adjective', definition: 'Related to money, trade, and the economy' },
  economy: { pos: 'Noun', definition: 'The system of money, trade, and industry in a country' },
  consequences: { pos: 'Noun', definition: 'Results or effects that follow from an action or situation' },
  consequence: { pos: 'Noun', definition: 'A result or effect that follows from an action or situation' },
  innovation: { pos: 'Noun', definition: 'A new idea, method, or product; the act of introducing something new' },
  technological: { pos: 'Adjective', definition: 'Related to scientific and industrial technology' },
  algorithmic: { pos: 'Adjective', definition: 'Related to step-by-step procedures used by computers' },
  breakfast: { pos: 'Noun', definition: 'The first meal of the day' },
  morning: { pos: 'Noun', definition: 'The early part of the day, before noon' },
  book: { pos: 'Noun', definition: 'A set of printed pages bound together to read' },
  water: { pos: 'Noun', definition: 'The clear liquid that falls as rain and fills rivers and lakes' },
  face: { pos: 'Noun', definition: 'The front part of the head, including eyes, nose, and mouth' },
  eyes: { pos: 'Noun', definition: 'The organs in your face that you see with' },
  eye: { pos: 'Noun', definition: 'The organ in your face that you see with' },
  bread: { pos: 'Noun', definition: 'A common food made from flour and baked' },
  cold: { pos: 'Adjective', definition: 'Having a low temperature; not warm' },
  small: { pos: 'Adjective', definition: 'Little in size or amount' },
  open: { pos: 'Verb', definition: 'To move something so that it is no longer closed' },
  read: { pos: 'Verb', definition: 'To look at and understand written words' },
  workers: { pos: 'Noun', definition: 'People who do a job, especially for pay' },
  worker: { pos: 'Noun', definition: 'A person who does a job, especially for pay' },
  nation: { pos: 'Noun', definition: 'A country and its people' },
  nations: { pos: 'Noun', definition: 'Countries and their people' },
  rights: { pos: 'Noun', definition: 'Legal or moral freedoms and protections people are entitled to' },
  right: { pos: 'Noun', definition: 'A legal or moral freedom someone is entitled to' },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function norm(w) {
  return String(w).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function capitalizeLemma(s) {
  const t = String(s).trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function stripPossessive(tok) {
  return tok.replace(/'s$/i, '').replace(/'$/, '').replace(/'$/, '');
}

function textTokens(text) {
  const lower = text.toLowerCase();
  const raw = lower.split(/[^a-z0-9']+/).filter(Boolean);
  const tokens = new Set();
  for (const t of raw) {
    const s = stripPossessive(t);
    if (s) tokens.add(s);
    tokens.add(t);
  }
  return { lower, tokens };
}

function inflections(base) {
  const forms = new Set([
    base, base + 's', base + 'es', base + 'ed', base + 'd', base + 'ing',
    base + 'er', base + 'est', base + 'ers',
  ]);
  if (/[^aeiou]y$/.test(base)) {
    forms.add(base.slice(0, -1) + 'ies');
    forms.add(base.slice(0, -1) + 'ied');
    forms.add(base.slice(0, -1) + 'ier');
    forms.add(base.slice(0, -1) + 'iest');
  }
  if (base.endsWith('e')) {
    const noE = base.slice(0, -1);
    forms.add(noE + 'ing');
    forms.add(noE + 'ed');
    forms.add(noE + 'er');
    forms.add(noE + 'est');
  }
  if (/[b-df-hj-np-tv-z][aeiou][b-df-hj-np-tv-z]$/.test(base) && !base.endsWith('s')) {
    forms.add(base + base.slice(-1) + 'ing');
    forms.add(base + base.slice(-1) + 'ed');
  }
  if (base.endsWith('ies')) forms.add(base.slice(0, -3) + 'y');
  if (base.endsWith('s') && base.length > 3 && !base.endsWith('ss')) forms.add(base.slice(0, -1));
  if (base.endsWith('es') && base.length > 4) forms.add(base.slice(0, -2));
  if (base.endsWith('ing') && base.length > 5) {
    forms.add(base.slice(0, -3));
    forms.add(base.slice(0, -3) + 'e');
  }
  if (base.endsWith('ed') && base.length > 4) {
    forms.add(base.slice(0, -2));
    forms.add(base.slice(0, -1));
  }
  return forms;
}

function wordInText(word, text) {
  const w = norm(word);
  if (!w) return true;
  const { lower, tokens } = textTokens(text);
  const phrase = w.split(' ').filter(Boolean);
  if (phrase.length > 1) {
    if (lower.includes(phrase.join(' '))) return true;
    return phrase.every((tok) => tokenPresent(tok, tokens));
  }
  return tokenPresent(phrase[0], tokens);
}

function tokenPresent(token, tokens) {
  if (tokens.has(token)) return true;
  for (const f of inflections(token)) if (tokens.has(f)) return true;
  return false;
}

function tokenize(text) {
  return [...textTokens(text).tokens].filter((t) => /^[a-z]+$/.test(t));
}

function extractPhrasal(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (STOP.has(a) || TOO_COMMON.has(a)) continue;
    if (a.length < 3 || a.length > 12) continue;
    if (PARTICLES.has(b)) out.push(`${a} ${b}`);
  }
  return out;
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf8');
}

function scoreSense(def, pos) {
  let s = 0;
  const d = def.toLowerCase();
  if (/slang|obsolete|archaic|dated|vulgar|offensive/.test(d)) s -= 20;
  if (/cannabis|marijuana|euphoric|illicit|narcotic|heroin|cocaine/.test(d)) s -= 30;
  if (/prescription of a physician|ethical drug/.test(d)) s -= 25;
  if (/heraldry|alchemy|anatomy rare|dialect/.test(d)) s -= 15;
  if (def.length > 180) s -= 4;
  if (def.length > 120) s -= 2;
  if (def.length <= 90) s += 3;
  if (def.length <= 60) s += 2;
  if (['Noun', 'Verb', 'Adjective', 'Adverb'].includes(pos)) s += 2;
  if (pos === 'Noun') s += 1;
  return s;
}

function pickBestSense(meanings, preferPhrasal) {
  let best = null;
  let bestScore = -Infinity;
  for (const m of meanings) {
    for (const d of m.definitions || []) {
      const def = d?.definition;
      if (!def) continue;
      let pos = POS_MAP[m.partOfSpeech] || capitalizeLemma(m.partOfSpeech || 'Noun');
      if (preferPhrasal) pos = 'Phrasal verb';
      const cleaned = def.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
      const sc = scoreSense(cleaned, preferPhrasal ? 'Verb' : pos);
      if (sc > bestScore) {
        bestScore = sc;
        best = { pos, definition: cleaned };
      }
    }
  }
  if (bestScore < -10) return null;
  return best;
}

async function fetchDefinition(rawWord, cache) {
  const key = norm(rawWord).replace(/\s+/g, ' ');
  if (!key) return null;
  if (LEARNER_DEFS[key]) return LEARNER_DEFS[key];
  if (Object.prototype.hasOwnProperty.call(cache, key) && cache[key]?._v === 2) {
    return cache[key].data;
  }

  const candidates = key.includes(' ') ? [key, key.split(' ')[0]] : [key];
  let result = null;

  for (const q of candidates) {
    if (LEARNER_DEFS[q]) {
      result = key.includes(' ')
        ? { pos: 'Phrasal verb', definition: LEARNER_DEFS[q].definition }
        : LEARNER_DEFS[q];
      break;
    }
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
    let attempt = 0;
    while (attempt < 4) {
      try {
        const res = await fetch(url);
        if (res.status === 404) break;
        if (!res.ok) throw new Error(`dict ${res.status}`);
        const data = await res.json();
        const meanings = data?.[0]?.meanings || [];
        result = pickBestSense(meanings, key.includes(' '));
        break;
      } catch {
        attempt++;
        await sleep(200 * attempt);
      }
    }
    if (result) break;
  }

  cache[key] = { _v: 2, data: result };
  return result;
}

function formatEntry(word, defObj) {
  const display = capitalizeLemma(word);
  const key = norm(word);
  const override = LEARNER_DEFS[key];
  const used = override || defObj;
  if (!used) {
    return {
      word: display,
      definition: `(Noun) A useful word from this passage meaning "${word.toLowerCase()}".`,
    };
  }
  let pos = used.pos;
  if (key.includes(' ') && pos === 'Verb') pos = 'Phrasal verb';
  const def = used.definition.endsWith('.') ? used.definition : used.definition + '.';
  return { word: display, definition: `(${pos}) ${def}` };
}

function buildDocFreq(en) {
  const df = new Map();
  let docs = 0;
  for (const level of Object.keys(en)) {
    for (const p of en[level]) {
      docs++;
      const seen = new Set(tokenize(p.text));
      for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
    }
  }
  return { df, docs };
}

function scoreCandidate(word, level, df, docs, tf) {
  const n = norm(word);
  const parts = n.split(' ');
  const base = parts[0];
  const isPhrase = parts.length > 1;
  const d = df.get(base) || 1;
  const idf = Math.log((docs + 1) / d);
  const len = base.length;
  let score = idf * 2 + Math.min(tf, 3) * 0.5;

  if (isPhrase) score += 2.5;
  if (STOP.has(base)) return -100;

  if (level === 'Beginner') {
    if (len >= 3 && len <= 9) score += 2;
    if (len > 12) score -= 2;
    if (d > docs * 0.35) score -= 1;
    if (TOO_COMMON.has(base)) score -= 3;
  } else if (level === 'Elementary') {
    if (len >= 4 && len <= 10) score += 1.5;
    if (TOO_COMMON.has(base)) score -= 4;
  } else if (level === 'Pre-Intermediate') {
    if (len >= 5) score += 1.5;
    if (TOO_COMMON.has(base)) score -= 5;
    if (d < docs * 0.15) score += 1;
  } else if (level === 'Intermediate') {
    if (len >= 6) score += 2;
    if (TOO_COMMON.has(base)) score -= 6;
    score += idf;
  } else {
    if (len >= 7) score += 3;
    if (TOO_COMMON.has(base)) score -= 8;
    score += idf * 1.5;
    if (d > docs * 0.2) score -= 2;
  }

  return score;
}

function collectCandidates(text, level, existingKeys, df, docs) {
  const tokens = tokenize(text);
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

  // Preserve sequential tokens for phrasal extraction from raw text
  const seq = (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [])
    .map(stripPossessive)
    .filter(Boolean);

  const candidates = new Map();

  for (const ph of extractPhrasal(seq)) {
    const key = norm(ph);
    if (existingKeys.has(key) || STOP.has(key.split(' ')[0])) continue;
    if (!wordInText(ph, text)) continue;
    const sc = scoreCandidate(ph, level, df, docs, 1);
    if (!candidates.has(key) || candidates.get(key).score < sc) {
      candidates.set(key, { word: ph, score: sc });
    }
  }

  for (const [tok, count] of tf) {
    if (STOP.has(tok)) continue;
    if (tok.length < 3) continue;
    if (existingKeys.has(tok)) continue;
    if (level !== 'Beginner' && TOO_COMMON.has(tok)) continue;
    if (level === 'Beginner' && TOO_COMMON.has(tok) && count < 2) continue;
    if (level === 'Advanced' && tok.length < 5) continue;
    if (level === 'Intermediate' && tok.length < 4) continue;

    const sc = scoreCandidate(tok, level, df, docs, count);
    if (sc < -50) continue;
    if (!candidates.has(tok) || candidates.get(tok).score < sc) {
      candidates.set(tok, { word: tok, score: sc });
    }
  }

  return [...candidates.values()].sort((a, b) => b.score - a.score);
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function polishExistingDefinition(word, definition) {
  const key = norm(word);
  if (LEARNER_DEFS[key]) {
    const o = LEARNER_DEFS[key];
    const def = o.definition.endsWith('.') ? o.definition : o.definition + '.';
    return `(${o.pos}) ${def}`;
  }
  return definition;
}

async function main() {
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const cache = loadCache();
  const { df, docs } = buildDocFreq(en);

  const before = {};
  for (const level of Object.keys(en)) {
    const counts = en[level].map((p) => (p.vocabulary || []).length);
    before[level] = {
      avg: +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2),
      min: Math.min(...counts),
      max: Math.max(...counts),
    };
  }
  console.log('BEFORE', JSON.stringify(before, null, 2));

  const prefetch = new Set();
  for (const level of Object.keys(en)) {
    const tgt = TARGET[level];
    for (const p of en[level]) {
      const existing = (p.vocabulary || []).filter((v) => wordInText(v.word, p.text));
      const existingKeys = new Set(existing.map((v) => norm(v.word)));
      const cands = collectCandidates(p.text, level, existingKeys, df, docs);
      const need = Math.max(tgt.max - existing.length + 6, 8);
      for (const c of cands.slice(0, need)) prefetch.add(norm(c.word));
    }
  }

  // Re-score any old cache entries lacking _v:2
  const prefList = [...prefetch];
  console.log('Prefetching/refreshing definitions for', prefList.length, 'unique forms...');
  let done = 0;
  // Migrate legacy cache entries; only refetch low-quality senses
  for (const [k, v] of Object.entries(cache)) {
    if (v && !v._v && v.pos && v.definition) {
      cache[k] = { _v: 2, data: { pos: v.pos, definition: v.definition } };
    }
  }

  await mapPool(prefList, 16, async (w) => {
    if (LEARNER_DEFS[w]) {
      done++;
      return;
    }
    const cached = cache[w];
    const data = cached?._v === 2 ? cached.data : null;
    if (data && scoreSense(data.definition, data.pos) >= 0) {
      done++;
      return;
    }
    delete cache[w];
    await fetchDefinition(w, cache);
    done++;
    if (done % 250 === 0) {
      saveCache(cache);
      console.log(`  dict ${done}/${prefList.length}`);
    }
  });
  saveCache(cache);
  console.log('Dictionary cache ready.');

  for (const level of Object.keys(en)) {
    const tgt = TARGET[level];
    for (const p of en[level]) {
      const kept = [];
      const seen = new Set();
      for (const v of p.vocabulary || []) {
        if (!wordInText(v.word, p.text)) continue;
        const key = norm(v.word);
        if (seen.has(key) || STOP.has(key)) continue;
        seen.add(key);
        kept.push({
          word: capitalizeLemma(v.word),
          definition: polishExistingDefinition(v.word, v.definition),
        });
      }

      const cands = collectCandidates(p.text, level, seen, df, docs);
      for (const c of cands) {
        if (kept.length >= tgt.ideal) break;
        const key = norm(c.word);
        if (seen.has(key)) continue;
        const defObj = await fetchDefinition(c.word, cache);
        if (!defObj) continue;
        // Reject still-bad senses
        if (scoreSense(defObj.definition, defObj.pos) < -10 && !LEARNER_DEFS[key]) continue;
        seen.add(key);
        kept.push(formatEntry(c.word, defObj));
      }

      if (kept.length < tgt.min) {
        for (const c of cands) {
          if (kept.length >= tgt.min) break;
          const key = norm(c.word);
          if (seen.has(key)) continue;
          const defObj = await fetchDefinition(c.word, cache);
          if (!defObj && !LEARNER_DEFS[key]) continue;
          seen.add(key);
          kept.push(formatEntry(c.word, defObj));
        }
      }

      p.vocabulary = kept.slice(0, tgt.max);
    }
    const counts = en[level].map((p) => (p.vocabulary || []).length);
    console.log(
      level,
      'avg',
      (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2),
      'min',
      Math.min(...counts),
      'max',
      Math.max(...counts),
    );
  }

  saveCache(cache);
  fs.writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + '\n', 'utf8');

  let problems = 0;
  for (const level of Object.keys(en)) {
    for (const p of en[level]) {
      for (const v of p.vocabulary || []) {
        if (!wordInText(v.word, p.text)) {
          problems++;
          console.log(`MISSING ${level} ${p.id}: ${v.word}`);
        }
      }
    }
  }
  console.log('Presence problems:', problems);

  const after = {};
  for (const level of Object.keys(en)) {
    const counts = en[level].map((p) => (p.vocabulary || []).length);
    after[level] = {
      avg: +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2),
      min: Math.min(...counts),
      max: Math.max(...counts),
    };
  }
  console.log('AFTER', JSON.stringify(after, null, 2));
  console.log('Wrote', EN_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

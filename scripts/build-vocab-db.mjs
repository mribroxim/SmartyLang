/**
 * Build the predetermined semantic vocabulary database from the 29 aligned
 * language packs. English is the join axis only — every language is a peer
 * in the output shards.
 *
 * Usage:
 *   node scripts/build-vocab-db.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'vocab');
const PATCH_PATH = path.join(__dirname, 'vocab-patches.json');
const REPORT_PATH = path.join(ROOT, 'vocab-report.json');

const LANGS = [
  'en', 'ru', 'tl', 'es', 'uz', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh',
  'ar', 'tr', 'nl', 'hi', 'pl', 'sv', 'id', 'ms', 'vi', 'th', 'uk', 'el',
  'cs', 'ro', 'fa', 'ur', 'sw',
];

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const CEFR = {
  Beginner: 'A1',
  Elementary: 'A2',
  'Pre-Intermediate': 'B1',
  Intermediate: 'B2',
  Advanced: 'C1',
};

const MERGE_THRESHOLD = 0.52;

const GARBAGE_RE = [
  /^\*?\s*see\s+p\.?\s*\d+/i,
  /^\*?\s*see\s+(page|pages|above|below|entry|note)\b/i,
  /mymemory\s*warning/i,
  /invalid\s*language\s*pair/i,
  /^https?:\/\//i,
  /^n\/?a$/i,
  /^null$/i,
  /^undefined$/i,
];


function packPath(lang) {
  return lang === 'en'
    ? path.join(ROOT, 'public', 'level-texts.json')
    : path.join(ROOT, 'public', 'data', 'lang-packs', lang, 'level-texts.json');
}

function loadPack(lang) {
  const p = packPath(lang);
  if (!fs.existsSync(p)) throw new Error(`Missing pack: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function extractPos(definition) {
  const m = String(definition || '').match(/^\(([^)]{1,40})\)\s*/);
  if (!m) return 'unknown';
  const raw = m[1].toLowerCase().trim();
  if (/phrasal/.test(raw)) return 'phrasal verb';
  if (/noun|существитель|ot|ism|substantiv|nom|nomen|名詞|명사|名词|اسم/.test(raw)) return 'noun';
  if (/verb|глагол|fe['’]?l|동사|動詞|动词|فعل/.test(raw)) return 'verb';
  if (/adj|прилаг|sifat|형용사|形容/.test(raw)) return 'adjective';
  if (/adv|нареч|zarf|부사|副詞/.test(raw)) return 'adverb';
  if (/prep|предлог/.test(raw)) return 'preposition';
  if (/conj|союз/.test(raw)) return 'conjunction';
  if (/pron|местоим/.test(raw)) return 'pronoun';
  if (/interj|восклиц/.test(raw)) return 'interjection';
  if (/det|article|артикл/.test(raw)) return 'determiner';
  return raw.slice(0, 24);
}

function stripPos(definition) {
  const text = String(definition || '');
  const match = text.match(/^\(([^)]{0,40})\)\s*/u);
  const raw = match?.[1]?.toLowerCase().trim() || '';
  const isPos = /^(?:phrase|phrasal\s+verb|verb|noun|adjective|adverb|preposition|conjunction|pronoun|interjection|determiner)$/.test(raw)
    || /noun|существитель|ot|ism|substantiv|nom|nomen|名詞|명사|名词|اسم|verb|глагол|fe['’]?l|동사|動詞|动词|فعل|adj|прилаг|sifat|형용사|形容|adv|нареч|zarf|부사|副詞|prep|предлог|conj|союз|pron|местоим|interj|восклиц|det|article|артикл/.test(raw);
  return (isPos && match ? text.slice(match[0].length) : text)
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLemma(word) {
  return String(word || '')
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ');
}

function tokenizeDef(text) {
  return stripPos(text)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function cosine(a, b) {
  if (!a.length || !b.length) return 0;
  const fa = new Map();
  const fb = new Map();
  for (const t of a) fa.set(t, (fa.get(t) || 0) + 1);
  for (const t of b) fb.set(t, (fb.get(t) || 0) + 1);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [t, n] of fa) {
    na += n * n;
    if (fb.has(t)) dot += n * fb.get(t);
  }
  for (const n of fb.values()) nb += n * n;
  if (!na || !nb) return 0;
  return dot / Math.sqrt(na * nb);
}

function isGarbage(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  if (t.length > 400) return true;
  return GARBAGE_RE.some((re) => re.test(t));
}

function flattenPack(pack) {
  const slots = [];
  for (const level of LEVELS) {
    const texts = pack[level] || [];
    for (const text of texts) {
      const vocab = Array.isArray(text.vocabulary) ? text.vocabulary : [];
      vocab.forEach((v, i) => {
        slots.push({
          level,
          passageId: text.id,
          index: i,
          word: v?.word || '',
          definition: v?.definition || '',
        });
      });
    }
  }
  return slots;
}

/** Native uz pack has fewer vocab rows; pad/realign to EN passageId#index order. */
function realignSlotsToEn(enSlots, otherSlots) {
  const map = new Map(otherSlots.map((s) => [`${s.passageId}#${s.index}`, s]));
  return enSlots.map((en) => {
    const hit = map.get(`${en.passageId}#${en.index}`);
    return hit
      ? { ...hit, level: en.level, passageId: en.passageId, index: en.index }
      : { level: en.level, passageId: en.passageId, index: en.index, word: '', definition: '' };
  });
}

function assertAlignment(packs) {
  const en = packs.en;
  const mismatches = [];
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    let other = packs[lang];
    if (lang === 'uz' && en.length !== other.length) {
      packs[lang] = realignSlotsToEn(en, other);
      other = packs[lang];
      console.log(`[vocab] uz realigned ${other.filter((s) => s.word).length}/${en.length} slots`);
    }
    if (en.length !== other.length) {
      mismatches.push({ lang, reason: `slot count ${other.length} != en ${en.length}` });
      continue;
    }
    for (let i = 0; i < en.length; i++) {
      if (en[i].passageId !== other[i].passageId || en[i].index !== other[i].index) {
        mismatches.push({
          lang,
          slot: i,
          reason: `passage ${other[i].passageId}#${other[i].index} != ${en[i].passageId}#${en[i].index}`,
        });
        if (mismatches.length > 40) return mismatches;
      }
    }
  }
  return mismatches;
}

function mergeSenses(enSlots) {
  const buckets = new Map();
  const senses = [];
  for (let i = 0; i < enSlots.length; i++) {
    const slot = enSlots[i];
    const lemma = normalizeLemma(slot.word);
    const pos = extractPos(slot.definition);
    const tokens = tokenizeDef(slot.definition);
    const key = `${lemma}|${pos}`;
    const bucket = buckets.get(key) || [];
    let matched = null;
    let best = 0;
    for (const sense of bucket) {
      const sim = cosine(tokens, sense.tokens);
      if (sim >= MERGE_THRESHOLD && sim > best) {
        best = sim;
        matched = sense;
      }
    }
    if (matched) {
      matched.src.push(`${slot.passageId}#${slot.index}`);
      matched.slotIndexes.push(i);
      if (tokens.length > matched.tokens.length) matched.tokens = tokens;
      const cefr = CEFR[slot.level];
      if (cefr && (!matched.cefr || cefr < matched.cefr)) matched.cefr = cefr;
    } else {
      const sense = {
        lemma,
        pos,
        tokens,
        src: [`${slot.passageId}#${slot.index}`],
        slotIndexes: [i],
        cefr: CEFR[slot.level] || 'A1',
        primarySlot: i,
      };
      bucket.push(sense);
      buckets.set(key, bucket);
      senses.push(sense);
    }
  }
  return senses;
}

function applyPatches(index, shards) {
  if (!fs.existsSync(PATCH_PATH)) return { applied: 0 };
  let patch;
  try {
    patch = JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8'));
  } catch {
    return { applied: 0, error: 'invalid vocab-patches.json' };
  }
  let applied = 0;
  for (const [id, data] of Object.entries(patch.senses || {})) {
    if (data.pos) {
      index.senses[id] = { ...(index.senses[id] || {}), pos: data.pos };
    }
    if (data.cefr) index.senses[id] = { ...(index.senses[id] || {}), cefr: data.cefr };
    for (const [lang, entry] of Object.entries(data.langs || {})) {
      if (!shards[lang]) continue;
      shards[lang][id] = {
        w: entry.w ?? shards[lang][id]?.w ?? '',
        d: entry.d ?? shards[lang][id]?.d ?? '',
      };
      applied++;
    }
  }
  for (const neu of patch.newSenses || []) {
    const id = neu.id;
    if (!id || index.senses[id]) continue;
    index.senses[id] = {
      pos: neu.pos || 'unknown',
      cefr: neu.cefr || '',
      src: neu.src || ['patch'],
    };
    for (const [lang, entry] of Object.entries(neu.langs || {})) {
      if (!shards[lang]) continue;
      shards[lang][id] = { w: entry.w || '', d: entry.d || '' };
    }
    applied++;
  }
  return { applied };
}

function latinRatio(text) {
  const letters = String(text || '').replace(/[^A-Za-z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g, '');
  if (!letters) return 0;
  const latin = (letters.match(/[A-Za-z]/g) || []).length;
  return latin / letters.length;
}


function main() {
  console.log('[vocab] loading 29 language packs…');
  const packs = {};
  for (const lang of LANGS) packs[lang] = flattenPack(loadPack(lang));
  const mismatches = assertAlignment(packs);
  if (mismatches.length) {
    console.error('[vocab] ALIGNMENT FAILED');
    fs.writeFileSync(REPORT_PATH, JSON.stringify({ ok: false, mismatches }, null, 2));
    throw new Error(`${mismatches.length} alignment mismatches — see vocab-report.json`);
  }
  console.log(`[vocab] alignment ok — ${packs.en.length} slots`);

  const merged = mergeSenses(packs.en);
  console.log(`[vocab] ${merged.length} distinct senses (from ${packs.en.length} slots)`);

  const index = { version: 'v1', generatedAt: new Date().toISOString(), slotCount: packs.en.length, senseCount: 0, senses: {} };
  const shards = Object.fromEntries(LANGS.map((l) => [l, {}]));

  merged.forEach((sense, n) => {
    const id = `s${String(n + 1).padStart(5, '0')}`;
    const slot = packs.en[sense.primarySlot];
    index.senses[id] = {
      pos: sense.pos,
      cefr: sense.cefr,
      src: sense.src,
    };
    for (const lang of LANGS) {
      const s = packs[lang][sense.primarySlot];
      shards[lang][id] = {
        w: String(s?.word || '').trim(),
        d: stripPos(s?.definition || ''),
      };
    }
    void slot;
  });
  index.senseCount = Object.keys(index.senses).length;

  const patchResult = applyPatches(index, shards);
  if (patchResult.applied) console.log(`[vocab] applied ${patchResult.applied} patch fields`);

  const missingLang = [];
  const leftovers = [];
  const garbage = [];
  for (const id of Object.keys(index.senses)) {
    const enDef = shards.en[id]?.d || '';
    const enWord = shards.en[id]?.w || '';
    for (const lang of LANGS) {
      const entry = shards[lang][id];
      if (!entry?.w || !entry?.d) {
        missingLang.push({ id, lang, word: entry?.w || '', def: entry?.d || '' });
        continue;
      }
      if (isGarbage(entry.d)) garbage.push({ id, lang, def: entry.d });
      if (lang !== 'en') {
        const sameDef = entry.d.trim().toLocaleLowerCase() === enDef.trim().toLocaleLowerCase();
        const sameWord = normalizeLemma(entry.w) === normalizeLemma(enWord);
        const leftoverLatin = !['es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'id', 'ms', 'pl', 'cs', 'ro', 'tl', 'sw', 'tr', 'uz'].includes(lang)
          && latinRatio(entry.d) > 0.85
          && /[а-яα-ω一-龥가-힣а-яё]/i.test('') === false
          && ['ru', 'uk', 'el', 'ar', 'fa', 'ur', 'hi', 'th', 'ja', 'ko', 'zh'].includes(lang)
          && latinRatio(entry.d) > 0.7;
        if (sameDef || leftoverLatin) {
          leftovers.push({ id, lang, word: entry.w, def: entry.d, enWord, enDef });
        } else if (sameWord && sameDef) {
          leftovers.push({ id, lang, word: entry.w, def: entry.d, enWord, enDef });
        }
      }
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  const indexOut = { version: index.version, generatedAt: index.generatedAt, slotCount: index.slotCount, senseCount: index.senseCount, senses: {} };
  for (const [id, meta] of Object.entries(index.senses)) {
    indexOut.senses[id] = { pos: meta.pos, cefr: meta.cefr, src: meta.src };
  }

  return { indexOut, shards, missingLang, leftovers, garbage, mismatches, mergedCount: merged.length };
}

const built = main();

const { indexOut, shards, missingLang, leftovers, garbage } = built;

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(indexOut));
for (const lang of LANGS) {
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify(shards[lang]));
}

const leftoverCap = leftovers.slice(0, 400);
const garbageCap = garbage.slice(0, 200);
const missingCap = missingLang.slice(0, 200);

const report = {
  ok: missingLang.length === 0,
  generatedAt: indexOut.generatedAt,
  slotCount: indexOut.slotCount,
  senseCount: indexOut.senseCount,
  alignmentMismatches: 0,
  missingLanguageEntries: missingLang.length,
  leftoverLikelyUntranslated: leftovers.length,
  garbageDefinitions: garbage.length,
  missingSample: missingCap,
  leftoverSample: leftoverCap,
  garbageSample: garbageCap,
  shardBytes: Object.fromEntries(
    LANGS.map((l) => [l, fs.statSync(path.join(OUT, `${l}.json`)).size]),
  ),
  indexBytes: fs.statSync(path.join(OUT, 'index.json')).size,
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`[vocab] wrote ${indexOut.senseCount} senses → public/data/vocab/`);
console.log(`[vocab] report: missing=${report.missingLanguageEntries} leftovers=${report.leftoverLikelyUntranslated} garbage=${report.garbageDefinitions}`);
console.log(`[vocab] index ${report.indexBytes} bytes; en shard ${report.shardBytes.en} bytes`);

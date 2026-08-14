/**
 * Literary polish for L2 lang packs (OpenRouter).
 * Preserves JSON structure/IDs. Polishes learner-facing prose only.
 *
 * Usage:
 *   node scripts/polish-literary-packs.mjs --lang=ar
 *   node scripts/polish-literary-packs.mjs --lang=tr --only=speaking,writing,dictation
 *   node scripts/polish-literary-packs.mjs --lang=el --force
 *
 * Checkpoint: public/data/lang-packs/{lang}/.polish-checkpoint.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

const API_KEY =
  process.env.VITE_OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  '';
let MODEL = process.env.POLISH_MODEL || process.env.SEED_TRANSLATE_MODEL || 'google/gemini-2.5-flash-lite';
const FREE_MODELS = (
  process.env.POLISH_FREE_MODELS ||
  'google/gemma-3-27b-it:free,meta-llama/llama-3.3-70b-instruct:free,qwen/qwen3-8b:free,mistralai/mistral-small-3.1-24b-instruct:free'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
let MAX_TOKENS = Number(process.env.POLISH_MAX_TOKENS || 1800);
let affordCap = MAX_TOKENS;
const CONCURRENCY = Number(process.env.POLISH_CONCURRENCY || 2);
const FORCE = process.argv.includes('--force');

const LANG_ARG = (process.argv.find((a) => a.startsWith('--lang=')) || '').slice(7);
const ONLY = (() => {
  const eq = process.argv.find((x) => x.startsWith('--only='));
  if (!eq) return null;
  return eq.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
})();

const LANG_META = {
  ar: {
    name: 'Modern Standard Arabic (فصحى معاصرة، أدبية، سليمة)',
    endonym: 'العربية',
    notes:
      'Use correct Arabic orthography and diacritics sparingly (hamza, tāʾ marbūṭa). RTL-safe plain strings only — no LTR marks needed. Prefer natural MSA over calqued English syntax. Avoid Egyptian colloquial unless the source is clearly spoken-register.',
  },
  fa: {
    name: 'Persian (Farsi) — ادبی و روان',
    endonym: 'فارسی',
    notes:
      'Use Persian script and natural Persian word order. Prefer فارسی واژه‌ها over heavy Arabic calques when Persian has a clear native choice. Fix broken ezāfe and awkward MT phrasing.',
  },
  ur: {
    name: 'Urdu — ادبی اور درست',
    endonym: 'اردو',
    notes:
      'Use Nastaliq-friendly Urdu orthography (Arabic script). Replace leftover Latin technical titles with Urdu where a standard term exists (keep rare proper nouns). Natural Indo-Persian register, not Hindi-in-Urdu-script calques.',
  },
  hi: {
    name: 'Hindi — साहित्यिक और स्वाभाविक',
    endonym: 'हिन्दी',
    notes:
      'Devanagari only for learner prose. Prefer natural Hindi; avoid unnecessary English code-mixing except established proper nouns. Correct postpositions and gender agreement.',
  },
  tr: {
    name: 'Turkish — doğal, edebi, ekleri doğru',
    endonym: 'Türkçe',
    notes:
      'Fix agglutination/vowel harmony errors and English calques (e.g. “X hissediyorum” word order). Prefer natural Turkish clause structure.',
  },
  uz: {
    name: 'Oʻzbek tili — adabiy, tabiiy',
    endonym: "oʻzbek tili",
    notes:
      'Latin Uzbek with correct oʻ/gʻ apostrophes (prefer ʻ / ʼ forms consistently as already used in the pack). Fix nonsensical MT compounds. Natural word order.',
  },
  sw: {
    name: 'Kiswahili — fasihi, sahihi, asilia',
    endonym: 'Kiswahili',
    notes:
      'Correct noun-class agreement (ki/vi, m/wa, etc.). Fix interrogatives (jina … ni nini, not nani). Natural East African standard Swahili.',
  },
  el: {
    name: 'Ελληνικά — λογοτεχνικά, φυσικά',
    endonym: 'ελληνικά',
    notes:
      'Correct Modern Greek morphology, articles, and agreement. No leftover English sentences. Natural word order; avoid calques.',
  },
  th: {
    name: 'ภาษาไทย — วรรณศิลป์ ลื่นไหล เป็นธรรมชาติ',
    endonym: 'ภาษาไทย',
    notes:
      'Use correct Thai orthography, spacing between clauses where natural, classifiers (ตัว/คน/อัน/เล่ม etc.), and particles (ครับ/ค่ะ only if source is spoken-register; prefer neutral prose for reading passages). Fix stiff MT calques, wrong word order, and leftover English titles/sentences. Self-reference: ภาษาไทย not ภาษาอังกฤษ/English when meaning the learning language. Keep factual IELTS topics about English-as-subject or England.',
  },
  ja: {
    name: '日本語 — 文学的で自然な現代日本語',
    endonym: '日本語',
    notes:
      'Natural literary Japanese with correct particles (は/が/を/に/で). Keep です/ます or plain style consistent with CEFR level. Fix MT calques (ラウンド→丸い, 文字列→ひも, nonsense katakana). No leftover English. SELF-REF: 日本語 — never instruct learners to practice English/英語 when meaning the learning language; factual IELTS-style English-as-topic may stay.',
  },
  vi: {
    name: 'tiếng Việt — tự nhiên, trôi chảy, văn chương vừa phải',
    endonym: 'tiếng Việt',
    notes:
      'Correct Vietnamese tone marks and natural phrasing. Fix English calques and stiff MT. Match register to CEFR level. No leftover English sentences. SELF-REF: tiếng Việt — not tiếng Anh/English when instructing the learner’s practice language; factual IELTS topics ABOUT English may remain.',
  },
  zh: {
    name: '中文（简体）— 自然、通顺、有文学性',
    endonym: '中文',
    notes:
      'Natural Simplified Chinese. Fix stiff MT, awkward 的/地/得, English calques, and choppy clause chains. Match register to CEFR level (Beginner plain; Advanced more literary). No leftover English sentences. SELF-REF: 中文 — not 英语/英文 when instructing the learner’s practice language; factual IELTS topics ABOUT English may remain.',
  },
  ko: {
    name: '한국어 — 문학적이고 자연스러운 현대 한국어',
    endonym: '한국어',
    notes:
      'Natural Korean with correct particles (은/는/이/가/을/를/에/에서). Appropriate honorifics for prompts. Fix calques (나는 고양이가 있다 → 나는 고양이를 키운다 / 나에게는 고양이가 있다). No leftover English. SELF-REF: 한국어 — never instruct learners to practice English/영어 when meaning the learning language; factual IELTS-style English-as-topic may stay.',
  },
  id: {
    name: 'bahasa Indonesia — fasih, alami, sastra ringan',
    endonym: 'bahasa Indonesia',
    notes:
      'Fluent Indonesian (NOT Malay). Natural aku/saya by register (beginner personal narratives may use aku; formal essays saya). Fix Malay mix-ups (universiti→universitas, aktiviti→aktivitas, automatik→otomatis, kritikal→kritis where Indonesian prefers it, pejabat→kantor when meaning office). Natural word order; no leftover English sentences. SELF-REF endonym is bahasa Indonesia — not bahasa Inggris/English when instructing the practice language. Keep factual mentions of English as loanword source or IELTS topic ABOUT English.',
  },
  ms: {
    name: 'bahasa Melayu — fasih, standard Malaysia',
    endonym: 'bahasa Melayu',
    notes:
      'Fluent Malay (NOT Indonesian). Correct Melayu spelling/lexicon: universiti, aktiviti, automatik, kritikal, pejabat (office), telefon, basuh, gosok gigi, berbeza (not berbeda). Prefer saya in instructional/formal; awak/anda by register. Keep DISTINCT from Indonesian wording. SELF-REF endonym is bahasa Melayu — not bahasa Inggeris/English when instructing the practice language. Factual IELTS topics about English-as-subject may stay.',
  },
  tl: {
    name: 'Tagalog/Filipino — likas, malinis, pampanitikan',
    endonym: 'Tagalog',
    notes:
      'Natural Tagalog/Filipino prose. Reduce unnecessary English code-switching when a Tagalog equivalent is natural (ini-stretch→iniuunat, magpa-practice→magsanay/magpraktis, naka-enroll→nakatala, growth mindset→mindset ng paglaki or pag-iisip ng pag-unlad, deliberate practice→sadyang pagsasanay, rush hour→oras ng pagsisikip). Fix awkward English calques and broken aspect/focus. SELF-REF endonym is Tagalog — not Ingles/English when instructing the practice language. Keep English only for factual topics about English/England.',
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function want(step) {
  return !ONLY || ONLY.includes(step);
}

function checkpointPath(lang) {
  return path.join(PACKS, lang, '.polish-checkpoint.json');
}

function loadCheckpoint(lang) {
  const p = checkpointPath(lang);
  if (FORCE || !fs.existsSync(p)) return { done: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { done: {} };
  }
}

function saveCheckpoint(lang, cp) {
  fs.writeFileSync(checkpointPath(lang), JSON.stringify(cp, null, 2) + '\n', 'utf8');
}

function isDone(cp, key) {
  return !!cp.done?.[key];
}

function markDone(cp, key) {
  cp.done = cp.done || {};
  cp.done[key] = true;
}

function estimateMaxTokens(items) {
  const chars = items.reduce((a, s) => a + String(s).length, 0);
  // ~1 token / 2 chars output headroom + JSON overhead; clamp to affordCap
  const need = Math.min(affordCap, Math.max(512, Math.ceil(chars * 0.7) + 256));
  return Math.min(MAX_TOKENS, need, affordCap);
}

async function polishBatch(lang, items, context) {
  if (!items.length) return [];
  if (!API_KEY) throw new Error('Missing OPENROUTER / VITE_OPENROUTER_API_KEY');
  const meta = LANG_META[lang];
  const system = `You are a senior literary editor for a language-learning app.
Polish each string into native literary ${meta.name}.

Rules:
- Return ONLY JSON: { "polished": string[] } same length and order as input.
- Preserve meaning and CEFR/level difficulty; do not simplify Advanced into Beginner.
- Fix machine-translation garbage, broken morphology, wrong word order, calques, nonsense compounds, and wrong-script leftovers.
- SELF-REFERENCE: learners study ${meta.endonym}, NOT English. Rewrite learning/speaking/studying English, English class/teacher/course/test, "in English", etc. to ${meta.endonym}. Keep English only when the text is factually about the English language, England, or English nationality.
- ${meta.notes}
- Keep proper names (Hasan, Tashkent, Bakhtiyor, ARPANET, etc.) unless a standard local form exists.
- Do not add commentary, numbering, or markdown.`;

  const user = `Context: ${context}\n\nPolish this JSON array into { "polished": [...] }:\n${JSON.stringify(items)}`;

  let attempt = 0;
  let freeIdx = -1;
  for (;;) {
    attempt++;
    const maxTok = estimateMaxTokens(items);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://smartyenglish.uz',
        'X-Title': 'Smarty literary polish',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTok,
        temperature: 0.25,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 402 || res.status === 404) {
        if (res.status === 402) {
          const m = t.match(/afford\s+(\d+)/i);
          if (m) {
            affordCap = Math.max(256, Number(m[1]) - 32);
            MAX_TOKENS = Math.min(MAX_TOKENS, affordCap);
            console.warn(`  ⚠ credit cap → max_tokens=${MAX_TOKENS} (afford ${m[1]})`);
          }
        }
        freeIdx++;
        if (freeIdx < FREE_MODELS.length) {
          MODEL = FREE_MODELS[freeIdx];
          console.warn(`  ⚠ switching model → ${MODEL}`);
          await sleep(500);
          continue;
        }
        // last resort: single-item with tiny budget
        if (items.length > 1 && res.status === 402) {
          const out = [];
          for (const one of items) {
            out.push(...(await polishBatch(lang, [one], context)));
            await sleep(120);
          }
          return out;
        }
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 8) {
        await sleep(1000 * attempt);
        continue;
      }
      throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 280)}`);
    }

    const data = await res.json();
    let raw = (data?.choices?.[0]?.message?.content || '').trim();
    if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('No JSON in polish response');
      parsed = { polished: JSON.parse(m[0]) };
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : parsed.polished || parsed.translations || parsed.items || Object.values(parsed)[0];

    if (!Array.isArray(arr) || arr.length !== items.length) {
      if (attempt < 4) {
        await sleep(400 * attempt);
        continue;
      }
      throw new Error(`Polish length mismatch: got ${arr?.length}, expected ${items.length}`);
    }
    return arr.map((x) => String(x ?? ''));
  }
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

async function polishChunks(lang, items, context, chunkSize) {
  if (!items.length) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push({ start: i, slice: items.slice(i, i + chunkSize) });
  }
  const results = await mapPool(chunks, CONCURRENCY, async (ch) => {
    const polished = await polishBatch(lang, ch.slice, context);
    return { start: ch.start, polished };
  });
  const out = new Array(items.length);
  for (const r of results) {
    for (let j = 0; j < r.polished.length; j++) out[r.start + j] = r.polished[j];
  }
  return out;
}

function avgLen(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, s) => a + String(s).length, 0) / arr.length;
}

function chunkSizeFor(items) {
  const a = avgLen(items);
  if (a > 1200) return 1;
  if (a > 600) return 2;
  if (a > 250) return 4;
  if (a > 100) return 8;
  return 12;
}

async function polishStringList(lang, items, context) {
  const size = chunkSizeFor(items);
  return polishChunks(lang, items, context, size);
}

/* ---------- pack processors ---------- */

async function polishLevelTexts(lang, cp) {
  const key = 'level-texts';
  if (!want(key) || isDone(cp, key)) return;
  const fp = path.join(PACKS, lang, 'level-texts.json');
  const data = loadJson(fp);
  const levels = Object.keys(data);
  for (const level of levels) {
    const arr = data[level];
    const titles = arr.map((t) => t.title || '');
    const texts = arr.map((t) => t.text || '');
    console.log(`  [${lang}] level-texts ${level}: ${arr.length} titles+texts`);
    const newTitles = await polishStringList(lang, titles, `${level} reading titles`);
    const newTexts = await polishStringList(lang, texts, `${level} reading passages`);
    for (let i = 0; i < arr.length; i++) {
      arr[i].title = newTitles[i];
      arr[i].text = newTexts[i];
    }
    // Polish vocabulary definitions (keep lemmas/words aligned)
    const defRefs = [];
    const defs = [];
    for (let i = 0; i < arr.length; i++) {
      const vocab = arr[i].vocabulary || [];
      for (let vi = 0; vi < vocab.length; vi++) {
        defRefs.push({ i, vi });
        defs.push(vocab[vi].definition || '');
      }
    }
    if (defs.length) {
      console.log(`  [${lang}] level-texts ${level}: ${defs.length} vocab defs`);
      const newDefs = await polishStringList(
        lang,
        defs,
        `${level} vocabulary definitions (preserve POS markers like (명사)/(동사)/(名詞)/(動詞); polish the gloss only; keep word lemmas unchanged elsewhere)`,
      );
      for (let j = 0; j < defRefs.length; j++) {
        const { i, vi } = defRefs[j];
        arr[i].vocabulary[vi].definition = newDefs[j];
      }
    }
    writeJson(fp, data);
  }
  markDone(cp, key);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ level-texts`);
}

async function polishComprehensive(lang, cp) {
  const key = 'comprehensive-reading';
  if (!want(key) || isDone(cp, key)) return;
  const fp = path.join(PACKS, lang, 'comprehensive-reading.json');
  const data = loadJson(fp);

  // Titles + passages in sliding windows (save often)
  const PASS_BATCH = 40;
  for (let start = 0; start < data.length; start += PASS_BATCH) {
    const end = Math.min(start + PASS_BATCH, data.length);
    console.log(`  [${lang}] CR titles/passages ${start}-${end - 1}`);
    const titles = data.slice(start, end).map((p) => p.title || '');
    const passages = data.slice(start, end).map((p) => p.passage || '');
    const nt = await polishStringList(lang, titles, 'comprehensive reading titles');
    const np = await polishStringList(lang, passages, 'comprehensive reading passages');
    for (let i = start; i < end; i++) {
      data[i].title = nt[i - start];
      data[i].passage = np[i - start];
    }
    writeJson(fp, data);
  }

  // Flatten all question texts + options for fewer round-trips
  const qRefs = [];
  const qTexts = [];
  const oRefs = [];
  const oTexts = [];
  for (let pi = 0; pi < data.length; pi++) {
    const qs = data[pi].questions || [];
    for (let qi = 0; qi < qs.length; qi++) {
      qRefs.push({ pi, qi });
      qTexts.push(qs[qi].text || '');
      const opts = qs[qi].options || [];
      for (let oi = 0; oi < opts.length; oi++) {
        oRefs.push({ pi, qi, oi });
        oTexts.push(String(opts[oi]));
      }
    }
  }
  console.log(`  [${lang}] CR questions ${qTexts.length}, options ${oTexts.length}`);
  const pq = await polishStringList(lang, qTexts, 'reading comprehension questions');
  const po = await polishStringList(lang, oTexts, 'reading question options');
  for (let i = 0; i < qRefs.length; i++) {
    const { pi, qi } = qRefs[i];
    data[pi].questions[qi].text = pq[i];
  }
  for (let i = 0; i < oRefs.length; i++) {
    const { pi, qi, oi } = oRefs[i];
    data[pi].questions[qi].options[oi] = po[i];
  }
  writeJson(fp, data);

  markDone(cp, key);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ comprehensive-reading`);
}

async function polishTopicMap(lang, cp, filename, stepKey, context) {
  if (!want(stepKey) || isDone(cp, stepKey)) return;
  const fp = path.join(PACKS, lang, filename);
  const data = loadJson(fp);
  for (const level of Object.keys(data)) {
    const arr = data[level];
    console.log(`  [${lang}] ${stepKey} ${level}: ${arr.length}`);
    data[level] = await polishStringList(lang, arr.map(String), `${context} (${level})`);
    writeJson(fp, data);
  }
  markDone(cp, stepKey);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ ${stepKey}`);
}

async function polishTask2(lang, cp) {
  const key = 'task2';
  if (!want(key) || isDone(cp, key)) return;
  const fp = path.join(PACKS, lang, 'task2.json');
  const data = loadJson(fp);
  for (const block of data) {
    const head = [block.label || '', block.description || '', block.instruction || ''];
    const ph = await polishStringList(lang, head, 'task2 essay type headers');
    block.label = ph[0];
    block.description = ph[1];
    block.instruction = ph[2];
    for (const cat of block.categories || []) {
      const cname = await polishStringList(lang, [cat.name || ''], 'task2 category name');
      cat.name = cname[0];
      if (Array.isArray(cat.prompts) && cat.prompts.length) {
        cat.prompts = await polishStringList(lang, cat.prompts.map(String), 'task2 essay prompts');
      }
    }
  }
  writeJson(fp, data);
  markDone(cp, key);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ task2`);
}

async function polishTask1Prompts(lang, cp) {
  const key = 'task1';
  if (!want(key) || isDone(cp, key)) return;
  const fp = path.join(PACKS, lang, 'task1.json');
  const data = loadJson(fp);

  // Type headers
  if (Array.isArray(data.types)) {
    const labels = data.types.map((t) => t.label || '');
    const descs = data.types.map((t) => t.description || '');
    const nl = await polishStringList(lang, labels, 'task1 chart-type labels');
    const nd = await polishStringList(lang, descs, 'task1 chart-type descriptions');
    for (let i = 0; i < data.types.length; i++) {
      data.types[i].label = nl[i];
      data.types[i].description = nd[i];
    }
  }

  for (const typ of Object.keys(data.byType || {})) {
    const arr = data.byType[typ];
    const titles = arr.map((x) => x.title || '');
    const instructions = arr.map((x) => x.instruction || '');
    console.log(`  [${lang}] task1 byType.${typ}: ${arr.length}`);
    const nt = await polishStringList(
      lang,
      titles,
      `task1 ${typ} titles (chart topics; keep factual England/English survey topics when they are chart subjects)`,
    );
    const ni = await polishStringList(
      lang,
      instructions,
      `task1 ${typ} instructions for learners writing in ${LANG_META[lang].endonym}; do not invent chart statistics`,
    );
    for (let i = 0; i < arr.length; i++) {
      arr[i].title = nt[i];
      arr[i].instruction = ni[i];
    }

    // Process stage titles/descriptions = instructional prose (translate).
    // Do NOT touch statistical chart labels/headers/segment names/units.
    if (typ === 'process') {
      const stageTitles = [];
      const stageDescs = [];
      const refs = [];
      for (let i = 0; i < arr.length; i++) {
        const stages = arr[i]?.chartData?.stages || [];
        for (let si = 0; si < stages.length; si++) {
          refs.push({ i, si });
          stageTitles.push(stages[si].title || '');
          stageDescs.push(stages[si].description || '');
        }
      }
      if (refs.length) {
        console.log(`  [${lang}] task1 process stages: ${refs.length}`);
        const nst = await polishStringList(lang, stageTitles, 'task1 process stage titles');
        const nsd = await polishStringList(
          lang,
          stageDescs,
          'task1 process stage descriptions (instructional prose on the diagram)',
        );
        for (let j = 0; j < refs.length; j++) {
          const { i, si } = refs[j];
          arr[i].chartData.stages[si].title = nst[j];
          arr[i].chartData.stages[si].description = nsd[j];
        }
      }
    }
    writeJson(fp, data);
  }

  // Mirror byType → types[].prompts (duplicate trees; avoid double API cost)
  if (Array.isArray(data.types)) {
    for (const t of data.types) {
      if (data.byType?.[t.type]) {
        t.prompts = JSON.parse(JSON.stringify(data.byType[t.type]));
      }
    }
    writeJson(fp, data);
  }

  markDone(cp, key);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ task1 prompts`);
}

async function polishDictation(lang, cp) {
  const key = 'dictation';
  if (!want(key) || isDone(cp, key)) return;
  const dir = path.join(PACKS, lang, 'dictation');
  if (!fs.existsSync(dir)) {
    markDone(cp, key);
    saveCheckpoint(lang, cp);
    return;
  }
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.txt'))) {
    const fp = path.join(dir, file);
    const raw = fs.readFileSync(fp, 'utf8');
    const lines = raw.split(/\r?\n/);
    const idxs = [];
    const texts = [];
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      idxs.push(i);
      // keep leading "- " marker pattern
      texts.push(t);
    }
    console.log(`  [${lang}] dictation ${file}: ${texts.length} lines`);
    const polished = await polishStringList(lang, texts, `dictation sentences (${file})`);
    for (let j = 0; j < idxs.length; j++) {
      const orig = lines[idxs[j]];
      const indent = orig.match(/^\s*/)?.[0] || '';
      lines[idxs[j]] = indent + polished[j];
    }
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
  }
  markDone(cp, key);
  saveCheckpoint(lang, cp);
  console.log(`  [${lang}] ✓ dictation`);
}

async function main() {
  if (!LANG_ARG || !LANG_META[LANG_ARG]) {
    console.error(
      'Usage: node scripts/polish-literary-packs.mjs --lang=ar|fa|ur|hi|tr|uz|sw|el|id|ms|tl|ja|ko|th|vi|zh',
    );
    process.exit(1);
  }
  const lang = LANG_ARG;
  if (!API_KEY) {
    console.error('Missing API key');
    process.exit(1);
  }
  console.log(`Literary polish: ${lang} / ${LANG_META[lang].name}`);
  console.log(`Model: ${MODEL} concurrency=${CONCURRENCY}`);
  const cp = loadCheckpoint(lang);
  if (FORCE) cp.done = {};

  // Smaller packs first for early wins, then heavy reading
  await polishTopicMap(lang, cp, 'speaking-topics.json', 'speaking', 'speaking practice prompts');
  Object.assign(cp, loadCheckpoint(lang));
  await polishTopicMap(lang, cp, 'writing-topics.json', 'writing', 'writing practice prompts');
  Object.assign(cp, loadCheckpoint(lang));
  await polishTask2(lang, cp);
  Object.assign(cp, loadCheckpoint(lang));
  await polishDictation(lang, cp);
  Object.assign(cp, loadCheckpoint(lang));
  await polishTask1Prompts(lang, cp);
  Object.assign(cp, loadCheckpoint(lang));
  await polishLevelTexts(lang, cp);
  Object.assign(cp, loadCheckpoint(lang));
  await polishComprehensive(lang, cp);

  console.log(`\nDONE ${lang}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

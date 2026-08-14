/**
 * Seed language packs by translating English built-in content via OpenRouter.
 * Resume-safe: skips files that already exist unless --force.
 *
 * Usage:
 *   npx tsx scripts/seed-lang-packs.ts
 *   npx tsx scripts/seed-lang-packs.ts --force
 *   npx tsx scripts/seed-lang-packs.ts --only=speaking,writing,dictation
 *   npx tsx scripts/seed-lang-packs.ts --langs=es,de,fr
 *   npx tsx scripts/seed-lang-packs.ts --skip-existing-langs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'lang-packs');

const API_KEY =
  process.env.VITE_OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  '';
const MODEL = process.env.SEED_TRANSLATE_MODEL || 'google/gemini-2.5-flash-lite';
/** Cap completion size so OpenRouter credit checks don't require 65k-token headroom. */
const MAX_TOKENS = Number(process.env.SEED_MAX_TOKENS || 8192);

/** Prefer free Google Translate when OpenRouter credits are exhausted. */
let USE_GTX =
  process.argv.includes('--gtx') ||
  process.env.SEED_PROVIDER === 'gtx' ||
  !API_KEY;

const GTX_CODE: Record<string, string> = {
  ru: 'ru', tl: 'tl', es: 'es', uz: 'uz', de: 'de', fr: 'fr', it: 'it', pt: 'pt',
  ja: 'ja', ko: 'ko', zh: 'zh-CN', ar: 'ar', tr: 'tr', nl: 'nl', hi: 'hi', pl: 'pl',
  sv: 'sv', id: 'id', ms: 'ms', vi: 'vi', th: 'th', uk: 'uk', el: 'el', cs: 'cs',
  ro: 'ro', fa: 'fa', ur: 'ur', sw: 'sw',
};

function switchToGtx(reason: string) {
  if (USE_GTX) return;
  USE_GTX = true;
  console.warn(`\n⚠ Switching to Google Translate free endpoint (${reason})`);
}

async function gtxTranslate(lang: Lang, text: string): Promise<string> {
  if (!text?.trim()) return text ?? '';
  // Keep under ~4500 chars per request for reliability
  if (text.length > 4200) {
    const parts = splitForTranslate(text, 4000);
    const out: string[] = [];
    for (const p of parts) {
      out.push(await gtxTranslate(lang, p));
      await sleep(80);
    }
    return out.join('');
  }
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
    encodeURIComponent(GTX_CODE[lang]) +
    '&dt=t&q=' +
    encodeURIComponent(text);
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gtx ${res.status}`);
      const data = await res.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((row: any) => row?.[0] ?? '').join('')
        : '';
      if (!translated) throw new Error('empty gtx translation');
      return translated;
    } catch (e: any) {
      attempt++;
      if (attempt >= 5) throw e;
      await sleep(400 * attempt);
    }
  }
}

function splitForTranslate(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf('. ', maxLen);
    if (cut < maxLen * 0.4) cut = rest.lastIndexOf(' ', maxLen);
    if (cut < maxLen * 0.4) cut = maxLen;
    parts.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest) parts.push(rest);
  return parts;
}

const FORCE = process.argv.includes('--force');
const SKIP_EXISTING_LANGS = process.argv.includes('--skip-existing-langs');
const ONLY = (() => {
  const eq = process.argv.find(x => x.startsWith('--only='));
  if (eq) return eq.slice(7).split(',').map(s => s.trim()).filter(Boolean);
  const idx = process.argv.findIndex(x => x === '--only');
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
})();

/** All non-English content languages (matches CONTENT_LANGS minus en). */
type Lang =
  | 'ru' | 'tl'
  | 'es' | 'uz' | 'de' | 'fr' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'
  | 'ar' | 'tr' | 'nl' | 'hi' | 'pl' | 'sv' | 'id' | 'ms' | 'vi'
  | 'th' | 'uk' | 'el' | 'cs' | 'ro' | 'fa' | 'ur' | 'sw';

const ALL_LANGS: Lang[] = [
  'ru', 'tl',
  'ar', 'zh', 'cs', 'nl', 'fa', 'fr', 'de', 'el', 'hi', 'id', 'it',
  'ja', 'ko', 'ms', 'pl', 'pt', 'ro', 'es', 'sv', 'sw', 'th', 'tr',
  'uk', 'ur', 'uz', 'vi',
];

const LANG_NAME: Record<Lang, string> = {
  ru: 'Russian',
  tl: 'Tagalog (Filipino)',
  es: 'Spanish',
  uz: 'Uzbek',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  tr: 'Turkish',
  nl: 'Dutch',
  hi: 'Hindi',
  pl: 'Polish',
  sv: 'Swedish',
  id: 'Indonesian',
  ms: 'Malay',
  vi: 'Vietnamese',
  th: 'Thai',
  uk: 'Ukrainian',
  el: 'Greek',
  cs: 'Czech',
  ro: 'Romanian',
  fa: 'Persian (Farsi)',
  ur: 'Urdu',
  sw: 'Swahili',
};

/** Core pack files that mark a language as fully seeded. */
const CORE_PACK_FILES = [
  'speaking-topics.json',
  'writing-topics.json',
  'level-texts.json',
  'comprehensive-reading.json',
  'task1.json',
  'task2.json',
  'dictation/Beginner.txt',
];

function parseLangsArg(): Lang[] | null {
  const eq = process.argv.find(x => x.startsWith('--langs='));
  const idx = process.argv.findIndex(x => x === '--langs');
  let raw: string | null = null;
  if (eq) raw = eq.slice('--langs='.length);
  else if (idx >= 0 && process.argv[idx + 1]) raw = process.argv[idx + 1];
  if (!raw) return null;
  // PowerShell may pass "=ar,zh" or space-separated tokens
  raw = raw.replace(/^=/, '').replace(/\s+/g, ',');
  const requested = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean) as Lang[];
  const invalid = requested.filter(l => !ALL_LANGS.includes(l));
  if (invalid.length) {
    throw new Error(`Unknown langs: ${invalid.join(', ')}. Valid: ${ALL_LANGS.join(',')}`);
  }
  return requested;
}

function langHasCorePack(lang: Lang): boolean {
  return CORE_PACK_FILES.every(f => exists(path.join(OUT, lang, f)));
}

const LANGS: Lang[] = (() => {
  const fromArg = parseLangsArg();
  let list = fromArg ?? ALL_LANGS;
  if (SKIP_EXISTING_LANGS) {
    list = list.filter(l => !langHasCorePack(l));
  }
  return list;
})();

function want(step: string) {
  return !ONLY || ONLY.includes(step);
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function exists(p: string) {
  return fs.existsSync(p);
}

async function sleep(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

async function translateBatch(
  lang: Lang,
  items: string[],
  context: string,
): Promise<string[]> {
  if (items.length === 0) return [];
  if (USE_GTX) {
    const out: string[] = [];
    // Parallelize small chunks to speed MT while staying polite
    const concurrency = 5;
    for (let i = 0; i < items.length; i += concurrency) {
      const slice = items.slice(i, i + concurrency);
      const translated = await Promise.all(slice.map(item => gtxTranslate(lang, item)));
      out.push(...translated);
      await sleep(50);
    }
    return out;
  }

  const system = `You are a professional translator for a language-learning app.
Translate each string into natural ${LANG_NAME[lang]}.
Rules:
- Return ONLY JSON object: { "translations": string[] } with the same length and order as the input.
- Preserve meaning; adapt culture lightly if needed.
- SELF-REFERENCE RULE: The learner is studying ${LANG_NAME[lang]}, NOT English. Rewrite any "learning/speaking/studying English", "English teacher/class/lesson/course/test", "in English", "English books/songs", etc. to use the ${LANG_NAME[lang]} language name (endonym forms as used by native speakers). Do NOT leave "English" / "anglais" / "inglés" / etc. when it refers to the language being learned.
- Exception: keep English when it is factual content ABOUT English (e.g. history of the English language, English as a UN official language, "English scientist" nationality, signs in English for tourists, England the country).
- Keep proper names (Temur, Tashkent, etc.) unless a standard local form exists.
- Do not add numbering or commentary.`;

  const user = `Context: ${context}\n\nTranslate this JSON array into { "translations": [...] }:\n${JSON.stringify(items)}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://smartyenglish.uz',
      'X-Title': 'Smarty Lang Pack Seed',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 402 || /credits/i.test(t)) {
      switchToGtx(t.slice(0, 80));
      return translateBatch(lang, items, context);
    }
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  let raw = data?.choices?.[0]?.message?.content || '';
  raw = raw.trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) throw new Error('No JSON array in translation response');
    parsed = JSON.parse(m[0]);
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : parsed.translations || parsed.items || parsed.strings || Object.values(parsed)[0];

  if (!Array.isArray(arr) || arr.length !== items.length) {
    throw new Error(`Translation length mismatch: got ${arr?.length}, expected ${items.length}`);
  }
  return arr.map((x: any) => String(x));
}

async function translateChunks(lang: Lang, items: string[], context: string, chunkSize = 20): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    let attempt = 0;
    for (;;) {
      try {
        const translated = await translateBatch(lang, chunk, context);
        out.push(...translated);
        process.stdout.write(`  [${lang}] ${Math.min(i + chunk.length, items.length)}/${items.length}\r`);
        break;
      } catch (e: any) {
        attempt++;
        if (attempt >= 4) throw e;
        console.warn(`\n  retry ${attempt}: ${e.message?.slice(0, 120)}`);
        await sleep(1500 * attempt);
      }
    }
    await sleep(200);
  }
  process.stdout.write('\n');
  return out;
}

function writeJson(file: string, data: any) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function shouldSkip(file: string) {
  return !FORCE && exists(file);
}

/* ── Extract helpers ───────────────────────────────────────────────── */

async function loadEnTopics(kind: 'speaking' | 'writing'): Promise<Record<string, string[]>> {
  if (kind === 'speaking') {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/speakingTopics.ts')).href);
    return mod.SPEAKING_TOPICS_BY_LEVEL as Record<string, string[]>;
  }
  const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/practiceTopics.ts')).href);
  return mod.TOPICS_BY_LEVEL as Record<string, string[]>;
}

async function seedTopics(kind: 'speaking' | 'writing') {
  const en = await loadEnTopics(kind);
  for (const lang of LANGS) {
    const outFile = path.join(OUT, lang, `${kind}-topics.json`);
    if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }
    console.log(`\n== ${kind} topics → ${lang} ==`);
    const out: Record<string, string[]> = {};
    for (const [level, items] of Object.entries(en)) {
      console.log(`  ${level}: ${items.length}`);
      out[level] = await translateChunks(lang, items, `${kind} practice prompts (${level})`, 15);
    }
    writeJson(outFile, out);
    console.log(`wrote ${outFile}`);
  }
}

async function seedDictation() {
  const dir = path.join(ROOT, 'public/data/audio-dictation');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
  for (const lang of LANGS) {
    for (const file of files) {
      const outFile = path.join(OUT, lang, 'dictation', file);
      if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const lines = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
      console.log(`\n== dictation ${file} → ${lang} (${lines.length}) ==`);
      const translated = await translateChunks(lang, lines, `audio dictation sentences (${file})`, 20);
      ensureDir(path.dirname(outFile));
      fs.writeFileSync(outFile, translated.map(s => `- ${s}`).join('\n') + '\n', 'utf8');
      console.log(`wrote ${outFile}`);
    }
  }
}

function parseJsonLoose(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // Fix common model escapes (trailing commas, bad \\ sequences)
        const repaired = slice
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001f]/g, ' ');
        return JSON.parse(repaired);
      }
    }
    throw new Error('No JSON object in response');
  }
}

async function translateLevelTextBatch(lang: Lang, batch: any[], maxAttempts = 6): Promise<any[]> {
  if (USE_GTX) {
    const out = [];
    for (const t of batch) {
      const title = await gtxTranslate(lang, t.title);
      const text = await gtxTranslate(lang, t.text);
      const vocabulary = [];
      for (const v of t.vocabulary || []) {
        vocabulary.push({
          word: await gtxTranslate(lang, v.word),
          definition: await gtxTranslate(lang, v.definition),
        });
        await sleep(40);
      }
      out.push({ id: t.id, title, text, vocabulary, targetSeconds: t.targetSeconds });
      await sleep(40);
    }
    return out;
  }

  const payload = batch.map(t => ({
    id: t.id,
    title: t.title,
    text: t.text,
    vocabulary: (t.vocabulary || []).map((v: any) => ({ word: v.word, definition: v.definition })),
    targetSeconds: t.targetSeconds,
  }));
  const system = `Translate reading-practice content into ${LANG_NAME[lang]} for language learners.
Return JSON: { "items": [ { "id", "title", "text", "vocabulary":[{"word","definition"}], "targetSeconds" } ] }
Keep id and targetSeconds unchanged. Translate title, text, vocabulary words and definitions into ${LANG_NAME[lang]}.
Vocabulary "word" should be the ${LANG_NAME[lang]} word appearing in the text.
SELF-REFERENCE RULE: Learners are studying ${LANG_NAME[lang]}, not English. Replace course self-references (English lessons/teacher/class/course/test, "speak/read/write in English", "learning English") with the equivalent for ${LANG_NAME[lang]} using natural endonym forms. Keep English only when the passage is factually about the English language/history, England, or English nationality.
Escape all quotes inside strings properly.`;
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smartyenglish.uz',
          'X-Title': 'Smarty Lang Pack Seed',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: JSON.stringify({ items: payload }) },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 402 || /credits/i.test(errText)) {
          switchToGtx(errText.slice(0, 80));
          return translateLevelTextBatch(lang, batch, maxAttempts);
        }
        throw new Error(errText);
      }
      const data = await res.json();
      let raw = data?.choices?.[0]?.message?.content || '';
      raw = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = parseJsonLoose(raw);
      const items = parsed.items || parsed.texts || parsed;
      if (!Array.isArray(items) || items.length !== batch.length) {
        throw new Error(`level-text batch length mismatch`);
      }
      return items;
    } catch (e: any) {
      if (String(e.message).includes('CREDITS') || /credits/i.test(String(e.message))) {
        switchToGtx(String(e.message).slice(0, 80));
        return translateLevelTextBatch(lang, batch, maxAttempts);
      }
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await sleep(1500 * attempt);
    }
  }
}

async function seedLevelTexts() {
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/level-texts.json'), 'utf8')) as Record<string, any[]>;
  for (const lang of LANGS) {
    const outFile = path.join(OUT, lang, 'level-texts.json');
    const partialFile = path.join(OUT, lang, 'level-texts.partial.json');
    if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }

    let out: Record<string, any[]> = {};
    if (!FORCE && exists(partialFile)) {
      try { out = JSON.parse(fs.readFileSync(partialFile, 'utf8')); } catch { out = {}; }
      console.log(`resuming level-texts ${lang} from partial`);
    }

    console.log(`\n== level-texts → ${lang} ==`);
    for (const [level, texts] of Object.entries(en)) {
      if (Array.isArray(out[level]) && out[level].length === texts.length) {
        console.log(`  skip ${level} (already ${out[level].length})`);
        continue;
      }
      const startAt = Array.isArray(out[level]) ? out[level].length : 0;
      out[level] = out[level] ?? [];
      const step = USE_GTX ? 1 : 5;
      for (let i = startAt; i < texts.length; i += step) {
        const batch = texts.slice(i, i + step);
        try {
          const items = await translateLevelTextBatch(lang, batch, 6);
          out[level].push(...items);
          writeJson(partialFile, out);
          process.stdout.write(`  [${lang}/${level}] ${out[level].length}/${texts.length}\r`);
        } catch (e: any) {
          console.warn(`\n  retry level-text ${level}#${i}: ${String(e.message).slice(0, 120)}`);
          await sleep(1000);
          const items = await translateLevelTextBatch(lang, batch.length > 1 ? [batch[0]] : batch, 8);
          out[level].push(...items);
          // if batch was >1 and we only did first, rewind i to redo rest
          if (batch.length > 1) {
            writeJson(partialFile, out);
            i = i - step + 1;
            continue;
          }
          writeJson(partialFile, out);
        }
        await sleep(USE_GTX ? 80 : 250);
      }
      process.stdout.write('\n');
    }
    writeJson(outFile, out);
    if (exists(partialFile)) fs.unlinkSync(partialFile);
    console.log(`wrote ${outFile}`);
  }
}

async function seedComprehensiveReading() {
  const raw = fs.readFileSync(
    path.join(ROOT, 'public/data/comprehensive-reading/Comprehensive_Reading_Materials.txt'),
    'utf8'
  );
  const passages = parseCompReading(raw);
  console.log(`parsed ${passages.length} comprehensive reading passages`);

  for (const lang of LANGS) {
    const outFile = path.join(OUT, lang, 'comprehensive-reading.json');
    const partialFile = path.join(OUT, lang, 'comprehensive-reading.partial.json');
    if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }

    let out: any[] = [];
    if (!FORCE && exists(partialFile)) {
      try { out = JSON.parse(fs.readFileSync(partialFile, 'utf8')); } catch { out = []; }
      console.log(`resuming comprehensive ${lang} from ${out.length}`);
    }

    console.log(`\n== comprehensive reading → ${lang} ==`);
    for (let i = out.length; i < passages.length; i += 1) {
      const src = passages[i];
      try {
        let it: any;
        if (USE_GTX) {
          const title = await gtxTranslate(lang, src.title);
          const passage = await gtxTranslate(lang, src.passage);
          const questions = [];
          for (const q of src.questions) {
            const [text, ...options] = await Promise.all([
              gtxTranslate(lang, q.text),
              ...q.options.map((opt: string) => gtxTranslate(lang, opt)),
            ]);
            questions.push({ id: q.id, text, options, answer: q.answer });
          }
          it = { title, passage, level: src.level, questions };
        } else {
          const system = `Translate reading comprehension materials into ${LANG_NAME[lang]}.
Return JSON { "passages": [ { "title", "passage", "level", "questions":[{"id","text","options":[...],"answer"}] } ] }
Keep level, question id, and answer index unchanged. Translate title, passage, question text, and options.
SELF-REFERENCE RULE: Learners study ${LANG_NAME[lang]}, not English. If a passage is about studying/speaking/practicing English as the course language (online English learning, English teacher, language school studying English, etc.), rewrite those references to ${LANG_NAME[lang]}. Keep English when factual (Tokyo station signs in English, hotel staff speaking English, UN official languages, "English scientist", English Civil War/Parliament).
Escape quotes inside strings properly. Do not truncate.`;
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://smartyenglish.uz',
              'X-Title': 'Smarty Lang Pack Seed',
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: MAX_TOKENS,
              temperature: 0.2,
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: JSON.stringify({ passages: [src] }) },
              ],
              response_format: { type: 'json_object' },
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            if (res.status === 402 || /credits/i.test(errText)) {
              switchToGtx(errText.slice(0, 80));
              i -= 1; // retry this index with gtx
              continue;
            }
            throw new Error(errText);
          }
          const data = await res.json();
          let rawResp = data?.choices?.[0]?.message?.content || '';
          rawResp = rawResp.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed = parseJsonLoose(rawResp);
          const items = parsed.passages || parsed.items || parsed;
          if (!Array.isArray(items) || items.length !== 1) {
            throw new Error(`comp-reading batch mismatch at ${i}`);
          }
          it = items[0];
          it.level = src.level;
          if (Array.isArray(it.questions) && Array.isArray(src.questions)) {
            it.questions.forEach((q: any, qi: number) => {
              if (src.questions[qi]) q.answer = src.questions[qi].answer;
              q.id = src.questions[qi]?.id ?? q.id;
            });
          }
        }
        out.push(it);
        writeJson(partialFile, out);
        process.stdout.write(`  [${lang}] ${out.length}/${passages.length}\r`);
      } catch (e: any) {
        console.warn(`\n  retry compreading ${lang}#${i}: ${String(e.message).slice(0, 120)}`);
        switchToGtx(String(e.message).slice(0, 60));
        await sleep(800);
        i -= 1;
        continue;
      }
      await sleep(USE_GTX ? 60 : 150);
    }
    process.stdout.write('\n');
    writeJson(outFile, out);
    if (exists(partialFile)) fs.unlinkSync(partialFile);
    console.log(`wrote ${outFile}`);
  }
}

function parseCompReading(text: string): any[] {
  const results: any[] = [];
  const lines = text.split('\n');
  let currentLevel = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.toUpperCase().startsWith('LEVEL:')) {
      currentLevel = line.replace(/^LEVEL:\s*/i, '').trim();
      i++; continue;
    }
    const readingMatch = line.match(/^Reading\s+\d+:\s*(.+)/i);
    if (readingMatch && currentLevel) {
      const title = readingMatch[1].trim();
      const passageLines: string[] = [];
      i++;
      while (i < lines.length) {
        const pl = lines[i].trim();
        if (/^\d+\./.test(pl) || pl.startsWith('Answer Key:') || pl.match(/^Reading\s+\d+:/i)) break;
        if (pl && !/^[=\-_*#]{3,}$/.test(pl)) passageLines.push(pl);
        i++;
      }
      const passage = passageLines.join(' ').trim();
      const questions: any[] = [];
      for (let q = 0; q < 5 && i < lines.length; q++) {
        while (i < lines.length && !lines[i].trim()) i++;
        if (i >= lines.length) break;
        const qLine = lines[i].trim();
        const qMatch = qLine.match(/^\d+\.\s*(.+)/);
        if (!qMatch) break;
        const qText = qMatch[1].trim();
        const options: string[] = [];
        i++;
        for (let o = 0; o < 4 && i < lines.length; o++) {
          while (i < lines.length && !lines[i].trim()) i++;
          if (i >= lines.length) break;
          const optLine = lines[i].trim();
          const optMatch = optLine.match(/^[A-D]\)\s*(.+)/);
          if (optMatch) { options.push(optMatch[1].trim()); i++; }
          else break;
        }
        if (options.length >= 2) questions.push({ id: q + 1, text: qText, options, answer: -1 });
      }
      while (i < lines.length) {
        const akLine = lines[i].trim();
        if (akLine.startsWith('Answer Key:')) {
          const answers = akLine.replace('Answer Key:', '').trim();
          const letters = answers.split(/\s+/).filter(p => /^[A-D]$/.test(p));
          letters.forEach((letter, qi) => {
            if (qi < questions.length) {
              const idx = letter.charCodeAt(0) - 65;
              if (idx >= 0 && idx < 4) questions[qi].answer = idx;
            }
          });
          i++;
          break;
        }
        i++;
      }
      if (passage && questions.length > 0) {
        results.push({ passage, questions, level: currentLevel, title });
      }
      continue;
    }
    i++;
  }
  return results;
}

async function seedTask2() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/writingTask2.ts')).href);
  const data = mod.TASK2_DATA as any[];
  for (const lang of LANGS) {
    const outFile = path.join(OUT, lang, 'task2.json');
    if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }
    console.log(`\n== task2 → ${lang} ==`);
    const out = [];
    for (const typeData of data) {
      const metaStrings = [typeData.label, typeData.description, typeData.instruction];
      const [label, description, instruction] = await translateChunks(
        lang, metaStrings, 'IELTS/academic writing task2 metadata', 3
      );
      const categories = [];
      for (const cat of typeData.categories) {
        const [name] = await translateChunks(lang, [cat.name], 'essay category name', 1);
        const prompts = await translateChunks(
          lang, cat.prompts, `academic essay prompts (${typeData.type}/${cat.name})`, 5
        );
        categories.push({ name, prompts });
      }
      out.push({ ...typeData, label, description, instruction, categories });
    }
    writeJson(outFile, out);
    console.log(`wrote ${outFile}`);
  }
}

async function seedTask1() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/writingTask1.ts')).href);
  const data = mod.TASK1_DATA as any[];
  for (const lang of LANGS) {
    const outFile = path.join(OUT, lang, 'task1.json');
    if (shouldSkip(outFile)) { console.log(`skip ${outFile}`); continue; }
    console.log(`\n== task1 → ${lang} ==`);
    const out = [];
    for (const typeData of data) {
      const [label, description] = await translateChunks(
        lang, [typeData.label, typeData.description], 'task1 chart type metadata', 2
      );
      const prompts = [];
      for (let i = 0; i < typeData.prompts.length; i += 8) {
        const batch = typeData.prompts.slice(i, i + 8);
        const titles = batch.map((p: any) => p.title);
        const instructions = batch.map((p: any) => p.instruction);
        const tTitles = await translateChunks(lang, titles, 'task1 prompt titles', 8);
        const tInstr = await translateChunks(lang, instructions, 'task1 prompt instructions', 8);
        batch.forEach((p: any, idx: number) => {
          prompts.push({ ...p, title: tTitles[idx], instruction: tInstr[idx] });
        });
      }
      out.push({ ...typeData, label, description, prompts });
    }
    writeJson(outFile, { byType: Object.fromEntries(out.map((t: any) => [t.type, t.prompts])), types: out });
    console.log(`wrote ${outFile}`);
  }
}

async function main() {
  if (!API_KEY && !USE_GTX) {
    console.error('Missing VITE_OPENROUTER_API_KEY / OPENROUTER_API_KEY (or pass --gtx)');
    process.exit(1);
  }
  console.log(`Provider: ${USE_GTX ? 'gtx (Google Translate)' : `OpenRouter / ${MODEL}`}`);
  console.log(`Output: ${OUT}`);
  console.log(`Langs (${LANGS.length}): ${LANGS.join(', ')}`);
  ensureDir(OUT);

  if (want('speaking')) await seedTopics('speaking');
  if (want('writing')) await seedTopics('writing');
  if (want('dictation')) await seedDictation();
  if (want('levels')) await seedLevelTexts();
  if (want('compreading')) await seedComprehensiveReading();
  if (want('task2')) await seedTask2();
  if (want('task1')) await seedTask1();

  console.log('\nDone.');
  console.log('Remaining empty langs:', ALL_LANGS.filter(l => !langHasCorePack(l)).join(', ') || '(none)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

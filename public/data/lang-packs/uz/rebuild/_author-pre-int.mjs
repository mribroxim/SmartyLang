/**
 * Author Pre-Intermediate Latin-Uzbek lessons → rebuild/Pre-Intermediate.json only.
 * Meaning-first (beats), no kernel fillers, no final pack writes.
 *
 *   node public/data/lang-packs/uz/rebuild/_author-pre-int.mjs
 *   node public/data/lang-packs/uz/rebuild/_author-pre-int.mjs --force
 *   node public/data/lang-packs/uz/rebuild/_author-pre-int.mjs --ids=p1,p2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EN_PATH,
  REBUILD_DIR,
  chatJson,
  compactEnPayload,
  extractBeats,
  loadGlossary,
  normalizeLesson,
  readJson,
  sleep,
  systemPrompt,
  targetSecondsFor,
  validateLesson,
  validateSense,
  wordCount,
  writeJson,
} from '../../../../../scripts/localize/shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(REBUILD_DIR, 'Pre-Intermediate.json');
const LEVEL = 'Pre-Intermediate';
const FORCE = process.argv.includes('--force');
const MODEL =
  process.env.LOCALIZE_MODEL_STRONG ||
  process.env.PREINT_AUTHOR_MODEL ||
  'google/gemini-2.5-flash';
const CONCURRENCY = Math.max(1, Number(process.env.PREINT_CONCURRENCY || 2));

function parseIds() {
  const eq = process.argv.find((x) => x.startsWith('--ids='));
  if (!eq) return null;
  return new Set(eq.slice(6).split(',').map((s) => s.trim()).filter(Boolean));
}

const ONLY = parseIds();

function stripEnFiller(text) {
  const paras = String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length < 2) return text;
  const last = paras[paras.length - 1];
  if (
    /Cause and effect sit|Discussions in everyday|Relative clauses|Second conditional|Comparatives and|used to help|Practising the language|learners need/i.test(
      last,
    )
  ) {
    return paras.slice(0, -1).join('\n\n');
  }
  return paras.join('\n\n');
}

function userPrompt(enLesson) {
  const cleaned = { ...enLesson, text: stripEnFiller(enLesson.text) };
  const payload = compactEnPayload(cleaned);
  return `Rewrite ONE Pre-Intermediate English Learn lesson into natural B1 Latin Uzbek (Oʻzbekcha).

MEANING-FIRST: cover every beat with cause/effect, concrete examples, and opinions. Do NOT translate word-for-word. Do NOT add generic philosophy filler to pad length.

Return ONLY JSON:
{
  "id": "${enLesson.id}",
  "title": "Uzbek title (question form OK)",
  "text": "330–400 words of natural Latin Uzbek, paragraphs separated by blank lines",
  "vocabulary": [
    { "word": "headword appearing in text", "definition": "short clear Uzbek definition" }
  ]
}

Rules:
- Latin only (oʻ / gʻ). No Cyrillic.
- 8–12 vocabulary items; each word MUST appear in text; definitions in simple Uzbek (not English dictionary calques).
- Keep dialogue "Name: …" shape if beats say dialogue (this lesson is not dialogue unless beats say so).
- Skip EN meta closers about grammar labels; end with a real learner takeaway on the topic.
- Self-check naturalness: would a Tashkent reader find this spoken/clear?

Beats + source:
${JSON.stringify(payload, null, 2)}`;
}

async function authorOne(enLesson, sys) {
  const parsed = await chatJson({
    system: sys,
    user: userPrompt(enLesson),
    model: MODEL,
    temperature: 0.35,
    maxTokens: 4500,
  });
  const raw = parsed.lessons?.[0] || parsed;
  let lesson = normalizeLesson(
    {
      id: enLesson.id,
      title: raw.title,
      text: raw.text,
      vocabulary: raw.vocabulary,
    },
    enLesson,
  );
  lesson.targetSeconds = targetSecondsFor(lesson.text);

  let v = validateLesson(LEVEL, enLesson, lesson);
  let s = validateSense(LEVEL, enLesson, lesson);
  if (v.ok && s.ok) return lesson;

  // One repair pass with explicit errors
  const repair = await chatJson({
    system: sys,
    user: `Fix this Uzbek Pre-Intermediate lesson. Keep id ${enLesson.id}. Return the same JSON shape (id,title,text,vocabulary).

Schema errors: ${JSON.stringify(v.errors)}
Sense errors: ${JSON.stringify(s.errors)}
EN beats: ${JSON.stringify(extractBeats({ ...enLesson, text: stripEnFiller(enLesson.text) }))}
Current draft:
${JSON.stringify({ title: lesson.title, text: lesson.text, vocabulary: lesson.vocabulary })}

Requirements: 330–400 words (±20% OK), Latin Uzbek, vocab words in text, cover beats with real examples, no kernel/philosophy padding.`,
    model: MODEL,
    temperature: 0.25,
    maxTokens: 4500,
  });
  const raw2 = repair.lessons?.[0] || repair;
  lesson = normalizeLesson(
    {
      id: enLesson.id,
      title: raw2.title || lesson.title,
      text: raw2.text || lesson.text,
      vocabulary: raw2.vocabulary || lesson.vocabulary,
    },
    enLesson,
  );
  lesson.targetSeconds = targetSecondsFor(lesson.text);
  return lesson;
}

function loadExisting() {
  if (!fs.existsSync(OUT)) return [];
  try {
    const raw = readJson(OUT);
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.[LEVEL])) return raw[LEVEL];
    if (Array.isArray(raw?.lessons)) return raw.lessons;
  } catch {
    /* ignore */
  }
  return [];
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

async function main() {
  const enAll = readJson(EN_PATH)[LEVEL];
  const glossary = loadGlossary();
  const sys = systemPrompt(glossary);
  const existing = loadExisting();
  const byId = new Map(existing.filter((x) => x?.id && x?.text).map((x) => [x.id, x]));

  const todo = enAll.filter((en) => {
    if (ONLY && !ONLY.has(en.id)) return false;
    if (FORCE) return true;
    const cur = byId.get(en.id);
    if (!cur?.text) return true;
    const v = validateLesson(LEVEL, en, cur);
    const s = validateSense(LEVEL, en, cur);
    return !(v.ok && s.ok);
  });

  console.log(`Pre-Int author model=${MODEL} todo=${todo.length}/100 out=${OUT}`);

  let done = 0;
  await mapPool(todo, CONCURRENCY, async (en) => {
    try {
      const lesson = await authorOne(en, sys);
      byId.set(en.id, lesson);
      done++;
      const w = wordCount(lesson.text);
      const v = validateLesson(LEVEL, en, lesson);
      const s = validateSense(LEVEL, en, lesson);
      console.log(
        `  ${lesson.id} words=${w} schema=${v.ok ? 'OK' : v.errors[0]} sense=${s.ok ? 'OK' : s.errors[0]} (${done}/${todo.length})`,
      );
      // checkpoint after each
      const ordered = enAll.map((e) => byId.get(e.id)).filter(Boolean);
      writeJson(OUT, ordered);
      await sleep(200);
    } catch (e) {
      console.error(`  FAIL ${en.id}: ${(e.message || e).toString().slice(0, 200)}`);
    }
  });

  const ordered = enAll.map((e) => byId.get(e.id)).filter(Boolean);
  writeJson(OUT, ordered);

  let schemaFail = 0;
  let senseFail = 0;
  for (const en of enAll) {
    const uz = byId.get(en.id);
    if (!uz) {
      schemaFail++;
      continue;
    }
    if (!validateLesson(LEVEL, en, uz).ok) schemaFail++;
    if (!validateSense(LEVEL, en, uz).ok) senseFail++;
  }
  console.log(`Wrote ${ordered.length}/100 → ${OUT}`);
  console.log(`Remaining schema fails: ${schemaFail}; sense fails: ${senseFail}`);
  if (ordered.length < 100 || schemaFail || senseFail) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

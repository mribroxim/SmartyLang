#!/usr/bin/env node
/**
 * Native Latin-Uzbek rewrite of all 500 EN Learn lessons (level-texts only).
 * Resume-safe. Does NOT use GTX.
 *
 * Usage:
 *   node scripts/localize/localize-uz-level-texts.mjs
 *   node scripts/localize/localize-uz-level-texts.mjs --force
 *   node scripts/localize/localize-uz-level-texts.mjs --levels=Beginner
 *   node scripts/localize/localize-uz-level-texts.mjs --ids=e1,b1,b2
 *   node scripts/localize/localize-uz-level-texts.mjs --limit=10
 *
 * Env:
 *   OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY
 *   LOCALIZE_MODEL_CHEAP, LOCALIZE_MODEL_STRONG, LOCALIZE_CONCURRENCY
 */
import fs from 'fs';
import path from 'path';
import {
  API_KEY,
  BACKUP_PATH,
  CONCURRENCY,
  EN_PATH,
  FAILURES_PATH,
  LEVELS,
  MAX_RETRIES,
  MODEL_CHEAP,
  MODEL_STRONG,
  OUT_PATH,
  PARTIAL_PATH,
  PROGRESS_PATH,
  batchSizeForLevel,
  chatJson,
  chatText,
  compactEnPayload,
  emptyPack,
  ensureDir,
  loadGlossary,
  modelForLevel,
  normalizeLesson,
  readJson,
  sleep,
  systemPrompt,
  validateLesson,
  wordCount,
  writeJson,
} from './shared.mjs';

const FORCE = process.argv.includes('--force');
const SKIP_BACKUP = process.argv.includes('--skip-backup');

function parseArg(flag) {
  const eq = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.findIndex((x) => x === flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

const ONLY_LEVELS = (() => {
  const raw = parseArg('--levels');
  if (!raw) return null;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
})();

const ONLY_IDS = (() => {
  const raw = parseArg('--ids');
  if (!raw) return null;
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
})();

const LIMIT = Number(parseArg('--limit') || 0) || 0;

function wantLevel(level) {
  return !ONLY_LEVELS || ONLY_LEVELS.includes(level);
}

function backupOnce(enPack) {
  ensureDir(path.dirname(BACKUP_PATH));
  if (fs.existsSync(BACKUP_PATH)) {
    console.log(`backup exists: ${BACKUP_PATH}`);
    return;
  }
  if (SKIP_BACKUP) return;
  if (fs.existsSync(OUT_PATH)) {
    fs.copyFileSync(OUT_PATH, BACKUP_PATH);
    console.log(`backed up old UZ pack → ${BACKUP_PATH}`);
  } else {
    writeJson(BACKUP_PATH, { _note: 'no prior uz pack', enLevels: Object.keys(enPack) });
    console.log(`wrote placeholder backup (no prior pack)`);
  }
}

function loadPartial(en) {
  if (!FORCE && fs.existsSync(PARTIAL_PATH)) {
    const partial = readJson(PARTIAL_PATH);
    console.log('resuming from partial');
    return partial;
  }
  const pack = emptyPack();
  for (const level of LEVELS) {
    pack[level] = new Array(en[level].length).fill(null);
  }
  return pack;
}

function countDone(pack, en) {
  let n = 0;
  for (const level of LEVELS) {
    const arr = pack[level] || [];
    for (let i = 0; i < (en[level]?.length || 0); i++) {
      if (arr[i]?.id === en[level][i].id && arr[i]?.text) n++;
    }
  }
  return n;
}

function userPromptForBatch(level, lessons) {
  const payload = lessons.map(compactEnPayload);
  return `Native-rewrite these ${lessons.length} ${level} lesson(s) into Latin Uzbek from MEANING BEATS (not word-for-word).

Return JSON:
{
  "lessons": [
    {
      "id": "same as input",
      "title": "Uzbek title",
      "text": "Uzbek passage covering every beat",
      "vocabulary": [{ "word": "uzbek headword in text", "definition": "uzbek definition" }]
    }
  ]
}

Cover every beat in "beats". Keep order/ids. Length near EN ±20% with real content (no filler).
Vocabulary words must appear in the Uzbek text.
Lessons:
${JSON.stringify(payload)}`;
}

async function rewriteBatch(level, enLessons, sys, strong = false) {
  const model = modelForLevel(level, strong);
  const parsed = await chatJson({
    system: sys,
    user: userPromptForBatch(level, enLessons),
    model,
    temperature: strong ? 0.3 : 0.35,
  });
  const arr = parsed.lessons || parsed.items || parsed.results;
  if (!Array.isArray(arr) || arr.length !== enLessons.length) {
    throw new Error(`batch length mismatch: got ${arr?.length} expected ${enLessons.length}`);
  }
  return enLessons.map((en, i) => {
    const raw = arr.find((x) => x?.id === en.id) || arr[i];
    return normalizeLesson(raw, en);
  });
}

function splitParagraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitSentences(text) {
  const parts = String(text || '').match(/[^\r\n]+/g) || [text];
  const out = [];
  for (const line of parts) {
    if (/^[^:]{1,40}:\s+\S/.test(line.trim())) {
      out.push(line.trim());
      continue;
    }
    const sents = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    for (const s of sents) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

function chunkBySize(parts, maxChars = 380) {
  const chunks = [];
  let buf = '';
  for (const p of parts) {
    if (!buf) {
      buf = p;
      continue;
    }
    if ((buf + '\n' + p).length > maxChars) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = `${buf}\n${p}`;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

/** Chunk long lessons so free/small models don't truncate. */
async function rewriteChunkedDirect(level, enLesson, sys, model) {
  const parts = splitSentences(enLesson.text);
  const chunks = chunkBySize(parts, level === 'Advanced' ? 320 : 400);
  const uzParas = [];
  for (let i = 0; i < chunks.length; i++) {
    const t = await chatText({
      system:
        'You rewrite English into natural Latin Uzbek (Oʻzbekcha). Output ONLY the Uzbek text. No JSON, no markdown, no English, no Cyrillic.',
      model,
      temperature: 0.3,
      maxTokens: Math.min(900, Number(process.env.LOCALIZE_MAX_TOKENS || 900)),
      maxAttempts: 4,
      user: `Rewrite to Latin Uzbek. Keep "Name: line" dialogue turns if present.\n\n${chunks[i]}`,
    });
    if (!t) throw new Error(`empty chunk ${i} for ${enLesson.id}`);
    uzParas.push(t.trim());
    await sleep(120);
  }
  const text = uzParas.join('\n\n').replace(/\n{3,}/g, '\n\n');
  const meta = await chatJson({
    system: 'Latin Oʻzbekcha writer. Output ONLY compact JSON.',
    model,
    temperature: 0.25,
    maxTokens: 900,
    user: `Return {"id":"${enLesson.id}","title":"uzbek title","vocabulary":[{"word":"in text","definition":"uzbek"}]}
6-8 vocab words that appear in text. EN title: ${JSON.stringify(enLesson.title)}
Text excerpt: ${JSON.stringify(text.slice(0, 2500))}`,
  });
  return normalizeLesson({ ...meta, id: enLesson.id, text }, enLesson);
}

function shouldChunk(level, enLesson) {
  if (process.env.LOCALIZE_CHUNKED === '1') return true;
  if (level === 'Advanced' || level === 'Intermediate') return wordCount(enLesson.text) >= 280;
  return wordCount(enLesson.text) >= 400;
}

const MODEL_FALLBACKS = (
  process.env.LOCALIZE_MODEL_FALLBACKS ||
  'poolside/laguna-s-2.1:free,openrouter/free'
).split(',').map((s) => s.trim()).filter(Boolean);

async function rewriteWithModelFallback(level, enLesson, sys, strong) {
  const primary = modelForLevel(level, strong);
  const models = [primary, ...MODEL_FALLBACKS.filter((m) => m !== primary)];
  let lastErr;
  for (const model of models) {
    try {
      if (shouldChunk(level, enLesson)) {
        return await rewriteChunkedDirect(level, enLesson, sys, model);
      }
      const parsed = await chatJson({
        system: sys,
        user: userPromptForBatch(level, [enLesson]),
        model,
        temperature: strong ? 0.3 : 0.35,
      });
      const arr = parsed.lessons || parsed.items || [parsed];
      const raw = arr.find((x) => x?.id === enLesson.id) || arr[0];
      return normalizeLesson(raw, enLesson);
    } catch (e) {
      lastErr = e;
      console.warn(`  model ${model} fail: ${(e.message || e).toString().slice(0, 100)}`);
      if (/HTTP 401|HTTP 402|insufficient credits/i.test(e.message || '') && !String(model).includes(':free')) {
        continue;
      }
      if (/HTTP 401|HTTP 402|insufficient credits/i.test(e.message || '') && models.every((m) => !String(m).includes(':free'))) {
        throw e;
      }
      await sleep(800);
    }
  }
  throw lastErr || new Error('all models failed');
}

async function rewriteOneWithRetries(level, enLesson, sys, failures) {
  let lastErrors = [];
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const strong = attempt >= 1;
    try {
      const uz = await rewriteWithModelFallback(level, enLesson, sys, strong);
      const v = validateLesson(level, enLesson, uz);
      if (v.ok) return uz;
      lastErrors = v.errors;
      console.warn(`  ${enLesson.id} validate fail (try ${attempt + 1}): ${v.errors.slice(0, 3).join('; ')}`);
    } catch (e) {
      lastErrors = [(e.message || String(e)).toString().slice(0, 200)];
      console.warn(`  ${enLesson.id} rewrite error (try ${attempt + 1}): ${lastErrors[0]}`);
      if (/HTTP 401|HTTP 402|HTTP 403|insufficient credits/i.test(lastErrors[0]) && !/free/.test(process.env.LOCALIZE_MODEL_CHEAP || '')) {
        throw e;
      }
    }
    await sleep(500 * (attempt + 1));
  }
  failures.push({ id: enLesson.id, level, errors: lastErrors });
  return null;
}

// keep rewriteBatch for Beginner multi-lesson calls
void splitParagraphs;
void MODEL_CHEAP;
void MODEL_STRONG;

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

async function main() {
  console.log('=== UZ native localize (level-texts) ===');
  if (!API_KEY) {
    console.error('Missing OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY');
    console.error('Pipeline is ready. Set the key and re-run:');
    console.error('  node scripts/localize/localize-uz-level-texts.mjs');
    process.exit(2);
  }

  const en = readJson(EN_PATH);
  const glossary = loadGlossary();
  const sys = systemPrompt(glossary);
  backupOnce(en);

  const pack = loadPartial(en);
  const failures = [];
  let processedThisRun = 0;

  for (const level of LEVELS) {
    if (!wantLevel(level)) continue;
    const enArr = en[level];
    if (!Array.isArray(enArr) || enArr.length !== 100) {
      throw new Error(`${level}: EN expected 100 lessons`);
    }
    if (!Array.isArray(pack[level]) || pack[level].length !== 100) {
      pack[level] = new Array(100).fill(null);
    }

    console.log(`\n== ${level} ==`);
    const pendingIdx = [];
    for (let i = 0; i < enArr.length; i++) {
      const enL = enArr[i];
      if (ONLY_IDS && !ONLY_IDS.has(enL.id)) continue;
      const cur = pack[level][i];
      if (!FORCE && cur?.id === enL.id && cur?.text) {
        const v = validateLesson(level, enL, cur);
        if (v.ok) continue;
      }
      pendingIdx.push(i);
    }

    if (LIMIT > 0) {
      const remain = Math.max(0, LIMIT - processedThisRun);
      pendingIdx.splice(remain);
    }

    console.log(`  pending ${pendingIdx.length} / ${enArr.length}`);
    if (!pendingIdx.length) continue;

    const batchSize = batchSizeForLevel(level);

    // Group into batches
    const batches = [];
    for (let i = 0; i < pendingIdx.length; i += batchSize) {
      batches.push(pendingIdx.slice(i, i + batchSize));
    }

    await mapPool(batches, CONCURRENCY, async (idxs) => {
      if (LIMIT > 0 && processedThisRun >= LIMIT) return;
      const enBatch = idxs.map((i) => enArr[i]);
      try {
        if (batchSize === 1) {
          const uz = await rewriteOneWithRetries(level, enBatch[0], sys, failures);
          if (uz) pack[level][idxs[0]] = uz;
        } else {
          let uzBatch;
          try {
            uzBatch = await rewriteBatch(level, enBatch, sys, false);
          } catch (e) {
            console.warn(`  batch fail, falling back to 1x: ${(e.message || e).toString().slice(0, 120)}`);
            uzBatch = [];
            for (const enL of enBatch) {
              const uz = await rewriteOneWithRetries(level, enL, sys, failures);
              uzBatch.push(uz);
            }
          }
          for (let j = 0; j < idxs.length; j++) {
            let uz = uzBatch[j];
            if (!uz) continue;
            const v = validateLesson(level, enBatch[j], uz);
            if (!v.ok) {
              console.warn(`  ${enBatch[j].id} batch-invalid → retry: ${v.errors.slice(0, 2).join('; ')}`);
              uz = await rewriteOneWithRetries(level, enBatch[j], sys, failures);
            }
            if (uz) pack[level][idxs[j]] = uz;
          }
        }
      } catch (e) {
        if (/daily free-model limit|HTTP 401|HTTP 402|HTTP 403|credits|insufficient/i.test(e.message || '')) {
          writeJson(PARTIAL_PATH, pack);
          writeJson(FAILURES_PATH, failures);
          console.error('\nAPI credits/auth/daily-limit blocked. Partial saved. Re-run to resume.');
          throw e;
        }
        for (const enL of enBatch) {
          failures.push({ id: enL.id, level, errors: [(e.message || String(e)).slice(0, 200)] });
        }
      }
      processedThisRun += idxs.length;
      const done = countDone(pack, en);
      process.stdout.write(`\r  progress ${done}/500 (this run +${processedThisRun})   `);
      writeJson(PARTIAL_PATH, pack);
      writeJson(PROGRESS_PATH, {
        updatedAt: new Date().toISOString(),
        done,
        failures: failures.length,
      });
      await sleep(80);
    });
    process.stdout.write('\n');
    if (LIMIT > 0 && processedThisRun >= LIMIT) {
      console.log(`--limit=${LIMIT} reached`);
      break;
    }
  }

  writeJson(PARTIAL_PATH, pack);
  writeJson(FAILURES_PATH, failures);

  // Assemble final whenever all 500 slots are filled (even if this run was scoped)
  let missingGlobal = 0;
  for (const level of LEVELS) {
    for (let i = 0; i < 100; i++) {
      if (!pack[level][i]?.text) missingGlobal++;
    }
  }

  if (failures.length) {
    console.log(`\nFailures: ${failures.length} (see ${FAILURES_PATH})`);
  }

  if (missingGlobal === 0) {
    const out = {};
    for (const level of LEVELS) {
      out[level] = pack[level].map((lesson, i) => {
        if (!lesson?.text) throw new Error(`missing ${level}[${i}]`);
        return lesson;
      });
    }
    writeJson(OUT_PATH, out);
    console.log(`\nWrote ${OUT_PATH}`);
  } else {
    let missing = 0;
    for (const level of LEVELS) {
      if (ONLY_LEVELS && !ONLY_LEVELS.includes(level)) continue;
      for (let i = 0; i < 100; i++) {
        const enL = en[level][i];
        if (ONLY_IDS && !ONLY_IDS.has(enL.id)) continue;
        if (!pack[level][i]?.text) missing++;
      }
    }
    console.log(`\nPartial only (${missingGlobal} missing globally, ${missing} in scope). Resume later; not writing final pack.`);
    writeJson(PARTIAL_PATH, pack);
    console.log('Updated partial; run without --limit/--ids when ready for full ship.');
  }

  console.log(`Done. processedThisRun=${processedThisRun} failures=${failures.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Machine critic pass for UZ localized lessons + selective stronger rewrite.
 *
 * Usage:
 *   node scripts/localize/critic-pass.mjs
 *   node scripts/localize/critic-pass.mjs --sample=50
 *   node scripts/localize/critic-pass.mjs --borderline-only
 *   node scripts/localize/critic-pass.mjs --all
 *
 * Default: critic every lesson that exists; rewrite when score < 0.62 (max 1 retry).
 * Blocks (exit 1) if post-critic failure rate > 2%.
 */
import fs from 'fs';
import {
  API_KEY,
  CONCURRENCY,
  EN_PATH,
  FAIL_RATE_LIMIT,
  FAILURES_PATH,
  LEVELS,
  MODEL_CRITIC,
  MODEL_STRONG,
  OUT_PATH,
  PARTIAL_PATH,
  chatJson,
  compactEnPayload,
  extractBeats,
  loadGlossary,
  normalizeLesson,
  readJson,
  sleep,
  systemPrompt,
  validateLesson,
  validateSense,
  wordCount,
  writeJson,
  uzWordBand,
} from './shared.mjs';

function parseArg(flag) {
  const eq = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  return null;
}

const SAMPLE = Number(parseArg('--sample') || 0) || 0;
const ALL = process.argv.includes('--all');
const BORDERLINE = process.argv.includes('--borderline-only');
const THRESHOLD = Number(process.env.LOCALIZE_CRITIC_THRESHOLD || 0.62);

function packPath() {
  return fs.existsSync(OUT_PATH) ? OUT_PATH : PARTIAL_PATH;
}

function isBorderline(level, enL, uzL) {
  const w = wordCount(uzL.text);
  const [minW, maxW] = uzWordBand(level);
  const near = w < minW * 1.05 || w > maxW * 0.95;
  const v = validateLesson(level, enL, uzL);
  return near || !v.ok;
}

async function criticOne(enL, uzL, level) {
  const local = validateSense(level, enL, uzL);
  if (!local.ok) {
    return {
      id: enL.id,
      level,
      score: 0,
      pass: false,
      issues: local.errors,
      russian_calque: 0,
      localSenseFail: true,
    };
  }
  const beats = extractBeats(enL);
  const parsed = await chatJson({
    model: MODEL_CRITIC,
    temperature: 0.1,
    system: `You are a strict MEANING critic for Latin Uzbek (Oʻzbekcha) learner texts.
Fail (pass=false) if: any EN beat missing/wrong; nonsense; English calques; generic philosophy filler padding; wrong topic.
Score 0–1 for: beat coverage, fluency, naturalness (not MT), Latin-script correctness.
Return ONLY JSON: { "id": "...", "score": 0.0, "pass": true|false, "missing_beats": ["..."], "issues": ["..."], "russian_calque": 0.0 }`,
    user: JSON.stringify({
      level,
      beats,
      en: { id: enL.id, title: enL.title, text: enL.text.slice(0, 1000) },
      uz: { id: uzL.id, title: uzL.title, text: uzL.text.slice(0, 1000) },
    }),
  });
  const score = Number(parsed.score);
  const missing = Array.isArray(parsed.missing_beats) ? parsed.missing_beats : [];
  const issues = [
    ...(Array.isArray(parsed.issues) ? parsed.issues : []),
    ...missing.map((b) => `missing beat: ${b}`),
  ];
  const pass = (parsed.pass === true || score >= THRESHOLD) && missing.length === 0;
  return {
    id: enL.id,
    level,
    score: Number.isFinite(score) ? score : 0,
    pass,
    issues,
    russian_calque: Number(parsed.russian_calque) || 0,
  };
}

async function rewriteStrong(level, enL, sys) {
  const parsed = await chatJson({
    model: MODEL_STRONG,
    temperature: 0.28,
    system: sys,
    user: `Rewrite this ${level} English lesson into natural Latin Uzbek. Fix prior QA issues (calques, leakage, length).
Return JSON: { "lessons": [{ "id", "title", "text", "vocabulary":[{"word","definition"}] }] }
${JSON.stringify([compactEnPayload(enL)])}`,
  });
  const raw = (parsed.lessons || parsed.items || [parsed])[0];
  return normalizeLesson(raw, enL);
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
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
  return results;
}

async function main() {
  console.log('=== UZ critic pass ===');
  if (!API_KEY) {
    console.error('Missing OpenRouter API key — skipping critic (run validate-localized only).');
    process.exit(2);
  }

  const en = readJson(EN_PATH);
  const file = packPath();
  const pack = readJson(file);
  const glossary = loadGlossary();
  const sys = systemPrompt(glossary);

  const queue = [];
  for (const level of LEVELS) {
    for (let i = 0; i < 100; i++) {
      const enL = en[level][i];
      const uzL = pack[level]?.[i];
      if (!uzL?.text) continue;
      if (BORDERLINE && !isBorderline(level, enL, uzL)) continue;
      queue.push({ level, i, enL, uzL });
    }
  }

  let work = queue;
  if (!ALL && !BORDERLINE && SAMPLE > 0) {
    // stratified sample
    work = [];
    for (const level of LEVELS) {
      const slice = queue.filter((q) => q.level === level);
      const n = Math.max(1, Math.ceil(SAMPLE / LEVELS.length));
      work.push(...slice.slice(0, n));
    }
  } else if (!ALL && SAMPLE > 0) {
    work = queue.slice(0, SAMPLE);
  }

  console.log(`Critiquing ${work.length} lessons (threshold ${THRESHOLD})…`);
  const reports = [];
  let rewritten = 0;

  await mapPool(work, Math.min(CONCURRENCY, 4), async (item) => {
    try {
      let report = await criticOne(item.enL, item.uzL, item.level);
      if (!report.pass || report.score < THRESHOLD) {
        console.warn(`  rewrite ${item.enL.id} score=${report.score.toFixed(2)} ${report.issues.slice(0, 2).join('; ')}`);
        const uz2 = await rewriteStrong(item.level, item.enL, sys);
        const v = validateLesson(item.level, item.enL, uz2);
        if (v.ok) {
          pack[item.level][item.i] = uz2;
          rewritten++;
          report = await criticOne(item.enL, uz2, item.level);
          report.rewritten = true;
        } else {
          report.rewriteErrors = v.errors;
          report.pass = false;
        }
      }
      reports.push(report);
      process.stdout.write(`\r  critic ${reports.length}/${work.length} (rewrites ${rewritten})   `);
      await sleep(60);
    } catch (e) {
      reports.push({
        id: item.enL.id,
        level: item.level,
        score: 0,
        pass: false,
        issues: [(e.message || String(e)).slice(0, 160)],
      });
    }
  });
  process.stdout.write('\n');

  writeJson(file, pack);
  if (file === PARTIAL_PATH && work.length >= 500 && pack.Beginner?.every((x) => x?.text)) {
    // promote if complete
    const complete = LEVELS.every((l) => Array.isArray(pack[l]) && pack[l].length === 100 && pack[l].every((x) => x?.text));
    if (complete) writeJson(OUT_PATH, pack);
  } else if (file === OUT_PATH) {
    writeJson(OUT_PATH, pack);
  }

  const failed = reports.filter((r) => !r.pass || r.score < THRESHOLD);
  writeJson(FAILURES_PATH, failed.map((r) => ({
    id: r.id,
    level: r.level,
    errors: r.issues?.length ? r.issues : [`score ${r.score}`],
    score: r.score,
  })));

  const denom = Math.max(work.length, 1);
  const failRate = failed.length / denom;
  console.log(`Critic fails: ${failed.length}/${work.length} (${(failRate * 100).toFixed(2)}%), rewritten=${rewritten}`);
  const ok = failRate <= FAIL_RATE_LIMIT;
  console.log(`RESULT: ${ok ? 'PASS' : 'FAIL'} (limit ${(FAIL_RATE_LIMIT * 100).toFixed(0)}%)`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

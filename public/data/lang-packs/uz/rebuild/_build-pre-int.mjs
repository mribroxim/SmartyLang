/**
 * Assemble Pre-Intermediate.json from agent-authored chunk modules.
 *   node public/data/lang-packs/uz/rebuild/_build-pre-int.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EN_PATH,
  REBUILD_DIR,
  normalizeLesson,
  targetSecondsFor,
  validateLesson,
  validateSense,
  wordCount,
  writeJson,
} from '../../../../../scripts/localize/shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVEL = 'Pre-Intermediate';

async function loadChunks() {
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => /^_chunk-p\d+-p\d+\.mjs$/i.test(f))
    .sort();
  const all = [];
  for (const f of files) {
    const mod = await import(pathToFileUrl(path.join(__dirname, f)));
    const lessons = mod.lessons || mod.default || [];
    all.push(...lessons);
    console.log(`loaded ${f}: ${lessons.length}`);
  }
  return all;
}

function pathToFileUrl(p) {
  const normalized = path.resolve(p).replace(/\\/g, '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

async function main() {
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'))[LEVEL];
  const authored = await loadChunks();
  const byId = new Map(authored.map((l) => [l.id, l]));

  const missing = en.filter((e) => !byId.get(e.id)?.text).map((e) => e.id);
  if (missing.length) {
    console.error(`Missing ${missing.length}: ${missing.join(',')}`);
  }

  const out = [];
  const failures = [];
  for (const enL of en) {
    const raw = byId.get(enL.id);
    if (!raw?.text) {
      failures.push({ id: enL.id, errors: ['missing authored text'] });
      continue;
    }
    const lesson = normalizeLesson(raw, enL);
    lesson.targetSeconds = targetSecondsFor(lesson.text);
    const v = validateLesson(LEVEL, enL, lesson);
    const s = validateSense(LEVEL, enL, lesson);
    if (!v.ok || !s.ok) {
      failures.push({
        id: enL.id,
        errors: [...(v.errors || []), ...(s.errors || [])],
        words: wordCount(lesson.text),
      });
      console.error(`FAIL ${enL.id}: ${(v.errors || []).concat(s.errors || []).join('; ')}`);
    } else {
      console.log(`OK ${enL.id} ${wordCount(lesson.text)}w`);
    }
    out.push(lesson);
  }

  const dest = path.join(REBUILD_DIR, 'Pre-Intermediate.json');
  writeJson(dest, out);
  writeJson(path.join(REBUILD_DIR, '_pre-int-failures.json'), failures);
  console.log(`\nWrote ${out.length}/100 → ${dest}`);
  console.log(`Failures: ${failures.length}`);
  if (out.length !== 100 || failures.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

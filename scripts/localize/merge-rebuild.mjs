#!/usr/bin/env node
/**
 * Merge sibling-authored per-level UZ rebuild files into partial + final pack.
 *
 * Expects:
 *   public/data/lang-packs/uz/rebuild/Beginner.json
 *   …/Elementary.json, Pre-Intermediate.json, Intermediate.json, Advanced.json
 *
 * Each file: array of 100 lessons OR { "Beginner": [...] } / { "lessons": [...] }
 *
 * Usage:
 *   node scripts/localize/merge-rebuild.mjs
 *   node scripts/localize/merge-rebuild.mjs --wait          # poll until all 5 ready
 *   node scripts/localize/merge-rebuild.mjs --wait --timeout-ms=3600000
 *   node scripts/localize/merge-rebuild.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import {
  EN_PATH,
  LEVELS,
  OUT_PATH,
  PARTIAL_PATH,
  REBUILD_DIR,
  REBUILD_LEVEL_FILES,
  ensureDir,
  normalizeLesson,
  readJson,
  sleep,
  targetSecondsFor,
  validateLesson,
  validateSense,
  writeJson,
} from './shared.mjs';

function parseArg(flag) {
  const eq = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  return null;
}

const WAIT = process.argv.includes('--wait');
const DRY = process.argv.includes('--dry-run');
const TIMEOUT_MS = Number(parseArg('--timeout-ms') || 90 * 60 * 1000);
const POLL_MS = Number(parseArg('--poll-ms') || 15000);

function levelPath(level) {
  return path.join(REBUILD_DIR, REBUILD_LEVEL_FILES[level]);
}

function coerceLessons(raw, level) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.[level])) return raw[level];
  if (Array.isArray(raw?.lessons)) return raw.lessons;
  if (raw && typeof raw === 'object') {
    // map keyed by id
    const vals = Object.values(raw).filter((x) => x && typeof x === 'object' && x.id && x.text);
    if (vals.length) return vals;
  }
  return null;
}

function inspectLevel(level, enArr) {
  const file = levelPath(level);
  if (!fs.existsSync(file)) {
    return { ready: false, path: file, count: 0, missing: enArr.map((x) => x.id), errors: ['file missing'] };
  }
  let raw;
  try {
    raw = readJson(file);
  } catch (e) {
    return { ready: false, path: file, count: 0, missing: enArr.map((x) => x.id), errors: [`JSON parse: ${e.message}`] };
  }
  const arr = coerceLessons(raw, level);
  if (!arr) {
    return { ready: false, path: file, count: 0, missing: enArr.map((x) => x.id), errors: ['expected array of lessons'] };
  }
  const byId = new Map(arr.filter((x) => x?.id).map((x) => [x.id, x]));
  const missing = [];
  const errors = [];
  const ordered = [];
  for (const enL of enArr) {
    const uz = byId.get(enL.id);
    if (!uz?.text) {
      missing.push(enL.id);
      continue;
    }
    ordered.push(uz);
  }
  if (arr.length !== 100) errors.push(`got ${arr.length} entries (want 100)`);
  if (missing.length) errors.push(`missing ids: ${missing.join(',')}`);
  return {
    ready: missing.length === 0 && ordered.length === 100,
    path: file,
    count: ordered.length,
    missing,
    errors,
    ordered,
  };
}

async function waitAll(en) {
  ensureDir(REBUILD_DIR);
  const start = Date.now();
  for (;;) {
    const reports = LEVELS.map((level) => inspectLevel(level, en[level]));
    const ready = reports.filter((r) => r.ready).length;
    const line = reports
      .map((r, i) => `${LEVELS[i]}:${r.ready ? 'OK' : `${r.count}/100`}`)
      .join(' ');
    console.log(`[${new Date().toISOString()}] rebuild ${ready}/5  ${line}`);
    if (ready === 5) return reports;
    if (Date.now() - start > TIMEOUT_MS) {
      console.error('Timeout waiting for rebuild level files.');
      for (const r of reports) {
        if (!r.ready) {
          console.error(`  ${path.basename(r.path)}: ${r.errors.join('; ') || `missing ${r.missing.join(',')}`}`);
        }
      }
      process.exit(2);
    }
    await sleep(POLL_MS);
  }
}

function mainSync(en, reports) {
  const pack = {};
  const schemaFails = [];
  const senseFails = [];

  for (let li = 0; li < LEVELS.length; li++) {
    const level = LEVELS[li];
    const report = reports[li];
    if (!report.ready) {
      console.error(`Incomplete: ${level} — missing ${report.missing.join(',') || '(file)'}`);
      process.exit(2);
    }
    const out = [];
    for (let i = 0; i < 100; i++) {
      const enL = en[level][i];
      let uz = report.ordered[i];
      if (uz.id !== enL.id) {
        uz = report.ordered.find((x) => x.id === enL.id) || uz;
      }
      const normalized = normalizeLesson(uz, enL);
      if (!normalized.targetSeconds) {
        normalized.targetSeconds = targetSecondsFor(normalized.text);
      }
      const v = validateLesson(level, enL, normalized);
      if (!v.ok) schemaFails.push({ id: enL.id, level, errors: v.errors });
      const s = validateSense(level, enL, normalized);
      if (!s.ok) senseFails.push({ id: enL.id, level, errors: s.errors });
      out.push(normalized);
    }
    pack[level] = out;
  }

  console.log(`Schema fails: ${schemaFails.length}; Sense fails: ${senseFails.length}`);
  if (schemaFails.length) {
    console.log('Schema sample:');
    for (const f of schemaFails.slice(0, 15)) {
      console.log(`  ${f.level}/${f.id}: ${f.errors.join('; ')}`);
    }
  }
  if (senseFails.length) {
    console.log('Sense sample:');
    for (const f of senseFails.slice(0, 15)) {
      console.log(`  ${f.level}/${f.id}: ${f.errors.join('; ')}`);
    }
  }

  if (DRY) {
    console.log('--dry-run: not writing pack');
    process.exit(schemaFails.length || senseFails.length ? 1 : 0);
  }

  writeJson(PARTIAL_PATH, pack);
  console.log(`Wrote partial: ${PARTIAL_PATH}`);

  if (schemaFails.length || senseFails.length) {
    writeJson(path.join(REBUILD_DIR, 'merge-failures.json'), { schemaFails, senseFails });
    console.error('Not promoting to final pack until schema+sense are green.');
    console.error('Fix the listed IDs in rebuild/<Level>.json and re-run merge.');
    process.exit(1);
  }

  writeJson(OUT_PATH, pack);
  console.log(`Wrote final: ${OUT_PATH}`);
  console.log('500/500 merged OK');
}

async function main() {
  ensureDir(REBUILD_DIR);
  // Placeholder README for sibling agents
  const readme = path.join(REBUILD_DIR, 'README.md');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      `# UZ rebuild drop folder

Sibling agents write one file each (100 lessons, Latin Oʻzbekcha):

- \`Beginner.json\`
- \`Elementary.json\`
- \`Pre-Intermediate.json\`
- \`Intermediate.json\`
- \`Advanced.json\`

Format: JSON array of \`{ id, title, text, vocabulary, targetSeconds }\` aligned to EN ids (\`b1\`–\`a100\`).

Coordinator merges with \`node scripts/localize/merge-rebuild.mjs --wait\`.
**Do not** pad with kernel filler bridges.
`,
      'utf8',
    );
  }

  const en = readJson(EN_PATH);
  const reports = WAIT
    ? await waitAll(en)
    : LEVELS.map((level) => inspectLevel(level, en[level]));

  if (!WAIT) {
    const incomplete = reports.filter((r) => !r.ready);
    if (incomplete.length) {
      console.log('Rebuild status:');
      for (let i = 0; i < LEVELS.length; i++) {
        const r = reports[i];
        console.log(
          `  ${LEVELS[i]}: ${r.ready ? 'ready' : `NOT ready (${r.count}/100)`} — ${r.path}`,
        );
        if (r.missing?.length) {
          console.log(`    missing: ${r.missing.join(',')}`);
        }
        if (r.errors?.length) console.log(`    ${r.errors.join('; ')}`);
      }
      process.exit(2);
    }
  }

  mainSync(en, reports);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

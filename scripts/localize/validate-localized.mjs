#!/usr/bin/env node
/**
 * Local gates for UZ localized level-texts (no API).
 *
 * Usage:
 *   node scripts/localize/validate-localized.mjs
 *   node scripts/localize/validate-localized.mjs --file=public/data/lang-packs/uz/level-texts.json
 */
import fs from 'fs';
import path from 'path';
import {
  EN_PATH,
  FAIL_RATE_LIMIT,
  FAILURES_PATH,
  LEVELS,
  OUT_PATH,
  PARTIAL_PATH,
  ROOT,
  readJson,
  validateLesson,
  wordCount,
  writeJson,
  uzWordBand,
} from './shared.mjs';

function parseArg(flag) {
  const eq = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  return null;
}

const fileArg = parseArg('--file');
const packPath = fileArg
  ? path.isAbsolute(fileArg)
    ? fileArg
    : path.join(ROOT, fileArg)
  : fs.existsSync(OUT_PATH)
    ? OUT_PATH
    : PARTIAL_PATH;

const en = readJson(EN_PATH);
const pack = readJson(packPath);

const failures = [];
const stats = [];

for (const level of LEVELS) {
  const enArr = en[level];
  const uzArr = pack[level];
  if (!Array.isArray(uzArr) || uzArr.length !== 100) {
    failures.push({ id: level, level, errors: [`expected 100 lessons, got ${uzArr?.length}`] });
    continue;
  }
  if (enArr.length !== 100) {
    failures.push({ id: level, level, errors: [`EN expected 100, got ${enArr.length}`] });
    continue;
  }
  const [minW, maxW] = uzWordBand(level);
  const words = [];
  for (let i = 0; i < 100; i++) {
    const enL = enArr[i];
    const uzL = uzArr[i];
    if (!uzL) {
      failures.push({ id: enL.id, level, errors: ['missing lesson'] });
      continue;
    }
    const v = validateLesson(level, enL, uzL);
    if (!v.ok) failures.push({ id: enL.id, level, errors: v.errors });
    words.push(wordCount(uzL?.text));
  }
  const avg = words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : 0;
  stats.push({ level, band: `${minW}-${maxW}`, avgWords: avg, min: Math.min(...words), max: Math.max(...words) });
}

writeJson(FAILURES_PATH, failures);

console.log(`Validating: ${packPath}`);
for (const s of stats) {
  console.log(`  ${s.level}: avg ${s.avgWords} words (band ${s.band}, range ${s.min}-${s.max})`);
}

const total = 500;
const failRate = failures.length / total;
console.log(`\nFailures: ${failures.length}/${total} (${(failRate * 100).toFixed(2)}%)`);
if (failures.length) {
  console.log('Sample:');
  for (const f of failures.slice(0, 12)) {
    console.log(`  ${f.level}/${f.id}: ${f.errors.join('; ')}`);
  }
}

const ok = failRate <= FAIL_RATE_LIMIT && failures.length <= Math.floor(total * FAIL_RATE_LIMIT);
console.log(`\nRESULT: ${ok ? 'PASS' : 'FAIL'} (limit ${(FAIL_RATE_LIMIT * 100).toFixed(0)}%)`);
process.exit(ok ? 0 : 1);

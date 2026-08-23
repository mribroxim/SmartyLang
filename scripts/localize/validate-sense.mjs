#!/usr/bin/env node
/**
 * Sense QA for UZ level-texts — fails on kernel fillers / known calques.
 * Length alone is NOT enough (see also validate-localized.mjs).
 *
 * Usage:
 *   node scripts/localize/validate-sense.mjs
 *   node scripts/localize/validate-sense.mjs --file=public/data/lang-packs/uz/level-texts.json
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
  validateSense,
  writeJson,
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

for (const level of LEVELS) {
  const enArr = en[level] || [];
  const uzArr = pack[level] || [];
  for (let i = 0; i < Math.max(enArr.length, uzArr.length); i++) {
    const enL = enArr[i];
    const uzL = uzArr[i];
    if (!enL) continue;
    if (!uzL?.text) {
      failures.push({ id: enL.id, level, errors: ['missing lesson text'] });
      continue;
    }
    const v = validateSense(level, enL, uzL);
    if (!v.ok) failures.push({ id: enL.id, level, errors: v.errors });
  }
}

const sensePath = path.join(path.dirname(FAILURES_PATH), 'localize-sense-failures.json');
writeJson(sensePath, failures);

console.log(`Sense-validating: ${packPath}`);
console.log(`Failures: ${failures.length}/500`);
if (failures.length) {
  console.log('Sample:');
  for (const f of failures.slice(0, 20)) {
    console.log(`  ${f.level}/${f.id}: ${f.errors.join('; ')}`);
  }
}

const failRate = failures.length / 500;
const ok = failRate <= FAIL_RATE_LIMIT;
console.log(`\nRESULT: ${ok ? 'PASS' : 'FAIL'} (limit ${(FAIL_RATE_LIMIT * 100).toFixed(0)}%)`);
process.exit(ok ? 0 : 1);

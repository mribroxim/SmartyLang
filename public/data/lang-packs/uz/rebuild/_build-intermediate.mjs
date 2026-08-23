/**
 * Build Intermediate.json: polish i1–i86 from existing pack + agent-authored i87–i100.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EN_PATH,
  OUT_PATH,
  REBUILD_DIR,
  normalizeLesson,
  validateLesson,
  writeJson,
  targetSecondsFor,
  wordCount,
} from '../../../../../scripts/localize/shared.mjs';
import { LESSONS_I87_I100 as BASE } from './_i87-i100.mjs';
import { EXPANSIONS } from './_expansions-i87-i100.mjs';

export const LESSONS_I87_I100 = BASE.map((l) => ({
  ...l,
  text: EXPANSIONS[l.id] ? `${l.text.trimEnd()}${EXPANSIONS[l.id]}` : l.text,
}));


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TITLE_FIXES = {
  i51: 'Did shaxsiymi yoki jim oʻrgatilganmi?',
};

function fixMarks(s) {
  return String(s || '')
    .replace(/o'/g, 'oʻ')
    .replace(/g'/g, 'gʻ')
    .replace(/O'/g, 'Oʻ')
    .replace(/G'/g, 'Gʻ');
}

function main() {
  const enPack = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const uzPack = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  const en = enPack.Intermediate;
  const uz = uzPack.Intermediate;
  const authored = Object.fromEntries(LESSONS_I87_I100.map((l) => [l.id, l]));

  const out = [];
  const failures = [];

  for (let i = 0; i < 100; i++) {
    const enL = en[i];
    let raw;
    if (authored[enL.id]) {
      raw = authored[enL.id];
    } else {
      raw = uz[i];
      if (TITLE_FIXES[enL.id]) raw = { ...raw, title: TITLE_FIXES[enL.id] };
    }
    const lesson = normalizeLesson(
      {
        ...raw,
        title: fixMarks(raw.title),
        text: fixMarks(raw.text),
        vocabulary: (raw.vocabulary || []).map((v) => ({
          word: fixMarks(v.word),
          definition: fixMarks(v.definition),
        })),
      },
      enL,
    );
    lesson.targetSeconds = targetSecondsFor(lesson.text);
    const v = validateLesson('Intermediate', enL, lesson);
    if (!v.ok) {
      failures.push({ id: lesson.id, errors: v.errors, words: wordCount(lesson.text) });
      console.error(`FAIL ${lesson.id}: ${v.errors.join('; ')}`);
    } else {
      console.log(`OK ${lesson.id} ${wordCount(lesson.text)}w`);
    }
    out.push(lesson);
  }

  const dest = path.join(REBUILD_DIR, 'Intermediate.json');
  writeJson(dest, out);
  writeJson(path.join(REBUILD_DIR, '_intermediate-failures.json'), failures);
  console.log(`\nWrote ${out.length} lessons → ${dest}`);
  console.log(`Failures: ${failures.length}`);
  if (failures.length) process.exitCode = 1;
}

main();

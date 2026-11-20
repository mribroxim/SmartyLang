/**
 * Bundles content/<lang>/<section>/unit-*.json into one file the app fetches:
 * public/data/course/<lang>-<section>.json. Only units that pass the
 * validator should be bundled (run validate-lessons first).
 *
 *   node scripts/content/build-course.mjs [lang] [section]
 */
import fs from 'node:fs';

const [lang = 'en', section = 'beginner'] = process.argv.slice(2);
const dir = new URL(`../../content/${lang}/${section}/`, import.meta.url);
const units = fs.readdirSync(dir).filter((f) => /^unit-\d+\.json$/.test(f)).sort()
  .map((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
const course = {
  lang, section, version: 1,
  units: units.map((u) => ({ unit: u.unit, title: u.title, room: u.room, lessons: u.lessons })),
};
const out = new URL(`../../public/data/course/${lang}-${section}.json`, import.meta.url);
fs.writeFileSync(out, JSON.stringify(course));
// The app reads this list to know which courses exist (no code change per course).
const indexFile = new URL('../../public/data/course/index.json', import.meta.url);
let index = [];
try { index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch { /* first course */ }
index = [...index.filter((c) => !(c.lang === lang && c.section === section)), { lang, section, units: units.length, lessons: units.reduce((a, u) => a + u.lessons.length, 0) }]
  .sort((a, b) => a.lang.localeCompare(b.lang) || a.section.localeCompare(b.section));
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
console.log(`course ${lang}-${section}: ${units.length} units, ${units.reduce((a, u) => a + u.lessons.length, 0)} lessons, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);

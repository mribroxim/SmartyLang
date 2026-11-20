/**
 * Builds a ready-to-paste Gemini prompt that designs one level of a new
 * language course, using the English level as the reference for units,
 * topics and rooms. Save Gemini's answer as docs/curriculum/<lang>/<file>.md,
 * then run: node scripts/content/plan-from-curriculum.mjs --all <lang>
 *
 *   node scripts/content/curriculum-prompt.mjs <lang> <section>
 * → content/<lang>/prompts/curriculum-<section>.txt
 */
import fs from 'node:fs';
import path from 'node:path';

const LEVELS = { beginner: ['a1-beginner', 'Beginner (A1)'], elementary: ['a2-elementary', 'Elementary (A2)'], 'pre-intermediate': ['b1-pre-intermediate', 'Pre-Intermediate (B1)'], intermediate: ['b2-intermediate', 'Intermediate (B2)'], advanced: ['c1-advanced', 'Advanced (C1)'] };
const ORDER = Object.keys(LEVELS);
const LANG_NAMES = { es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', uz: 'Uzbek', tl: 'Tagalog (Filipino)', ar: 'Arabic (Modern Standard)', zh: 'Chinese (Mandarin, Simplified)', en: 'English' };
const GUIDES = {
  es: 'E.g. ser vs estar early and gradually; gender and agreement from Unit 1; present tense regular then key irregulars (ser, estar, tener, ir, querer); gustar construction; preterite vs imperfect across A2–B1; subjunctive from B1.',
  fr: 'E.g. gender and articles (le/la/les, un/une) from Unit 1; être/avoir/aller/faire early; liaison and elision; passé composé (avoir/être) at A2, imparfait contrast at A2–B1; subjunctive from B1.',
  de: 'E.g. der/die/das from Unit 1 with each noun; sein/haben early; verb-second word order; accusative at A1, dative at A1–A2; separable verbs; Perfekt at A2; Präteritum of sein/haben/modals; subordinate clause word order from A2.',
  ru: 'E.g. Unit 0 = Cyrillic alphabet and sounds (letters in small groups, cognates); gender; no "to be" in present; cases introduced one at a time (nominative, prepositional for location, accusative, genitive for "have/no", then dative/instrumental); aspect pairs from A2; motion verbs from A2–B1.',
  uz: 'E.g. Unit 0 = Latin alphabet with oʻ, gʻ, sh, ch, ng sounds; vowel harmony is weak but suffix order matters: plural -lar, possessive -im/-ing, cases (-ni, -ga, -da, -dan) one at a time; "bor/yoʻq"; present-future -a/-y + personal endings; past -di; SOV word order from the start.',
  tl: 'E.g. ang/ng/sa markers early; ako/ikaw/siya; "may/mayroon"; verb focus (actor focus -um-/mag- first, then object focus -in/-an at A2); aspect (completed/ongoing/contemplated) from A1–A2; linker na/-ng; respectful po/opo.',
  ar: 'E.g. Unit 0 = Arabic script in small groups (letter shapes by position, short vowels with harakat, sun/moon letters with al-); gender (-a/ة); nominal sentences without "to be"; attached pronouns; present tense (mudāriʿ) before past (māḍī); dual and broken plurals gradually; numbers with agreement later.',
  zh: 'E.g. Unit 0 = pinyin, the four tones and neutral tone, then characters introduced gradually (each new character must be taught as or within an item); 是/有; measure words (个, 本, 杯) early; 了/过 aspect at A2; complements and 把 from B1. Every item: characters (with pinyin given in the lesson note).',
};

const [lang, section] = process.argv.slice(2);
if (!lang || !LEVELS[section]) { console.error('Usage: node scripts/content/curriculum-prompt.mjs <lang> <beginner|elementary|pre-intermediate|intermediate|advanced>'); process.exit(1); }
const [file, heading] = LEVELS[section];
const english = fs.readFileSync(path.join('docs', 'curriculum', `${file}.md`), 'utf8');
const earlier = ORDER.slice(0, ORDER.indexOf(section)).map((s) => path.join('docs', 'curriculum', lang, `${LEVELS[s][0]}.md`)).filter(fs.existsSync).map((f) => fs.readFileSync(f, 'utf8')).join('\n\n') || '(none yet: this is the first level)';
const b1plus = ORDER.indexOf(section) >= 2;
const vars = {
  LANG_NAME: LANG_NAMES[lang] ?? lang, LEVEL_NAME: heading, LEVEL_HEADING: heading, LANG_GUIDE: GUIDES[lang] ?? '', EARLIER: earlier, ENGLISH: english,
  EXPOSURE_HEADER: b1plus ? ' Exposure |' : '', EXPOSURE_RULE: b1plus ? '---|' : '', EXPOSURE_CELL: b1plus ? ' word, word |' : '', EXPOSURE_DASH: b1plus ? ' — |' : '',
};
const text = fs.readFileSync('docs/prompts/curriculum-prompt.md', 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
const out = path.join('content', lang, 'prompts', `curriculum-${section}.txt`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, text);
console.log(`${out} (${Math.round(text.length / 1024)} KB). Save Gemini's answer as docs/curriculum/${lang}/${file}.md`);

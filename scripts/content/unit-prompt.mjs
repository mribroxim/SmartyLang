/**
 * Builds a ready-to-paste Gemini prompt for one unit:
 * the method + format (docs/prompts/unit-prompt.md), this unit's plan, every
 * item taught before it (earlier units and earlier levels) and an example lesson.
 *
 *   node scripts/content/unit-prompt.mjs <lang> <section> <unit>
 *   node scripts/content/unit-prompt.mjs <lang> <section> --all
 * → content/<lang>/<section>/prompts/unit-NN.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { LANGUAGE_WHITELISTS, SECTION_ORDER } from './validate-lessons.mjs';

const LANG_NAMES = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', uz: 'Uzbek', tl: 'Tagalog (Filipino)', ar: 'Arabic', zh: 'Chinese (Mandarin)' };
const LEVEL_NAMES = { beginner: 'Beginner (CEFR A1)', elementary: 'Elementary (A2)', 'pre-intermediate': 'Pre-Intermediate (B1)', intermediate: 'Intermediate (B2)', advanced: 'Advanced (C1)' };
const SHORT = { beginner: 'a1', elementary: 'a2', 'pre-intermediate': 'b1', intermediate: 'b2', advanced: 'c1' };
const LANG_NOTES = {
  en: 'Use British or American spelling consistently (American).',
  es: 'Neutral international Spanish (usted only where politeness needs it; tú by default). Use ¿ ? and ¡ !. List gender/number forms (el/la, -o/-a, plurals) and verb forms you use in `forms`.',
  fr: 'Standard French. Elided forms (l\', d\', j\', qu\') count as separate tokens: teach "le/la/l\'" etc. List gender, plural and verb forms you use in `forms`.',
  de: 'Standard German, du by default (Sie where politeness needs it). Capitalise nouns. List article/case forms (der/die/das/den/dem) and verb forms you use in `forms`.',
  ru: 'Standard Russian in Cyrillic, ты by default. Put stress marks only in `note` when helpful, not in target text. List case and verb forms you use in `forms` (книга, книгу, книги…).',
  uz: 'Uzbek in the official Latin script (oʻ, gʻ written o\' g\' are fine). List suffixed forms you use in `forms` (kitob, kitobim, kitoblar…).',
  tl: 'Everyday Tagalog/Filipino as spoken today (common English loanwords are fine where natural). List affixed verb forms you use in `forms` (kain, kumain, kumakain, kakain…).',
  ar: 'Modern Standard Arabic. At A1–A2 write full vowel marks (harakat) on `items[].text` and `example`; the checker ignores vowel marks. List forms with attached pronouns or plurals you use in `forms`.',
  zh: 'Mandarin in Simplified characters. Every character used must belong to a taught item (or a form), so introduce characters gradually. Put pinyin with tone marks at the start of each item `note`, e.g. "nǐ hǎo – Say 你好 to greet someone."',
};

const [lang, section, unitArg] = process.argv.slice(2);
if (!lang || !section || !unitArg) { console.error('Usage: node scripts/content/unit-prompt.mjs <lang> <section> <unit|--all>'); process.exit(1); }
const planFile = (s) => path.join('content', lang, s, 'plan.json');
const plan = JSON.parse(fs.readFileSync(planFile(section), 'utf8'));
const template = fs.readFileSync('docs/prompts/unit-prompt.md', 'utf8');
const wl = LANGUAGE_WHITELISTS[lang] ?? LANGUAGE_WHITELISTS.en;

// A complete, validated example lesson (format reference).
const exampleLesson = () => fs.readFileSync('docs/prompts/example-lesson.json', 'utf8').trim();
const EXAMPLE = exampleLesson();

function taughtBefore(unitNo) {
  const lines = [];
  for (const s of SECTION_ORDER.slice(0, SECTION_ORDER.indexOf(section) + 1)) {
    if (!fs.existsSync(planFile(s))) continue;
    const p = JSON.parse(fs.readFileSync(planFile(s), 'utf8'));
    for (const u of p.units) {
      if (s === section && u.unit >= unitNo) continue;
      const items = u.lessons.flatMap((l) => l.items);
      if (items.length) lines.push(`## ${LEVEL_NAMES[s]} · Unit ${u.unit}: ${u.title}`, ...items.map((i) => `${i.id} = ${i.text}`));
    }
  }
  return lines.length ? lines.join('\n') : '(nothing yet: this is the first unit)';
}

function build(u) {
  const unitPlan = { unit: u.unit, title: u.title, room: u.room, lessons: u.lessons.map((l) => ({ lesson: l.lesson, type: l.type, title: l.title, canDo: l.canDo, items: l.items.map(({ id, text, kind, image }) => ({ id, text, kind, ...(image ? { picture: true } : {}) })), ...(l.exposure?.length ? { suggestedExposure: l.exposure } : {}) })) };
  const vars = {
    LANG: lang, LANG_NAME: LANG_NAMES[lang] ?? lang, LANG_NOTES: LANG_NOTES[lang] ?? '', SECTION: section, SECTION_SHORT: SHORT[section] ?? section,
    LEVEL_NAME: LEVEL_NAMES[section] ?? section, UNIT: String(u.unit), UNIT_PAD: String(u.unit).padStart(2, '0'), UNIT_TITLE: u.title, ROOM: u.room,
    UNIT_CANDO: u.canDo, UNIT_GRAMMAR: u.grammar, NAMES: wl.names.join(', '), NUMBERS: wl.numbers.join(', '),
    UNIT_PLAN: JSON.stringify(unitPlan, null, 1), TAUGHT_BEFORE: taughtBefore(u.unit), EXAMPLE,
  };
  const text = template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
  const out = path.join('content', lang, section, 'prompts', `unit-${String(u.unit).padStart(2, '0')}.txt`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text);
  console.log(`${out} (${Math.round(text.length / 1024)} KB)`);
}

const units = unitArg === '--all' ? plan.units : plan.units.filter((u) => u.unit === Number(unitArg));
if (!units.length) { console.error(`unit ${unitArg} not in ${planFile(section)}`); process.exit(1); }
units.forEach(build);

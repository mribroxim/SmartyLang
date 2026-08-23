#!/usr/bin/env node
/**
 * Generate Intermediate units 4–10 (i31–i100) from meta + content cores.
 * Run: node scripts/curriculum/gen-intermediate-remaining.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCount } from './helpers.mjs';
import { CORES_4 } from './_int-cores-4.mjs';
import { CORES_5_7 } from './_int-cores-5-7.mjs';
import { CORES_7 } from './_int-cores-7.mjs';
import { CORES_8_10 } from './_int-cores-8-10.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'generated', '_intermediate-meta.json'), 'utf8')
);

const ALL_CORES = { ...CORES_4, ...CORES_5_7, ...CORES_7, ...CORES_8_10 };

const UNIT_FILES = {
  4: 'u04-science.mjs',
  5: 'u05-markets.mjs',
  6: 'u06-culture.mjs',
  7: 'u07-health.mjs',
  8: 'u08-language.mjs',
  9: 'u09-nature.mjs',
  10: 'u10-leadership.mjs',
};

const UNIT_HEADERS = {
  4: 'Science in Daily Life (i31–i40)',
  5: 'Fairness, Money & Markets (i41–i50)',
  6: 'Culture, Taste & Creativity (i51–i60)',
  7: 'Health Systems & Personal Choice (i61–i70)',
  8: 'Language, Persuasion & Truth (i71–i80)',
  9: 'Nature, Risk & Responsibility (i81–i90)',
  10: 'Leadership, Habits & Growth (i91–i100)',
};

function expandToRange(metaItem, paras, min = 450, max = 580) {
  let text = paras.map((p) => p.trim()).join('\n\n');
  let w = wordCount(text);
  const q = metaItem.coreQuestion.replace(/\?$/, '');
  const extras = [
    `\n\nIn everyday talk about ${metaItem.vocabularyDomain}, people often reach for slogans because slogans travel faster than careful sentences. ${q}? rewards a slower tempo. Discourse markers—however, in practice, at the same time—help speakers keep more than one truth in view without collapsing into contradiction. That is not fence-sitting; it is adult cognition under social pressure.`,
    `\n\nLearners working at intermediate level can treat “${metaItem.title}” as a rehearsal space for ${metaItem.grammarFocus.join(' and ')}. The aim is not ornamental grammar. The aim is control: the ability to qualify a claim, concede a limit, and still take a position worth defending. ${metaItem.languageGoal}. When language becomes more precise, disagreements become more negotiable, and negotiable disagreements are less likely to harden into identity wars.`,
    `\n\nFinally, ${metaItem.communicationGoal.charAt(0).toLowerCase()}${metaItem.communicationGoal.slice(1)}. None of these habits require perfection. They require practice in ordinary rooms—kitchens, clinics, group chats, and council meetings—where evidence is incomplete and feelings are loud. A person who can stay analytical without becoming cold, and humane without becoming vague, is already doing the real work this unit trains.`,
  ];
  let i = 0;
  while (w < min && i < extras.length) {
    text += extras[i];
    w = wordCount(text);
    i += 1;
  }
  while (w < min) {
    text += `\n\nWhat remains is method: notice the hidden assumption, name the evidence you actually have, and leave a door open for revision when better information arrives. That method travels well beyond a single lesson and keeps curiosity from turning into either cynicism or gullibility.`;
    w = wordCount(text);
  }
  if (w > max) {
    const parts = text.split('\n\n');
    while (wordCount(parts.join('\n\n')) > max && parts.length > 4) {
      parts.pop();
    }
    text = parts.join('\n\n');
  }
  // If trimming made it short again, add a compact closer
  w = wordCount(text);
  if (w < min) {
    text += `\n\nKeeping these distinctions in view—evidence versus comfort, fairness versus convenience, courage versus performance—gives intermediate readers a portable habit: slow down just enough to choose words that match the world they actually share.`;
  }
  return text.trim();
}

function lessonFromMeta(m, core) {
  const text = expandToRange(m, core.paras);
  const vocab = core.vocab.slice(0, 16);
  while (vocab.length < 12) {
    vocab.push(['nuance', 'a small but important difference in meaning']);
  }
  return {
    id: m.id,
    title: m.title,
    unit: m.unit,
    unitName: m.unitName,
    format: m.format,
    coreQuestion: m.coreQuestion,
    languageGoal: m.languageGoal,
    communicationGoal: m.communicationGoal,
    grammarFocus: m.grammarFocus,
    vocabularyDomain: m.vocabularyDomain,
    text,
    vocabulary: vocab,
  };
}

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function formatLesson(lesson) {
  const vocab = lesson.vocabulary
    .map(([w, d]) => `      [${JSON.stringify(w)}, ${JSON.stringify(d)}],`)
    .join('\n');
  const gf = lesson.grammarFocus.map((g) => JSON.stringify(g)).join(', ');
  return `  {
    id: ${JSON.stringify(lesson.id)},
    title: ${JSON.stringify(lesson.title)},
    unit: ${lesson.unit},
    unitName: ${JSON.stringify(lesson.unitName)},
    format: ${JSON.stringify(lesson.format)},
    coreQuestion: ${JSON.stringify(lesson.coreQuestion)},
    languageGoal: ${JSON.stringify(lesson.languageGoal)},
    communicationGoal: ${JSON.stringify(lesson.communicationGoal)},
    grammarFocus: [${gf}],
    vocabularyDomain: ${JSON.stringify(lesson.vocabularyDomain)},
    text: \`${esc(lesson.text)}\`,
    vocabulary: [
${vocab}
    ],
  }`;
}

const byUnit = {};
const missing = [];
const stats = [];

for (const m of meta) {
  if (m.unit < 4) continue;
  if (!ALL_CORES[m.id]) {
    missing.push(m.id);
    continue;
  }
  const lesson = lessonFromMeta(m, ALL_CORES[m.id]);
  const w = wordCount(lesson.text);
  stats.push({ id: m.id, w, v: lesson.vocabulary.length });
  if (w < 400 || w > 650) console.log(m.id, w, w < 400 ? 'SHORT' : 'LONG');
  (byUnit[m.unit] ||= []).push(lesson);
}

if (missing.length) {
  console.error('Missing cores:', missing.join(', '));
  process.exit(1);
}

const outDir = path.join(__dirname, 'intermediate-units');
for (const [unit, lessons] of Object.entries(byUnit)) {
  const u = Number(unit);
  const body = lessons.map(formatLesson).join(',\n');
  const file = `/** Intermediate Unit ${u}: ${UNIT_HEADERS[u]} */\nexport default [\n${body}\n];\n`;
  fs.writeFileSync(path.join(outDir, UNIT_FILES[u]), file);
  console.log('Wrote', UNIT_FILES[u], lessons.length);
}

const words = stats.map((s) => s.w);
console.log(
  `units 4–10: ${stats.length} lessons | min ${Math.min(...words)} max ${Math.max(...words)} avg ${Math.round(words.reduce((a, b) => a + b, 0) / words.length)}`
);

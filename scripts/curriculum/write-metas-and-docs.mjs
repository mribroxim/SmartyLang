#!/usr/bin/env node
/**
 * Validate en-curriculum-plan.json (all 5 levels), write meta extracts + docs/CURRICULUM_EN.md.
 * Does not modify Beginner or Elementary units in the plan.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planPath = path.join(__dirname, 'en-curriculum-plan.json');
const genDir = path.join(__dirname, 'generated');
const mdPath = path.join(__dirname, '../../docs/CURRICULUM_EN.md');

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const PREFIX = {
  Beginner: 'b',
  Elementary: 'e',
  'Pre-Intermediate': 'p',
  Intermediate: 'i',
  Advanced: 'a',
};
const META_FILES = {
  Beginner: '_beginner-meta.json',
  Elementary: '_elementary-meta.json',
  'Pre-Intermediate': '_preintermediate-meta.json',
  Intermediate: '_intermediate-meta.json',
  Advanced: '_advanced-meta.json',
};

const EXPECTED_UNITS = {
  Beginner: [
    'Hello & Me',
    'Home & Daily Life',
    'Food & Shopping',
    'People Around Me',
    'Places in Town',
    'Time, Weather & Body',
    'School & Learning',
    'Free Time & Fun',
    'Travel Basics',
    'Stories & Special Days',
  ],
  Elementary: [
    'Memories & Firsts',
    'People Who Shape Us',
    'Towns, Trips & Discovery',
    'Food, Guests & Sharing',
    'Health, Habits & Feeling Well',
    'Skills, Work & Ambition',
    'Nature & Outdoor Life',
    'Stories, Screens & Imagination',
    'Money, Choices & Small Problems',
    'Goals, Change & Growing Up',
  ],
  'Pre-Intermediate': [
    'Everyday Decisions',
    'Communication & Relationships',
    'Learning That Works',
    'Cities & Community Life',
    'Lifestyle & Wellbeing Choices',
    'Travel, Culture & Perspective',
    'Environment Close to Home',
    'Time, Money & Priorities',
    'Media & Information Habits',
    'Plans, Risks & Possibilities',
  ],
  Intermediate: [
    'Identity & Belonging',
    'Work, Ambition & Burnout',
    'Cities, Design & Public Life',
    'Science in Daily Life',
    'Fairness, Money & Markets',
    'Culture, Taste & Creativity',
    'Health Systems & Personal Choice',
    'Language, Persuasion & Truth',
    'Nature, Risk & Responsibility',
    'Leadership, Habits & Growth',
  ],
  Advanced: [
    'Knowing the Mind',
    'Institutions & Trust',
    'Technology & Human Judgment',
    'Cities, Space & Inequality',
    'Culture, Memory & Art',
    'Economy Beyond Headlines',
    'Ethics of Care & Medicine',
    'Language, Rhetoric & Power',
    'Environment as System',
    'Craft, Mastery & Meaning',
  ],
};

const errors = [];
const allTitles = new Map();
const flats = {};

for (const name of LEVELS) {
  const units = plan.levels[name]?.units;
  const prefix = PREFIX[name];
  const expectedNames = EXPECTED_UNITS[name];

  if (!Array.isArray(units) || units.length !== 10) {
    errors.push(`${name}: expected 10 units, got ${units?.length}`);
    continue;
  }

  for (let i = 0; i < 10; i++) {
    if (units[i].index !== i + 1) errors.push(`${name}: unit index ${units[i].index} at position ${i + 1}`);
    if (units[i].name !== expectedNames[i]) {
      errors.push(`${name} unit ${i + 1}: expected "${expectedNames[i]}", got "${units[i].name}"`);
    }
  }

  let expected = 1;
  const flat = [];
  for (const u of units) {
    if (!u.theme) errors.push(`${name} unit ${u.index}: missing theme`);
    if (u.topics?.length !== 10) {
      errors.push(`${name} unit ${u.index}: expected 10 topics, got ${u.topics?.length}`);
      continue;
    }
    for (const t of u.topics) {
      const want = `${prefix}${expected}`;
      if (t.id !== want) errors.push(`${name}: expected id ${want}, got ${t.id}`);
      const key = (t.title || '').toLowerCase().trim();
      if (!key) errors.push(`${want}: empty title`);
      else if (allTitles.has(key)) {
        errors.push(`Duplicate title: "${t.title}" (${allTitles.get(key)} & ${t.id})`);
      } else {
        allTitles.set(key, t.id);
      }
      if (/part\s*2|additional lesson|topic\s*\d/i.test(t.title || '')) {
        errors.push(`${t.id}: bad title pattern "${t.title}"`);
      }
      for (const field of [
        'title',
        'coreQuestion',
        'format',
        'vocabularyDomain',
        'languageGoal',
        'communicationGoal',
      ]) {
        if (!t[field]) errors.push(`${t.id}: missing ${field}`);
      }
      if (!Array.isArray(t.grammarFocus) || t.grammarFocus.length === 0) {
        errors.push(`${t.id}: grammarFocus empty`);
      }
      flat.push({
        id: t.id,
        title: t.title,
        coreQuestion: t.coreQuestion,
        format: t.format,
        grammarFocus: t.grammarFocus,
        vocabularyDomain: t.vocabularyDomain,
        languageGoal: t.languageGoal,
        communicationGoal: t.communicationGoal,
        unit: u.index,
        unitName: u.name,
      });
      expected++;
    }
  }
  if (expected !== 101) errors.push(`${name}: expected 100 topics, ended at ${expected - 1}`);
  flats[name] = flat;
  const q = flat.filter((t) => /\?/.test(t.title)).length;
  console.log(`${name}: ${flat.length} topics, ${q} question-style titles`);
}

if (errors.length) {
  console.error(`VALIDATION FAILED (${errors.length}):`);
  errors.slice(0, 80).forEach((e) => console.error(' -', e));
  process.exit(1);
}

fs.mkdirSync(genDir, { recursive: true });
fs.mkdirSync(path.dirname(mdPath), { recursive: true });

for (const name of LEVELS) {
  const file = META_FILES[name];
  fs.writeFileSync(path.join(genDir, file), JSON.stringify(flats[name], null, 2) + '\n');
  console.log('Wrote', file);
}

const lines = [];
lines.push('# English Curriculum Plan');
lines.push('');
lines.push(
  'A structured 500-topic curriculum across five CEFR-aligned levels (10 units × 10 topics each).'
);
lines.push('');
lines.push('## Progression philosophy');
lines.push('');
lines.push('The curriculum moves from concrete personal experience to nuanced public reasoning:');
lines.push('');
lines.push(
  '- **Beginner (A1–A2):** immediate self, home, town, and simple past stories—survival talk and short narration.'
);
lines.push(
  '- **Elementary (A2–B1-):** richer past narrative, comparisons, opinions, and first conditionals—experiences with reasons.'
);
lines.push(
  '- **Pre-Intermediate (B1):** cause/effect, advantages/disadvantages, and used-to reflection—everyday issues with clearer argumentation.'
);
lines.push(
  '- **Intermediate (B1+/B2):** abstract social themes, hedging, and defended positions—analysis without encyclopedia dumps.'
);
lines.push(
  '- **Advanced (B2+/C1):** synthesis, qualification, and institutional/cultural nuance—essayistic feature voice.'
);
lines.push('');
lines.push(
  'Broad themes may recur across levels, but each revisit deepens angle and language demand (not merely harder subject matter).'
);
lines.push('');
lines.push(`Source of truth: \`scripts/curriculum/en-curriculum-plan.json\` (version ${plan.version}).`);
lines.push('');

for (const name of LEVELS) {
  const level = plan.levels[name];
  lines.push(`## ${name} (${level.cefr})`);
  lines.push('');
  lines.push(`Grammar focus: ${level.grammarFocus.join('; ')}`);
  lines.push('');
  lines.push(
    `Word-count target (later passages): ${plan.wordCountTargets[name][0]}–${plan.wordCountTargets[name][1]} words`
  );
  lines.push('');
  for (const u of level.units) {
    lines.push(`### Unit ${u.index}: ${u.name}`);
    lines.push('');
    lines.push(`*${u.theme}*`);
    lines.push('');
    for (const t of u.topics) {
      lines.push(`- **${t.id}** — ${t.title}`);
    }
    lines.push('');
  }
}

lines.push('## Unit name index (50 units)');
lines.push('');
for (const name of LEVELS) {
  lines.push(`### ${name}`);
  lines.push('');
  for (const u of plan.levels[name].units) {
    lines.push(`${u.index}. ${u.name}`);
  }
  lines.push('');
}

fs.writeFileSync(mdPath, lines.join('\n'));
console.log(`OK: ${allTitles.size}/500 unique titles`);
console.log(`Wrote ${mdPath}`);

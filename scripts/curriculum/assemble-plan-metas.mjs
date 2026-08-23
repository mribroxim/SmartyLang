#!/usr/bin/env node
/**
 * Assemble en-curriculum-plan.json (non-Beginner levels), meta extracts, and docs/CURRICULUM_EN.md.
 * Preserves Beginner units exactly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const planPath = path.join(__dirname, 'en-curriculum-plan.json');
const genDir = path.join(__dirname, 'generated');
const docsPath = path.join(root, 'docs', 'CURRICULUM_EN.md');

const THEMES = {
  Elementary: {
    1: 'First experiences, formative memories, early milestones',
    2: 'Mentors, family influence, neighbours, role models',
    3: 'Local discovery, travel mishaps, towns and places',
    4: 'Hosting, shared meals, food etiquette',
    5: 'Wellbeing routines, illness, sleep, stress',
    6: 'Skills, first jobs, ambition, setbacks',
    7: 'Outdoors, parks, weather, nature etiquette',
    8: 'Stories, screens, reading, imagination',
    9: 'Spending, saving, small money problems',
    10: 'Goals, change, growing up, persistence',
  },
  'Pre-Intermediate': {
    1: 'Everyday choices, routines, regret, fairness',
    2: 'Listening, conflict, trust, teamwork',
    3: 'Study methods, focus, practice, school redesign',
    4: 'Neighbourhoods, public space, community life',
    5: 'Sleep, habits, rest, wellbeing routines',
    6: 'Travel experiences, culture, perspective change',
    7: 'Local environment, litter, parks, trees',
    8: 'Time, money, priorities, value',
    9: 'News, media habits, verification, scrolling',
    10: 'Plans, risks, opportunities, backup thinking',
  },
  Intermediate: {
    1: 'Belonging, labels, identity, inclusion',
    2: 'Ambition, overwork, boundaries, burnout',
    3: 'Urban design, public space, walkability',
    4: 'Everyday science, expertise, uncertainty',
    5: 'Fair markets, prices, debt, local economy',
    6: 'Taste, creativity, culture, museums',
    7: 'Health systems, autonomy, access, reform',
    8: 'Persuasion, framing, truth, rhetoric basics',
    9: 'Outdoor risk, stewardship, climate pressure',
    10: 'Leadership habits, feedback, growth',
  },
  Advanced: {
    1: 'Self-knowledge, memory, emotion, dialogue under uncertainty',
    2: 'Institutional trust, transparency, accountability',
    3: 'Algorithms, judgement, automation, attention design',
    4: 'Spatial inequality, housing, mobility, urban justice',
    5: 'Cultural memory, monuments, museums, nostalgia',
    6: 'Lived economy, care work, growth metrics, resilience',
    7: 'Care ethics, medical language, solidarity, dying',
    8: 'Rhetoric, metaphor, silence, public argument',
    9: 'Systems ecology, climate justice, leverage points',
    10: 'Craft, mastery, meaning, practical intelligence',
  },
};

const UNIT_NAMES = {
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

const PREFIX = {
  Elementary: 'e',
  'Pre-Intermediate': 'p',
  Intermediate: 'i',
  Advanced: 'a',
};

const TOPIC_FIELDS = [
  'id',
  'title',
  'coreQuestion',
  'format',
  'grammarFocus',
  'vocabularyDomain',
  'languageGoal',
  'communicationGoal',
];

function stripMeta(t) {
  const out = {};
  for (const k of TOPIC_FIELDS) out[k] = t[k];
  return out;
}

function metasToUnits(level, metas) {
  const names = UNIT_NAMES[level];
  const themes = THEMES[level];
  const units = [];
  for (let u = 1; u <= 10; u++) {
    const slice = metas.filter((m) => m.unit === u);
    if (slice.length !== 10) {
      throw new Error(`${level} unit ${u}: expected 10 topics, got ${slice.length}`);
    }
    units.push({
      index: u,
      name: names[u - 1],
      theme: themes[u],
      topics: slice.map(stripMeta),
    });
  }
  return units;
}

function validateMetas(level, metas) {
  const prefix = PREFIX[level];
  if (metas.length !== 100) throw new Error(`${level}: expected 100 metas, got ${metas.length}`);
  for (let i = 0; i < 100; i++) {
    const expected = `${prefix}${i + 1}`;
    if (metas[i].id !== expected) {
      throw new Error(`${level}: id ${metas[i].id} !== ${expected}`);
    }
    for (const k of TOPIC_FIELDS) {
      if (metas[i][k] == null || metas[i][k] === '') {
        throw new Error(`${level}/${expected}: missing ${k}`);
      }
    }
    if (!Array.isArray(metas[i].grammarFocus) || !metas[i].grammarFocus.length) {
      throw new Error(`${level}/${expected}: empty grammarFocus`);
    }
    if (metas[i].unit !== Math.floor(i / 10) + 1) {
      throw new Error(`${level}/${expected}: unit ${metas[i].unit} mismatch`);
    }
    if (metas[i].unitName !== UNIT_NAMES[level][metas[i].unit - 1]) {
      throw new Error(`${level}/${expected}: unitName mismatch`);
    }
  }
}

function writePretty(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// --- load sources ---
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const beginnerUnits = plan.levels.Beginner.units;
if (!Array.isArray(beginnerUnits) || beginnerUnits.length !== 10) {
  throw new Error('Beginner units missing or incomplete — aborting');
}

const elementary = JSON.parse(fs.readFileSync(path.join(genDir, '_elem-meta.json'), 'utf8'));
const preMod = await import(
  pathToFileURL(path.join(__dirname, 'levels', 'pre-intermediate-meta.mjs')).href
);
const preintermediate = preMod.TOPICS;
const intermediate = JSON.parse(
  fs.readFileSync(path.join(genDir, '_intermediate-meta.json'), 'utf8')
);
const advanced = JSON.parse(fs.readFileSync(path.join(genDir, '_advanced-meta.json'), 'utf8'));

const byLevel = {
  Elementary: elementary,
  'Pre-Intermediate': preintermediate,
  Intermediate: intermediate,
  Advanced: advanced,
};

for (const [level, metas] of Object.entries(byLevel)) {
  validateMetas(level, metas);
  plan.levels[level].units = metasToUnits(level, metas);
}

writePretty(planPath, plan);

// meta extracts (requested filenames)
writePretty(path.join(genDir, '_elementary-meta.json'), elementary);
writePretty(path.join(genDir, '_preintermediate-meta.json'), preintermediate);
writePretty(path.join(genDir, '_intermediate-meta.json'), intermediate);
writePretty(path.join(genDir, '_advanced-meta.json'), advanced);

// docs
const allLevels = [
  'Beginner',
  'Elementary',
  'Pre-Intermediate',
  'Intermediate',
  'Advanced',
];
const lines = [
  '# English Curriculum Map',
  '',
  '500 topics across 5 levels × 10 units × 10 topics. Titles and metadata only (no reading passages).',
  '',
  `| Level | CEFR | IDs | Topics |`,
  `| --- | --- | --- | ---: |`,
  `| Beginner | ${plan.levels.Beginner.cefr} | b1–b100 | 100 |`,
  `| Elementary | ${plan.levels.Elementary.cefr} | e1–e100 | 100 |`,
  `| Pre-Intermediate | ${plan.levels['Pre-Intermediate'].cefr} | p1–p100 | 100 |`,
  `| Intermediate | ${plan.levels.Intermediate.cefr} | i1–i100 | 100 |`,
  `| Advanced | ${plan.levels.Advanced.cefr} | a1–a100 | 100 |`,
  '',
];

for (const level of allLevels) {
  lines.push(`## ${level}`);
  lines.push('');
  for (const unit of plan.levels[level].units) {
    lines.push(`### Unit ${unit.index}. ${unit.name}`);
    lines.push('');
    lines.push(`_${unit.theme}_`);
    lines.push('');
    for (const t of unit.topics) {
      lines.push(`- \`${t.id}\` ${t.title}`);
    }
    lines.push('');
  }
}

fs.mkdirSync(path.dirname(docsPath), { recursive: true });
fs.writeFileSync(docsPath, lines.join('\n'), 'utf8');

// final counts
const counts = {};
for (const level of allLevels) {
  const n = plan.levels[level].units.reduce((s, u) => s + u.topics.length, 0);
  counts[level] = n;
  console.log(`${level}: ${plan.levels[level].units.length} units, ${n} topics`);
}
console.log('Wrote', planPath);
console.log('Wrote', docsPath);
console.log(
  'Wrote metas:',
  '_elementary-meta.json',
  '_preintermediate-meta.json',
  '_intermediate-meta.json',
  '_advanced-meta.json'
);
console.log('TOTAL', Object.values(counts).reduce((a, b) => a + b, 0));

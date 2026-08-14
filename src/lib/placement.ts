import type { Level } from './reading-logic';

export type LearningGoal = 'daily' | 'school' | 'exam';

export const LEARNING_GOALS: { id: LearningGoal; title: string; desc: string }[] = [
  { id: 'daily', title: 'Everyday English', desc: 'Speak and understand in daily life' },
  { id: 'school', title: 'School & study', desc: 'Keep up with class and homework' },
  { id: 'exam', title: 'IELTS / exams', desc: 'Train for a test with a target band' },
];

export const PLACEMENT_LEVELS: Level[] = [
  'Beginner',
  'Elementary',
  'Pre-Intermediate',
  'Intermediate',
  'Advanced',
];

export type PlacementSectionId =
  | 'grammar'
  | 'vocabulary'
  | 'truefalse'
  | 'reading'
  | 'listening';

export type PlacementStep =
  | {
      type: 'mcq';
      id: string;
      section: PlacementSectionId;
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      type: 'truefalse';
      id: string;
      section: PlacementSectionId;
      statement: string;
      answer: boolean;
    }
  | {
      type: 'passage';
      id: string;
      section: PlacementSectionId;
      title: string;
      passage: string;
      levelHint: Level;
    }
  | {
      type: 'listening';
      id: string;
      section: PlacementSectionId;
      context: string;
      prompt: string;
      options: string[];
      answer: number;
    };

/** Ordered placement flow — grammar, vocab, T/F, two readings, listening. */
export const PLACEMENT_FLOW: PlacementStep[] = [
  // ── Grammar (8) ──
  { type: 'mcq', id: 'g1', section: 'grammar', prompt: '“I ___ a student.”', options: ['am', 'is', 'are', 'be'], answer: 0 },
  { type: 'mcq', id: 'g2', section: 'grammar', prompt: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
  { type: 'mcq', id: 'g3', section: 'grammar', prompt: 'There ___ many books on the table.', options: ['is', 'are', 'was', 'be'], answer: 1 },
  { type: 'mcq', id: 'g4', section: 'grammar', prompt: 'If it rains tomorrow, we ___ stay inside.', options: ['will', 'would', 'are', 'have'], answer: 0 },
  { type: 'mcq', id: 'g5', section: 'grammar', prompt: 'I have ___ this book twice.', options: ['read', 'reading', 'reads', 'readed'], answer: 0 },
  { type: 'mcq', id: 'g6', section: 'grammar', prompt: 'The report was ___ by the committee last week.', options: ['wrote', 'written', 'writing', 'write'], answer: 1 },
  { type: 'mcq', id: 'g7', section: 'grammar', prompt: 'Despite ___ late, she still caught the train.', options: ['she was', 'being', 'to be', 'she is'], answer: 1 },
  { type: 'mcq', id: 'g8', section: 'grammar', prompt: 'By the time we arrived, the film ___.', options: ['already started', 'had already started', 'has already started', 'was already start'], answer: 1 },

  // ── Vocabulary (6) ──
  { type: 'mcq', id: 'v1', section: 'vocabulary', prompt: 'Choose the best synonym for “generous”.', options: ['kind and giving', 'angry', 'lazy', 'quiet'], answer: 0 },
  { type: 'mcq', id: 'v2', section: 'vocabulary', prompt: 'A “deadline” is ___.', options: ['a type of line on paper', 'the latest time something must be finished', 'a sports rule', 'a holiday'], answer: 1 },
  { type: 'mcq', id: 'v3', section: 'vocabulary', prompt: '“Postpone” means to ___.', options: ['cancel forever', 'delay to a later time', 'finish early', 'repeat loudly'], answer: 1 },
  { type: 'mcq', id: 'v4', section: 'vocabulary', prompt: 'Which word fits: “The evidence was ___; everyone believed the story.”', options: ['doubtful', 'convincing', 'silent', 'empty'], answer: 1 },
  { type: 'mcq', id: 'v5', section: 'vocabulary', prompt: '“Reluctant” means ___.', options: ['eager and excited', 'unwilling or hesitant', 'very fast', 'completely sure'], answer: 1 },
  { type: 'mcq', id: 'v6', section: 'vocabulary', prompt: 'An “assumption” is something you ___.', options: ['prove in a lab', 'suppose is true without proof', 'buy in a shop', 'draw on paper'], answer: 1 },

  // ── True / False (4) ──
  { type: 'truefalse', id: 'tf1', section: 'truefalse', statement: '“Children” is the plural of “child”.', answer: true },
  { type: 'truefalse', id: 'tf2', section: 'truefalse', statement: 'In English, adjectives usually come after the noun they describe.', answer: false },
  { type: 'truefalse', id: 'tf3', section: 'truefalse', statement: '“Although it was cold, we went outside” shows contrast.', answer: true },
  { type: 'truefalse', id: 'tf4', section: 'truefalse', statement: '“Less” and “fewer” are always interchangeable in English.', answer: false },

  // ── Reading passage 1 (Elementary) ──
  {
    type: 'passage',
    id: 'passage1',
    section: 'reading',
    title: 'Reading 1 — Tom’s café',
    levelHint: 'Elementary',
    passage:
      'Tom works in a small café in London. Every morning he arrives at six o\'clock and prepares fresh coffee. He enjoys talking to customers and hearing about their lives. On Saturdays he visits his sister and her two children. Tom saves money because he wants to travel to Japan one day — he loves Japanese food and culture.',
  },
  { type: 'mcq', id: 'r1q1', section: 'reading', prompt: 'Where does Tom work?', options: ['In a school', 'In a café', 'In a hospital', 'On a farm'], answer: 1 },
  { type: 'mcq', id: 'r1q2', section: 'reading', prompt: 'What time does Tom arrive in the morning?', options: ['Five o\'clock', 'Six o\'clock', 'Eight o\'clock', 'Ten o\'clock'], answer: 1 },
  { type: 'mcq', id: 'r1q3', section: 'reading', prompt: 'Who does Tom visit on Saturdays?', options: ['His parents', 'His sister and her children', 'His boss', 'His neighbours'], answer: 1 },
  { type: 'mcq', id: 'r1q4', section: 'reading', prompt: 'Why is Tom saving money?', options: ['To buy a car', 'To travel to Japan', 'To open a second café', 'To study medicine'], answer: 1 },

  // ── Reading passage 2 (Intermediate) ──
  {
    type: 'passage',
    id: 'passage2',
    section: 'reading',
    title: 'Reading 2 — Climate change',
    levelHint: 'Intermediate',
    passage:
      'Scientists report that global temperatures are rising faster than many models predicted twenty years ago. Some regions suffer severe droughts while others experience heavier rainfall and flooding. Governments are investing in renewable energy, yet experts stress that individual choices matter too. Reducing waste, using public transport, and eating less meat can lower a person\'s carbon footprint. Adaptation — such as improving flood defences — is now discussed alongside prevention.',
  },
  { type: 'mcq', id: 'r2q1', section: 'reading', prompt: 'According to the passage, temperatures are rising ___.', options: ['more slowly than expected', 'faster than many models predicted', 'only in coastal cities', 'not at all'], answer: 1 },
  { type: 'mcq', id: 'r2q2', section: 'reading', prompt: 'What do experts say about individual choices?', options: ['They do not matter', 'They matter as well as government action', 'They are illegal in most countries', 'They only affect air travel'], answer: 1 },
  { type: 'mcq', id: 'r2q3', section: 'reading', prompt: 'Which action is mentioned as reducing carbon footprint?', options: ['Driving alone more often', 'Eating less meat', 'Using more plastic', 'Avoiding public transport'], answer: 1 },
  { type: 'mcq', id: 'r2q4', section: 'reading', prompt: '“Adaptation” in the passage refers to ___.', options: ['learning a new language', 'changing behaviour to cope with effects', 'writing scientific reports', 'closing all factories'], answer: 1 },

  // ── Listening-style (4) — read transcript, pick answer ──
  {
    type: 'listening',
    id: 'l1',
    section: 'listening',
    context: 'You hear: “Excuse me, could you tell me where the nearest train station is? I think I took a wrong turn at the library.”',
    prompt: 'What does the speaker need?',
    options: ['Directions to the station', 'A library card', 'Train tickets', 'A taxi phone number'],
    answer: 0,
  },
  {
    type: 'listening',
    id: 'l2',
    section: 'listening',
    context: 'You hear: “The meeting has been moved to Thursday at three, but please send the slides by Wednesday noon.”',
    prompt: 'When must the slides be sent?',
    options: ['Thursday at 3 p.m.', 'Wednesday at noon', 'Friday morning', 'Tuesday evening'],
    answer: 1,
  },
  {
    type: 'listening',
    id: 'l3',
    section: 'listening',
    context: 'You hear: “I’d love to join you, but I’ve already promised to help my brother move house this weekend.”',
    prompt: 'Why can’t the speaker join?',
    options: ['They are ill', 'They promised to help their brother', 'They are travelling abroad', 'They forgot the address'],
    answer: 1,
  },
  {
    type: 'listening',
    id: 'l4',
    section: 'listening',
    context: 'You hear: “Although the product looks similar, the warranty on this model is twice as long as the cheaper one.”',
    prompt: 'What is being compared?',
    options: ['Colours of two phones', 'Warranty length', 'Shipping speed', 'Store locations'],
    answer: 1,
  },
];

export const PLACEMENT_SECTION_LABELS: Record<PlacementSectionId, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  truefalse: 'True / False',
  reading: 'Reading',
  listening: 'Listening',
};

const SECTION_WEIGHTS: Record<PlacementSectionId, number> = {
  grammar: 1.2,
  vocabulary: 1,
  truefalse: 0.8,
  reading: 1.5,
  listening: 1,
};

export interface PlacementAnalysis {
  startingLevel: Level;
  totalCorrect: number;
  totalScored: number;
  overallPct: number;
  sections: Record<PlacementSectionId, { correct: number; total: number; pct: number }>;
  strengths: string[];
  weaknesses: string[];
}

function isAnswerable(step: PlacementStep): step is Exclude<PlacementStep, { type: 'passage' }> {
  return step.type !== 'passage';
}

export function scorePlacementStep(
  step: Exclude<PlacementStep, { type: 'passage' }>,
  answer: number | boolean | undefined,
): boolean | null {
  if (answer === undefined) return null;
  if (step.type === 'truefalse') return answer === step.answer;
  if (step.type === 'mcq' || step.type === 'listening') return answer === step.answer;
  return null;
}

export function analyzePlacement(answers: Record<string, number | boolean>): PlacementAnalysis {
  const sections = {} as PlacementAnalysis['sections'];
  (Object.keys(PLACEMENT_SECTION_LABELS) as PlacementSectionId[]).forEach(s => {
    sections[s] = { correct: 0, total: 0, pct: 0 };
  });

  let weightedCorrect = 0;
  let weightedTotal = 0;
  let totalCorrect = 0;
  let totalScored = 0;

  for (const step of PLACEMENT_FLOW) {
    if (!isAnswerable(step)) continue;
    const w = SECTION_WEIGHTS[step.section];
    sections[step.section].total += 1;
    weightedTotal += w;
    totalScored += 1;

    const ok = scorePlacementStep(step, answers[step.id]);
    if (ok === true) {
      sections[step.section].correct += 1;
      weightedCorrect += w;
      totalCorrect += 1;
    }
  }

  for (const s of Object.keys(sections) as PlacementSectionId[]) {
    const { correct, total } = sections[s];
    sections[s].pct = total > 0 ? correct / total : 0;
  }

  const overallPct = weightedTotal > 0 ? weightedCorrect / weightedTotal : 0;
  const startingLevel = levelFromPlacementPct(overallPct);

  const ranked = (Object.keys(sections) as PlacementSectionId[])
    .filter(s => sections[s].total > 0)
    .sort((a, b) => sections[b].pct - sections[a].pct);

  const strengths = ranked.filter(s => sections[s].pct >= 0.7).slice(0, 2).map(s => PLACEMENT_SECTION_LABELS[s]);
  const weaknesses = ranked.filter(s => sections[s].pct < 0.5).slice(-2).reverse().map(s => PLACEMENT_SECTION_LABELS[s]);

  return {
    startingLevel,
    totalCorrect,
    totalScored,
    overallPct,
    sections,
    strengths,
    weaknesses,
  };
}

export function levelFromPlacementPct(pct: number): Level {
  if (pct < 0.25) return 'Beginner';
  if (pct < 0.45) return 'Elementary';
  if (pct < 0.62) return 'Pre-Intermediate';
  if (pct < 0.82) return 'Intermediate';
  return 'Advanced';
}

/** @deprecated use analyzePlacement */
export function levelFromPlacementScore(correct: number, total = 26): Level {
  return levelFromPlacementPct(total > 0 ? correct / total : 0);
}

/** Answerable steps only (excludes passage intro screens). */
export function placementQuestionSteps(): Exclude<PlacementStep, { type: 'passage' }>[] {
  return PLACEMENT_FLOW.filter(isAnswerable);
}

import type { Level } from './reading-logic';

/** Thematic names for each unit (10 per level), in lesson order. */
export const UNIT_NAMES: Record<Level, string[]> = {
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

export function unitDisplayName(level: Level, unitIndex: number): string {
  const names = UNIT_NAMES[level];
  return names?.[unitIndex] ?? `Unit ${unitIndex + 1}`;
}

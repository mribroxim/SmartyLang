import type { ContentLang } from './contentLang';
import type { Level } from './reading-logic';
import type { PlacementStep } from './placement';
import { PLACEMENT_FLOW } from './placement';
import { fetchLangPackJson } from './langPacks';
import {
  readStoredArabicDisplayMode,
  transformArabicContent,
  type ArabicDisplayMode,
} from './arabicText';

export type CompReadingItem = {
  title: string;
  passage: string;
  level: string;
  questions: { id?: number; text: string; options: string[]; answer: number }[];
};

const MIN_ANSWERABLE = 4;

function levelNorm(level: string): string {
  return level.trim().toLowerCase();
}

function isLowerBand(level: string): boolean {
  const l = levelNorm(level);
  return l === 'beginner' || l === 'elementary' || l.includes('beginner') || l.includes('elementary');
}

function isHigherBand(level: string): boolean {
  const l = levelNorm(level);
  if (isLowerBand(level)) return false;
  return (
    l.includes('pre-intermediate') ||
    l.includes('preintermediate') ||
    l.includes('intermediate') ||
    l.includes('advanced')
  );
}

function toLevelHint(level: string): Level {
  const l = levelNorm(level);
  if (l.includes('advanced')) return 'Advanced';
  if (l.includes('pre-intermediate') || l.includes('preintermediate')) return 'Pre-Intermediate';
  if (l.includes('intermediate')) return 'Intermediate';
  if (l.includes('elementary')) return 'Elementary';
  if (l.includes('beginner')) return 'Beginner';
  return 'Elementary';
}

function usableQuestions(item: CompReadingItem): CompReadingItem['questions'] {
  return (item.questions ?? []).filter(
    (q) => q.text?.trim() && Array.isArray(q.options) && q.options.length >= 2 && typeof q.answer === 'number',
  );
}

function pickPassages(items: CompReadingItem[]): CompReadingItem[] {
  const withQs = items.filter((it) => it.passage?.trim() && usableQuestions(it).length > 0);
  const lower = withQs.find((it) => isLowerBand(it.level));
  const higher = withQs.find((it) => isHigherBand(it.level) && it !== lower);

  const picked: CompReadingItem[] = [];
  if (lower) picked.push(lower);
  if (higher) picked.push(higher);

  if (picked.length < 2) {
    for (const it of withQs) {
      if (picked.length >= 2) break;
      if (!picked.includes(it)) picked.push(it);
    }
  }

  return picked.slice(0, 2);
}

/**
 * Build a short reading-based placement flow from comprehensive-reading pack items.
 * Returns [] if fewer than 4 answerable questions can be produced — Onboarding should
 * show a self-level picker in that case.
 */
export function buildPlacementFromReading(items: CompReadingItem[]): PlacementStep[] {
  const passages = pickPassages(items);
  if (passages.length === 0) return [];

  const steps: PlacementStep[] = [];
  let answerable = 0;

  passages.forEach((item, pi) => {
    const n = pi + 1;
    steps.push({
      type: 'passage',
      id: `p${n}`,
      section: 'reading',
      title: item.title,
      passage: item.passage,
      levelHint: toLevelHint(item.level),
    });

    usableQuestions(item)
      .slice(0, 4)
      .forEach((q, qi) => {
        steps.push({
          type: 'mcq',
          id: `r${n}q${qi + 1}`,
          section: 'reading',
          prompt: q.text,
          options: q.options,
          answer: q.answer,
        });
        answerable += 1;
      });
  });

  if (answerable < MIN_ANSWERABLE) return [];
  return steps;
}

/**
 * Load placement content in the learning language.
 * English uses the full built-in PLACEMENT_FLOW; other langs use reading packs.
 * Empty array ⇒ Onboarding should show a self-level picker (no auto check yet).
 */
export async function loadPlacementFlow(
  lang: ContentLang,
  arabicDisplayMode: ArabicDisplayMode = readStoredArabicDisplayMode(),
): Promise<PlacementStep[]> {
  if (lang === 'en') return PLACEMENT_FLOW;

  const data = await fetchLangPackJson<CompReadingItem[]>(lang, 'comprehensive-reading.json');
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  return transformArabicContent(buildPlacementFromReading(data), lang, arabicDisplayMode);
}

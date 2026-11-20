import type { LessonExerciseType } from '../lessonProgress';

/** A bite is a 3–5 minute slice of a lesson. */
export type BiteKind = 'learn' | 'drill' | 'story' | 'mission' | 'meet' | 'read' | 'words' | 'sentences' | 'listen-speak' | 'today' | 'heart-practice' | 'practice' | 'section-test' | 'unit-exam' | 'refine';

/** v2 lessons add: teach (narrated cards), v2-recognise / v2-produce (authored practice), scene (dialogue), v2-scene-quiz. */
export type StepKind = 'vocab-intro' | 'read-aloud' | 'word-review' | 'mission-reply' | 'teach' | 'v2-recognise' | 'v2-produce' | 'scene' | 'v2-scene-quiz' | LessonExerciseType;

export interface BiteStep {
  kind: StepKind;
  /** Words this step practises (vocab steps). */
  words?: string[];
  /** Cap on items (passage steps). */
  maxItems?: number;
  sentenceOffset?: number;
  /** Re-ask of earlier mistakes: never costs hearts. */
  retry?: boolean;
  /** Never costs hearts (e.g. recycled words from older lessons). */
  free?: boolean;
}

export interface BiteDef {
  /** `${passageId}#${index}` */
  id: string;
  passageId: string;
  index: number;
  kind: BiteKind;
  steps: BiteStep[];
  estMinutes: number;
  /** Mistakes cost hearts (path bites); practice and review never do. */
  costsHearts: boolean;
  /** Local calendar date for a cached daily session. */
  date?: string;
}

export interface BiteRecord {
  best: number;
  completedAt: number;
  perfect?: boolean;
  attempts: number;
}

export interface BiteResult {
  def: BiteDef;
  accuracy: number;
  correctWords: string[];
  mistakes: string[];
  perfect: boolean;
  recovered: boolean;
  ms: number;
  /** First attempts and retries, preserved on resume for personalized practice. */
  scores?: import('./session').StepScore[];
}

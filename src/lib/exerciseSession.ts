/** Persist mid-exercise progress so interrupted sessions can be resumed. */

export type ExerciseSessionSnapshot = {
  type: string;
  /** Ordered word list for this session */
  words: string[];
  index: number;
  score: number;
  mistakes: string[];
  /** Memory Match tracks a count instead of word list */
  mistakeCount?: number;
  meanings?: Record<string, string>;
  meaningMode?: 'definition' | 'translation';
  targetLang?: string;
  /** Flashcards */
  flipped?: boolean;
  /** Word Match / Memory Match — ids already matched */
  matchedIds?: string[];
  /** Memory Match card order */
  cardOrder?: { id: string; text: string; type: 'word' | 'def'; matchId: string }[];
  /** Learning language this session was started in */
  contentLang?: string;
  updatedAt: number;
};

const KEY = 'exercise_session_v1';
export const RESUME_FLAG = 'exercise_resume_now';

const TYPE_LABELS: Record<string, string> = {
  flashcards: 'Flashcards',
  'definition-quiz': 'Quiz',
  'listening-match': 'Listening',
  'true-false-quiz': 'True or False',
  'memory-match': 'Memory Match',
  'word-match': 'Word Match',
  'spelling-practice': 'Spelling Practice',
  pronunciation: 'Pronunciation',
  'word-scramble': 'Word Scramble',
};

export function exerciseTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type.replace(/-/g, ' ');
}

export function loadExerciseSession(): ExerciseSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExerciseSessionSnapshot;
    if (!parsed?.type || !Array.isArray(parsed.words) || parsed.words.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveExerciseSession(
  snap: Omit<ExerciseSessionSnapshot, 'updatedAt'> & { updatedAt?: number },
): void {
  try {
    let contentLang = snap.contentLang;
    if (!contentLang) {
      try { contentLang = localStorage.getItem('smarty_content_lang') || 'en'; } catch { contentLang = 'en'; }
    }
    const payload: ExerciseSessionSnapshot = {
      ...snap,
      contentLang,
      updatedAt: snap.updatedAt ?? Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function clearExerciseSession(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('flashcards_progress');
  } catch {}
}

export function requestExerciseResume(): void {
  try {
    sessionStorage.setItem(RESUME_FLAG, '1');
  } catch {}
}

export function consumeExerciseResumeFlag(): boolean {
  try {
    if (sessionStorage.getItem(RESUME_FLAG) === '1') {
      sessionStorage.removeItem(RESUME_FLAG);
      return true;
    }
  } catch {}
  return false;
}

export function sessionProgressLabel(snap: ExerciseSessionSnapshot): string {
  const total = snap.words.length;
  const at = Math.min((snap.index || 0) + 1, total);
  if (snap.type === 'word-match' || snap.type === 'memory-match') {
    return `${snap.score || 0} / ${total} pairs`;
  }
  if (snap.type === 'flashcards') {
    return `Card ${at} of ${total}`;
  }
  return `${at} of ${total}`;
}

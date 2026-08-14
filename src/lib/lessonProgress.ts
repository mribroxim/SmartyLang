/**
 * Lesson-flow unlock + score-matrix persistence.
 * Keys are scoped by content language so each language pack progresses independently.
 * When signed in, mirrors to users/{uid}/lessonUnlocks/{lang_passageId}.
 */

import type { Level } from './reading-logic';
import type { ContentLang } from './contentLang';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { scopedKey, getStorageUid } from './userStorage';

export type LessonPhase = 'pre-read' | 'read' | 'exercises' | 'recommendations';

export interface LessonUnlock {
  vocabQuizScore: number | null;
  vocabPassed: boolean;
  readingBest: number | null;
  readingPassed: boolean;
  exerciseBest: Record<string, number>;
  missedWords: string[];
}

export const LESSON_PASS_THRESHOLD = 80;

export const LESSON_EXERCISE_TYPES = [
  'definition-quiz',
  'word-match',
  'word-scramble',
  'listening-match',
  'true-false-quiz',
  'spelling-practice',
  'pronunciation',
  'sentence-reorder',
  'cloze',
  'comprehension',
  'audio-dictation',
  'read-back-shadowing',
] as const;

export type LessonExerciseType = (typeof LESSON_EXERCISE_TYPES)[number];

export const LESSON_EXERCISE_LABELS: Record<LessonExerciseType, string> = {
  'definition-quiz': 'Quiz',
  'word-match': 'Word Match',
  'word-scramble': 'Word Scramble',
  'listening-match': 'Listening Match',
  'true-false-quiz': 'True / False',
  'spelling-practice': 'Spelling',
  pronunciation: 'Vocab Pronunciation',
  'sentence-reorder': 'Sentence Reorder',
  cloze: 'Gap Fill / Cloze',
  comprehension: 'Comprehension',
  'audio-dictation': 'Audio Dictation',
  'read-back-shadowing': 'Read-back Shadowing',
};

function unlockDocId(lang: ContentLang, passageId: string): string {
  return `${lang}_${passageId}`.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
}

function unlockKey(lang: ContentLang, passageId: string): string {
  const base = `readmaster_lesson_unlock_${lang}_${passageId}`;
  const uid = getStorageUid();
  return uid ? scopedKey(base, uid) : base;
}

function certKey(lang: ContentLang, level: Level): string {
  const base = `readmaster_certificate_${lang}_${level.toLowerCase().replace(/\s+/g, '_')}`;
  const uid = getStorageUid();
  return uid ? scopedKey(base, uid) : base;
}

function emptyUnlock(): LessonUnlock {
  return {
    vocabQuizScore: null,
    vocabPassed: false,
    readingBest: null,
    readingPassed: false,
    exerciseBest: {},
    missedWords: [],
  };
}

function deriveVocabPassed(score: number | null | undefined): boolean {
  return typeof score === 'number' && Number.isFinite(score) && score >= LESSON_PASS_THRESHOLD;
}

export function normalizePercentScore(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  let v = Math.round(n);
  while (v > 100) v = Math.round(v / 100);
  return Math.max(0, Math.min(100, v));
}

function syncUnlockToCloud(lang: ContentLang, passageId: string, data: LessonUnlock): void {
  const uid = auth?.currentUser?.uid || getStorageUid();
  if (!uid || !isFirebaseConfigured || !db) return;
  const id = unlockDocId(lang, passageId);
  setDoc(doc(db, 'users', uid, 'lessonUnlocks', id), {
    lang,
    passageId,
    ...data,
    updatedAt: Date.now(),
  }, { merge: true }).catch(e => console.error('lessonUnlock sync failed:', e));
}

export function loadLessonUnlock(lang: ContentLang, passageId: string): LessonUnlock {
  try {
    const raw = localStorage.getItem(unlockKey(lang, passageId))
      || localStorage.getItem(`readmaster_lesson_unlock_${lang}_${passageId}`);
    if (!raw) return emptyUnlock();
    const parsed = JSON.parse(raw) as Partial<LessonUnlock>;
    const vocabQuizScore = normalizePercentScore(
      typeof parsed.vocabQuizScore === 'number' ? parsed.vocabQuizScore : null,
    );
    const readingBest = normalizePercentScore(
      typeof parsed.readingBest === 'number' ? parsed.readingBest : null,
    );
    const exerciseBest: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed.exerciseBest || {})) {
      const nv = normalizePercentScore(typeof v === 'number' ? v : null);
      if (nv != null) exerciseBest[k] = nv;
    }
    const next: LessonUnlock = {
      ...emptyUnlock(),
      ...parsed,
      vocabQuizScore,
      vocabPassed: deriveVocabPassed(vocabQuizScore),
      readingBest,
      readingPassed: readingBest != null && readingBest >= LESSON_PASS_THRESHOLD,
      exerciseBest,
      missedWords: Array.isArray(parsed.missedWords) ? parsed.missedWords : [],
    };
    if (readingBest !== parsed.readingBest || vocabQuizScore !== parsed.vocabQuizScore) {
      saveLessonUnlock(lang, passageId, next);
    }
    return next;
  } catch {
    return emptyUnlock();
  }
}

export function saveLessonUnlock(lang: ContentLang, passageId: string, data: LessonUnlock): void {
  try {
    localStorage.setItem(unlockKey(lang, passageId), JSON.stringify(data));
    localStorage.setItem(`readmaster_lesson_unlock_${lang}_${passageId}`, JSON.stringify(data));
  } catch { /* ignore */ }
  syncUnlockToCloud(lang, passageId, data);
}

export function updateLessonUnlock(
  lang: ContentLang,
  passageId: string,
  patch: Partial<LessonUnlock>,
): LessonUnlock {
  const prev = loadLessonUnlock(lang, passageId);
  const next: LessonUnlock = {
    ...prev,
    ...patch,
    exerciseBest: patch.exerciseBest
      ? { ...prev.exerciseBest, ...patch.exerciseBest }
      : prev.exerciseBest,
    missedWords: patch.missedWords
      ? Array.from(new Set([...(prev.missedWords || []), ...patch.missedWords]))
      : prev.missedWords,
  };

  if (typeof patch.vocabQuizScore === 'number' && Number.isFinite(patch.vocabQuizScore)) {
    const score = normalizePercentScore(patch.vocabQuizScore) ?? 0;
    next.vocabQuizScore = Math.max(prev.vocabQuizScore ?? 0, score);
  }
  next.vocabPassed = deriveVocabPassed(next.vocabQuizScore);

  if (typeof patch.readingBest === 'number') {
    const score = normalizePercentScore(patch.readingBest) ?? 0;
    const prevBest = normalizePercentScore(prev.readingBest) ?? 0;
    next.readingBest = Math.max(prevBest, score);
    if (next.readingBest >= LESSON_PASS_THRESHOLD) next.readingPassed = true;
  }
  if (patch.readingPassed) next.readingPassed = true;

  if (patch.exerciseBest) {
    const merged = { ...prev.exerciseBest };
    for (const [k, v] of Object.entries(patch.exerciseBest)) {
      const nv = normalizePercentScore(v) ?? 0;
      merged[k] = Math.max(normalizePercentScore(merged[k]) ?? 0, nv);
    }
    next.exerciseBest = merged;
  }

  saveLessonUnlock(lang, passageId, next);
  return next;
}

export function normalizeExerciseScore(score: number, total?: number): number {
  if (typeof total === 'number' && total > 0) {
    return Math.round((score / total) * 100);
  }
  if (score <= 1) return Math.round(score * 100);
  return Math.min(100, Math.round(score));
}

export function recordLessonExerciseScore(
  lang: ContentLang,
  passageId: string,
  exerciseType: string,
  percent: number,
  missedWords: string[] = [],
): LessonUnlock {
  return updateLessonUnlock(lang, passageId, {
    exerciseBest: { [exerciseType]: percent },
    missedWords,
  });
}

export function isLessonExercisesComplete(unlock: LessonUnlock): boolean {
  return LESSON_EXERCISE_TYPES.every(
    (t) => (unlock.exerciseBest[t] ?? 0) >= LESSON_PASS_THRESHOLD,
  );
}

export function lessonExerciseProgress(unlock: LessonUnlock): { done: number; total: number } {
  const done = LESSON_EXERCISE_TYPES.filter(
    (t) => (unlock.exerciseBest[t] ?? 0) >= LESSON_PASS_THRESHOLD,
  ).length;
  return { done, total: LESSON_EXERCISE_TYPES.length };
}

export function hasCertificate(lang: ContentLang, level: Level): boolean {
  return !!loadCertificateMeta(lang, level)?.awarded;
}

export function awardCertificate(lang: ContentLang, level: Level, meta?: { name?: string; date?: number }): void {
  const payload = { awarded: true, date: meta?.date ?? Date.now(), name: meta?.name ?? '' };
  try {
    localStorage.setItem(certKey(lang, level), JSON.stringify(payload));
    localStorage.setItem(certKey(lang, level) + '_flag', '1');
    localStorage.setItem(
      `readmaster_certificate_${lang}_${level.toLowerCase().replace(/\s+/g, '_')}`,
      JSON.stringify(payload),
    );
  } catch { /* ignore */ }
}

export function loadCertificateMeta(
  lang: ContentLang,
  level: Level,
): { awarded: boolean; date?: number; name?: string } | null {
  try {
    const raw = localStorage.getItem(certKey(lang, level))
      || localStorage.getItem(`readmaster_certificate_${lang}_${level.toLowerCase().replace(/\s+/g, '_')}`);
    if (!raw || raw === '1') {
      if (localStorage.getItem(certKey(lang, level) + '_flag') === '1' || raw === '1') {
        return { awarded: true };
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.awarded) return parsed;
    return null;
  } catch {
    return localStorage.getItem(certKey(lang, level) + '_flag') === '1'
      ? { awarded: true }
      : null;
  }
}

export function checkLevelCertificateEligibility(
  lang: ContentLang,
  passageIds: string[],
): boolean {
  if (!passageIds.length) return false;
  return passageIds.every((id) => isLessonExercisesComplete(loadLessonUnlock(lang, id)));
}

export function maybeAwardLevelCertificate(
  lang: ContentLang,
  level: Level,
  passageIds: string[],
  studentName?: string,
): boolean {
  if (hasCertificate(lang, level) || loadCertificateMeta(lang, level)?.awarded) return true;
  if (!checkLevelCertificateEligibility(lang, passageIds)) return false;
  awardCertificate(lang, level, { name: studentName, date: Date.now() });
  return true;
}

export function levelProgressSummary(
  lang: ContentLang,
  passageIds: string[],
): { vocabUnlocked: number; readingPassed: number; exercisesComplete: number; total: number } {
  let vocabUnlocked = 0;
  let readingPassed = 0;
  let exercisesComplete = 0;
  for (const id of passageIds) {
    const u = loadLessonUnlock(lang, id);
    if (u.vocabPassed) vocabUnlocked++;
    if (u.readingPassed) readingPassed++;
    if (isLessonExercisesComplete(u)) exercisesComplete++;
  }
  return { vocabUnlocked, readingPassed, exercisesComplete, total: passageIds.length };
}

export async function hydrateLessonUnlocksFromCloud(uid: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'lessonUnlocks'));
    snap.forEach(d => {
      const data = d.data() as LessonUnlock & { lang?: ContentLang; passageId?: string };
      if (!data.lang || !data.passageId) return;
      const unlock: LessonUnlock = {
        vocabQuizScore: data.vocabQuizScore ?? null,
        vocabPassed: !!data.vocabPassed,
        readingBest: data.readingBest ?? null,
        readingPassed: !!data.readingPassed,
        exerciseBest: data.exerciseBest || {},
        missedWords: Array.isArray(data.missedWords) ? data.missedWords : [],
      };
      try {
        localStorage.setItem(unlockKey(data.lang, data.passageId), JSON.stringify(unlock));
        localStorage.setItem(`readmaster_lesson_unlock_${data.lang}_${data.passageId}`, JSON.stringify(unlock));
      } catch { /* ignore */ }
    });
  } catch (e) {
    console.error('hydrateLessonUnlocksFromCloud failed:', e);
  }
}

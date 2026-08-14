/** Mid-session snapshots for reading / listening / speaking / assignments. */

export type ReadingSessionSnap = {
  kind: 'reading';
  textId: string;
  level: string;
  isCustomMode: boolean;
  customText?: string;
  timedMode: boolean;
  timeLeft: number;
  transcript: string;
  isFinished: boolean;
  contentLang?: string;
  /** Soft progress: words attempted via alignment isn't stored; timer + text id is enough to reopen */
  updatedAt: number;
};

export type ListeningSessionSnap = {
  kind: 'listening';
  title: string;
  level: string;
  passage: string;
  questions: any[];
  answers: Record<number, number>;
  submitted: boolean;
  contentLang?: string;
  updatedAt: number;
};

export type SpeakingSessionSnap = {
  kind: 'speaking';
  level: string;
  topicIdx: number;
  view: string;
  contentLang?: string;
  updatedAt: number;
};

export type AssignmentResumeSnap = {
  kind: 'assignment-exercise';
  assignmentId: string;
  exerciseType: string;
  words: string[];
  updatedAt: number;
};

const READING_KEY = 'reading_session_v1';
const LISTENING_KEY = 'listening_session_v1';
const SPEAKING_KEY = 'speaking_session_v1';
const ASSIGNMENT_KEY = 'assignment_exercise_resume_v1';
export const READING_RESUME_FLAG = 'reading_resume_now';
export const LISTENING_RESUME_FLAG = 'listening_resume_now';
export const SPEAKING_RESUME_FLAG = 'speaking_resume_now';

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function clear(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function loadReadingSession(): ReadingSessionSnap | null {
  return load(READING_KEY);
}
export function saveReadingSession(s: Omit<ReadingSessionSnap, 'kind' | 'updatedAt'> & { updatedAt?: number }) {
  save(READING_KEY, { ...s, kind: 'reading', updatedAt: s.updatedAt ?? Date.now() });
}
export function clearReadingSession() {
  clear(READING_KEY);
}

export function loadListeningSession(): ListeningSessionSnap | null {
  return load(LISTENING_KEY);
}
export function saveListeningSession(s: Omit<ListeningSessionSnap, 'kind' | 'updatedAt'> & { updatedAt?: number }) {
  save(LISTENING_KEY, { ...s, kind: 'listening', updatedAt: s.updatedAt ?? Date.now() });
}
export function clearListeningSession() {
  clear(LISTENING_KEY);
}

export function loadSpeakingSession(): SpeakingSessionSnap | null {
  return load(SPEAKING_KEY);
}
export function saveSpeakingSession(s: Omit<SpeakingSessionSnap, 'kind' | 'updatedAt'> & { updatedAt?: number }) {
  save(SPEAKING_KEY, { ...s, kind: 'speaking', updatedAt: s.updatedAt ?? Date.now() });
}
export function clearSpeakingSession() {
  clear(SPEAKING_KEY);
}

export function loadAssignmentExerciseResume(): AssignmentResumeSnap | null {
  return load(ASSIGNMENT_KEY);
}
export function saveAssignmentExerciseResume(s: Omit<AssignmentResumeSnap, 'kind' | 'updatedAt'> & { updatedAt?: number }) {
  save(ASSIGNMENT_KEY, { ...s, kind: 'assignment-exercise', updatedAt: s.updatedAt ?? Date.now() });
}
export function clearAssignmentExerciseResume() {
  clear(ASSIGNMENT_KEY);
}

export function requestFlag(flag: string) {
  try {
    sessionStorage.setItem(flag, '1');
  } catch {}
}
export function consumeFlag(flag: string): boolean {
  try {
    if (sessionStorage.getItem(flag) === '1') {
      sessionStorage.removeItem(flag);
      return true;
    }
  } catch {}
  return false;
}

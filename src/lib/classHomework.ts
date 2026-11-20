import type { Assignment, Submission } from '../firebase';
import type { CompletionRecord, CompletionType } from './completions';
import { readScopedJSON, writeScopedJSON } from './userStorage';

export const HOMEWORK_STARTED_KEY = 'smarty_assignment_pending';
export const HOMEWORK_REFRESH = 'smarty:homework-refresh';

type ComprehensionDraft<Question> = { title: string; lang: string; questions: Question[]; answers: Record<number, number> };
export function readHomeworkDraft<Question>(id: string | undefined, title: string, lang: string) {
  if (!id) return null;
  const draft = readScopedJSON<ComprehensionDraft<Question> | null>(`homework-draft:${id}`, null);
  return draft?.title === title && draft.lang === lang ? draft : null;
}
export function saveHomeworkDraft<Question>(id: string, draft: ComprehensionDraft<Question> | null) {
  writeScopedJSON(`homework-draft:${id}`, draft);
}

export function needsMaxForHomework(type: Assignment['type']): boolean {
  return type === 'speaking' || type === 'writing';
}

export function isHomeworkRoute(assignment: Assignment, tab: string, path: string[]) {
  switch (assignment.type) {
    case 'reading': return tab === 'reading' && (path[0] === 'practice' || (!assignment.passageId && path[0] === 'library'));
    case 'comp-reading': return tab === 'reading' && (!path[0] || path[0] === 'menu');
    case 'lesson': return tab === 'lessons' && path[0] === 'bite' && path[2] === assignment.lessonId;
    case 'listening': return tab === 'listening' && path[0] === 'comprehensive';
    case 'speaking': return tab === 'speaking' && path[0] === 'general';
    case 'writing': return tab === 'writing' && path[0] === 'general';
    case 'exercise': return tab === 'exercises';
    default: return false;
  }
}

export function homeworkResult(assignment: Assignment, record: CompletionRecord): Partial<Submission> | undefined {
  const completion: Partial<Record<Assignment['type'], CompletionType>> = {
    reading: 'reading-pronunciation', 'comp-reading': 'comprehensive-reading', listening: 'comprehensive-listening',
    speaking: 'speaking', writing: 'writing',
  };
  if (completion[assignment.type] !== record.type) return;
  const match = (expected: string | undefined, actual: unknown) => !expected || expected === actual;
  if (assignment.type === 'reading' && (!match(assignment.passageId, record.data?.textId) || !record.data?.wordsRead)) return;
  if (assignment.type === 'comp-reading' && !match(assignment.compReadingPassageTitle, record.title)) return;
  if (assignment.type === 'listening' && !match(assignment.listeningPassageTitle, record.title)) return;
  if (assignment.type === 'speaking' && !match(assignment.speakingTopic?.slice(0, 80), record.title)) return;
  if (assignment.type === 'writing' && !match(assignment.writingTopic?.slice(0, 80), record.title)) return;
  const accuracy = record.accuracy ?? (record.band === undefined ? undefined : Math.round(record.band / 9 * 100));
  return { ...(accuracy !== undefined ? { score: accuracy, accuracy } : {}),
    ...(record.band !== undefined ? { band: record.band } : {}),
    ...(typeof record.data?.wordsRead === 'number' ? { wordsRead: record.data.wordsRead } : {}),
    ...(Array.isArray(record.data?.mistakeWords) ? { errors: record.data.mistakeWords } : {}) };
}

// Activity tracker — logs every student activity (exercise, reading, listening,
// speaking, writing, etc.) to Firestore so teachers can see fine-grained results.
//
// Wire-up: any feature that finishes an activity calls `logActivity({...})`.
// The tracker writes to `studentActivity/{studentUid}/events/{auto-id}` with a
// timestamp and a `type` discriminator. Teachers query this collection per
// student to render the activity feed. Failures are swallowed and logged — the
// student's flow never blocks on tracking.

import { auth } from '../firebase';
import { dataRequest } from './selfHostedApi';

export type ActivityType =
  | 'reading_pronunciation'    // Speaking out a reading text
  | 'reading_assignment'       // Assignment-based reading
  | 'comprehensive_reading'    // Comprehensive Reading MCQ
  | 'comprehensive_listening'  // Comprehensive Listening MCQ
  | 'listening_practice'       // Listening practice (audio + question)
  | 'speaking_practice'        // Speaking practice topic
  | 'writing_practice'         // Writing practice essay
  | 'ai_check_writing'         // AI Writing checker run
  | 'ai_check_speaking'        // AI Speaking checker run
  | 'interactive_story'        // Interactive story completion
  | 'exercise'                 // Generic exercise (flashcards, quiz, etc.)
  | 'vocabulary_add'           // Saved a word
  | 'translation_practice'     // Translation practice (any-language)
  | 'audio_dictation';         // Audio dictation

export interface ActivityDetail {
  question?: string;
  options?: string[];
  correctIndex?: number;
  pickedIndex?: number;
  isCorrect?: boolean;
  word?: string;
  expected?: string;
  actual?: string;
  durationMs?: number;
  [k: string]: any;
}

export interface ActivityRecord {
  type: ActivityType;
  title?: string;
  level?: string;
  score?: number;
  total?: number;
  accuracy?: number;       // 0-100
  durationMs?: number;
  exerciseId?: string;
  topic?: string;
  details?: ActivityDetail[];
  // Audit / context
  timestamp?: number;
  studentUid?: string;
  studentName?: string;
  studentEmail?: string;
}

const MAX_DETAILS = 50; // cap per-question detail entries to keep docs small

function clean<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)) as T;
}

/**
 * Log a student activity. Fire-and-forget — never throws. Safe to call from
 * any UI handler. Skips silently if Firebase isn't configured or user isn't
 * signed in (e.g. preview/anonymous mode).
 */
export function logActivity(record: ActivityRecord): void {
  try {
    if (!auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    const detailsArr = Array.isArray(record.details)
      ? record.details.slice(0, MAX_DETAILS).map((d) => (d && typeof d === 'object' ? clean(d) : d))
      : undefined;
    const payload = clean({
      ...record,
      timestamp: record.timestamp ?? Date.now(),
      studentUid: uid,
      studentName: auth.currentUser.displayName || '',
      studentEmail: auth.currentUser.email || '',
      details: detailsArr,
    });

    dataRequest('activity.add', { uid, record: payload }).catch((err) => {
      console.warn('[activity-tracker] failed to log activity:', err?.message || err);
    });
  } catch (err: any) {
    console.warn('[activity-tracker] failed to log activity:', err?.message || err);
  }
}

/** Fetch the latest N events for a single student — used by the teacher view. */
export async function getStudentActivity(studentUid: string, count = 100): Promise<ActivityRecord[]> {
  try {
    return await dataRequest<ActivityRecord[]>('activity.list', { studentUid, limit: count });
  } catch (err) {
    console.warn('[activity-tracker] failed to fetch activity:', err);
    return [];
  }
}

/** Fetch activity for several students at once (e.g. all students in a class). */
export async function getActivityForStudents(
  studentUids: string[],
  perStudent = 50,
): Promise<Record<string, ActivityRecord[]>> {
  const result: Record<string, ActivityRecord[]> = {};
  await Promise.all(
    studentUids.map(async uid => {
      result[uid] = await getStudentActivity(uid, perStudent);
    }),
  );
  return result;
}

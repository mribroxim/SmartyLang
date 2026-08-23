/**
 * Client for POST /api/ai — writing/speaking examiner + speaking buddy.
 */
import { auth } from '../firebase';

export type AiImprovement = {
  what_you_did: string;
  what_you_could_have_done: string;
  reason: string;
};

export type AiCriterion = {
  name: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  improvements: AiImprovement[];
};

export type AiCheckReportData = {
  style: 'ielts' | 'practice';
  criteria: AiCriterion[];
  final: {
    overallScore: number;
    summary: string;
    generalFeedback?: string;
    levelLabel?: string;
    topPriorities?: string[];
  };
  pronunciationNote?: string;
  contentLang?: string;
  langLabel?: string;
  checkedAt?: number;
};

export class AiExaminerError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth?.currentUser;
  if (!user) throw new AiExaminerError('Sign in required', 401);
  const token = await user.getIdToken();
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function postAi<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  let data: any = null;
  try { data = await r.json(); } catch { /* ignore */ }
  if (!r.ok) {
    throw new AiExaminerError(data?.error || `AI request failed (${r.status})`, r.status);
  }
  return data as T;
}

export async function checkWriting(opts: {
  essay: string;
  prompt: string;
  task: 't1' | 't2' | 'practice';
  wordCount?: number;
  level?: string;
  uiLang: string;
  contentLang: string;
  chartType?: string;
  visualSummary?: string;
}): Promise<AiCheckReportData> {
  const { report } = await postAi<{ report: AiCheckReportData }>({
    action: 'check-writing',
    ...opts,
  });
  return report;
}

export async function checkSpeaking(opts: {
  transcript: string;
  questions?: string;
  prompt?: string;
  part?: string;
  duration?: number;
  level?: string;
  style?: 'ielts' | 'practice';
  uiLang: string;
  contentLang: string;
}): Promise<AiCheckReportData> {
  const { report } = await postAi<{ report: AiCheckReportData }>({
    action: 'check-speaking',
    ...opts,
  });
  return report;
}

export async function buddyTurn(opts: {
  history: { role: 'user' | 'assistant'; content: string }[];
  utterance: string;
  level: string;
  contentLang: string;
  uiLang: string;
}): Promise<{ reply: string; followUp: string; correctionNote: string }> {
  return postAi({ action: 'buddy-turn', ...opts });
}

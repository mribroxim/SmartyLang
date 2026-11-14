/**
 * Compatibility facade for the self-hosted SmartyLang API.
 *
 * Feature components keep importing this module, but all persistence now
 * travels through same-origin requests to Express/PostgreSQL. Keeping the
 * facade preserves the existing domain model while removing Firebase from the
 * browser runtime.
 */
import { apiRequest, dataRequest } from './lib/selfHostedApi';

export const ADMIN_EMAIL = 'abduraxmonovibroxim16@gmail.com';
export const app = null as any;
export const db = null as any;

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  getIdToken: () => Promise<string>;
};

type AuthListener = (user: User | null) => void;
let currentUser: User | null = null;
const authListeners = new Set<AuthListener>();

function userFromApi(value: any): User | null {
  if (!value?.uid) return null;
  return {
    uid: String(value.uid),
    email: value.email ?? null,
    displayName: value.displayName ?? null,
    photoURL: value.photoURL ?? null,
    getIdToken: async () => '',
  };
}

function setCurrentUser(value: any): User | null {
  currentUser = userFromApi(value);
  authListeners.forEach((listener) => listener(currentUser));
  return currentUser;
}

export const auth = {
  get currentUser(): User | null {
    return currentUser;
  },
  onAuthStateChanged(listener: AuthListener): () => void {
    authListeners.add(listener);
    // Like Firebase: report the first state only once the session check is done.
    // Reporting "signed out" before /api/auth/session answers made every reload
    // look like a fresh sign-in, which bounced deep links (e.g. a bite) to the dashboard.
    if (sessionResolved) listener(currentUser);
    return () => authListeners.delete(listener);
  },
};

let sessionResolved = false;
const sessionReady = apiRequest<{ user?: any }>('/api/auth/session')
  .then((session) => { sessionResolved = true; return setCurrentUser(session.user); })
  .catch(() => { sessionResolved = true; return setCurrentUser(null); });

export const loginWithGoogle = async (): Promise<void> => {
  window.location.assign('/api/auth/google');
};

/** Re-run account hydration after onboarding grants age/consent access. */
export const refreshAuthSession = async (): Promise<void> => {
  const session = await apiRequest<{ user?: any }>('/api/auth/session');
  setCurrentUser(session.user);
};

export const loginWithEmail = async (email: string, password: string): Promise<void> => {
  const result = await apiRequest<{ user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setCurrentUser(result.user);
};

export const registerWithEmail = async (email: string, password: string, displayName?: string): Promise<void> => {
  const result = await apiRequest<{ user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  setCurrentUser(result.user);
};

export const logout = async (): Promise<void> => {
  await apiRequest('/api/auth/logout', { method: 'POST' });
  setCurrentUser(null);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type UserRole = 'student' | 'business' | 'admin' | 'content-manager';
export type PlanId = 'smarty-max' | 'business';

export interface UserAccountProfile {
  uid?: string;
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
  organizationId?: string;
  suspended?: boolean;
  plan?: PlanId | null;
  planSeats?: number;
  planLanguages?: number;
  planExpiresAt?: number | null;
  planStartedAt?: number;
  /** Learner cancelled Smarty Max: it stays on until this time, then ends. */
  planCancelAt?: number | null;
  planCancelledAt?: number | null;
  planCancelReason?: string | null;
  sponsoredBy?: string;
  pendingInviteFrom?: string;
  startingLevel?: 'Beginner' | 'Elementary' | 'Pre-Intermediate' | 'Intermediate' | 'Advanced';
  learningGoal?: 'daily' | 'school' | 'exam';
  onboardingCompletedAt?: number;
  dailyMinutes?: 5 | 10 | 15 | 20;
  [key: string]: any;
}

export function fallbackAccountProfile(user: User): UserAccountProfile {
  const email = user.email ?? '';
  return {
    uid: user.uid,
    role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'student',
    displayName: user.displayName ?? email.split('@')[0] ?? 'User',
    email,
    createdAt: Date.now(),
    ...(user.photoURL ? { photoURL: user.photoURL } : {}),
  };
}

export const getUserProfile = async (uid: string): Promise<UserAccountProfile | null> =>
  dataRequest<UserAccountProfile | null>('profile.get', { uid });

export const ensureUserProfile = async (user: User): Promise<UserAccountProfile> =>
  dataRequest<UserAccountProfile>('profile.ensure');

export const saveOnboarding = async (
  uid: string,
  data: {
    startingLevel: UserAccountProfile['startingLevel'];
    learningGoal: UserAccountProfile['learningGoal'];
    dailyMinutes: NonNullable<UserAccountProfile['dailyMinutes']>;
    onboardingCompletedAt?: number;
  },
): Promise<void> => {
  await dataRequest('profile.update', { uid, patch: data });
};

export const updateUserDisplayName = async (uid: string, displayName: string): Promise<void> => {
  await dataRequest('profile.update', { uid, patch: { displayName } });
  if (auth.currentUser?.uid === uid) {
    currentUser = { ...auth.currentUser, displayName };
  }
};

export const listAllProfiles = (): Promise<UserAccountProfile[]> =>
  dataRequest('profile.list');

export const setUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await dataRequest('profile.role', { uid, role });
};

export const setUserPlan = async (
  uid: string,
  plan: PlanId | null,
  opts: { seats?: number; languages?: number; expiresAt?: number | null } = {},
): Promise<void> => {
  await dataRequest('profile.plan', { uid, plan, opts });
};

export interface PaymentRecord {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  planId: PlanId;
  seats: number;
  amountUSD: number;
  amountUZS: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt: number;
  transactionId?: string;
}

export const recordPayment = (record: Omit<PaymentRecord, 'id'>): Promise<string> =>
  dataRequest('payment.record', { record });

export const confirmPayment = (
  payment: Record<string, any>,
  paymentId: string,
): Promise<UserAccountProfile | null> =>
  dataRequest('payment.confirm', { payment, paymentId });

export const listPayments = (max = 200): Promise<PaymentRecord[]> =>
  dataRequest('payment.list', { limit: max });

export const suspendUser = (uid: string, suspended: boolean): Promise<void> =>
  dataRequest('profile.suspend', { uid, suspended });

export interface StudentSummary {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  streak: { current: number; max: number };
  globalStreak?: { current: number; max: number; lastDate?: string };
  totalSessions: number;
  avgAccuracy: number;
  lastActive: number;
  problemWordCount: number;
  vocabCount: number;
  xp?: number;
  weeklyXp?: number;
  weekKey?: string;
  league?: string;
  [key: string]: any;
}

export const getStudentSummaries = async (uids: string[]): Promise<StudentSummary[]> => {
  const rows = await dataRequest<StudentSummary[]>('summary.list', { uids });
  const byUid = new Map(rows.map((row) => [row.uid, row]));
  return uids.map((uid) => byUid.get(uid) || {
    uid, displayName: uid, email: '', streak: { current: 0, max: 0 }, totalSessions: 0,
    avgAccuracy: 0, lastActive: 0, problemWordCount: 0, vocabCount: 0,
  });
};

export function sortWeeklyLeagueRows(summaries: StudentSummary[], weekKey: string): StudentSummary[] {
  return [...summaries].sort((a, b) => {
    const ax = a.weekKey === weekKey ? (a.weeklyXp || 0) : 0;
    const bx = b.weekKey === weekKey ? (b.weeklyXp || 0) : 0;
    return bx !== ax ? bx - ax : (b.xp || 0) - (a.xp || 0);
  });
}

export const getGlobalLeagueLeaderboard = async (
  leagueId: string,
  weekKey: string,
  opts?: { max?: number; includeUid?: string },
): Promise<StudentSummary[]> => {
  const rows = await dataRequest<StudentSummary[]>('summary.global', {
    leagueId, weekKey, max: opts?.max ?? 50, includeUid: opts?.includeUid,
  });
  return sortWeeklyLeagueRows(rows, weekKey).slice(0, opts?.max ?? 50);
};

export interface ClassRoom {
  id?: string;
  teacherUid: string;
  organizationId?: string;
  name: string;
  description?: string;
  inviteCode: string;
  studentUids: string[];
  createdAt: number;
  [key: string]: any;
}

export const createClass = (teacherUid: string, name: string, description?: string, organizationId?: string): Promise<string> =>
  dataRequest('class.create', { teacherUid, name, description, organizationId });

export const getTeacherClasses = (teacherUid: string): Promise<ClassRoom[]> =>
  dataRequest('class.list', { kind: 'teacher', uid: teacherUid });

export const getStudentClasses = (studentUid: string): Promise<ClassRoom[]> =>
  dataRequest('class.list', { kind: 'student', uid: studentUid });

export const joinClassWithCode = (studentUid: string, code: string): Promise<ClassRoom> =>
  dataRequest('class.join', { studentUid, code });

export const removeStudentFromClass = (classId: string, studentUid: string): Promise<void> =>
  dataRequest('class.remove', { classId, studentUid });

export const deleteClass = (classId: string): Promise<void> =>
  dataRequest('class.delete', { classId });

export const regenerateInviteCode = (classId: string): Promise<string> =>
  dataRequest('class.regenerate', { classId });

export interface SmartyMaxInvitation {
  id?: string;
  sponsorUid: string;
  sponsorName: string;
  sponsorRole: UserRole;
  inviteeEmail: string;
  inviteeUid?: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: number;
  acceptedAt?: number;
  revokedAt?: number;
}

export const getSponsorSeatUsage = (sponsorUid: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  invitations: SmartyMaxInvitation[];
}> => dataRequest('invite.usage', { sponsorUid });

export const inviteToSmartyMax = (
  sponsorUid: string,
  sponsorName: string,
  sponsorRole: UserRole,
  inviteeEmail: string,
): Promise<{ status: 'accepted' | 'pending'; invitation: SmartyMaxInvitation }> =>
  dataRequest('invite.create', { sponsorUid, sponsorName, sponsorRole, inviteeEmail });

export const revokeSmartyMaxInvitation = (invitationId: string): Promise<void> =>
  dataRequest('invite.revoke', { invitationId });

export interface Assignment {
  id?: string;
  classId: string;
  className?: string;
  teacherUid: string;
  title: string;
  description?: string;
  type: 'reading' | 'listening' | 'speaking' | 'writing' | 'exercise' | 'comp-reading' | 'worksheet';
  worksheet?: any;
  worksheetLevel?: string;
  passageId?: string;
  passageLevel?: string;
  passageTitle?: string;
  compReadingLevel?: string;
  compReadingPassageTitle?: string;
  listeningLevel?: string;
  listeningPassageTitle?: string;
  listeningPassageIndex?: number;
  speakingLevel?: string;
  speakingTopicIndex?: number;
  speakingTopic?: string;
  writingLevel?: string;
  writingTopicIndex?: number;
  writingTopic?: string;
  exerciseType?: string;
  exerciseWords?: string[];
  dueDate?: number;
  createdAt: number;
  [key: string]: any;
}

export interface Submission {
  studentUid: string;
  studentName?: string;
  completedAt: number;
  score?: number;
  accuracy?: number;
  wordsRead?: number;
  errors?: string[];
  [key: string]: any;
}

export const createAssignment = (data: Omit<Assignment, 'id'>): Promise<string> =>
  dataRequest('assignment.create', { data });

export const getClassAssignments = (classId: string): Promise<Assignment[]> =>
  dataRequest('assignment.list', { classId });

export const getStudentAssignments = (classIds: string[]): Promise<Assignment[]> =>
  dataRequest('assignment.list', { classIds });

export const submitAssignment = (assignmentId: string, submission: Submission): Promise<void> =>
  dataRequest('assignment.submit', { assignmentId, submission });

export const updateSubmission = (assignmentId: string, studentUid: string, updates: Partial<Submission>): Promise<void> =>
  dataRequest('assignment.updateSubmission', { assignmentId, studentUid, updates });

export const getAssignmentSubmissions = (assignmentId: string): Promise<Submission[]> =>
  dataRequest('assignment.submissions', { assignmentId });

export const getStudentSubmissions = (assignmentIds: string[], studentUid: string): Promise<Record<string, Submission>> =>
  dataRequest('assignment.studentSubmissions', { assignmentIds, studentUid });

export const deleteAssignment = (assignmentId: string): Promise<void> =>
  dataRequest('assignment.delete', { assignmentId });

export interface AppNotification {
  id?: string;
  type: 'assignment' | 'role_change' | 'class_join' | 'announcement' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  link?: string;
}

export const getNotifications = (uid: string, limit = 20): Promise<AppNotification[]> =>
  dataRequest('notification.list', { uid, limit });

export const markNotificationRead = (uid: string, id: string): Promise<void> =>
  dataRequest('notification.read', { uid, id });

export const markAllNotificationsRead = (uid: string): Promise<void> =>
  dataRequest('notification.readAll', { uid });

export interface Announcement {
  id?: string;
  authorUid: string;
  authorName: string;
  targetType: 'class' | 'org' | 'all';
  targetId?: string;
  title: string;
  message: string;
  createdAt: number;
  [key: string]: any;
}

export const createAnnouncement = (data: Omit<Announcement, 'id'>): Promise<string> =>
  dataRequest('announcement.create', { data });

export interface AuditEntry {
  id?: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  targetUid?: string;
  details: Record<string, any>;
  timestamp: number;
}

export const getAuditLog = (limit = 100): Promise<AuditEntry[]> =>
  dataRequest('audit.list', { limit });

export interface PlatformStats {
  totalUsers: number;
  students: number;
  business: number;
  admins: number;
  suspended: number;
  totalClasses: number;
  totalAssignments: number;
}

export const getPlatformStats = (): Promise<PlatformStats> =>
  dataRequest('stats.platform');

export const getCMSDocument = async (docId: string): Promise<any | null> => {
  try { return await dataRequest('cms.get', { docId }); } catch { return null; }
};

export const setCMSDocument = (docId: string, data: any): Promise<void> =>
  dataRequest('cms.set', { docId, data });

export const deleteCMSDocument = (docId: string): Promise<void> =>
  dataRequest('cms.delete', { docId });

export type VocabMissRecord = {
  id: string;
  word: string;
  lang: string;
  targetLang?: string;
  count: number;
  sampleSentence?: string;
  lastTranslation?: string;
  source?: string;
  reviewed?: boolean;
  lastAt?: number;
  createdAt?: number;
};

export const getVocabMisses = (max = 80): Promise<VocabMissRecord[]> =>
  dataRequest('vocabMiss.list', { limit: max });

export const markVocabMissReviewed = (id: string): Promise<void> =>
  dataRequest('vocabMiss.review', { id });

export interface CustomIELTSTestRecord {
  firestoreId: string;
  title: string;
  passages: any[];
  createdAt: number;
  updatedAt?: number;
  archived?: boolean;
  status?: 'draft' | 'published';
  builtInOverrideIndex?: number;
}

export interface CustomIELTSListeningTestRecord {
  firestoreId: string;
  title: string;
  sections: any[];
  createdAt: number;
  updatedAt?: number;
  archived?: boolean;
  status?: 'draft' | 'published';
  builtInOverrideIndex?: number;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: { userId?: string | null; email?: string | null };
}

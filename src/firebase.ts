import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  type User,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteField,
  addDoc, query, where, orderBy, limit, writeBatch, arrayUnion, arrayRemove,
  Timestamp, deleteDoc, updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const firestoreDatabaseId: string = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';

export const ADMIN_EMAIL = 'abduraxmonovibroxim16@gmail.com';

export const isFirebaseConfigured: boolean = !!(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

export const app  = isFirebaseConfigured ? initializeApp(firebaseConfig) : null as any;
export const db   = isFirebaseConfigured ? getFirestore(app, firestoreDatabaseId) : null as any;
export const auth = isFirebaseConfigured ? getAuth(app) : null as any;
export const provider = new GoogleAuthProvider();

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase not configured.');
  try { await signInWithPopup(auth, provider); }
  catch (e: any) {
    if (e?.code === 'auth/popup-blocked') await signInWithRedirect(auth, provider);
    else throw e;
  }
};
export const processGoogleRedirect = async () => {
  if (!isFirebaseConfigured || !auth) return;
  await getRedirectResult(auth);
};
export const loginWithEmail = async (email: string, password: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase not configured.');
  await signInWithEmailAndPassword(auth, email, password);
};
export const registerWithEmail = async (email: string, password: string, displayName?: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase not configured.');
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
};
export const logout = async () => { if (auth) await signOut(auth); };

export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }

// ─── User Profiles ───────────────────────────────────────────────────────────
export type UserRole = 'student' | 'teacher' | 'organization' | 'admin' | 'content-manager';
export type PlanId  = 'smarty-max' | 'teacher' | 'organization';

export interface UserAccountProfile {
  uid?: string;
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
  organizationId?: string;
  suspended?: boolean;
  /** Active subscription plan, if any. */
  plan?: PlanId | null;
  /** Number of seats purchased (teacher/organization plans). */
  planSeats?: number;
  /** Timestamp the active subscription expires (or null = no expiry tracked). */
  planExpiresAt?: number | null;
  /** Timestamp the subscription was activated. */
  planStartedAt?: number;
  /** If this user's Smarty Max access is sponsored by a teacher/org, who? (their uid) */
  sponsoredBy?: string;
  /** Pending invitations sent to this email — used to upgrade them on first sign-in. */
  pendingInviteFrom?: string;
  /** CEFR-style lesson band from onboarding placement. Does not mark earlier levels complete. */
  startingLevel?: 'Beginner' | 'Elementary' | 'Pre-Intermediate' | 'Intermediate' | 'Advanced';
  /** Why the student is learning. */
  learningGoal?: 'daily' | 'school' | 'exam';
  /** Set when the student finishes or skips onboarding. */
  onboardingCompletedAt?: number;
}

const profileRef = (uid: string) => doc(db, 'userProfiles', uid);

export const getUserProfile = async (uid: string): Promise<UserAccountProfile | null> => {
  try {
    const snap = await getDoc(profileRef(uid));
    return snap.exists() ? ({ uid, ...(snap.data() as UserAccountProfile) }) : null;
  } catch { return null; }
};

export const ensureUserProfile = async (user: User): Promise<UserAccountProfile> => {
  const ref = profileRef(user.uid);
  const snap = await getDoc(ref);
  const isAdminEmail = (user.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (snap.exists()) {
    const existing = snap.data() as UserAccountProfile;
    if (isAdminEmail && existing.role !== 'admin') {
      await setDoc(ref, { role: 'admin' }, { merge: true });
      return { ...existing, uid: user.uid, role: 'admin' };
    }
    if (!isAdminEmail && existing.role === 'admin') {
      await setDoc(ref, { role: 'student' }, { merge: true });
      return { ...existing, uid: user.uid, role: 'student' };
    }
    return { uid: user.uid, ...existing };
  }
  // Firestore rejects `undefined` values; only include photoURL when present
  const profile: UserAccountProfile = {
    role: isAdminEmail ? 'admin' : 'student',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    createdAt: Date.now(),
  };
  if (user.photoURL) profile.photoURL = user.photoURL;
  await setDoc(ref, profile);

  // First sign-in: auto-accept any pending Smarty Max invitations sent to this email.
  const sponsored = await acceptPendingInvitations(user);
  if (sponsored) {
    const refreshed = await getDoc(ref);
    return { uid: user.uid, ...(refreshed.data() as UserAccountProfile) };
  }
  return { uid: user.uid, ...profile };
};

export const saveOnboarding = async (
  uid: string,
  data: {
    startingLevel: UserAccountProfile['startingLevel'];
    learningGoal: UserAccountProfile['learningGoal'];
    onboardingCompletedAt?: number;
  },
): Promise<void> => {
  await setDoc(profileRef(uid), {
    startingLevel: data.startingLevel,
    learningGoal: data.learningGoal,
    onboardingCompletedAt: data.onboardingCompletedAt ?? Date.now(),
  }, { merge: true });
};

export const updateUserDisplayName = async (uid: string, displayName: string) => {
  await setDoc(profileRef(uid), { displayName }, { merge: true });
  if (auth?.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { displayName });
  }
};

export const listAllProfiles = async (): Promise<UserAccountProfile[]> => {
  const snap = await getDocs(collection(db, 'userProfiles'));
  return snap.docs.map(d => ({ uid: d.id, ...(d.data() as UserAccountProfile) }));
};

export const setUserRole = async (uid: string, role: UserRole): Promise<void> => {
  if (role === 'admin') throw new Error('Admin role is reserved.');
  const patch: any = { role };
  if (role !== 'teacher') patch.organizationId = deleteField();
  await setDoc(profileRef(uid), patch, { merge: true });
  await addAuditLog({
    action: 'role_changed', actorUid: auth?.currentUser?.uid ?? '', actorEmail: auth?.currentUser?.email ?? '',
    targetUid: uid, details: { newRole: role }, timestamp: Date.now(),
  });
};

/**
 * Set the active subscription plan for a user.
 * Admin can override; the payment-success handler also calls this.
 * - 'smarty-max' → plan = 'smarty-max', role stays student
 * - 'teacher'    → plan = 'teacher', role becomes teacher
 * - 'organization' → plan = 'organization', role becomes organization
 * - null → clear plan, demote to student
 */
export const setUserPlan = async (
  uid: string,
  plan: PlanId | null,
  opts: { seats?: number; expiresAt?: number | null } = {}
): Promise<void> => {
  const patch: any = {};
  if (plan === null) {
    patch.plan = deleteField();
    patch.planSeats = deleteField();
    patch.planExpiresAt = deleteField();
    patch.planStartedAt = deleteField();
    patch.role = 'student';
  } else {
    patch.plan = plan;
    patch.planStartedAt = Date.now();
    if (opts.seats !== undefined) patch.planSeats = opts.seats;
    if (opts.expiresAt !== undefined) patch.planExpiresAt = opts.expiresAt;
    // Smarty Max keeps the user as a regular student; Teacher/Org plans elevate the role.
    if (plan === 'teacher') patch.role = 'teacher';
    else if (plan === 'organization') patch.role = 'organization';
    else if (plan === 'smarty-max') patch.role = 'student';
  }
  await setDoc(profileRef(uid), patch, { merge: true });
  await addAuditLog({
    action: 'plan_changed', actorUid: auth?.currentUser?.uid ?? '', actorEmail: auth?.currentUser?.email ?? '',
    targetUid: uid, details: { newPlan: plan ?? 'none', seats: opts.seats ?? 0 }, timestamp: Date.now(),
  });
};

// ─── Payments / Subscription Records ────────────────────────────────────────
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
  /** ATMOS transaction ID if available */
  transactionId?: string;
}

export const recordPayment = async (record: Omit<PaymentRecord, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'payments'), record);
  return ref.id;
};

export const listPayments = async (max = 200): Promise<PaymentRecord[]> => {
  try {
    const q = query(collection(db, 'payments'), orderBy('paidAt', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as PaymentRecord) }));
  } catch { return []; }
};

export const setTeacherOrganization = async (teacherUid: string, organizationUid: string | null) => {
  await setDoc(profileRef(teacherUid), { organizationId: organizationUid ?? deleteField() }, { merge: true });
};

export const suspendUser = async (uid: string, suspended: boolean) => {
  await setDoc(profileRef(uid), { suspended }, { merge: true });
  await addAuditLog({
    action: suspended ? 'user_suspended' : 'user_unsuspended',
    actorUid: auth?.currentUser?.uid ?? '', actorEmail: auth?.currentUser?.email ?? '',
    targetUid: uid, details: { suspended }, timestamp: Date.now(),
  });
};

// ─── Student Summaries (readable by teachers/orgs/admin) ─────────────────────
export interface StudentSummary {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  streak: { current: number; max: number };
  /** Account-wide habit streak (Duolingo-style). */
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
}

export const updateStudentSummary = async (uid: string, data: Partial<StudentSummary>) => {
  try { await setDoc(doc(db, 'studentSummaries', uid), data, { merge: true }); } catch { /* non-critical */ }
};

export const getStudentSummary = async (uid: string): Promise<StudentSummary | null> => {
  try {
    const snap = await getDoc(doc(db, 'studentSummaries', uid));
    return snap.exists() ? { uid, ...(snap.data() as StudentSummary) } : null;
  } catch { return null; }
};

export const getStudentSummaries = async (uids: string[]): Promise<StudentSummary[]> => {
  const results: StudentSummary[] = [];
  await Promise.all(uids.map(async uid => {
    const s = await getStudentSummary(uid);
    if (s) results.push(s);
    else results.push({ uid, displayName: uid, email: '', streak: { current: 0, max: 0 }, totalSessions: 0, avgAccuracy: 0, lastActive: 0, problemWordCount: 0, vocabCount: 0 });
  }));
  return results;
};

// ─── Classes ─────────────────────────────────────────────────────────────────
export interface ClassRoom {
  id?: string;
  teacherUid: string;
  organizationId?: string;
  name: string;
  description?: string;
  inviteCode: string;
  studentUids: string[];
  createdAt: number;
}

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const createClass = async (
  teacherUid: string, name: string, description?: string, organizationId?: string
): Promise<string> => {
  const data: ClassRoom = {
    teacherUid, name, inviteCode: generateInviteCode(),
    studentUids: [], createdAt: Date.now(),
    ...(description && { description }),
    ...(organizationId && { organizationId }),
  };
  const ref = await addDoc(collection(db, 'classes'), data);
  await addAuditLog({ action: 'class_created', actorUid: teacherUid, actorEmail: auth?.currentUser?.email ?? '', details: { classId: ref.id, name }, timestamp: Date.now() });
  return ref.id;
};

export const getTeacherClasses = async (teacherUid: string): Promise<ClassRoom[]> => {
  const q = query(collection(db, 'classes'), where('teacherUid', '==', teacherUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ClassRoom) }));
};

export const getStudentClasses = async (studentUid: string): Promise<ClassRoom[]> => {
  const q = query(collection(db, 'classes'), where('studentUids', 'array-contains', studentUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ClassRoom) }));
};

export const getOrgClasses = async (organizationId: string): Promise<ClassRoom[]> => {
  const q = query(collection(db, 'classes'), where('organizationId', '==', organizationId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ClassRoom) }));
};

export const joinClassWithCode = async (studentUid: string, code: string): Promise<ClassRoom> => {
  const q = query(collection(db, 'classes'), where('inviteCode', '==', code.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Class not found. Check the invite code.');
  const classDoc = snap.docs[0];
  const classData = { id: classDoc.id, ...(classDoc.data() as ClassRoom) };
  if (classData.studentUids.includes(studentUid)) throw new Error("You're already in this class.");
  await updateDoc(classDoc.ref, { studentUids: arrayUnion(studentUid) });
  await addNotification(studentUid, {
    type: 'class_join', title: 'Joined a class!',
    message: `You joined "${classData.name}". Good luck!`,
    read: false, createdAt: Date.now(),
  });
  return { ...classData, studentUids: [...classData.studentUids, studentUid] };
};

export const removeStudentFromClass = async (classId: string, studentUid: string) => {
  await updateDoc(doc(db, 'classes', classId), { studentUids: arrayRemove(studentUid) });
};

export const deleteClass = async (classId: string) => {
  await deleteDoc(doc(db, 'classes', classId));
};

export const updateClassInfo = async (classId: string, updates: { name?: string; description?: string }) => {
  await updateDoc(doc(db, 'classes', classId), updates);
};

export const regenerateInviteCode = async (classId: string): Promise<string> => {
  const code = generateInviteCode();
  await updateDoc(doc(db, 'classes', classId), { inviteCode: code });
  return code;
};

// ─── Smarty Max Seat Invitations ────────────────────────────────────────────
//
// A teacher's plan comes with N invitation seats (5 for the Teacher plan,
// 30+ for the Organization plan). Sponsoring a user grants them Smarty Max
// access for as long as the teacher/org keeps them as a sponsored member.

export interface SmartyMaxInvitation {
  id?: string;
  /** The teacher OR organization granting the seat. */
  sponsorUid: string;
  sponsorName: string;
  sponsorRole: UserRole;
  /** Email of the invited person. */
  inviteeEmail: string;
  /** Filled in once the invitee signs in and is sponsored. */
  inviteeUid?: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: number;
  acceptedAt?: number;
  revokedAt?: number;
}

const invitesRef = () => collection(db, 'smartyMaxInvites');

/** Sponsor count = invites that are currently 'pending' or 'accepted'. */
export const getSponsorSeatUsage = async (sponsorUid: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  invitations: SmartyMaxInvitation[];
}> => {
  try {
    const q = query(invitesRef(), where('sponsorUid', '==', sponsorUid));
    const snap = await getDocs(q);
    const invitations = snap.docs.map(d => ({ id: d.id, ...(d.data() as SmartyMaxInvitation) }));
    const active = invitations.filter(i => i.status !== 'revoked');
    return {
      total: active.length,
      pending: active.filter(i => i.status === 'pending').length,
      accepted: active.filter(i => i.status === 'accepted').length,
      invitations,
    };
  } catch {
    return { total: 0, pending: 0, accepted: 0, invitations: [] };
  }
};

/** Invite someone by email. If they already have an account, sponsor them now. */
export const inviteToSmartyMax = async (
  sponsorUid: string, sponsorName: string, sponsorRole: UserRole, inviteeEmail: string,
): Promise<{ status: 'accepted' | 'pending'; invitation: SmartyMaxInvitation }> => {
  const email = inviteeEmail.trim().toLowerCase();
  if (!email) throw new Error('Email is required.');

  // Block duplicate invitations from the same sponsor.
  const existing = await getDocs(query(
    invitesRef(),
    where('sponsorUid', '==', sponsorUid),
    where('inviteeEmail', '==', email),
  ));
  const liveDup = existing.docs.find(d => (d.data() as SmartyMaxInvitation).status !== 'revoked');
  if (liveDup) throw new Error('This email has already been invited.');

  // Try to find an existing account with that email.
  let inviteeUid: string | undefined;
  try {
    const profiles = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', email)));
    if (!profiles.empty) inviteeUid = profiles.docs[0].id;
  } catch { /* ignore — fall back to pending */ }

  const data: Omit<SmartyMaxInvitation, 'id'> = {
    sponsorUid, sponsorName, sponsorRole,
    inviteeEmail: email,
    status: inviteeUid ? 'accepted' : 'pending',
    createdAt: Date.now(),
    ...(inviteeUid && { inviteeUid, acceptedAt: Date.now() }),
  };
  const ref = await addDoc(invitesRef(), data);

  // If we found an existing account, sponsor them right away.
  if (inviteeUid) {
    await setDoc(profileRef(inviteeUid), {
      plan: 'smarty-max',
      sponsoredBy: sponsorUid,
      planStartedAt: Date.now(),
    }, { merge: true });
    await addNotification(inviteeUid, {
      type: 'announcement',
      title: '🎉 Smarty Max activated!',
      message: `${sponsorName} just gifted you Smarty Max access. All features are unlocked!`,
      read: false, createdAt: Date.now(),
    });
  }

  return {
    status: data.status as 'accepted' | 'pending',
    invitation: { id: ref.id, ...data },
  };
};

/** Revoke a previously sent invitation. Removes Smarty Max from the user if they were sponsored. */
export const revokeSmartyMaxInvitation = async (invitationId: string): Promise<void> => {
  const ref = doc(db, 'smartyMaxInvites', invitationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const inv = snap.data() as SmartyMaxInvitation;
  await updateDoc(ref, { status: 'revoked', revokedAt: Date.now() } as any);
  // If the invitee was sponsored by this sponsor, clear their plan.
  if (inv.inviteeUid) {
    const userSnap = await getDoc(profileRef(inv.inviteeUid));
    if (userSnap.exists()) {
      const user = userSnap.data() as UserAccountProfile;
      if (user.sponsoredBy === inv.sponsorUid && user.plan === 'smarty-max') {
        await setDoc(profileRef(inv.inviteeUid), {
          plan: deleteField(), sponsoredBy: deleteField(),
          planStartedAt: deleteField(),
        }, { merge: true });
      }
    }
  }
};

/**
 * Called from ensureUserProfile on first sign-in — checks if any pending invitations
 * match this user's email, and if so accepts them and grants Smarty Max.
 */
const acceptPendingInvitations = async (user: User): Promise<boolean> => {
  if (!user.email) return false;
  const email = user.email.toLowerCase();
  try {
    const q = query(invitesRef(), where('inviteeEmail', '==', email), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    if (snap.empty) return false;
    // Sponsor by the first pending invite. Mark all matching invites as accepted.
    const first = snap.docs[0].data() as SmartyMaxInvitation;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, {
      status: 'accepted', acceptedAt: Date.now(), inviteeUid: user.uid,
    } as any));
    await batch.commit();
    await setDoc(profileRef(user.uid), {
      plan: 'smarty-max',
      sponsoredBy: first.sponsorUid,
      planStartedAt: Date.now(),
    }, { merge: true });
    await addNotification(user.uid, {
      type: 'announcement',
      title: '🎉 Smarty Max activated!',
      message: `${first.sponsorName} gifted you Smarty Max access. All features are unlocked!`,
      read: false, createdAt: Date.now(),
    });
    return true;
  } catch (e) {
    console.error('acceptPendingInvitations failed:', e);
    return false;
  }
};

// ─── Assignments ─────────────────────────────────────────────────────────────
export interface Assignment {
  id?: string;
  classId: string;
  className?: string;
  teacherUid: string;
  title: string;
  description?: string;
  type: 'reading' | 'listening' | 'speaking' | 'writing' | 'exercise' | 'comp-reading' | 'worksheet';

  // ── AI-Generated Worksheet ───────────────────────────────────────────
  /** Full worksheet payload from AI Creator. Present when type === 'worksheet'. */
  worksheet?: any;
  worksheetLevel?: string;

  // ── Reading (pronunciation / fluency) ────────────────────────────────
  passageId?: string;
  passageLevel?: string;
  passageTitle?: string;

  // ── Comprehensive Reading ─────────────────────────────────────────────
  compReadingLevel?: string;
  compReadingPassageTitle?: string;

  // ── Listening / Comprehensive Listening ──────────────────────────────
  listeningLevel?: string;
  listeningPassageTitle?: string;
  listeningPassageIndex?: number;

  // ── Speaking ─────────────────────────────────────────────────────────
  speakingLevel?: string;
  speakingTopicIndex?: number;
  speakingTopic?: string;

  // ── Writing ──────────────────────────────────────────────────────────
  writingLevel?: string;
  writingTopicIndex?: number;
  writingTopic?: string;

  // ── Exercises ────────────────────────────────────────────────────────
  exerciseType?: string;
  exerciseWords?: string[];    // specific words to practice

  dueDate?: number;
  createdAt: number;
}

export interface Submission {
  studentUid: string;
  studentName?: string;
  completedAt: number;
  score?: number;
  // Detailed reading results
  accuracy?: number;
  wordsRead?: number;
  errors?: string[];   // words the student got wrong
}

export const createAssignment = async (data: Omit<Assignment, 'id'>): Promise<string> => {
  // Firestore rejects undefined field values — strip them before writing
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  const ref = await addDoc(collection(db, 'assignments'), clean);
  // Notify all students in the class
  const classSnap = await getDoc(doc(db, 'classes', data.classId));
  if (classSnap.exists()) {
    const cls = classSnap.data() as ClassRoom;
    await Promise.all(cls.studentUids.map(uid =>
      addNotification(uid, {
        type: 'assignment', title: 'New Assignment!',
        message: `"${data.title}" has been assigned to your class. ${data.dueDate ? `Due: ${new Date(data.dueDate).toLocaleDateString()}` : ''}`,
        read: false, createdAt: Date.now(), link: 'assignments',
      })
    ));
  }
  return ref.id;
};

export const getClassAssignments = async (classId: string): Promise<Assignment[]> => {
  // No orderBy here to avoid requiring a composite index; sort in JS instead
  const q = query(collection(db, 'assignments'), where('classId', '==', classId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Assignment) }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
};

export const getStudentAssignments = async (classIds: string[]): Promise<Assignment[]> => {
  if (!classIds.length) return [];
  const results: Assignment[] = [];
  await Promise.all(classIds.map(async classId => {
    const q = query(collection(db, 'assignments'), where('classId', '==', classId));
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...(d.data() as Assignment) }));
  }));
  return results.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
};

export const submitAssignment = async (assignmentId: string, submission: Submission) => {
  const clean = Object.fromEntries(Object.entries(submission).filter(([, v]) => v !== undefined));
  await setDoc(doc(db, 'assignments', assignmentId, 'submissions', submission.studentUid), clean);
};

export const updateSubmission = async (assignmentId: string, studentUid: string, updates: Partial<Submission>) => {
  const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  await setDoc(doc(db, 'assignments', assignmentId, 'submissions', studentUid), clean, { merge: true });
};

export const getAssignmentSubmissions = async (assignmentId: string): Promise<Submission[]> => {
  const snap = await getDocs(collection(db, 'assignments', assignmentId, 'submissions'));
  return snap.docs.map(d => d.data() as Submission);
};

export const getStudentSubmissions = async (assignmentIds: string[], studentUid: string): Promise<Record<string, Submission>> => {
  const result: Record<string, Submission> = {};
  await Promise.all(assignmentIds.map(async id => {
    const snap = await getDoc(doc(db, 'assignments', id, 'submissions', studentUid));
    if (snap.exists()) result[id] = snap.data() as Submission;
  }));
  return result;
};

export const deleteAssignment = async (assignmentId: string) => {
  await deleteDoc(doc(db, 'assignments', assignmentId));
};

// ─── Notifications ───────────────────────────────────────────────────────────
export interface AppNotification {
  id?: string;
  type: 'assignment' | 'role_change' | 'class_join' | 'announcement' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  link?: string;
}

export const addNotification = async (uid: string, notif: Omit<AppNotification, 'id'>) => {
  try { await addDoc(collection(db, 'notifications', uid, 'items'), notif); } catch { /* non-critical */ }
};

export const getNotifications = async (uid: string, limitN = 20): Promise<AppNotification[]> => {
  try {
    const q = query(collection(db, 'notifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as AppNotification) }));
  } catch { return []; }
};

export const markNotificationRead = async (uid: string, notifId: string) => {
  await updateDoc(doc(db, 'notifications', uid, 'items', notifId), { read: true });
};

export const markAllNotificationsRead = async (uid: string) => {
  const q = query(collection(db, 'notifications', uid, 'items'), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};

// ─── Announcements ───────────────────────────────────────────────────────────
export interface Announcement {
  id?: string;
  authorUid: string;
  authorName: string;
  targetType: 'class' | 'org' | 'all';
  targetId?: string;
  title: string;
  message: string;
  createdAt: number;
}

export const createAnnouncement = async (data: Omit<Announcement, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'announcements'), data);
  // If targeting a class, notify its members
  if (data.targetType === 'class' && data.targetId) {
    const classSnap = await getDoc(doc(db, 'classes', data.targetId));
    if (classSnap.exists()) {
      const cls = classSnap.data() as ClassRoom;
      await Promise.all(cls.studentUids.map(uid =>
        addNotification(uid, {
          type: 'announcement', title: data.title,
          message: `${data.authorName}: ${data.message}`,
          read: false, createdAt: Date.now(),
        })
      ));
    }
  }
  return ref.id;
};

export const getAnnouncements = async (targetType?: string, targetId?: string): Promise<Announcement[]> => {
  try {
    let q;
    if (targetType && targetId) {
      q = query(collection(db, 'announcements'), where('targetType', '==', targetType), where('targetId', '==', targetId), orderBy('createdAt', 'desc'), limit(50));
    } else {
      q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(50));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Announcement) }));
  } catch { return []; }
};

// ─── Audit Log ───────────────────────────────────────────────────────────────
export interface AuditEntry {
  id?: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  targetUid?: string;
  details: Record<string, any>;
  timestamp: number;
}

export const addAuditLog = async (entry: Omit<AuditEntry, 'id'>) => {
  try { await addDoc(collection(db, 'auditLog'), entry); } catch { /* non-critical */ }
};

export const getAuditLog = async (limitN = 100): Promise<AuditEntry[]> => {
  const q = query(collection(db, 'auditLog'), orderBy('timestamp', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as AuditEntry) }));
};

// ─── Platform Analytics ──────────────────────────────────────────────────────
export interface PlatformStats {
  totalUsers: number; students: number; teachers: number;
  orgs: number; admins: number; suspended: number;
  totalClasses: number; totalAssignments: number;
}

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const [profilesSnap, classesSnap, assignmentsSnap] = await Promise.all([
    getDocs(collection(db, 'userProfiles')),
    getDocs(collection(db, 'classes')),
    getDocs(collection(db, 'assignments')),
  ]);
  const counts = { student: 0, teacher: 0, organization: 0, admin: 0, suspended: 0 };
  profilesSnap.docs.forEach(d => {
    const data = d.data() as UserAccountProfile;
    counts[data.role] = (counts[data.role] ?? 0) + 1;
    if (data.suspended) counts.suspended++;
  });
  return {
    totalUsers: profilesSnap.size,
    students: counts.student, teachers: counts.teacher,
    orgs: counts.organization, admins: counts.admin, suspended: counts.suspended,
    totalClasses: classesSnap.size, totalAssignments: assignmentsSnap.size,
  };
};

// ─── CMS Content ─────────────────────────────────────────────────────────────
/** Generic get/set for the `cmsContent` Firestore collection. */
export const getCMSDocument = async (docId: string): Promise<any | null> => {
  try {
    const snap = await getDoc(doc(db, 'cmsContent', docId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const setCMSDocument = async (docId: string, data: any): Promise<void> => {
  await setDoc(doc(db, 'cmsContent', docId), { ...data, updatedAt: Date.now() });
};

export const deleteCMSDocument = async (docId: string): Promise<void> => {
  await deleteDoc(doc(db, 'cmsContent', docId));
};

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

export async function getVocabMisses(max = 80): Promise<VocabMissRecord[]> {
  if (!db) return [];
  const q = query(collection(db, 'vocabMisses'), orderBy('count', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VocabMissRecord, 'id'>) }));
}

export async function markVocabMissReviewed(id: string): Promise<void> {
  await updateDoc(doc(db, 'vocabMisses', id), { reviewed: true, reviewedAt: Date.now() });
}

// ─── Custom IELTS Tests ──────────────────────────────────────────────────────

export interface CustomIELTSTestRecord {
  firestoreId: string;
  title: string;
  passages: any[];
  createdAt: number;
  updatedAt?: number;
  archived?: boolean;
  status?: 'draft' | 'published';
  /** 0-indexed position of built-in test this overrides (0, 1, or 2). */
  builtInOverrideIndex?: number;
}

export const saveIELTSTest = async (data: {
  title: string;
  passages: any[];
  builtInOverrideIndex?: number;
  status?: 'draft' | 'published';
}): Promise<string> => {
  const ref = await addDoc(collection(db, 'ieltsTests'), {
    ...data,
    status: data.status ?? 'draft',
    archived: false,
    createdAt: Date.now(),
  });
  return ref.id;
};

export const updateIELTSTest = async (
  firestoreId: string,
  data: Partial<{ title: string; passages: any[]; archived: boolean; builtInOverrideIndex: number; status: 'draft' | 'published' }>,
): Promise<void> => {
  await updateDoc(doc(db, 'ieltsTests', firestoreId), { ...data, updatedAt: Date.now() });
};

export const getIELTSTests = async (opts: { publishedOnly?: boolean } = {}): Promise<CustomIELTSTestRecord[]> => {
  const snap = await getDocs(query(collection(db, 'ieltsTests'), orderBy('createdAt', 'asc')));
  return snap.docs
    .map(d => ({ firestoreId: d.id, ...(d.data() as Omit<CustomIELTSTestRecord, 'firestoreId'>) }))
    .filter(t => !opts.publishedOnly || t.status === 'published');
};

export const deleteIELTSTest = async (firestoreId: string): Promise<void> => {
  await deleteDoc(doc(db, 'ieltsTests', firestoreId));
};

// ─── Custom IELTS Listening Tests ────────────────────────────────────────────

export interface CustomIELTSListeningTestRecord {
  firestoreId: string;
  title: string;
  sections: any[];
  createdAt: number;
  updatedAt?: number;
  archived?: boolean;
  status?: 'draft' | 'published';
  /** 0-indexed position of built-in test this overrides (0 or 1). */
  builtInOverrideIndex?: number;
}

export const saveIELTSListeningTest = async (data: {
  title: string;
  sections: any[];
  builtInOverrideIndex?: number;
  status?: 'draft' | 'published';
}): Promise<string> => {
  const ref = await addDoc(collection(db, 'ieltsListeningTests'), {
    ...data,
    status: data.status ?? 'draft',
    archived: false,
    createdAt: Date.now(),
  });
  return ref.id;
};

export const updateIELTSListeningTest = async (
  firestoreId: string,
  data: Partial<{ title: string; sections: any[]; archived: boolean; builtInOverrideIndex: number; status: 'draft' | 'published' }>,
): Promise<void> => {
  await updateDoc(doc(db, 'ieltsListeningTests', firestoreId), { ...data, updatedAt: Date.now() });
};

export const getIELTSListeningTests = async (opts: { publishedOnly?: boolean } = {}): Promise<CustomIELTSListeningTestRecord[]> => {
  const snap = await getDocs(query(collection(db, 'ieltsListeningTests'), orderBy('createdAt', 'asc')));
  return snap.docs
    .map(d => ({ firestoreId: d.id, ...(d.data() as Omit<CustomIELTSListeningTestRecord, 'firestoreId'>) }))
    .filter(t => !opts.publishedOnly || t.status === 'published');
};

export const deleteIELTSListeningTest = async (firestoreId: string): Promise<void> => {
  await deleteDoc(doc(db, 'ieltsListeningTests', firestoreId));
};

// ─── Error handling ──────────────────────────────────────────────────────────
export interface FirestoreErrorInfo { error: string; operationType: OperationType; path: string | null; authInfo: { userId?: string | null; email?: string | null } }

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { userId: auth?.currentUser?.uid, email: auth?.currentUser?.email },
    operationType, path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

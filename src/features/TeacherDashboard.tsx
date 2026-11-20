import { DialogSurface } from '../components/DialogSurface';
import { BusinessTeachers } from './Business/BusinessTeachers';
import { useUiLang } from '../contexts/UiLangContext';
import { needsMaxForHomework } from '../lib/classHomework';
import { useContentLang } from '../contexts/ContentLangContext';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, FileText, Copy, Trash2, ChevronRight,
  RefreshCw, CheckCircle2, X, BookOpen, Brain,
  Eye, Loader2, Calendar,
  Mic, PenLine, Headphones, Gamepad2, GraduationCap,
} from 'lucide-react';
import {
  auth, ClassRoom, Assignment, Submission,
  createClass, getTeacherClasses, createAssignment,
  getClassAssignments, getAssignmentSubmissions, deleteAssignment, deleteClass,
  removeStudentFromClass, regenerateInviteCode, type UserAccountProfile,
} from '../firebase';
import { Level } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import { SPEAKING_LEVELS } from '../data/speakingTopics';
import { PRACTICE_LEVELS } from '../data/practiceTopics';
import { useCMSContent } from '../lib/useCMSContent';
import { getListeningPassagesForLevel } from '../data/comprehensiveListening';
import { getReadingPassagesForLevel } from '../data/comprehensiveReading';
import { apiRequest, dataRequest } from '../lib/selfHostedApi';
import type { GameKind, TeacherGame } from '../lib/liveWordGame';
import { MODE_META } from './Classes/liveGameKit';
import { GameKitLibrary } from './Classes/GameKits';
import { ChunkyButton } from './Bites/lesson/chunky';
import { StudentDetail } from './Activity/StudentDetail';
import { ClassRecommendations } from './Activity/RecommendedWords';
import { SeatsPanel } from './Activity/SeatsPanel';
import { ManagementTabs } from '../components/ManagementTabs';
import '../styles/management.css';
import { ScreenShell, seCard, seInteractive } from '../components/ScreenShell';

export type TeacherTab = 'classes' | 'assignments' | 'games';

const READING_LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];





function InviteCodeBadge({ code, classId }: { code: string; classId: string }) {
  const { t: tr } = useUiLang();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const [error, setError] = useState(false);
  const copy = async () => {
    setError(false);
    try { await navigator.clipboard.writeText(currentCode); setCopied(true); }
    catch { setError(true); }
  };
  const regen = async () => {
    setRegenerating(true);
    setError(false);
    setCopied(false);
    try { setCurrentCode(await regenerateInviteCode(classId)); }
    catch { setError(true); }
    finally { setRegenerating(false); }
  };
  return (
    <div className="flex items-center gap-2">
      <span className="font-serif font-extrabold text-lg tracking-widest text-zinc-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-lg">{currentCode}</span>
      <button onClick={copy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title={tr("site.teacherdashboard.copy_af74f7")}>
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
      <button onClick={regen} disabled={regenerating} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title={tr("site.teacherdashboard.regenerate_b04c99")}>
        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
      </button>
      {error && <span role="alert" className="text-sm text-rose-700 dark:text-rose-300">{tr('management.loadError')}</span>}
    </div>
  );
}

function LoadError({ retry }: { retry: () => void }) {
  const { t } = useUiLang();
  return <div role="alert" className={`${seCard} p-4`}>
    <p className="font-serif font-extrabold">{t('management.loadError')}</p>
    <button type="button" onClick={retry} className="mt-1 font-serif text-sm font-bold underline">{t('action.tryAgain')}</button>
  </div>;
}

function ClassRoster({ classId, onChange, onOpenStudent }: { classId: string; onChange: () => Promise<void>; onOpenStudent: (student: { uid: string; name: string }) => void }) {
  const { t } = useUiLang();
  const [students, setStudents] = useState<{ uid: string; name: string; disabled: boolean }[] | null>(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [revision, setRevision] = useState(0);
  const [removing, setRemoving] = useState<string>();

  useEffect(() => {
    const ctl = new AbortController();
    setError(false);
    dataRequest<NonNullable<typeof students>>('class.roster', { classId }, { signal: ctl.signal })
      .then(rows => { if (!ctl.signal.aborted) setStudents(rows); })
      .catch(() => { if (!ctl.signal.aborted) setError(true); });
    return () => ctl.abort();
  }, [classId, revision]);

  const remove = async (uid: string, name: string) => {
    if (!window.confirm(t('teacher.roster.removeConfirm', { name }))) return;
    setRemoving(uid);
    setActionError('');
    try {
      await removeStudentFromClass(classId, uid);
      setStudents(rows => rows?.filter(row => row.uid !== uid) ?? null);
      await onChange();
    } catch (error) { setActionError(error instanceof Error ? error.message : t('management.loadError')); }
    finally { setRemoving(undefined); }
  };
  return <section className="mt-4 border-t border-slate-200 pt-4 dark:border-zinc-700">
    <h4 className="mb-2 font-serif font-extrabold">{t('site.teacherdashboard.students_fcfac3')}</h4>
    {actionError && <p role="alert" className="mb-2 text-sm text-rose-700 dark:text-rose-300">{actionError}</p>}
    {error ? <LoadError retry={() => setRevision(value => value + 1)} /> : !students
      ? <p role="status" className="text-sm">{t('teacher.loading')}</p> : students.length === 0
        ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('site.teacherdashboard.no_students_yet_share_the_246fd7')}</p>
        : <ul className="divide-y divide-slate-200 dark:divide-zinc-700">{students.map(student => {
          const name = student.name || t('site.identity.student');
          return <li key={student.uid} className="flex items-center justify-between gap-3 py-2">
            <button type="button" onClick={() => onOpenStudent({ uid: student.uid, name })} aria-label={t('teacher.student.view', { name })}
              className="flex min-w-0 flex-1 items-center gap-1 break-words text-left font-serif text-sm font-extrabold hover:underline">{name}{student.disabled && <span className="ml-2 font-sans font-medium text-zinc-500 dark:text-zinc-400">{t('teacher.roster.suspended')}</span>}<ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></button>
            <button type="button" disabled={!!removing} onClick={() => void remove(student.uid, name)} aria-label={t('teacher.roster.remove', { name })}
              className="shrink-0 rounded-lg px-2 text-sm font-semibold text-zinc-600 hover:text-rose-700 dark:text-zinc-300 dark:hover:text-rose-300">{t('site.teacherdashboard.remove_e96390')}</button>
          </li>;
        })}</ul>}
  </section>;
}

function GameRooms({ classId, onOpen }: { classId: string; onOpen: (classId: string, code?: string) => void }) {
  const { t } = useUiLang();
  const [rooms, setRooms] = useState<TeacherGame[] | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const ctl = new AbortController();
    setError(false);
    apiRequest<TeacherGame[]>(`/api/live-game?classId=${encodeURIComponent(classId)}`, { signal: ctl.signal })
      .then(data => { if (!ctl.signal.aborted) setRooms(data); })
      .catch(() => { if (!ctl.signal.aborted) setError(true); });
    return () => ctl.abort();
  }, [classId, revision]);

  const refresh = () => setRevision(value => value + 1);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setRevision(value => value + 1);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-serif text-xl font-extrabold">{t('class.live.title')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={refresh} className="inline-flex items-center gap-2 font-serif text-sm font-extrabold underline">
          <RefreshCw className="h-4 w-4" />{t('teacher.refresh')}
        </button>
        {rooms && !rooms.some(room => room.phase !== 'finished') &&
          <ChunkyButton onClick={() => onOpen(classId)}><Gamepad2 className="h-4 w-4" />{t('class.live.host')}</ChunkyButton>}
      </div>
    </div>
    {error ? <LoadError retry={refresh} /> : !rooms
      ? <p role="status">{t('teacher.loading')}</p> : rooms.length === 0
        ? <p className={`${seCard} p-5 text-sm text-zinc-600 dark:text-zinc-300`}>{t('teacher.games.empty')}</p>
        : <div className="space-y-3">
          {rooms.map(room => <article key={room.code} className={`${seCard} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div>
              <h3 className="font-serif font-extrabold">{t(MODE_META[room.mode as GameKind]?.title ?? 'game.mode.quiz')} <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{room.code}</span></h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t('class.live.playerCount', { n: room.playerCount })} · {
                room.phase === 'finished' ? t('class.live.finished') : room.phase === 'lobby' ? t('teacher.games.lobby')
                  : t('class.live.round', { n: room.round, total: room.rounds })
              }</p>
            </div>
            <ChunkyButton tone={room.phase === 'finished' ? 'secondary' : 'primary'}
              onClick={() => onOpen(classId, room.code)}>{t(room.phase === 'finished' ? 'teacher.games.results' : 'teacher.games.resume')}</ChunkyButton>
          </article>)}
        </div>}
  </section>;
}

// ── Level tab strip ──────────────────────────────────────────────────────────
function LevelPicker({ levels, active, onSelect }: { levels: string[]; active: string; onSelect: (level: string) => void }) {
  const { t, tLevel } = useUiLang();
  return <label className="block max-w-sm space-y-1 text-sm font-semibold">
    <span>{t('core.dashboardview.level_7c7f5d')}</span>
    <select value={active} onChange={event => onSelect(event.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
      {levels.map(level => <option key={level} value={level}>{tLevel(level)}</option>)}
    </select>
  </label>;
}

export function TeacherDashboard({ tab, classId, onNavigate, onHostGame, profile, onOpenPlans }: {
  /** Business accounts get a seats section; teachers do not. */
  profile?: UserAccountProfile | null;
  onOpenPlans?: () => void;
  tab: TeacherTab;
  classId?: string;
  onNavigate: (tab: TeacherTab, classId?: string) => void;
  onHostGame: (classId: string, code?: string) => void;
}) {
  const { t: tr, uiLang } = useUiLang();
const EXERCISE_TYPES = [
  { id: 'flashcards',           label: tr("learning.flashcards.2c6822") },
  { id: 'definition-quiz',      label: tr("learning.quiz.25c86f") },
  { id: 'listening-match',      label: tr("home.preview.listening") },
  { id: 'true-false-quiz',      label: tr("onboard.section.truefalse") },
  { id: 'memory-match',         label: tr("learning.memory.match.294cac") },
  { id: 'word-match',           label: tr("learning.word.match.a3d65e") },
  { id: 'spelling-practice',    label: tr("core.management.spelling_8a21b1") },
  { id: 'pronunciation',        label: tr("core.common.pronunciation_edd4ff") },
  { id: 'word-scramble',        label: tr("learning.word.scramble.b1e4dc") },
];
const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reading:        { label: tr("home.preview.reading"),         icon: BookOpen,   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'comp-reading': { label: tr("core.management.comp_reading_69cffb"),   icon: BookOpen,   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  listening:      { label: tr("core.management.comp_listening_9bfe80"), icon: Headphones, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  speaking:       { label: tr("home.preview.speaking"),        icon: Mic,        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  writing:        { label: tr("nav.writing"),         icon: PenLine,    color: 'bg-violet-50 text-violet-700 border-violet-200' },
  exercise:       { label: tr('hw.type.words'),                icon: Brain,      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  lesson:         { label: tr('hw.type.lesson'),               icon: GraduationCap, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

  const LEVEL_TEXTS = useLevelTexts();
  const { dictCode, contentLang } = useContentLang();
  const teacherUid = auth?.currentUser?.uid ?? '';
  // ── Classes ─────────────────────────────────────────────────────────────────
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const selectedClass = classes.find(cls => cls.id === classId) ?? classes[0];
  const selectedId = selectedClass?.id;
  const [actionFailure, setActionFailure] = useState('');
  const [openRoster, setOpenRoster] = useState<string | null>(null);
  const [openWords, setOpenWords] = useState<string | null>(null);
  const [openStudent, setOpenStudent] = useState<{ classId: string; uid: string; name: string } | null>(null);
  const isBusiness = profile?.role === 'business';
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // ── Assignments ─────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [assignmentRefresh, setAssignmentRefresh] = useState(0);
  const [published, setPublished] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [reviewHomework, setReviewHomework] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Common fields
  const [aType, setAType] = useState<Assignment['type']>('exercise');
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aDue, setADue] = useState('');

  // Lesson / unit
  const [aLessonLevel, setALessonLevel] = useState<Level>('Beginner');
  const [aLessonId, setALessonId] = useState('');

  // Reading
  const [aReadingLevel, setAReadingLevel] = useState<Level>('Beginner');
  const [aReadingPassageId, setAReadingPassageId] = useState('');

  // Listening (Comp. Listening)
  const [aListeningLevel, setAListeningLevel] = useState<Level>('Beginner');
  const [aListeningPassageTitle, setAListeningPassageTitle] = useState('');
  const [aListeningPassages, setAListeningPassages] = useState<{ title: string; passage: string }[]>([]);
  const [aListeningPassagesLoading, setAListeningPassagesLoading] = useState(false);

  // Comprehensive Reading
  const [aCompReadingLevel, setACompReadingLevel] = useState<Level>('Beginner');
  const [aCompReadingPassageTitle, setACompReadingPassageTitle] = useState('');
  const [aCompReadingPassages, setACompReadingPassages] = useState<{ title: string; passage: string }[]>([]);
  const [aCompReadingPassagesLoading, setACompReadingPassagesLoading] = useState(false);

  // Speaking
  const [aSpeakingLevel, setASpeakingLevel] = useState<string>('Beginner');
  const [aSpeakingTopicIdx, setASpeakingTopicIdx] = useState(-1);

  // Writing
  const [aWritingLevel, setAWritingLevel] = useState<string>('Beginner');
  const [aWritingTopicIdx, setAWritingTopicIdx] = useState(-1);

  // Exercise
  const [aExerciseType, setAExerciseType] = useState('flashcards');
  const [aExerciseWordSource, setAExerciseWordSource] = useState<'level' | 'custom'>('level');
  const [aExerciseVocabLevel, setAExerciseVocabLevel] = useState<Level>('Beginner');
  const [aExerciseVocabPassageId, setAExerciseVocabPassageId] = useState('');
  const [aExerciseCustomWords, setAExerciseCustomWords] = useState('');

  // Results viewer
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(false);
  const [submissionsRefresh, setSubmissionsRefresh] = useState(0);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    if (!teacherUid) { setClassesLoading(false); return; }
    setLoadFailure(null);
    setClassesLoading(true);
    try { const c = await getTeacherClasses(teacherUid); setClasses(c); }
    catch (error) { setLoadFailure(error instanceof Error ? error.message : 'Request failed'); }
    finally { setClassesLoading(false); }
  }, [teacherUid]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (!selectedId || tab !== 'assignments') return;
    const controller = new AbortController();
    setAssignmentsLoading(true);
    setAssignmentsError(false);
    setAssignments([]);
    getClassAssignments(selectedId, controller.signal)
      .then(items => { if (!controller.signal.aborted) setAssignments(items); })
      .catch(() => { if (!controller.signal.aborted) setAssignmentsError(true); })
      .finally(() => { if (!controller.signal.aborted) setAssignmentsLoading(false); });
    return () => controller.abort();
  }, [selectedId, tab, assignmentRefresh]);

  useEffect(() => {
    if (tab !== 'assignments' || !selectedId) return;
    const refresh = () => setAssignmentRefresh(revision => revision + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [selectedId, tab]);

  useEffect(() => {
    if (!viewingAssignment?.id) return;
    const controller = new AbortController();
    setSubmissions([]);
    setExpandedSub(null);
    setSubmissionsLoading(true);
    setSubmissionsError(false);
    const id = viewingAssignment.id;
    getAssignmentSubmissions(id, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setSubmissions(items);
        setAssignments(rows => rows.map(row => row.id === id ? { ...row, submissionCount: items.length } : row));
      })
      .catch(() => { if (!controller.signal.aborted) setSubmissionsError(true); })
      .finally(() => { if (!controller.signal.aborted) setSubmissionsLoading(false); });
    return () => controller.abort();
  }, [viewingAssignment?.id, submissionsRefresh]);

  // Load listening passages when level changes (in the assignment form)
  useEffect(() => {
    if (aType !== 'listening' || !showNewAssignment) return;
    let cancelled = false;
    setAListeningPassagesLoading(true);
    setAListeningPassageTitle('');
    getListeningPassagesForLevel(aListeningLevel)
      .then(ps => { if (!cancelled) setAListeningPassages(ps); })
      .catch(() => { if (!cancelled) setAListeningPassages([]); })
      .finally(() => { if (!cancelled) setAListeningPassagesLoading(false); });
    return () => { cancelled = true; };
  }, [aType, aListeningLevel, showNewAssignment]);

  // Load comprehensive reading passages when level changes
  useEffect(() => {
    if (aType !== 'comp-reading' || !showNewAssignment) return;
    let cancelled = false;
    setACompReadingPassagesLoading(true);
    setACompReadingPassageTitle('');
    getReadingPassagesForLevel(aCompReadingLevel)
      .then(ps => { if (!cancelled) setACompReadingPassages(ps); })
      .catch(() => { if (!cancelled) setACompReadingPassages([]); })
      .finally(() => { if (!cancelled) setACompReadingPassagesLoading(false); });
    return () => { cancelled = true; };
  }, [aType, aCompReadingLevel, showNewAssignment]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const readingPassages = LEVEL_TEXTS[aReadingLevel] ?? [];
  const { speakingTopics: selectedSpeakingTopics, writingTopics: selectedWritingTopics } = useCMSContent();
  const speakingTopics = selectedSpeakingTopics[aSpeakingLevel as keyof typeof selectedSpeakingTopics] ?? [];
  const writingTopics = selectedWritingTopics[aWritingLevel as keyof typeof selectedWritingTopics] ?? [];
  const exercisePassages = LEVEL_TEXTS[aExerciseVocabLevel] ?? [];
  const exercisePassageVocab = aExerciseVocabPassageId
    ? (exercisePassages.find((p: any) => p.id === aExerciseVocabPassageId)?.vocabulary ?? [])
    : exercisePassages.flatMap((p: any) => p.vocabulary ?? []);

  const getExerciseWords = (): string[] => {
    const raw = aExerciseWordSource === 'custom' ? aExerciseCustomWords.split(/[\n,]+/) : exercisePassageVocab.map(v => v.word);
    return [...new Set(raw.map(w => w.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
  };

  const resetAssignmentForm = () => {
    setReviewHomework(false);
    setATitle(''); setADesc(''); setADue('');
    setAReadingPassageId(''); setALessonId('');
    setAListeningPassageTitle(''); setAListeningPassages([]);
    setACompReadingPassageTitle(''); setACompReadingPassages([]);
    setASpeakingTopicIdx(-1);
    setAWritingTopicIdx(-1);
    setAExerciseCustomWords(''); setAExerciseVocabPassageId('');
    setShowNewAssignment(false);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    setActionFailure('');
    try {
      await createClass(teacherUid, newClassName.trim(), newClassDesc.trim() || undefined);
      setNewClassName(''); setNewClassDesc(''); setShowNewClass(false);
      await loadClasses();
    } catch (error) { setActionFailure(error instanceof Error ? error.message : tr('management.loadError')); }
    finally { setCreatingClass(false); }
  };

  const handleDeleteClass = async (cls: ClassRoom) => {
    if (!confirm(tr("core.management.delete_name_students_will_lose_625068", { name: cls.name }))) return;
    setActionFailure('');
    try { await deleteClass(cls.id!); await loadClasses(); }
    catch (error) { setActionFailure(error instanceof Error ? error.message : tr('management.loadError')); }
  };

  const handleCreateAssignment = async () => {
    if (!aTitle.trim() || !selectedClass || aType === 'exercise' && getExerciseWords().length < 2 || aType === 'lesson' && !aLessonId) return;
    setCreatingAssignment(true);
    setActionFailure('');
    setPublished(false);
    try {
      const base = {
        classId: selectedClass.id!, teacherUid, title: aTitle.trim(),
        description: aDesc.trim() || undefined,
        type: aType, contentLang,
        dueDate: aDue ? new Date(`${aDue}T23:59:59`).getTime() : undefined,
        createdAt: Date.now(),
      };

      const typeExtra: Partial<Assignment> = {};

      if (aType === 'reading' && aReadingPassageId) {
        const p = readingPassages.find((x: any) => x.id === aReadingPassageId);
        typeExtra.passageId = p?.id;
        typeExtra.passageLevel = aReadingLevel;
        typeExtra.passageTitle = p?.title;
      }
      if (aType === 'listening' && aListeningPassageTitle) {
        typeExtra.listeningLevel = aListeningLevel;
        typeExtra.listeningPassageTitle = aListeningPassageTitle;
        typeExtra.listeningPassageIndex = aListeningPassages.findIndex(p => p.title === aListeningPassageTitle);
      }
      if (aType === 'comp-reading' && aCompReadingPassageTitle) {
        typeExtra.compReadingLevel = aCompReadingLevel;
        typeExtra.compReadingPassageTitle = aCompReadingPassageTitle;
      }
      if (aType === 'speaking' && aSpeakingTopicIdx >= 0) {
        typeExtra.speakingLevel = aSpeakingLevel;
        typeExtra.speakingTopicIndex = aSpeakingTopicIdx;
        typeExtra.speakingTopic = speakingTopics[aSpeakingTopicIdx];
      }
      if (aType === 'writing' && aWritingTopicIdx >= 0) {
        typeExtra.writingLevel = aWritingLevel;
        typeExtra.writingTopicIndex = aWritingTopicIdx;
        typeExtra.writingTopic = writingTopics[aWritingTopicIdx];
      }
      if (aType === 'exercise') {
        typeExtra.exerciseType = aExerciseType;
        typeExtra.exerciseWords = getExerciseWords();
        typeExtra.exerciseLang = dictCode;
      }
      if (aType === 'lesson') {
        typeExtra.lessonId = aLessonId;
        typeExtra.lessonLevel = aLessonLevel;
        typeExtra.lessonTitle = (LEVEL_TEXTS[aLessonLevel] ?? []).find((x: any) => x.id === aLessonId)?.title;
      }

      await createAssignment({ ...base, ...typeExtra });
      resetAssignmentForm();
      setPublished(true);
      setAssignmentRefresh(revision => revision + 1);
    } catch (error) { setActionFailure(error instanceof Error ? error.message : tr('management.loadError')); }
    finally { setCreatingAssignment(false); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm(tr('core.management.delete_this_assignment_26e8f6'))) return;
    setActionFailure('');
    try { await deleteAssignment(id); setAssignmentRefresh(revision => revision + 1); }
    catch (error) { setActionFailure(error instanceof Error ? error.message : tr('management.loadError')); }
  };

  const tabs = [
    { id: 'classes', label: tr('nav.myClasses'), icon: Users },
    { id: 'assignments', label: tr('core.management.assignments_057d58'), icon: FileText },
    { id: 'games', label: tr('teacher.games'), icon: Gamepad2 },
  ] satisfies { id: TeacherTab; label: string; icon: React.ElementType }[];
  const switchTab = (next: TeacherTab, id = selectedId, openForm = false) => {
    resetAssignmentForm();
    if (openForm) setShowNewAssignment(true);
    setActionFailure('');
    setPublished(false);
    setViewingAssignment(null);
    onNavigate(next, id);
  };
  const classPicker = selectedClass && <label className="flex w-full min-w-0 flex-col gap-1.5 sm:max-w-sm">
    <span className="font-serif text-sm font-extrabold">{tr('teacher.class')}</span>
    <select value={selectedId} onChange={event => switchTab(tab, event.target.value)}
      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-serif text-sm font-bold dark:border-zinc-700 dark:bg-zinc-900">
      {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
    </select>
  </label>;
  const [gameView, setGameView] = useState<'rooms' | 'kits'>('rooms');

  return (
    <ScreenShell
      size="wide"
      className="smarty-management"
      title={isBusiness ? tr('biz.title') : tr("site.teacherdashboard.teacher_da33dd")}
    >
      <ManagementTabs<TeacherTab> tabs={tabs} active={tab} onSelect={switchTab} />
      {actionFailure && <p role="alert" className="mb-4 font-semibold text-rose-700 dark:text-rose-300">{actionFailure}</p>}
      {loadFailure && <div role="alert" className={`${seCard} p-5 mb-5`}><p className="font-bold">{tr('management.loadError')}</p><p className="text-sm text-slate-500 mt-1">{loadFailure}</p><button onClick={loadClasses} className="mt-3 underline font-bold">{tr('action.tryAgain')}</button></div>}

        {/* ═══════════════════ CLASSES ═══════════════════ */}
        {tab === 'classes' && openStudent && (
          <StudentDetail key={openStudent.uid} classId={openStudent.classId} student={openStudent} onBack={() => setOpenStudent(null)} />
        )}
        {tab === 'classes' && !openStudent && (
          <div>
            {isBusiness && profile && <SeatsPanel profile={profile} onBuyMore={() => onOpenPlans?.()} />}
            {isBusiness && profile && <BusinessTeachers profile={profile} />}
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{classes.length}  {tr("site.teacherdashboard.class_41ff35")}{classes.length !== 1 ? "es" : ''}</h2>
              <button onClick={() => setShowNewClass(true)} className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 dark-keep px-3 py-2 rounded-2xl font-serif font-extrabold text-sm hover:bg-zinc-800 dark:hover:bg-white shrink-0 shadow-[0_3px_0_0_#000] dark:shadow-[0_3px_0_0_#a1a1aa] active:translate-y-[3px] active:shadow-none">
                <Plus className="w-4 h-4" />  {tr("site.teacherdashboard.new_class_55f5e2")}</button>
            </div>
            {showNewClass && (
              <div className={`${seCard} mb-4 p-4 sm:p-6`}>
                <h3 className="font-bold text-lg mb-4">{tr("site.teacherdashboard.create_class_59aac6")}</h3>
                <input aria-label={tr("site.teacherdashboard.class_name_b45d98")} value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder={tr("site.teacherdashboard.class_name_b45d98")} className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-zinc-400" />
                <textarea aria-label={tr("site.teacherdashboard.description_optional_388de6")} value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} placeholder={tr("site.teacherdashboard.description_optional_388de6")} rows={2} className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-zinc-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={handleCreateClass} disabled={!newClassName.trim() || creatingClass} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 dark-keep px-5 py-2.5 rounded-2xl font-serif font-extrabold text-sm hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">
                    {creatingClass && <Loader2 className="w-4 h-4 animate-spin" />}  {tr("site.teacherdashboard.create_6e157c")}</button>
                  <button onClick={() => setShowNewClass(false)} className="px-5 py-2.5 rounded-2xl font-serif font-extrabold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50">{tr("action.cancel")}</button>
                </div>
              </div>
            )}
            {classesLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              : classes.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="font-serif font-extrabold">{tr("empty.classes.title")}</p><p className="text-sm">{tr("site.teacherdashboard.create_your_first_class_to_497602")}</p></div>
              ) : (
                <div className="grid gap-4">
                  {classes.map(cls => (
                    <div key={cls.id} className={`${seCard} space-y-4 p-4 sm:p-5`}>
                      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                        <div className="min-w-0">
                          <h3 className="break-words font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{cls.name}</h3>
                          {cls.description && <p className="mt-1 break-words text-sm text-slate-500 dark:text-zinc-400">{cls.description}</p>}
                          <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500 dark:text-zinc-400"><Users className="h-3.5 w-3.5" aria-hidden /> {cls.studentUids.length} {tr("site.teacherdashboard.students_327a47")}</p>
                        </div>
                        <ChunkyButton className="w-full sm:w-auto" onClick={() => switchTab('assignments', cls.id, true)}><Plus className="h-4 w-4" />{tr('hw.give')}</ChunkyButton>
                      </div>
                      <details className="border-t border-slate-200 pt-3 dark:border-zinc-800">
                        <summary className="cursor-pointer py-1 font-serif text-sm font-extrabold">{tr('site.app.details_dc3dec')}</summary>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {cls.id && <button type="button" onClick={() => onHostGame(cls.id!)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-zinc-200 px-3 py-1.5 font-serif text-sm font-extrabold dark:border-zinc-700 ${seInteractive}`}>
                            <Gamepad2 className="h-4 w-4" />{tr('class.live.host')}
                          </button>}
                          <button onClick={() => { setOpenWords(null); setOpenRoster(id => id === cls.id ? null : cls.id!); }} aria-expanded={openRoster === cls.id} className="px-3 py-1.5 rounded-lg border-2 border-slate-200 dark:border-zinc-700 text-sm font-serif font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />  {tr("site.teacherdashboard.students_fcfac3")}</button>
                          <button onClick={() => { setOpenRoster(null); setOpenWords(id => id === cls.id ? null : cls.id!); }} aria-expanded={openWords === cls.id} className="px-3 py-1.5 rounded-lg border-2 border-slate-200 dark:border-zinc-700 text-sm font-serif font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />  {tr('rec.title')}</button>
                          <button aria-label={tr('teacher.class.delete')} onClick={() => handleDeleteClass(cls)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="mt-4">
                          <p className="mb-1.5 font-serif text-xs font-extrabold uppercase tracking-wide text-slate-500">{tr("site.teacherdashboard.invite_code_6929e4")}</p>
                          <InviteCodeBadge code={cls.inviteCode} classId={cls.id!} />
                        </div>
                        {openRoster === cls.id && <ClassRoster classId={cls.id!} onChange={loadClasses} onOpenStudent={st => setOpenStudent({ classId: cls.id!, ...st })} />}
                        {openWords === cls.id && <ClassRecommendations classId={cls.id!} />}
                      </details>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {tab === 'games' && (
          <div>
            <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end">{classPicker}</div>
            {selectedId ? <>
              <ManagementTabs<'rooms' | 'kits'> tabs={[
                { id: 'rooms', icon: Gamepad2, label: tr('class.live.title') },
                { id: 'kits', icon: BookOpen, label: tr('kit.title') },
              ]} active={gameView} onSelect={setGameView} />
              {gameView === 'rooms' ? <GameRooms key={selectedId} classId={selectedId} onOpen={onHostGame} />
                : <GameKitLibrary classId={selectedId} onHost={onHostGame} />}
            </>
              : !classesLoading && <p>{tr('teacher.classRequired')}</p>}
          </div>
        )}

        {/* ═══════════════════ ASSIGNMENTS ═══════════════════ */}
        {tab === 'assignments' && (
          <div>
            <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
              {classPicker}
              {selectedClass && !showNewAssignment && (
                <ChunkyButton className="w-full sm:w-auto" onClick={() => { setShowNewAssignment(true); setPublished(false); setActionFailure(''); }}>
                  <Plus className="h-4 w-4" />{tr('hw.give')}</ChunkyButton>
              )}
            </div>

            {/* ── New assignment form ── */}
            {showNewAssignment && selectedClass && (
              <div className={`${seCard} mb-4 space-y-4 p-4 sm:p-6`}>
                <h3 className="font-serif text-lg font-extrabold">{tr('hw.formTitle', { name: selectedClass.name })}</h3>

                {!reviewHomework ? <>
                <label className="block max-w-sm space-y-1 text-sm font-semibold">
                  <span>{tr('common.type')}</span>
                  <select value={aType} onChange={event => setAType(event.target.value as Assignment['type'])}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
                    {(['exercise','lesson','reading','comp-reading','listening','speaking','writing'] as const).map(type =>
                      <option key={type} value={type}>{TYPE_META[type].label}</option>)}
                  </select>
                </label>
                {needsMaxForHomework(aType) && <p className="text-sm text-zinc-600 dark:text-zinc-400">{tr('homework.maxTeacher')}</p>}
                {/* ── LESSON picker ── */}
                {aType === 'lesson' && (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">{tr('hw.pickLesson')}</p>
                    <LevelPicker levels={READING_LEVELS} active={aLessonLevel} onSelect={l => { setALessonLevel(l as Level); setALessonId(''); }} />
                    <select aria-label={tr('hw.pickLesson')} value={aLessonId} onChange={e => {
                      setALessonId(e.target.value);
                      const lesson = (LEVEL_TEXTS[aLessonLevel] ?? []).find((x: any) => x.id === e.target.value);
                      if (lesson && !aTitle) setATitle(lesson.title);
                    }} className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-zinc-900 dark:border-amber-900 dark:bg-zinc-900 dark:text-zinc-50">
                      <option value="">{tr('hw.chooseLesson')}</option>
                      {(LEVEL_TEXTS[aLessonLevel] ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.title}</option>)}
                    </select>
                  </div>
                )}

                {/* ── READING picker ── */}
                {aType === 'reading' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{tr("site.teacherdashboard.choose_passage_304d09")}</p>
                    <LevelPicker levels={READING_LEVELS} active={aReadingLevel} onSelect={l => { setAReadingLevel(l as Level); setAReadingPassageId(''); }} />
                    <select value={aReadingPassageId} onChange={e => {
                      setAReadingPassageId(e.target.value);
                      const p = readingPassages.find((x: any) => x.id === e.target.value);
                      if (p && !aTitle) setATitle(p.title);
                    }} className="w-full border border-blue-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                      <option value="">{tr("site.teacherdashboard.any_passage_free_practice_002b5a")}</option>
                      {readingPassages.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    {aReadingPassageId && (
                      <p className="text-xs text-slate-500 bg-white border border-blue-100 rounded-lg p-2 line-clamp-2">
                        {readingPassages.find((p: any) => p.id === aReadingPassageId)?.text.slice(0, 160)}…
                      </p>
                    )}
                  </div>
                )}

                {/* ── COMP. READING picker ── */}
                {aType === 'comp-reading' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{tr("site.teacherdashboard.choose_comprehension_passage_7f066a")}</p>
                    <LevelPicker levels={READING_LEVELS} active={aCompReadingLevel} onSelect={l => { setACompReadingLevel(l as Level); setACompReadingPassageTitle(''); }} />
                    {aCompReadingPassagesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600"><Loader2 className="w-4 h-4 animate-spin" />  {tr("site.teacherdashboard.loading_passages_5a74a8")}</div>
                    ) : (
                      <select value={aCompReadingPassageTitle} onChange={e => {
                        setACompReadingPassageTitle(e.target.value);
                        if (e.target.value && !aTitle) setATitle(e.target.value);
                      }} className="w-full border border-emerald-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
                        <option value="">{tr("site.teacherdashboard.select_a_passage_86d621")}</option>
                        {aCompReadingPassages.map((p: any, i: number) => <option key={i} value={p.title}>{p.title}</option>)}
                      </select>
                    )}
                    {aCompReadingPassageTitle && (
                      <p className="text-xs text-slate-500 bg-white border border-emerald-100 rounded-lg p-2 line-clamp-2">
                        {aCompReadingPassages.find((p: any) => p.title === aCompReadingPassageTitle)?.passage?.slice(0, 160)}…
                      </p>
                    )}
                  </div>
                )}

                {/* ── LISTENING picker ── */}
                {aType === 'listening' && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{tr("site.teacherdashboard.choose_listening_passage_db9ec3")}</p>
                    <LevelPicker levels={READING_LEVELS} active={aListeningLevel} onSelect={l => setAListeningLevel(l as Level)} />
                    {aListeningPassagesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-cyan-600"><Loader2 className="w-4 h-4 animate-spin" />  {tr("site.teacherdashboard.loading_passages_5a74a8")}</div>
                    ) : (
                      <select value={aListeningPassageTitle} onChange={e => {
                        setAListeningPassageTitle(e.target.value);
                        if (e.target.value && !aTitle) setATitle(e.target.value);
                      }} className="w-full border border-cyan-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400">
                        <option value="">{tr("site.teacherdashboard.select_a_passage_86d621")}</option>
                        {aListeningPassages.map((p: any, i: number) => <option key={i} value={p.title}>{p.title}</option>)}
                      </select>
                    )}
                    {aListeningPassageTitle && (
                      <p className="text-xs text-slate-500 bg-white border border-cyan-100 rounded-lg p-2 line-clamp-2">
                        {aListeningPassages.find((p: any) => p.title === aListeningPassageTitle)?.passage?.slice(0, 160)}…
                      </p>
                    )}
                  </div>
                )}

                {/* ── SPEAKING picker ── */}
                {aType === 'speaking' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">{tr("site.teacherdashboard.choose_speaking_topic_bdf09f")}</p>
                    <LevelPicker levels={SPEAKING_LEVELS as string[]} active={aSpeakingLevel} onSelect={l => { setASpeakingLevel(l); setASpeakingTopicIdx(-1); }} />
                    <select value={aSpeakingTopicIdx} onChange={e => {
                      const idx = Number(e.target.value);
                      setASpeakingTopicIdx(idx);
                      if (idx >= 0 && !aTitle) setATitle(`Speaking: ${speakingTopics[idx]?.slice(0, 60)}`);
                    }} className="w-full border border-rose-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400">
                      <option value={-1}>{tr("site.teacherdashboard.select_a_topic_b8a8c9")}</option>
                      {speakingTopics.map((t: string, i: number) => <option key={i} value={i}>{t.slice(0, 80)}</option>)}
                    </select>
                    {aSpeakingTopicIdx >= 0 && (
                      <p className="text-xs bg-white border border-rose-100 rounded-lg p-2 text-slate-600">{speakingTopics[aSpeakingTopicIdx]}</p>
                    )}
                  </div>
                )}

                {/* ── WRITING picker ── */}
                {aType === 'writing' && (
                  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">{tr("site.teacherdashboard.choose_writing_prompt_f9dab0")}</p>
                    <LevelPicker levels={PRACTICE_LEVELS as string[]} active={aWritingLevel} onSelect={l => { setAWritingLevel(l); setAWritingTopicIdx(-1); }} />
                    <select value={aWritingTopicIdx} onChange={e => {
                      const idx = Number(e.target.value);
                      setAWritingTopicIdx(idx);
                      if (idx >= 0 && !aTitle) setATitle(`Writing: ${writingTopics[idx]?.slice(0, 60)}`);
                    }} className="w-full border border-violet-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400">
                      <option value={-1}>{tr("site.teacherdashboard.select_a_prompt_a8958b")}</option>
                      {writingTopics.map((t: string, i: number) => <option key={i} value={i}>{t.slice(0, 80)}</option>)}
                    </select>
                    {aWritingTopicIdx >= 0 && (
                      <p className="text-xs bg-white border border-violet-100 rounded-lg p-2 text-slate-600">{writingTopics[aWritingTopicIdx]}</p>
                    )}
                  </div>
                )}

                {/* ── EXERCISE picker ── */}
                {aType === 'exercise' && (
                  <div className="space-y-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{tr('class.challenge.setup')}</p>

                    <label className="block max-w-sm space-y-1 text-sm font-semibold">
                      <span>{tr('site.teacherdashboard.exercise_type_d2e70b')}</span>
                      <select value={aExerciseType} onChange={event => setAExerciseType(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
                        {EXERCISE_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>

                    {/* Word source */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-serif font-extrabold">{tr("site.teacherdashboard.word_source_2cd49a")}</p>
                      <div className="flex gap-2 mb-3">
                        {['level', 'custom'].map(src => (
                          <button key={src} onClick={() => setAExerciseWordSource(src as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all capitalize ${aExerciseWordSource === src ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'}`}>
                            {src === 'level' ? tr("site.teacherdashboard.from_passage_48446b") : tr("site.teacherdashboard.custom_words_8c9996")}
                          </button>
                        ))}
                      </div>

                      {aExerciseWordSource === 'level' && (
                        <div className="space-y-2">
                          <LevelPicker levels={READING_LEVELS} active={aExerciseVocabLevel} onSelect={l => { setAExerciseVocabLevel(l as Level); setAExerciseVocabPassageId(''); }} />
                          <select value={aExerciseVocabPassageId} onChange={e => setAExerciseVocabPassageId(e.target.value)}
                            className="w-full border border-purple-200 bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400">
                            <option value="">{tr("site.teacherdashboard.all_passages_in_level_3247b6")}{[...new Set(exercisePassages.flatMap((p: any) => p.vocabulary?.map((v: any) => v.word) ?? []))].length}  {tr("site.teacherdashboard.words_6687d0")}</option>
                            {exercisePassages.map((p: any) => <option key={p.id} value={p.id}>{p.title} ({p.vocabulary?.length ?? 0}  {tr("site.teacherdashboard.words_fc659f")}</option>)}
                          </select>
                          <p className="text-xs text-purple-600 font-serif font-extrabold">
                            {exercisePassageVocab.length > 0
                              ? tr("core.management.length_words_selected_value2value3_905826", { length: [...new Set(exercisePassageVocab.map((v: any) => v.word))].length, value2: [...new Set(exercisePassageVocab.map((v: any) => v.word))].slice(0, 8).join(', '), value3: exercisePassageVocab.length > 8 ? '…' : '' })
                              : tr("site.teacherdashboard.no_vocabulary_found_for_this_944a2b")}
                          </p>
                        </div>
                      )}

                      {aExerciseWordSource === 'custom' && (
                        <div>
                          <textarea aria-label={tr("site.teacherdashboard.enter_words_separated_by_commas_96c9b4")}
                            value={aExerciseCustomWords}
                            onChange={e => setAExerciseCustomWords(e.target.value)}
                            placeholder={tr("site.teacherdashboard.enter_words_separated_by_commas_96c9b4")}
                            rows={4}
                            className="w-full border border-purple-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none bg-white"
                          />
                          {aExerciseCustomWords.trim() && (
                            <p className="text-xs text-purple-600 font-serif font-extrabold mt-1">
                              {aExerciseCustomWords.split(/[\n,]+/).map(w => w.trim()).filter(Boolean).length}  {tr("common.words")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <ChunkyButton disabled={aType === 'exercise' && getExerciseWords().length < 2 || aType === 'lesson' && !aLessonId}
                    onClick={() => setReviewHomework(true)}>{tr('homework.review')}</ChunkyButton>
                  <button onClick={resetAssignmentForm} className="px-3 py-2 text-sm font-bold">{tr('action.cancel')}</button>
                </div>
                </> : <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{TYPE_META[aType]?.label}</p>
                  <button type="button" onClick={() => setReviewHomework(false)} className="text-sm font-bold underline">{tr('homework.changeActivity')}</button>
                </div>
                {needsMaxForHomework(aType) && <p className="text-sm text-zinc-600 dark:text-zinc-400">{tr('homework.maxTeacher')}</p>}
                {/* Title + Description + Due */}
                <input aria-label={tr("site.teacherdashboard.assignment_title_ed7125")} value={aTitle} maxLength={160} onChange={e => setATitle(e.target.value)} placeholder={tr("site.teacherdashboard.assignment_title_ed7125")}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                <textarea aria-label={tr("site.teacherdashboard.instructions_description_optional_512f8e")} value={aDesc} onChange={e => setADesc(e.target.value)} placeholder={tr("site.teacherdashboard.instructions_description_optional_512f8e")} rows={2}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
                <div>
                  <label className="text-xs font-serif font-extrabold text-slate-500 mb-1 block">{tr("site.teacherdashboard.due_date_optional_cf0e5a")}</label>
                  <input type="date" aria-label={tr("site.teacherdashboard.due_date_optional_cf0e5a")} value={aDue} onChange={e => setADue(e.target.value)}
                    className="border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateAssignment} disabled={!aTitle.trim() || creatingAssignment || aType === 'exercise' && getExerciseWords().length < 2 || aType === 'lesson' && !aLessonId}
                    className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 dark-keep px-5 py-2.5 rounded-2xl font-serif font-extrabold text-sm hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">
                    {creatingAssignment && <Loader2 className="w-4 h-4 animate-spin" />}  {tr("homework.publish")}</button>
                  <button onClick={resetAssignmentForm} className="px-5 py-2.5 rounded-2xl font-serif font-extrabold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50">{tr("action.cancel")}</button>
                </div>
                </>}
              </div>
            )}

            {/* Submissions modal */}
            {viewingAssignment && (
              <DialogSurface label={tr('teacher.results', { title: viewingAssignment.title })} onClose={() => setViewingAssignment(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px] shadow-[0_3px_0_0_#000] dark:shadow-[0_3px_0_0_#a1a1aa] active:translate-y-[3px] active:shadow-none">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900">
                  <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                      <h3 className="font-serif font-extrabold text-lg text-zinc-900 dark:text-zinc-50">{viewingAssignment.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                        {(() => { const m = TYPE_META[viewingAssignment.type] ?? TYPE_META.reading; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border ${m.color}`}><m.icon className="w-3 h-3" />{m.label}</span>; })()}
                        {viewingAssignment.passageTitle && <span>· {viewingAssignment.passageTitle} ({viewingAssignment.passageLevel})</span>}
                        {viewingAssignment.compReadingPassageTitle && <span>· {viewingAssignment.compReadingPassageTitle} ({viewingAssignment.compReadingLevel})</span>}
                        {viewingAssignment.listeningPassageTitle && <span>· {viewingAssignment.listeningPassageTitle}</span>}
                        {viewingAssignment.speakingTopic && <span>· {viewingAssignment.speakingTopic?.slice(0, 60)}</span>}
                        {viewingAssignment.writingTopic && <span>· {viewingAssignment.writingTopic?.slice(0, 60)}</span>}
                        {viewingAssignment.exerciseType && <span>· {EXERCISE_TYPES.find(e => e.id === viewingAssignment.exerciseType)?.label} ({viewingAssignment.exerciseWords?.length ?? 0}  {tr("site.teacherdashboard.words_fc659f")}</span>}
                        {viewingAssignment.dueDate && <span>{tr("site.teacherdashboard.due_7eb307")}{new Date(viewingAssignment.dueDate).toLocaleDateString(uiLang)}</span>}
                      </div>
                    </div>
                    <button aria-label={tr('a11y.close')} onClick={() => setViewingAssignment(null)} className="p-1.5 text-slate-400 hover:text-zinc-900 rounded-lg hover:bg-slate-100 shrink-0"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-6">
                    {submissionsLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                      : submissionsError ? <LoadError retry={() => setSubmissionsRefresh(value => value + 1)} />
                      : submissions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="font-serif font-extrabold">{tr("site.teacherdashboard.no_submissions_yet_764fe2")}</p></div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-500 font-serif font-extrabold">{submissions.length}  {tr("site.teacherdashboard.submission_4da0c3")}{submissions.length !== 1 ? "s" : ''}</p>
                          {submissions.map((s, i) => {
                            const isExp = expandedSub === s.studentUid;
                            return (
                              <div key={s.studentUid || i} className="border-2 border-slate-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
                                <button onClick={() => setExpandedSub(isExp ? null : s.studentUid)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 text-left">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold shrink-0">{(s.studentName?.[0] ?? '?').toUpperCase()}</div>
                                    <div><div className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">{s.studentName || tr('site.identity.student')}</div><div className="text-xs text-slate-400">{new Date(s.completedAt).toLocaleString(uiLang)}</div></div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {typeof (s.accuracy ?? s.score) === 'number' ? <span className="font-serif text-sm font-extrabold tabular-nums">{s.accuracy ?? s.score}%</span> : <span className="text-xs text-slate-400">{tr("site.teacherdashboard.submitted_2e0035")}</span>}
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                                  </div>
                                </button>
                                {isExp && (
                                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-zinc-700 pt-3 space-y-3 bg-slate-50 dark:bg-zinc-800">
                                    <div className="flex gap-6 flex-wrap">
                                      {s.accuracy !== undefined && <div className="text-center"><div className={`text-2xl font-black ${s.accuracy >= 80 ? 'text-emerald-600' : s.accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{s.accuracy}%</div><div className="text-xs text-slate-500">{tr("lesson.stat.accuracy")}</div></div>}
                                      {s.wordsRead !== undefined && <div className="text-center"><div className="text-2xl font-black text-zinc-900">{s.wordsRead}</div><div className="text-xs text-slate-500">{tr("site.app.words_read_bf9cd2")}</div></div>}
                                      {s.errors !== undefined && <div className="text-center"><div className="text-2xl font-black text-rose-500">{s.errors.length}</div><div className="text-xs text-slate-500">{tr("site.teacherdashboard.errors_805e86")}</div></div>}
                                    </div>
                                    {s.errors && s.errors.length > 0 && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{tr("site.teacherdashboard.words_missed_ae3130")}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {s.errors.map((w, wi) => <span key={wi} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-serif font-extrabold">{w}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    {s.accuracy === undefined && s.errors === undefined && <p className="text-sm text-slate-500 italic">{tr("site.teacherdashboard.no_detailed_results_recorded_6eed8d")}</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </DialogSurface>
            )}

            {published && <p role="status" className="mb-3 font-serif font-extrabold text-emerald-700 dark:text-emerald-300">{tr('teacher.published')}</p>}
            {!selectedClass ? (
              <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>{tr("site.teacherdashboard.select_a_class_to_manage_fc12a7")}</p></div>
            ) : assignmentsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              : assignmentsError ? <LoadError retry={() => setAssignmentRefresh(value => value + 1)} />
              : assignments.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>{tr("site.teacherdashboard.no_assignments_for_4233ca")}{selectedClass.name}  {tr("site.teacherdashboard.yet_ec8602")}</p></div>
              ) : (
                <div className="grid gap-3">
                  {assignments.map(a => {
                    const m = TYPE_META[a.type] ?? TYPE_META.reading;
                    return (
                      <div key={a.id} className={`${seCard} p-4 flex items-start justify-between gap-3 flex-col sm:flex-row`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${m.color}`}><m.icon className="w-3 h-3" />{m.label}</span>
                            {a.passageTitle && <span className="text-xs text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.passageTitle} ({a.passageLevel})</span>}
                            {a.listeningPassageTitle && <span className="text-xs text-slate-500 flex items-center gap-1"><Headphones className="w-3 h-3" />{a.listeningPassageTitle}</span>}
                            {a.speakingTopic && <span className="text-xs text-slate-500 flex items-center gap-1"><Mic className="w-3 h-3" />{a.speakingTopic.slice(0, 50)}</span>}
                            {a.writingTopic && <span className="text-xs text-slate-500 flex items-center gap-1"><PenLine className="w-3 h-3" />{a.writingTopic.slice(0, 50)}</span>}
                            {a.exerciseType && <span className="text-xs text-slate-500 flex items-center gap-1"><Brain className="w-3 h-3" />{EXERCISE_TYPES.find(e => e.id === a.exerciseType)?.label} · {a.exerciseWords?.length ?? 0}  {tr("common.words")}</span>}
                            {a.dueDate && <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar className="w-3 h-3" />{tr("site.teacherdashboard.due_145caf")}{new Date(a.dueDate).toLocaleDateString(uiLang)}</span>}
                          </div>
                          <h3 className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{a.title}</h3>
                          {a.description && <p className="text-slate-500 text-sm mt-0.5 truncate">{a.description}</p>}
                          <p className="mt-2 font-serif text-xs font-bold text-zinc-600 dark:text-zinc-300">{tr('teacher.submissionCount', { n: a.submissionCount ?? 0 })}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setViewingAssignment(a)} className="px-3 py-1.5 rounded-lg border-2 border-slate-200 dark:border-zinc-700 text-sm font-serif font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />  {tr("site.teacherdashboard.results_612e12")}</button>
                          <button aria-label={tr('teacher.assignment.delete', { title: a.title })} onClick={() => handleDeleteAssignment(a.id!)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

    </ScreenShell>
  );
}

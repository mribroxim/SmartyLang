import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, FileText, Copy, Trash2, ChevronRight,
  RefreshCw, CheckCircle2, X, BookOpen, Brain, GraduationCap,
  Send, Megaphone, Eye, Loader2, Calendar, Crown,
  Mic, PenLine, Headphones,
} from 'lucide-react';
import { SmartyMaxSeats } from './SmartyMaxSeats';
import {
  auth, ClassRoom, Assignment, Submission, StudentSummary,
  createClass, getTeacherClasses, getStudentSummaries, createAssignment,
  getClassAssignments, getAssignmentSubmissions, deleteAssignment, deleteClass,
  removeStudentFromClass, createAnnouncement, regenerateInviteCode,
} from '../firebase';
import { Level } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import { SPEAKING_TOPICS_BY_LEVEL, SPEAKING_LEVELS } from '../data/speakingTopics';
import { TOPICS_BY_LEVEL, PRACTICE_LEVELS } from '../data/practiceTopics';
import { getListeningPassagesForLevel } from '../data/comprehensiveListening';
import { getReadingPassagesForLevel } from '../data/comprehensiveReading';
import { StudentActivityModal } from '../components/StudentActivityModal';
import { ScreenShell, seCard } from '../components/ScreenShell';

type Tab = 'classes' | 'students' | 'assignments' | 'seats' | 'messages';

const READING_LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

const EXERCISE_TYPES = [
  { id: 'flashcards',           label: 'Flashcards' },
  { id: 'definition-quiz',      label: 'Quiz' },
  { id: 'listening-match',      label: 'Listening' },
  { id: 'true-false-quiz',      label: 'True / False' },
  { id: 'memory-match',         label: 'Memory Match' },
  { id: 'word-match',           label: 'Word Match' },
  { id: 'spelling-practice',    label: 'Spelling' },
  { id: 'pronunciation',        label: 'Pronunciation' },
  { id: 'word-scramble',        label: 'Word Scramble' },
];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reading:        { label: 'Reading',         icon: BookOpen,   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'comp-reading': { label: 'Comp. Reading',   icon: BookOpen,   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  listening:      { label: 'Comp. Listening', icon: Headphones, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  speaking:       { label: 'Speaking',        icon: Mic,        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  writing:        { label: 'Writing',         icon: PenLine,    color: 'bg-violet-50 text-violet-700 border-violet-200' },
  exercise:       { label: 'Exercises',       icon: Brain,      color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function InviteCodeBadge({ code, classId }: { code: string; classId: string }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const copy = () => { navigator.clipboard.writeText(currentCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const regen = async () => {
    setRegenerating(true);
    const c = await regenerateInviteCode(classId);
    setCurrentCode(c); setRegenerating(false);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-lg tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">{currentCode}</span>
      <button onClick={copy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Copy">
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
      <button onClick={regen} disabled={regenerating} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Regenerate">
        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

// ── Level tab strip ──────────────────────────────────────────────────────────
function LevelTabs({ levels, active, onSelect, color = 'blue' }: { levels: string[]; active: string; onSelect: (l: string) => void; color?: string }) {
  const COLOR_MAP: Record<string, { active: string; inactive: string }> = {
    blue:    { active: 'bg-blue-700 text-white',    inactive: 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50' },
    cyan:    { active: 'bg-cyan-700 text-white',    inactive: 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50' },
    rose:    { active: 'bg-rose-700 text-white',    inactive: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50' },
    violet:  { active: 'bg-violet-700 text-white',  inactive: 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50' },
    purple:  { active: 'bg-purple-700 text-white',  inactive: 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50' },
    emerald: { active: 'bg-emerald-700 text-white', inactive: 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50' },
    teal:    { active: 'bg-teal-700 text-white',    inactive: 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50' },
  };
  const { active: activeCls, inactive: inactiveCls } = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {levels.map(l => (
        <button key={l} onClick={() => onSelect(l)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active === l ? activeCls : inactiveCls}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

interface TeacherDashboardProps {
  /** Optional — used by "Buy more seats" to jump to the Plans page. */
  setActiveTab?: (tab: string) => void;
}

export function TeacherDashboard({ setActiveTab }: TeacherDashboardProps = {}) {
  const LEVEL_TEXTS = useLevelTexts();
  const [tab, setTab] = useState<Tab>('classes');
  const teacherUid = auth?.currentUser?.uid ?? '';
  const teacherName = auth?.currentUser?.displayName ?? 'Teacher';
  // Activity modal: which student's full activity log is open?
  const [activityStudent, setActivityStudent] = useState<{ uid: string; name?: string; email?: string } | null>(null);
  // Teacher plan ships with 5 seats baseline; planSeats overrides if they've bought more.
  const [teacherSeatTotal, setTeacherSeatTotal] = useState<number>(5);
  useEffect(() => {
    if (!teacherUid) return;
    import('../firebase').then(({ getUserProfile }) =>
      getUserProfile(teacherUid).then(p => {
        if (p?.planSeats && p.planSeats > 0) setTeacherSeatTotal(p.planSeats);
      }));
  }, [teacherUid]);

  // ── Classes ─────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // ── Students ────────────────────────────────────────────────────────────────
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(false);

  // ── Assignments ─────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Common fields
  const [aType, setAType] = useState<Assignment['type']>('reading');
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aDue, setADue] = useState('');

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
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // ── Messages ─────────────────────────────────────────────────────────────────
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTargetClassId, setAnnTargetClassId] = useState('');
  const [sendingAnn, setSendingAnn] = useState(false);
  const [annSent, setAnnSent] = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    try { const c = await getTeacherClasses(teacherUid); setClasses(c); }
    finally { setClassesLoading(false); }
  }, [teacherUid]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (!selectedClass) return;
    setSummariesLoading(true);
    getStudentSummaries(selectedClass.studentUids).then(s => { setSummaries(s); setSummariesLoading(false); });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || tab !== 'assignments') return;
    setAssignmentsLoading(true);
    getClassAssignments(selectedClass.id!).then(a => { setAssignments(a); setAssignmentsLoading(false); });
  }, [selectedClass, tab]);

  // Load listening passages when level changes (in the assignment form)
  useEffect(() => {
    if (aType !== 'listening' || !showNewAssignment) return;
    setAListeningPassagesLoading(true);
    setAListeningPassageTitle('');
    getListeningPassagesForLevel(aListeningLevel)
      .then((ps: any[]) => setAListeningPassages(ps))
      .catch(() => setAListeningPassages([]))
      .finally(() => setAListeningPassagesLoading(false));
  }, [aType, aListeningLevel, showNewAssignment]);

  // Load comprehensive reading passages when level changes
  useEffect(() => {
    if (aType !== 'comp-reading' || !showNewAssignment) return;
    setACompReadingPassagesLoading(true);
    setACompReadingPassageTitle('');
    getReadingPassagesForLevel(aCompReadingLevel)
      .then((ps: any[]) => setACompReadingPassages(ps))
      .catch(() => setACompReadingPassages([]))
      .finally(() => setACompReadingPassagesLoading(false));
  }, [aType, aCompReadingLevel, showNewAssignment]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const readingPassages = LEVEL_TEXTS[aReadingLevel] ?? [];
  const speakingTopics  = (SPEAKING_TOPICS_BY_LEVEL as any)[aSpeakingLevel] ?? [];
  const writingTopics   = (TOPICS_BY_LEVEL as any)[aWritingLevel] ?? [];
  const exercisePassages = LEVEL_TEXTS[aExerciseVocabLevel] ?? [];
  const exercisePassageVocab = aExerciseVocabPassageId
    ? (exercisePassages.find((p: any) => p.id === aExerciseVocabPassageId)?.vocabulary ?? [])
    : exercisePassages.flatMap((p: any) => p.vocabulary ?? []);

  const getExerciseWords = (): string[] => {
    if (aExerciseWordSource === 'custom') {
      return aExerciseCustomWords.split(/[\n,]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
    }
    return [...new Set((exercisePassageVocab as any[]).map((v: any) => v.word.toLowerCase()))];
  };

  const resetAssignmentForm = () => {
    setATitle(''); setADesc(''); setADue('');
    setAReadingPassageId('');
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
    try {
      await createClass(teacherUid, newClassName.trim(), newClassDesc.trim() || undefined);
      setNewClassName(''); setNewClassDesc(''); setShowNewClass(false);
      await loadClasses();
    } finally { setCreatingClass(false); }
  };

  const handleDeleteClass = async (cls: ClassRoom) => {
    if (!confirm(`Delete "${cls.name}"? Students will lose access.`)) return;
    await deleteClass(cls.id!);
    if (selectedClass?.id === cls.id) setSelectedClass(null);
    await loadClasses();
  };

  const handleCreateAssignment = async () => {
    if (!aTitle.trim() || !selectedClass) return;
    setCreatingAssignment(true);
    try {
      const base = {
        classId: selectedClass.id!, teacherUid, title: aTitle.trim(),
        description: aDesc.trim() || undefined,
        type: aType,
        dueDate: aDue ? new Date(aDue).getTime() : undefined,
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
      }

      await createAssignment({ ...base, ...typeExtra } as any);
      resetAssignmentForm();
      const updated = await getClassAssignments(selectedClass.id!);
      setAssignments(updated);
    } finally { setCreatingAssignment(false); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (viewingAssignment?.id === id) setViewingAssignment(null);
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setSubmissions([]);
    setExpandedSub(null);
    setSubmissionsLoading(true);
    const subs = await getAssignmentSubmissions(assignment.id!);
    setSubmissions(subs);
    setSubmissionsLoading(false);
  };

  const handleSendAnnouncement = async () => {
    if (!annTitle.trim() || !annMessage.trim()) return;
    setSendingAnn(true);
    try {
      await createAnnouncement({
        authorUid: teacherUid, authorName: teacherName,
        targetType: annTargetClassId ? 'class' : 'all',
        targetId: annTargetClassId || undefined,
        title: annTitle.trim(), message: annMessage.trim(), createdAt: Date.now(),
      });
      setAnnTitle(''); setAnnMessage(''); setAnnTargetClassId('');
      setAnnSent(true); setTimeout(() => setAnnSent(false), 3000);
    } finally { setSendingAnn(false); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'classes',     label: 'My Classes',  icon: Users },
    { id: 'students',   label: 'Students',    icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'seats',       label: 'Seats',       icon: Crown },
    { id: 'messages',   label: 'Messages',    icon: Megaphone },
  ];

  return (
    <ScreenShell
      size="wide"
      title="Teacher"
      subtitle="Classes, assignments, and student progress."
    >
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-[13px] transition-all shrink-0 ${tab === t.id ? 'bg-zinc-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

        {/* ═══════════════════ CLASSES ═══════════════════ */}
        {tab === 'classes' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-bold text-zinc-900">{classes.length} Class{classes.length !== 1 ? 'es' : ''}</h2>
              <button onClick={() => setShowNewClass(true)} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-2 rounded-xl font-semibold text-sm hover:bg-black shrink-0">
                <Plus className="w-4 h-4" /> New Class
              </button>
            </div>
            {showNewClass && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
                <h3 className="font-bold text-lg mb-4">Create Class</h3>
                <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Class name *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-zinc-400" />
                <textarea value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-zinc-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={handleCreateClass} disabled={!newClassName.trim() || creatingClass} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-black disabled:opacity-50 flex items-center gap-2">
                    {creatingClass && <Loader2 className="w-4 h-4 animate-spin" />} Create
                  </button>
                  <button onClick={() => setShowNewClass(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}
            {classesLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              : classes.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="font-semibold">No classes yet</p><p className="text-sm">Create your first class to get started.</p></div>
              ) : (
                <div className="grid gap-4">
                  {classes.map(cls => (
                    <div key={cls.id} className={`${seCard} p-4`}>
                      <div className="flex items-start justify-between gap-3 mb-3 flex-col sm:flex-row">
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-900">{cls.name}</h3>
                          {cls.description && <p className="text-slate-500 text-sm mt-0.5">{cls.description}</p>}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {cls.studentUids.length} students</span>
                            <span>Created {new Date(cls.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button onClick={() => { setSelectedClass(cls); setTab('students'); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Students</button>
                          <button onClick={() => { setSelectedClass(cls); setTab('assignments'); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Assign</button>
                          <button onClick={() => handleDeleteClass(cls)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Invite Code</p>
                        <InviteCodeBadge code={cls.inviteCode} classId={cls.id!} />
                        <p className="text-xs text-slate-400 mt-1.5">Share this code with students so they can join.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ═══════════════════ STUDENTS ═══════════════════ */}
        {tab === 'students' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <select value={selectedClass?.id ?? ''} onChange={e => setSelectedClass(classes.find(x => x.id === e.target.value) ?? null)}
                className="border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-zinc-400 w-full sm:w-auto min-w-0">
                <option value="">— Select a class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedClass && <span className="text-sm text-slate-500">{selectedClass.studentUids.length} students</span>}
            </div>
            {!selectedClass ? (
              <div className="text-center py-16 text-slate-400"><GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>Select a class to see its students.</p></div>
            ) : summariesLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              : selectedClass.studentUids.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><p>No students yet. Share the invite code:</p><div className="mt-3 inline-block"><InviteCodeBadge code={selectedClass.inviteCode} classId={selectedClass.id!} /></div></div>
              ) : (
                <div className={`${seCard} overflow-hidden`}>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Student</th>
                        <th className="text-left px-4 py-3 font-semibold">Streak</th>
                        <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Sessions</th>
                        <th className="text-left px-4 py-3 font-semibold">Avg</th>
                        <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Last Active</th>
                        <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Vocab</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {summaries.map(s => (
                        <tr key={s.uid} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {s.photoURL ? <img src={s.photoURL} className="w-8 h-8 rounded-full" alt="" /> : <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">{(s.displayName?.[0] ?? '?').toUpperCase()}</div>}
                              <div><div className="font-semibold text-zinc-900">{s.displayName}</div><div className="text-xs text-slate-400">{s.email}</div></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-orange-500">{s.streak?.current ?? 0}🔥</td>
                          <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">{s.totalSessions ?? 0}</td>
                          <td className="px-4 py-3"><span className={`font-bold ${(s.avgAccuracy ?? 0) >= 80 ? 'text-emerald-600' : (s.avgAccuracy ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{(s.avgAccuracy ?? 0).toFixed(0)}%</span></td>
                          <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-slate-700 hidden md:table-cell">{s.vocabCount ?? 0}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setActivityStudent({ uid: s.uid!, name: s.displayName, email: s.email })}
                                className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="View detailed activity log"
                              >
                                <Eye className="w-3.5 h-3.5 inline mr-1" />Activity
                              </button>
                              <button onClick={() => removeStudentFromClass(selectedClass.id!, s.uid!).then(() => setSelectedClass(prev => prev ? { ...prev, studentUids: prev.studentUids.filter(u => u !== s.uid) } : prev))} className="p-1 text-slate-400 hover:text-rose-500 rounded" title="Remove"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ═══════════════════ ASSIGNMENTS ═══════════════════ */}
        {tab === 'assignments' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <select value={selectedClass?.id ?? ''} onChange={e => setSelectedClass(classes.find(x => x.id === e.target.value) ?? null)}
                className="border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-zinc-400">
                <option value="">— Select a class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedClass && (
                <button onClick={() => setShowNewAssignment(true)} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-black">
                  <Plus className="w-4 h-4" /> New Assignment
                </button>
              )}
            </div>

            {/* ── New assignment form ── */}
            {showNewAssignment && selectedClass && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 space-y-4">
                <h3 className="font-bold text-lg">New Assignment — {selectedClass.name}</h3>

                {/* Type buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['reading','comp-reading','listening','speaking','writing','exercise'] as const).map(t => {
                      const m = TYPE_META[t];
                      return (
                        <button key={t} onClick={() => { setAType(t); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${aType === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          <m.icon className="w-4 h-4" /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── READING picker ── */}
                {aType === 'reading' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Choose Passage</p>
                    <LevelTabs levels={READING_LEVELS} active={aReadingLevel} onSelect={l => { setAReadingLevel(l as Level); setAReadingPassageId(''); }} color="blue" />
                    <select value={aReadingPassageId} onChange={e => {
                      setAReadingPassageId(e.target.value);
                      const p = readingPassages.find((x: any) => x.id === e.target.value);
                      if (p && !aTitle) setATitle(p.title);
                    }} className="w-full border border-blue-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                      <option value="">— Any passage (free practice) —</option>
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
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Choose Comprehension Passage</p>
                    <LevelTabs levels={READING_LEVELS} active={aCompReadingLevel} onSelect={l => { setACompReadingLevel(l as Level); setACompReadingPassageTitle(''); }} color="emerald" />
                    {aCompReadingPassagesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading passages…</div>
                    ) : (
                      <select value={aCompReadingPassageTitle} onChange={e => {
                        setACompReadingPassageTitle(e.target.value);
                        if (e.target.value && !aTitle) setATitle(e.target.value);
                      }} className="w-full border border-emerald-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
                        <option value="">— Select a passage —</option>
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
                  <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Choose Listening Passage</p>
                    <LevelTabs levels={READING_LEVELS} active={aListeningLevel} onSelect={l => setAListeningLevel(l as Level)} color="cyan" />
                    {aListeningPassagesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-cyan-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading passages…</div>
                    ) : (
                      <select value={aListeningPassageTitle} onChange={e => {
                        setAListeningPassageTitle(e.target.value);
                        if (e.target.value && !aTitle) setATitle(e.target.value);
                      }} className="w-full border border-cyan-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400">
                        <option value="">— Select a passage —</option>
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
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Choose Speaking Topic</p>
                    <LevelTabs levels={SPEAKING_LEVELS as string[]} active={aSpeakingLevel} onSelect={l => { setASpeakingLevel(l); setASpeakingTopicIdx(-1); }} color="rose" />
                    <select value={aSpeakingTopicIdx} onChange={e => {
                      const idx = Number(e.target.value);
                      setASpeakingTopicIdx(idx);
                      if (idx >= 0 && !aTitle) setATitle(`Speaking: ${speakingTopics[idx]?.slice(0, 60)}`);
                    }} className="w-full border border-rose-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400">
                      <option value={-1}>— Select a topic —</option>
                      {speakingTopics.map((t: string, i: number) => <option key={i} value={i}>{t.slice(0, 80)}</option>)}
                    </select>
                    {aSpeakingTopicIdx >= 0 && (
                      <p className="text-xs bg-white border border-rose-100 rounded-lg p-2 text-slate-600">{speakingTopics[aSpeakingTopicIdx]}</p>
                    )}
                  </div>
                )}

                {/* ── WRITING picker ── */}
                {aType === 'writing' && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Choose Writing Prompt</p>
                    <LevelTabs levels={PRACTICE_LEVELS as string[]} active={aWritingLevel} onSelect={l => { setAWritingLevel(l); setAWritingTopicIdx(-1); }} color="violet" />
                    <select value={aWritingTopicIdx} onChange={e => {
                      const idx = Number(e.target.value);
                      setAWritingTopicIdx(idx);
                      if (idx >= 0 && !aTitle) setATitle(`Writing: ${writingTopics[idx]?.slice(0, 60)}`);
                    }} className="w-full border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400">
                      <option value={-1}>— Select a prompt —</option>
                      {writingTopics.map((t: string, i: number) => <option key={i} value={i}>{t.slice(0, 80)}</option>)}
                    </select>
                    {aWritingTopicIdx >= 0 && (
                      <p className="text-xs bg-white border border-violet-100 rounded-lg p-2 text-slate-600">{writingTopics[aWritingTopicIdx]}</p>
                    )}
                  </div>
                )}

                {/* ── EXERCISE picker ── */}
                {aType === 'exercise' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Configure Exercise</p>

                    {/* Exercise type grid */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-semibold">Exercise Type</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {EXERCISE_TYPES.map(et => (
                          <button key={et.id} onClick={() => setAExerciseType(et.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${aExerciseType === et.id ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'}`}>
                            {et.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Word source */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-semibold">Word Source</p>
                      <div className="flex gap-2 mb-3">
                        {['level', 'custom'].map(src => (
                          <button key={src} onClick={() => setAExerciseWordSource(src as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all capitalize ${aExerciseWordSource === src ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'}`}>
                            {src === 'level' ? 'From Passage' : 'Custom Words'}
                          </button>
                        ))}
                      </div>

                      {aExerciseWordSource === 'level' && (
                        <div className="space-y-2">
                          <LevelTabs levels={READING_LEVELS} active={aExerciseVocabLevel} onSelect={l => { setAExerciseVocabLevel(l as Level); setAExerciseVocabPassageId(''); }} color="purple" />
                          <select value={aExerciseVocabPassageId} onChange={e => setAExerciseVocabPassageId(e.target.value)}
                            className="w-full border border-purple-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400">
                            <option value="">— All passages in level ({[...new Set(exercisePassages.flatMap((p: any) => p.vocabulary?.map((v: any) => v.word) ?? []))].length} words) —</option>
                            {exercisePassages.map((p: any) => <option key={p.id} value={p.id}>{p.title} ({p.vocabulary?.length ?? 0} words)</option>)}
                          </select>
                          <p className="text-xs text-purple-600 font-semibold">
                            {exercisePassageVocab.length > 0
                              ? `${[...new Set(exercisePassageVocab.map((v: any) => v.word))].length} words selected: ${[...new Set(exercisePassageVocab.map((v: any) => v.word))].slice(0, 8).join(', ')}${exercisePassageVocab.length > 8 ? '…' : ''}`
                              : 'No vocabulary found for this selection.'}
                          </p>
                        </div>
                      )}

                      {aExerciseWordSource === 'custom' && (
                        <div>
                          <textarea
                            value={aExerciseCustomWords}
                            onChange={e => setAExerciseCustomWords(e.target.value)}
                            placeholder="Enter words separated by commas or new lines:&#10;apple, banana, orange&#10;or one per line"
                            rows={4}
                            className="w-full border border-purple-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none bg-white"
                          />
                          {aExerciseCustomWords.trim() && (
                            <p className="text-xs text-purple-600 font-semibold mt-1">
                              {aExerciseCustomWords.split(/[\n,]+/).map(w => w.trim()).filter(Boolean).length} words
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Title + Description + Due */}
                <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Assignment title *"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                <textarea value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Instructions / description (optional)" rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Due Date (optional)</label>
                  <input type="date" value={aDue} onChange={e => setADue(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateAssignment} disabled={!aTitle.trim() || creatingAssignment}
                    className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-black disabled:opacity-50 flex items-center gap-2">
                    {creatingAssignment && <Loader2 className="w-4 h-4 animate-spin" />} Create Assignment
                  </button>
                  <button onClick={resetAssignmentForm} className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}

            {/* Submissions modal */}
            {viewingAssignment && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col">
                  <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900">{viewingAssignment.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                        {(() => { const m = TYPE_META[viewingAssignment.type]; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border ${m.color}`}><m.icon className="w-3 h-3" />{m.label}</span>; })()}
                        {viewingAssignment.passageTitle && <span>· {viewingAssignment.passageTitle} ({viewingAssignment.passageLevel})</span>}
                        {viewingAssignment.compReadingPassageTitle && <span>· {viewingAssignment.compReadingPassageTitle} ({viewingAssignment.compReadingLevel})</span>}
                        {viewingAssignment.listeningPassageTitle && <span>· {viewingAssignment.listeningPassageTitle}</span>}
                        {viewingAssignment.speakingTopic && <span>· {viewingAssignment.speakingTopic?.slice(0, 60)}</span>}
                        {viewingAssignment.writingTopic && <span>· {viewingAssignment.writingTopic?.slice(0, 60)}</span>}
                        {viewingAssignment.exerciseType && <span>· {EXERCISE_TYPES.find(e => e.id === viewingAssignment.exerciseType)?.label} ({viewingAssignment.exerciseWords?.length ?? 0} words)</span>}
                        {viewingAssignment.dueDate && <span>· Due {new Date(viewingAssignment.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button onClick={() => setViewingAssignment(null)} className="p-1.5 text-slate-400 hover:text-zinc-900 rounded-lg hover:bg-slate-100 shrink-0"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-6">
                    {submissionsLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                      : submissions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="font-semibold">No submissions yet</p></div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-500 font-semibold">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
                          {submissions.map((s, i) => {
                            const isExp = expandedSub === s.studentUid;
                            return (
                              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={() => setExpandedSub(isExp ? null : s.studentUid)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold shrink-0">{(s.studentName?.[0] ?? '?').toUpperCase()}</div>
                                    <div><div className="font-semibold text-zinc-900 text-sm">{s.studentName ?? s.studentUid.slice(0, 8)}</div><div className="text-xs text-slate-400">{new Date(s.completedAt).toLocaleString()}</div></div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {s.accuracy !== undefined ? <span className={`text-sm font-black ${s.accuracy >= 80 ? 'text-emerald-600' : s.accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{s.accuracy}%</span> : <span className="text-xs text-slate-400">Submitted</span>}
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                                  </div>
                                </button>
                                {isExp && (
                                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3 bg-slate-50">
                                    <div className="flex gap-6 flex-wrap">
                                      {s.accuracy !== undefined && <div className="text-center"><div className={`text-2xl font-black ${s.accuracy >= 80 ? 'text-emerald-600' : s.accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{s.accuracy}%</div><div className="text-xs text-slate-500">Accuracy</div></div>}
                                      {s.wordsRead !== undefined && <div className="text-center"><div className="text-2xl font-black text-zinc-900">{s.wordsRead}</div><div className="text-xs text-slate-500">Words Read</div></div>}
                                      {s.errors !== undefined && <div className="text-center"><div className="text-2xl font-black text-rose-500">{s.errors.length}</div><div className="text-xs text-slate-500">Errors</div></div>}
                                    </div>
                                    {s.errors && s.errors.length > 0 && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Words Missed</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {s.errors.map((w, wi) => <span key={wi} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">{w}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    {s.accuracy === undefined && s.errors === undefined && <p className="text-sm text-slate-500 italic">No detailed results recorded.</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {!selectedClass ? (
              <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>Select a class to manage assignments.</p></div>
            ) : assignmentsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              : assignments.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>No assignments for {selectedClass.name} yet.</p></div>
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
                            {a.exerciseType && <span className="text-xs text-slate-500 flex items-center gap-1"><Brain className="w-3 h-3" />{EXERCISE_TYPES.find(e => e.id === a.exerciseType)?.label} · {a.exerciseWords?.length ?? 0} words</span>}
                            {a.dueDate && <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar className="w-3 h-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                          </div>
                          <h3 className="font-bold text-zinc-900">{a.title}</h3>
                          {a.description && <p className="text-slate-500 text-sm mt-0.5 truncate">{a.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">Created {new Date(a.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleViewSubmissions(a)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Results</button>
                          <button onClick={() => handleDeleteAssignment(a.id!)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ═══════════════════ SEATS ═══════════════════ */}
        {tab === 'seats' && (
          <SmartyMaxSeats
            sponsorUid={teacherUid}
            sponsorEmail={auth?.currentUser?.email ?? ''}
            sponsorName={teacherName}
            sponsorRole="teacher"
            currentPlan="teacher"
            totalSeats={teacherSeatTotal}
            title="Teacher Seats"
            subtitle={`Your Teacher plan currently has ${teacherSeatTotal} SmartyLang Max seats. Buy more anytime — $8.99 per seat / month.`}
            onSeatsAdded={(n) => setTeacherSeatTotal(n)}
          />
        )}

        {/* ═══════════════════ MESSAGES ═══════════════════ */}
        {tab === 'messages' && (
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-1">Send Announcement</h2>
              <p className="text-slate-500 text-sm mb-5">Notify your students — they'll receive it in their notification bell.</p>
              {annSent && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-4 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />Announcement sent!</div>}
              <div className="space-y-3">
                <select value={annTargetClassId} onChange={e => setAnnTargetClassId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-zinc-400">
                  <option value="">All my students</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} only</option>)}
                </select>
                <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement title *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Write your message…" rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
                <button onClick={handleSendAnnouncement} disabled={!annTitle.trim() || !annMessage.trim() || sendingAnn} className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2">
                  {sendingAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Announcement
                </button>
              </div>
            </div>
          </div>
        )}

      {activityStudent && (
        <StudentActivityModal
          studentUid={activityStudent.uid}
          studentName={activityStudent.name}
          studentEmail={activityStudent.email}
          onClose={() => setActivityStudent(null)}
        />
      )}
    </ScreenShell>
  );
}

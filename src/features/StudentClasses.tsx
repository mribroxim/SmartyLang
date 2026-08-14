import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, BookOpen, Brain, GraduationCap, CheckCircle2, Calendar, Loader2, ChevronRight, X, Headphones, Mic, PenLine } from 'lucide-react';
import {
  auth, getStudentClasses, joinClassWithCode, getStudentAssignments,
  getStudentSubmissions, submitAssignment, ClassRoom, Assignment, Submission,
} from '../firebase';
import { ScreenShell } from '../components/ScreenShell';

const TYPE_ICON: Record<string, React.ElementType> = {
  reading:    BookOpen,
  listening:  Headphones,
  speaking:   Mic,
  writing:    PenLine,
  exercise:   Brain,
  vocabulary: GraduationCap,
};

const TYPE_COLOR: Record<string, string> = {
  reading: 'bg-blue-50 text-blue-700 border-blue-200',
  exercise: 'bg-purple-50 text-purple-700 border-purple-200',
  vocabulary: 'bg-amber-50 text-amber-700 border-amber-200',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StudentClasses({
  onNavigate,
  onStartAssignment,
}: {
  onNavigate: (tab: string) => void;
  onStartAssignment: (assignment: Assignment) => void;
}) {
  const uid = auth?.currentUser?.uid ?? '';
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cls = await getStudentClasses(uid);
      setClasses(cls);
      if (cls.length > 0) {
        const asgns = await getStudentAssignments(cls.map(c => c.id!));
        setAssignments(asgns);
        const subs = await getStudentSubmissions(asgns.map(a => a.id!), uid);
        setSubmissions(subs);
      }
    } finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError(''); setJoinSuccess('');
    try {
      const cls = await joinClassWithCode(uid, joinCode);
      setJoinSuccess(`Joined "${cls.name}"!`);
      setJoinCode(''); setShowJoin(false);
      await load();
    } catch (e: any) { setJoinError(e?.message || 'Failed to join class.'); }
    finally { setJoining(false); }
  };

  const handleSubmit = async (assignment: Assignment) => {
    // For reading with a specific passage: let App.tsx handle navigation + results tracking
    // For everything else: mark submitted immediately then navigate
    if (assignment.type === 'reading' && assignment.passageId) {
      // Optimistically mark as in-progress in local state so it moves out of "pending"
      setSubmissions(prev => ({
        ...prev,
        [assignment.id!]: { studentUid: uid, completedAt: Date.now() },
      }));
      onStartAssignment(assignment);
    } else {
      await submitAssignment(assignment.id!, {
        studentUid: uid,
        studentName: auth?.currentUser?.displayName ?? '',
        completedAt: Date.now(),
      });
      setSubmissions(prev => ({
        ...prev,
        [assignment.id!]: { studentUid: uid, completedAt: Date.now() },
      }));
      onStartAssignment(assignment);
    }
  };

  const pending = assignments.filter(a => !submissions[a.id!]);
  const completed = assignments.filter(a => !!submissions[a.id!]);

  return (
    <ScreenShell title="My Classes" subtitle="View your classes and complete assignments from teachers.">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowJoin(true)} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3.5 py-2 rounded-xl font-semibold text-[13px] hover:bg-black">
            <Plus className="w-4 h-4" /> Join Class
          </button>
        </div>

        {/* Join Class Modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Join a Class</h2>
                <button onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError(''); }} className="p-1 text-slate-400 hover:text-zinc-900 rounded"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Enter the 6-character invite code your teacher gave you.</p>
              {joinError && <p className="text-rose-600 text-sm mb-3 bg-rose-50 px-3 py-2 rounded-lg">{joinError}</p>}
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] focus:outline-none focus:border-zinc-400 mb-4"
              />
              <button onClick={handleJoin} disabled={joinCode.length < 4 || joining} className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2">
                {joining && <Loader2 className="w-4 h-4 animate-spin" />} Join Class
              </button>
            </div>
          </div>
        )}

        {joinSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-4 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {joinSuccess}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-14 h-14 mx-auto mb-4 text-slate-300" />
            <h2 className="font-semibold text-lg mb-1">No classes yet</h2>
            <p className="text-sm mb-6">Ask your teacher for an invite code to join their class.</p>
            <button onClick={() => setShowJoin(true)} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black"><Plus className="w-4 h-4" /> Join a Class</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enrolled Classes */}
            <div>
              <h2 className="font-bold text-zinc-900 mb-3">Enrolled Classes</h2>
              <div className="grid gap-3">
                {classes.map(cls => (
                  <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-indigo-600" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-zinc-900">{cls.name}</h3>
                      {cls.description && <p className="text-sm text-slate-500 truncate">{cls.description}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{cls.studentUids.length} students · Joined</p>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-indigo-600 flex items-center gap-1">
                      {assignments.filter(a => a.classId === cls.id && !submissions[a.id!]).length > 0 && (
                        <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {assignments.filter(a => a.classId === cls.id && !submissions[a.id!]).length} pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Assignments */}
            {pending.length > 0 && (
              <div>
                <h2 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                  Pending Assignments
                  <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
                </h2>
                <div className="grid gap-3">
                  {pending.map(a => (
                    <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {(() => { const Icon = TYPE_ICON[a.type] ?? BookOpen; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${TYPE_COLOR[a.type] ?? TYPE_COLOR.custom}`}><Icon className="w-3 h-3" />{a.type}</span>; })()}
                            {a.dueDate && (
                              <span className={`flex items-center gap-1 text-xs ${a.dueDate < Date.now() ? 'text-rose-500 font-semibold' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                {a.dueDate < Date.now() ? 'Overdue · ' : 'Due '}{new Date(a.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-zinc-900">{a.title}</h3>
                          {a.passageTitle && (
                            <p className="text-xs text-blue-600 font-semibold mt-0.5">📖 Passage: {a.passageTitle} ({a.passageLevel})</p>
                          )}
                          {a.compReadingPassageTitle && (
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5">📗 Reading: {a.compReadingPassageTitle} ({a.compReadingLevel})</p>
                          )}
                          {a.listeningPassageTitle && (
                            <p className="text-xs text-cyan-600 font-semibold mt-0.5">🎧 Listening: {a.listeningPassageTitle}</p>
                          )}
                          {a.description && <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>}
                        </div>
                        <button
                          onClick={() => handleSubmit(a)}
                          className="shrink-0 inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-black"
                        >
                          Start <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Assignments */}
            {completed.length > 0 && (
              <div>
                <h2 className="font-bold text-zinc-900 mb-3 text-slate-500">Completed ({completed.length})</h2>
                <div className="grid gap-2">
                  {completed.map(a => (
                    <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 opacity-75">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-zinc-900">{a.title}</span>
                        <span className="text-xs text-slate-400 ml-2">Completed {new Date(submissions[a.id!]?.completedAt).toLocaleDateString()}</span>
                      </div>
                      {submissions[a.id!]?.score !== undefined && (
                        <span className="text-sm font-bold text-emerald-600">{submissions[a.id!].score}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScreenShell>
  );
}

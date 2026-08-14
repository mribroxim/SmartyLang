import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, BarChart2, Download, Send, RefreshCw, Loader2,
  GraduationCap, BookOpen, TrendingUp, CheckCircle2, Megaphone, FileText, Crown,
} from 'lucide-react';
import {
  auth, listAllProfiles, getTeacherClasses, getStudentSummaries, getUserProfile,
  createAnnouncement, UserAccountProfile, ClassRoom, StudentSummary,
} from '../firebase';
import { SmartyMaxSeats } from './SmartyMaxSeats';
import { ScreenShell, seCard } from '../components/ScreenShell';

type Tab = 'teachers' | 'seats' | 'stats' | 'reports' | 'announcements';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className={`${seCard} p-3.5 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon className="w-4 h-4" /></div>
      <div><div className="text-xl font-black text-zinc-900 leading-tight">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
}

interface OrganizationPanelProps {
  setActiveTab?: (tab: string) => void;
}

export function OrganizationPanel({ setActiveTab }: OrganizationPanelProps = {}) {
  const orgUid = auth?.currentUser?.uid ?? '';
  const orgName = auth?.currentUser?.displayName ?? 'Organization';
  const [tab, setTab] = useState<Tab>('teachers');
  const [orgPlanSeats, setOrgPlanSeats] = useState<number>(30);

  // Load the org's purchased seat count from their profile (defaults to the 30-seat minimum).
  useEffect(() => {
    if (!orgUid) return;
    getUserProfile(orgUid).then(p => {
      if (p?.planSeats && p.planSeats > 0) setOrgPlanSeats(p.planSeats);
    });
  }, [orgUid]);

  // Teachers state
  const [teachers, setTeachers] = useState<UserAccountProfile[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Record<string, ClassRoom[]>>({});
  const [teacherStudents, setTeacherStudents] = useState<Record<string, StudentSummary[]>>({});
  const [loading, setLoading] = useState(true);

  // Stats computed
  const allStudents = (Object.values(teacherStudents).flat() as StudentSummary[]);
  const totalStudents = allStudents.length;
  const totalClasses = Object.values(teacherClasses).flat().length;
  const avgAccuracy = (() => {
    const all = allStudents;
    if (!all.length) return 0;
    return Math.round(all.reduce((sum, s) => sum + (s.avgAccuracy ?? 0), 0) / all.length);
  })();
  const activeStudents = allStudents.filter(s => {
    if (!s.lastActive) return false;
    return Date.now() - s.lastActive < 7 * 24 * 60 * 60 * 1000;
  }).length;

  // Announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listAllProfiles();
      const myTeachers = all.filter(p => p.role === 'teacher' && p.organizationId === orgUid);
      setTeachers(myTeachers);

      const classMap: Record<string, ClassRoom[]> = {};
      const studentMap: Record<string, StudentSummary[]> = {};
      await Promise.all(myTeachers.map(async t => {
        if (!t.uid) return;
        const cls = await getTeacherClasses(t.uid);
        classMap[t.uid] = cls;
        const allStudentUids = [...new Set(cls.flatMap(c => c.studentUids))];
        if (allStudentUids.length > 0) {
          studentMap[t.uid] = await getStudentSummaries(allStudentUids);
        } else {
          studentMap[t.uid] = [];
        }
      }));
      setTeacherClasses(classMap);
      setTeacherStudents(studentMap);
    } finally { setLoading(false); }
  }, [orgUid]);

  useEffect(() => { load(); }, [load]);

  const handleSendAnnouncement = async () => {
    if (!annTitle.trim() || !annMessage.trim()) return;
    setSending(true);
    try {
      await createAnnouncement({
        authorUid: orgUid, authorName: orgName,
        targetType: 'org', targetId: orgUid,
        title: annTitle.trim(), message: annMessage.trim(), createdAt: Date.now(),
      });
      setAnnTitle(''); setAnnMessage('');
      setSent(true); setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  };

  const exportCSV = () => {
    const rows: string[] = ['Teacher,Email,Classes,Students,Avg Accuracy,Active (7d)'];
    teachers.forEach(t => {
      const cls = teacherClasses[t.uid!] ?? [];
      const students = teacherStudents[t.uid!] ?? [];
      const active = students.filter(s => s.lastActive && Date.now() - s.lastActive < 7 * 24 * 60 * 60 * 1000).length;
      const avg = students.length ? Math.round(students.reduce((s, x) => s + (x.avgAccuracy ?? 0), 0) / students.length) : 0;
      rows.push(`"${t.displayName}","${t.email}",${cls.length},${students.length},${avg}%,${active}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'org-report.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'teachers', label: 'Teachers', icon: BookOpen },
    { id: 'seats',    label: 'Seats',    icon: Crown },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <ScreenShell
      size="wide"
      title="Organization"
      subtitle="Teachers, seats, and performance."
      actions={
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 text-sm font-semibold">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      }
    >
      <div className="flex items-center justify-end mb-3 lg:hidden">
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatCard label="Teachers" value={teachers.length} icon={BookOpen} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Classes" value={totalClasses} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Students" value={totalStudents} icon={GraduationCap} color="bg-amber-50 text-amber-600" />
        <StatCard label="Active this week" value={activeStudents} icon={TrendingUp} color="bg-violet-50 text-violet-600" />
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-[13px] transition-all shrink-0 ${tab === t.id ? 'bg-zinc-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

        {/* ── Seats (always rendered when active, even while teachers list loads) ── */}
        {tab === 'seats' && (
          <SmartyMaxSeats
            sponsorUid={orgUid}
            sponsorEmail={auth?.currentUser?.email ?? ''}
            sponsorName={orgName}
            sponsorRole="organization"
            currentPlan="organization"
            totalSeats={orgPlanSeats}
            title="Organization Seats"
            subtitle={`Your Organization plan currently has ${orgPlanSeats} Smarty Max seats. Buy more anytime — $12.99 per seat / month.`}
            onSeatsAdded={(n) => setOrgPlanSeats(n)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <>
            {/* ── Teachers ── */}
            {tab === 'teachers' && (
              teachers.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">No teachers assigned yet</p>
                  <p className="text-sm">Ask the admin to assign teachers to your organization.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {teachers.map(t => {
                    const cls = teacherClasses[t.uid!] ?? [];
                    const students = teacherStudents[t.uid!] ?? [];
                    const avg = students.length ? Math.round(students.reduce((s, x) => s + (x.avgAccuracy ?? 0), 0) / students.length) : 0;
                    return (
                      <div key={t.uid} className={`${seCard} p-4`}>
                        <div className="flex items-start gap-3">
                          {t.photoURL ? <img src={t.photoURL} className="w-12 h-12 rounded-full shrink-0" alt="" /> : <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-lg font-black text-emerald-700">{(t.displayName?.[0] ?? '?').toUpperCase()}</div>}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-zinc-900">{t.displayName}</h3>
                            <p className="text-sm text-slate-500">{t.email}</p>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              {[['Classes', cls.length], ['Students', students.length], ['Avg Accuracy', `${avg}%`]].map(([l, v]) => (
                                <div key={String(l)} className="bg-slate-50 rounded-xl p-3 text-center">
                                  <div className="text-xl font-black text-zinc-900">{v}</div>
                                  <div className="text-xs text-slate-400">{l}</div>
                                </div>
                              ))}
                            </div>
                            {cls.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {cls.map(c => <span key={c.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">{c.name} ({c.studentUids.length})</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Stats ── */}
            {tab === 'stats' && (
              <div className="grid gap-6">
                <div className={`${seCard} p-4`}>
                  <h2 className="text-lg font-bold mb-4">Platform Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Teachers', value: teachers.length, color: 'text-emerald-600' },
                      { label: 'Total Classes', value: totalClasses, color: 'text-blue-600' },
                      { label: 'Total Students', value: totalStudents, color: 'text-amber-600' },
                      { label: 'Active This Week', value: activeStudents, color: 'text-violet-600' },
                      { label: 'Avg Accuracy', value: `${avgAccuracy}%`, color: 'text-rose-600' },
                      { label: 'Inactive Students', value: totalStudents - activeStudents, color: 'text-slate-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className={`text-3xl font-black ${color}`}>{value}</div>
                        <div className="text-sm text-slate-500 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${seCard} p-4`}>
                  <h2 className="text-lg font-bold mb-4">Top Performing Students</h2>
                  {allStudents.length === 0 ? (
                    <p className="text-slate-400 text-sm">No student data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {allStudents
                        .sort((a, b) => (b.avgAccuracy ?? 0) - (a.avgAccuracy ?? 0))
                        .slice(0, 5)
                        .map((s, i) => (
                          <div key={s.uid ?? i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                            <span className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-black">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-zinc-900 truncate">{s.displayName}</div>
                              <div className="text-xs text-slate-400">{s.totalSessions ?? 0} sessions · {s.streak?.current ?? 0}🔥 streak</div>
                            </div>
                            <span className={`font-black text-lg ${(s.avgAccuracy ?? 0) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{(s.avgAccuracy ?? 0).toFixed(0)}%</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Reports ── */}
            {tab === 'reports' && (
              <div className={`${seCard} p-4 max-w-lg`}>
                <h2 className="text-xl font-bold mb-2">Export Reports</h2>
                <p className="text-slate-500 text-sm mb-6">Download performance data for all teachers and students in your organization.</p>
                <div className="space-y-3">
                  <button onClick={exportCSV} className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Download className="w-5 h-5 text-emerald-600" /></div>
                    <div><div className="font-semibold text-zinc-900">Teacher Performance Report</div><div className="text-sm text-slate-500">CSV: teachers, classes, student counts, accuracy</div></div>
                  </button>
                  <button onClick={() => {
                    const rows = ['Student,Email,Teacher,Sessions,Avg Accuracy,Streak,Last Active'];
                    teachers.forEach(t => {
                      (teacherStudents[t.uid!] ?? []).forEach(s => {
                        rows.push(`"${s.displayName}","${s.email}","${t.displayName}",${s.totalSessions ?? 0},${(s.avgAccuracy ?? 0).toFixed(0)}%,${s.streak?.current ?? 0},${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}`);
                      });
                    });
                    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob); const a = document.createElement('a');
                    a.href = url; a.download = 'student-report.csv'; a.click(); URL.revokeObjectURL(url);
                  }} className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-blue-600" /></div>
                    <div><div className="font-semibold text-zinc-900">Student Progress Report</div><div className="text-sm text-slate-500">CSV: all students, sessions, accuracy, streaks</div></div>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-4">Reports include data for {teachers.length} teachers and {totalStudents} students.</p>
              </div>
            )}

            {/* ── Announcements ── */}
            {tab === 'announcements' && (
              <div className={`${seCard} p-4 max-w-2xl`}>
                <h2 className="text-xl font-bold mb-1">Send Org-wide Announcement</h2>
                <p className="text-slate-500 text-sm mb-5">Notify all teachers and students in your organization.</p>
                {sent && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-4 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />Announcement sent!</div>}
                <div className="space-y-3">
                  <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement title *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400" />
                  <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Write your message…" rows={5} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
                  <button onClick={handleSendAnnouncement} disabled={!annTitle.trim() || !annMessage.trim() || sending} className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to All
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </ScreenShell>
  );
}

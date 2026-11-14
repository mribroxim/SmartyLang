import { DialogSurface } from './DialogSurface';
import { useUiLang } from '../contexts/UiLangContext';
import React, { useEffect, useState, useMemo } from 'react';
import {
  X, Loader2, CheckCircle2, XCircle, BookOpen, Headphones, Mic, PenLine,
  Sparkles, GraduationCap, Type, Filter, Calendar,
} from 'lucide-react';
import { getStudentActivity, type ActivityRecord, type ActivityType } from '../lib/activity-tracker';

const activityMeta = (t: ReturnType<typeof useUiLang>['t']): Record<ActivityType, { label: string; icon: React.ComponentType<any>; color: string }> => ({
  reading_pronunciation:   { label: t("home.preview.reading"),              icon: BookOpen,      color: 'indigo' },
  reading_assignment:      { label: t("core.common.reading_assignment_2ba9d1"),   icon: BookOpen,      color: 'indigo' },
  comprehensive_reading:   { label: t("reading.comp.title"), icon: BookOpen,     color: 'blue' },
  comprehensive_listening: { label: t("listening.comp.title"), icon: Headphones, color: 'teal' },
  listening_practice:      { label: t("home.preview.listening"),            icon: Headphones,    color: 'teal' },
  speaking_practice:       { label: t("home.preview.speaking"),             icon: Mic,           color: 'rose' },
  writing_practice:        { label: t("nav.writing"),              icon: PenLine,       color: 'amber' },
  ai_check_writing:        { label: t("core.common.ai_writing_check_fda836"),     icon: Sparkles,      color: 'amber' },
  ai_check_speaking:       { label: t("core.common.ai_speaking_check_79d8cf"),    icon: Sparkles,      color: 'rose' },
  interactive_story:       { label: t("core.common.interactive_story_85f0c3"),    icon: BookOpen,      color: 'purple' },
  exercise:                { label: t("site.app.exercise_20863c"),             icon: GraduationCap, color: 'emerald' },
  vocabulary_add:          { label: t("onboard.section.vocabulary"),           icon: Type,          color: 'slate' },
  translation_practice:    { label: t("site.exercisesview.translation_ac26a7"),          icon: Type,          color: 'cyan' },
  audio_dictation:         { label: t("listening.dict.title"),      icon: Headphones,    color: 'sky' },
});

interface StudentActivityModalProps {
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  onClose: () => void;
}

export function StudentActivityModal({ studentUid, studentName, studentEmail, onClose }: StudentActivityModalProps) {
  const { t } = useUiLang();
  const TYPE_META = activityMeta(t);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');
  const [selected, setSelected] = useState<ActivityRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStudentActivity(studentUid, 200).then(r => {
      if (!cancelled) {
        setActivity(r);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [studentUid]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return activity;
    return activity.filter(a => a.type === filterType);
  }, [activity, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activity.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, [activity]);

  return (
    <DialogSurface onClose={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-zinc-900 text-lg">{studentName || t("core.studentactivitymodal.student_42b327")}  {t("core.studentactivitymodal.activity_log_c1655c")}</h2>
              <p className="text-xs text-zinc-500 font-medium">{studentEmail || studentUid}</p>
            </div>
          </div>
          <button aria-label={t('a11y.close')} onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 text-zinc-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: activity list */}
          <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t("core.studentactivitymodal.all_04a9ac")}{activity.length})
              </button>
              {(Object.keys(TYPE_META) as ActivityType[])
                .filter(t => typeCounts[t])
                .map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      filterType === t ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {TYPE_META[t].label} ({typeCounts[t]})
                  </button>
                ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400 px-8">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">{t("core.dashboardview.no_activity_yet_8bdea3")}</p>
                  <p className="text-xs mt-1">{t("core.studentactivitymodal.this_student_hasnt_completed_anything_ca0593")}</p>
                </div>
              ) : (
                filtered.map((a, i) => {
                  const meta = TYPE_META[a.type] || TYPE_META.exercise;
                  const Icon = meta.icon;
                  const isSelected = selected === a;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(a)}
                      className={`w-full text-left px-5 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-${meta.color}-100 text-${meta.color}-700 flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{meta.label}</span>
                          {a.level && <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{a.level}</span>}
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{a.title || a.topic || '—'}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</span>
                          {typeof a.score === 'number' && typeof a.total === 'number' && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className={`font-bold ${a.score / a.total >= 0.7 ? 'text-emerald-600' : a.score / a.total >= 0.4 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {a.score}/{a.total}
                              </span>
                            </>
                          )}
                          {typeof a.accuracy === 'number' && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className={`font-bold ${a.accuracy >= 70 ? 'text-emerald-600' : a.accuracy >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {a.accuracy}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: detail */}
          <div className="hidden md:flex md:w-1/2 flex-col overflow-y-auto bg-slate-50">
            {!selected ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
                <BookOpen className="w-10 h-10 mb-3 text-slate-300" />
                <p className="font-medium">{t("core.studentactivitymodal.pick_an_activity_to_see_53a94b")}</p>
              </div>
            ) : (
              <DetailView record={selected} />
            )}
          </div>
        </div>
      </div>
    </DialogSurface>
  );
}

function DetailView({ record }: { record: ActivityRecord }) {
  const { t } = useUiLang();
  const TYPE_META = activityMeta(t);
  const meta = TYPE_META[record.type] || TYPE_META.exercise;
  const Icon = meta.icon;

  return (
    <div className="p-6 space-y-5">
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-${meta.color}-100 text-${meta.color}-700 flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-extrabold text-zinc-900 text-lg leading-tight">{record.title || record.topic || meta.label}</h3>
            <p className="text-xs text-zinc-500">{record.timestamp ? new Date(record.timestamp).toLocaleString() : '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {record.level && <Stat label={t("core.dashboardview.level_7c7f5d")} value={record.level} />}
          {typeof record.score === 'number' && typeof record.total === 'number' && (
            <Stat label={t("common.score")} value={`${record.score}/${record.total}`} highlight />
          )}
          {typeof record.accuracy === 'number' && <Stat label={t("lesson.stat.accuracy")} value={`${record.accuracy}%`} highlight />}
          {record.exerciseId && <Stat label={t("core.studentactivitymodal.exercise_20863c")} value={record.exerciseId.replace(/-/g, ' ')} />}
        </div>
      </div>

      {Array.isArray(record.details) && record.details.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">{t("core.dashboardview.perquestion_detail_a884aa")}</h4>
          <div className="space-y-3">
            {record.details.map((d: any, i: number) => (
              <React.Fragment key={i}>
                <DetailRow idx={i + 1} detail={d} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-2.5 border-2 border-slate-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>{value}</p>
    </div>
  );
}

function DetailRow({ idx, detail }: { idx: number; detail: any }) {
  const { t } = useUiLang();
  const TYPE_META = activityMeta(t);
  const isCorrect = detail.isCorrect === true;
  const isWrong = detail.isCorrect === false;
  const Icon = isCorrect ? CheckCircle2 : isWrong ? XCircle : null;
  const color = isCorrect ? 'emerald' : isWrong ? 'rose' : 'slate';
  return (
    <div className={`p-3 rounded-xl border ${
      isCorrect ? 'border-emerald-100 bg-emerald-50' :
      isWrong   ? 'border-rose-100 bg-rose-50' :
                  'border-slate-100 bg-slate-50'
    }`}>
      <div className="flex items-start gap-2">
        <span className={`text-xs font-bold ${color === 'emerald' ? 'text-emerald-700' : color === 'rose' ? 'text-rose-700' : 'text-slate-600'} shrink-0`}>#{idx}</span>
        {Icon && <Icon className={`w-4 h-4 ${color === 'emerald' ? 'text-emerald-600' : 'text-rose-600'} shrink-0 mt-0.5`} />}
        <div className="flex-1 min-w-0 text-sm">
          {detail.question && <p className="font-semibold text-zinc-900">{detail.question}</p>}
          {detail.word && (
            <p className="font-semibold text-zinc-900">
              <span className="font-mono">{detail.word}</span>
            </p>
          )}
          {detail.criterion && (
            <p className="font-bold text-zinc-900">{detail.criterion}{typeof detail.score === 'number' ? <span className="font-mono ml-2 text-sm bg-zinc-100 px-1.5 py-0.5 rounded">{detail.score}/9</span> : null}</p>
          )}
          {Array.isArray(detail.options) && (
            <ul className="mt-1 space-y-0.5">
              {detail.options.map((o: string, oi: number) => (
                <li key={oi} className={`text-xs flex items-center gap-2 ${
                  oi === detail.correctIndex ? 'font-bold text-emerald-700' :
                  oi === detail.pickedIndex && oi !== detail.correctIndex ? 'text-rose-700' :
                  'text-slate-600'
                }`}>
                  <span className="font-mono">{String.fromCharCode(65 + oi)}.</span>
                  <span>{o}</span>
                  {oi === detail.correctIndex && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">{t("core.studentactivitymodal.correct_3179a6")}</span>}
                  {oi === detail.pickedIndex && oi !== detail.correctIndex && <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600">{t("core.studentactivitymodal.picked_17a53b")}</span>}
                </li>
              ))}
            </ul>
          )}
          {detail.expected !== undefined && detail.actual !== undefined && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 mb-1">{t("core.studentactivitymodal.expected_6ac87f")}</p>
                <p className="font-mono text-zinc-900 break-words">{detail.expected || '∅'}</p>
              </div>
              <div className={`bg-white rounded-lg p-2 border ${isCorrect ? 'border-emerald-100' : 'border-rose-100'}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{t("core.studentactivitymodal.student_wrote_70867c")}</p>
                <p className="font-mono text-zinc-900 break-words">{detail.actual || '∅'}</p>
              </div>
            </div>
          )}
          {Array.isArray(detail.strengths) && detail.strengths.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">{t("onboard.result.strengths")}</p>
              <ul className="text-xs text-zinc-700 space-y-0.5">{detail.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
            </div>
          )}
          {Array.isArray(detail.weaknesses) && detail.weaknesses.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-0.5">{t("core.dashboardview.weaknesses_164229")}</p>
              <ul className="text-xs text-zinc-700 space-y-0.5">{detail.weaknesses.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
            </div>
          )}
          {Array.isArray(detail.recommendations) && detail.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-0.5">{t("core.dashboardview.recommendations_4faa65")}</p>
              <ul className="text-xs text-zinc-700 space-y-0.5">{detail.recommendations.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
            </div>
          )}
          {detail.summary && (
            <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-900 italic">{detail.summary}</div>
          )}
          {detail.response && (
            <details className="mt-2">
              <summary className="text-xs font-bold text-zinc-500 cursor-pointer">{t("core.studentactivitymodal.view_submitted_text_c24851")}</summary>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap mt-1 p-2 bg-white rounded border border-slate-100">{detail.response}</p>
            </details>
          )}
          {detail.choice && detail.passage && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-zinc-700 italic line-clamp-3">"{detail.passage}"</p>
              <p className="text-xs"><span className="font-bold text-emerald-700">{t("core.studentactivitymodal.chose_a3cab9")}</span> {detail.choice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  BookOpen, AlertCircle, Volume2, ChevronRight, BarChart2, ArrowLeft,
  Brain, Headphones, Mic, Play, Download, GraduationCap, PenLine, Search,
  GripVertical, X, Plus, Settings, RotateCcw, Sparkles, Clock, Languages, Award,
  Trophy, Repeat, Zap,
} from 'lucide-react';
import { loadCertificateMeta } from '../lib/lessonProgress';
import { useLevelTexts } from '../data/levelTexts';
import { DashboardWordCard } from '../components/DashboardWordCard';
import { ProfileIdentityCard } from '../components/ProfileIdentityCard';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { resolveLangLabel } from '../lib/activityMeta';
import {
  CONTENT_LANG_NATIVE,
  CONTENT_LANGS,
  CONTENT_LANGS_WITH_PACKS,
  vocabStorageKey,
  type ContentLang,
  isContentLang,
} from '../lib/contentLang';
import { get as idbGet } from 'idb-keyval';
import {
  dueSrsWords,
} from '../lib/weeklyGoals';
import { leagueMeta } from '../lib/habitEngine';
import { seCard } from '../components/ScreenShell';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { UserAccountProfile } from '../firebase';

/* ═══════════════════════ TYPES ═══════════════════════════════ */
type WidgetId =
  | 'continue' | 'stat-cards' | 'srs-review' | 'league-xp' | 'activity-history' | 'quick-actions'
  | 'writing' | 'speaking' | 'comp-reading' | 'comp-listening'
  | 'dictation' | 'interactive-reading'
  | 'pronunciation' | 'mistakes' | 'exercises';

interface LayoutState { order: WidgetId[]; hidden: WidgetId[] }

const ALL_WIDGETS: WidgetId[] = [
  'continue', 'stat-cards', 'srs-review', 'league-xp', 'activity-history', 'quick-actions',
  'writing', 'speaking', 'comp-reading', 'comp-listening',
  'dictation', 'interactive-reading',
  'pronunciation', 'mistakes', 'exercises',
];

/** Default home: Continue + graph + SRS + league/XP + activity */
const DEFAULT_LAYOUT: LayoutState = {
  order: ['continue', 'stat-cards', 'srs-review', 'league-xp', 'activity-history'],
  hidden: [
    'quick-actions',
    'writing', 'speaking', 'comp-reading', 'comp-listening',
    'dictation', 'interactive-reading', 'pronunciation', 'mistakes', 'exercises',
  ],
};

const LAYOUT_KEY = 'dashboard_layout_v6';

const PROFILE_LAYOUT: LayoutState = {
  order: [],
  hidden: [
    'continue', 'stat-cards', 'srs-review', 'league-xp', 'activity-history', 'quick-actions',
    'writing', 'speaking', 'comp-reading', 'comp-listening',
    'dictation', 'interactive-reading', 'pronunciation', 'mistakes', 'exercises',
  ],
};

const HOME_LAYOUT: LayoutState = {
  order: ['continue', 'stat-cards', 'srs-review', 'league-xp', 'activity-history'],
  hidden: [
    'quick-actions',
    'writing', 'speaking', 'comp-reading', 'comp-listening',
    'dictation', 'interactive-reading', 'pronunciation', 'mistakes', 'exercises',
  ],
};

// Widgets that look good side-by-side in a 2-col grid (in view mode)
const MEDIUM = new Set<WidgetId>(['writing','speaking','comp-reading','comp-listening','dictation','interactive-reading']);

const WIDGET_META: Record<WidgetId, { label: string; desc: string; icon: React.ReactNode }> = {
  'continue':            { label: 'Profile',                  desc: 'Your name and plan',                  icon: <ChevronRight className="w-4 h-4" /> },
  'stat-cards':          { label: 'Statistics',               desc: 'Activity graph',                       icon: <BarChart2 className="w-4 h-4" />     },
  'srs-review':          { label: 'SRS',                      desc: 'Words due for spaced review',         icon: <Repeat className="w-4 h-4" />        },
  'league-xp':           { label: 'League & XP',              desc: 'League and total XP',                 icon: <Trophy className="w-4 h-4" />        },
  'activity-history':    { label: 'Activity History',         desc: 'Every session with details',           icon: <Clock className="w-4 h-4" />         },
  'quick-actions':       { label: 'Quick Actions',            desc: 'Shortcuts to every feature',          icon: <ChevronRight className="w-4 h-4" /> },
  'writing':             { label: 'Writing Practice',         desc: 'Essays & word counts',                icon: <PenLine className="w-4 h-4" />       },
  'speaking':            { label: 'Speaking Practice',        desc: 'Recorded topics',                     icon: <Mic className="w-4 h-4" />           },
  'comp-reading':        { label: 'Comprehensive Reading',    desc: 'Passages & scores',                   icon: <BookOpen className="w-4 h-4" />      },
  'comp-listening':      { label: 'Comprehensive Listening',  desc: 'Audio passages & scores',             icon: <Headphones className="w-4 h-4" />    },
  'dictation':           { label: 'Audio Dictation',          desc: 'Dictation exercises',                 icon: <Volume2 className="w-4 h-4" />       },
  'interactive-reading': { label: 'IELTS Reading',             desc: 'Reading test scores',                 icon: <BookOpen className="w-4 h-4" />      },
  'pronunciation':       { label: 'Reading Pronunciation',    desc: 'Pronunciation history',               icon: <Mic className="w-4 h-4" />           },
  'mistakes':            { label: 'Fix Next',                 desc: 'Words to practise',                   icon: <AlertCircle className="w-4 h-4" />   },
  'exercises':           { label: 'Exercise History',         desc: 'All exercise sessions',               icon: <Brain className="w-4 h-4" />         },
};

const STATS_LANG_KEY = 'dashboard_stats_lang_v1';

type StatsLangFilter = 'all' | ContentLang;

function readStatsLang(): StatsLangFilter {
  try {
    const v = localStorage.getItem(STATS_LANG_KEY);
    if (!v || v === 'all') return 'all';
    return isContentLang(v) ? v : 'all';
  } catch {
    return 'all';
  }
}

function saveStatsLang(lang: StatsLangFilter) {
  try { localStorage.setItem(STATS_LANG_KEY, lang); } catch { /* ignore */ }
}

/** Match activity records to the stats language filter. Missing lang → English (legacy). */
function entryMatchesLang(obj: any, filter: StatsLangFilter): boolean {
  if (filter === 'all') return true;
  const lang = obj?.contentLang
    || obj?.aiCheckResult?.contentLang
    || obj?.fullCheck?.contentLang
    || obj?.result?.contentLang
    || 'en';
  return lang === filter;
}

function readVocabCountForLang(lang: ContentLang): number {
  try {
    const raw = localStorage.getItem(vocabStorageKey(lang));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? Object.keys(parsed).length : 0;
  } catch {
    return 0;
  }
}

function discoverVocabLangs(): ContentLang[] {
  return CONTENT_LANGS.filter(l => readVocabCountForLang(l) > 0);
}

function readLayout(): LayoutState {
  try {
    const s = localStorage.getItem(LAYOUT_KEY);
    if (!s) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(s) as LayoutState;
    const allInOrder = parsed.order.filter(id => ALL_WIDGETS.includes(id));
    const allInHidden = parsed.hidden.filter(id => ALL_WIDGETS.includes(id));
    const known = new Set([...allInOrder, ...allInHidden]);
    const newOnes = ALL_WIDGETS.filter(id => !known.has(id));
    return { order: [...allInOrder, ...newOnes], hidden: allInHidden };
  } catch { return DEFAULT_LAYOUT; }
}

function saveLayout(layout: LayoutState) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

/* ═══════════════════════ SHARED SUB-COMPONENTS ══════════════ */
const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const LEVEL_COLORS = ['bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-zinc-700', 'bg-violet-500'];

function readLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function LevelBreakdown({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  return (
    <div className="space-y-2 mt-3">
      {LEVELS.map((l, i) => (
        <div key={l} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 w-28 shrink-0 uppercase tracking-wider truncate">{l}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full ${LEVEL_COLORS[i]} transition-all duration-700`} style={{ width: `${(counts[i] / max) * 100}%` }} />
          </div>
          <span className={`text-xs font-black w-5 text-right ${counts[i] === 0 ? 'text-slate-200' : 'text-slate-700'}`}>{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon, iconColor, children, onNavigate, navLabel }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>{icon}</span>
          {title}
        </h2>
        {onNavigate && (
          <button onClick={onNavigate} className="text-xs font-bold text-slate-400 hover:text-zinc-900 flex items-center gap-1 transition-colors">
            {navLabel || 'Open'} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ═══════════════════════ PROPS ═══════════════════════════════ */
interface DashboardViewProps {
  dashboardFilter: '1' | '7' | '30' | '365' | 'all' | string;
  setDashboardFilter: (f: any) => void;
  history: Record<string, { accuracy: number; timestamp: number; hasAudio?: boolean }[]>;
  problemWords: Record<string, { count: number; lastMissed: number }>;
  savedVocab: Record<string, any>;
  savedCustomTexts: string[];
  playWord: (word: string) => void;
  practicingWord: string | null;
  startPracticeWord: (word: string) => void;
  allVocabMap: Map<string, string>;
  wordsToPracticePage: number;
  setWordsToPracticePage: (fn: (p: number) => number) => void;
  playHistoryAudio: (textId: string, timestamp?: number) => void;
  downloadAudio: (textId: string, timestamp?: number) => void;
  exercisesHistory: any[];
  exerciseProgressFilter: string;
  setExerciseProgressFilter: (f: any) => void;
  setActiveTab: (tab: string) => void;
  setReadingView: (view: string) => void;
  setSelectedVocabWords?: (fn: any) => void;
  setActiveExercise?: (ex: any) => void;
  setShowExerciseWordSelector?: (v: any) => void;
  habit?: any;
  userProfile?: { xp: number; coins: number; level: number; league: string };
  user?: { photoURL?: string | null; displayName?: string | null };
  accountProfile?: UserAccountProfile | null;
  navigate?: (route: { tab: string; path: string[] }) => void;
  /** home = continue + stats + SRS + league/XP + activity; profile unused; full = customizable (legacy) */
  variant?: 'home' | 'profile' | 'full';
  /** Drop outer scroll/padding when nested inside Profile */
  embedded?: boolean;
  /** Placement starting door — used when there is nothing to resume. */
  startingLevel?: string;
}

/* ═══════════════════════ MAIN COMPONENT ═════════════════════ */
export default function DashboardView({
  dashboardFilter, setDashboardFilter, history, problemWords, savedVocab,
  playWord, practicingWord, startPracticeWord, allVocabMap,
  wordsToPracticePage, setWordsToPracticePage, playHistoryAudio, downloadAudio,
  exercisesHistory, exerciseProgressFilter, setExerciseProgressFilter, setActiveTab, setReadingView,
  setSelectedVocabWords, setActiveExercise, setShowExerciseWordSelector,
  habit, userProfile, user, accountProfile, navigate,
  variant = 'home',
  embedded = false,
  startingLevel,
}: DashboardViewProps) {
  const LEVEL_TEXTS = useLevelTexts();
  const { isEnglish, contentLang } = useContentLang();
  const { t } = useUiLang();
  const isHome = variant === 'home';
  const isProfile = variant === 'profile';
  const isFull = variant === 'full';

  /* ── Language filter for stats / history (default: all) ── */
  const [statsLang, setStatsLangState] = useState<StatsLangFilter>(readStatsLang);
  const setStatsLang = useCallback((lang: StatsLangFilter) => {
    setStatsLangState(lang);
    saveStatsLang(lang);
  }, []);
  const matchLang = useCallback((obj: any) => entryMatchesLang(obj, statsLang), [statsLang]);

  /* ── Layout state ── */
  const [layout, setLayout] = useState<LayoutState>(() => {
    if (variant === 'profile') return PROFILE_LAYOUT;
    if (variant === 'home') return HOME_LAYOUT;
    return readLayout();
  });
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
  const dragCounter = useRef(0); // track nested dragenter/leave

  const updateLayout = useCallback((next: LayoutState) => {
    if (!isFull) return;
    setLayout(next);
    saveLayout(next);
  }, [isFull]);

  const hideWidget = useCallback((id: WidgetId) => {
    if (!isFull) return;
    setLayout(prev => {
      const next = { order: prev.order.filter(w => w !== id), hidden: [...prev.hidden, id] };
      saveLayout(next); return next;
    });
  }, [isFull]);

  const showWidget = useCallback((id: WidgetId) => {
    if (!isFull) return;
    setLayout(prev => {
      const next = { order: [...prev.order, id], hidden: prev.hidden.filter(w => w !== id) };
      saveLayout(next); return next;
    });
  }, [isFull]);

  const resetToDefault = useCallback(() => {
    if (!isFull) return;
    updateLayout(DEFAULT_LAYOUT);
  }, [isFull, updateLayout]);

  // Force layout for home/profile variants (ignore persisted customize)
  const effectiveLayout = isHome ? HOME_LAYOUT : isProfile ? PROFILE_LAYOUT : layout;

  /* ── DnD handlers ── */
  const onDragStart = useCallback((e: React.DragEvent, id: WidgetId) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverId(id);
  }, []);

  const onDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverId(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((e: React.DragEvent, toId: WidgetId) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverId(null);
    setLayout(prev => {
      if (!dragId || dragId === toId) { setDragId(null); return prev; }
      const newOrder = [...prev.order];
      const from = newOrder.indexOf(dragId);
      const to   = newOrder.indexOf(toId);
      if (from === -1 || to === -1) { setDragId(null); return prev; }
      newOrder.splice(from, 1);
      newOrder.splice(to, 0, dragId);
      const next = { ...prev, order: newOrder };
      saveLayout(next);
      setDragId(null);
      return next;
    });
  }, [dragId]);

  const onDragEnd = useCallback(() => { setDragId(null); setDragOverId(null); dragCounter.current = 0; }, []);

  /* ── Stats (re-read when language filter changes so dashboard stays in sync) ── */
  const essays           = useMemo(() => readLS<Record<string, any>>('smarty_essays_v2', {}), [statsLang]);
  const savedEssaysMap   = useMemo(() => readLS<Record<string, any[]>>('smarty_saved_essays_v1', {}), [statsLang]);
  const t1EssaysMap      = useMemo(() => readLS<Record<string, any[]>>('smarty_t1_essays_v1', {}), [statsLang]);
  const t2EssaysMap      = useMemo(() => readLS<Record<string, any[]>>('smarty_t2_essays_v1', {}), [statsLang]);
  const speakingIdx      = useMemo(() => readLS<Record<string, any[]>>('speaking_index_v2', {}), [statsLang]);
  const speakingGraded   = useMemo(() => readLS<Record<string, { transcript: string; result: any }[]>>('speaking_graded_v1', {}), [statsLang]);
  const ieltsSpeakingLogRaw = useMemo(() => readLS<any[]>('ielts_speaking_history_v1', []), [statsLang]);
  const crLogRaw       = useMemo(() => readLS<any[]>('cr_completions_v1', []), [statsLang]);
  const clLogRaw       = useMemo(() => readLS<any[]>('cl_completions_v1', []), [statsLang]);
  const ldLogRaw       = useMemo(() => readLS<any[]>('ld_completions_v1', []), [statsLang]);
  const isLogRaw       = useMemo(() => readLS<any[]>('is_completions_v1', []), [statsLang]);
  const shadowingLogRaw = useMemo(() => readLS<any[]>('shadowing_completions_v1', []), [statsLang]);
  const writingMockLogRaw = useMemo(() => readLS<any[]>('writing_mock_history_v1', []), [statsLang]);

  const ieltsSpeakingLog = useMemo(() => ieltsSpeakingLogRaw.filter(matchLang), [ieltsSpeakingLogRaw, matchLang]);
  const crLog       = useMemo(() => crLogRaw.filter(matchLang), [crLogRaw, matchLang]);
  const clLog       = useMemo(() => clLogRaw.filter(matchLang), [clLogRaw, matchLang]);
  const ldLog       = useMemo(() => ldLogRaw.filter(matchLang), [ldLogRaw, matchLang]);
  const isLog       = useMemo(() => isLogRaw.filter(matchLang), [isLogRaw, matchLang]);
  const shadowingLog = useMemo(() => shadowingLogRaw.filter(matchLang), [shadowingLogRaw, matchLang]);
  const writingMockLog = useMemo(() => writingMockLogRaw.filter(matchLang), [writingMockLogRaw, matchLang]);
  const exercisesHistoryLang = useMemo(
    () => (exercisesHistory || []).filter(matchLang),
    [exercisesHistory, matchLang],
  );

  // Flatten graded essays + speaking sessions for the dashboard summaries
  const gradedEssays = useMemo(() => {
    const out: { title: string; band: number; checkedAt: number; level?: string; content?: string; aiResult: any; fullCheck?: any; style?: string; contentLang?: string; langLabel?: string; source?: string }[] = [];
    const pushFrom = (map: Record<string, any[]>, source: string) => {
      for (const arr of Object.values(map)) {
        for (const e of arr as any[]) {
          if (e?.aiCheckResult?.final?.overallScore != null) {
            out.push({
              title: e.title || e.promptTitle || e.categoryName || 'Essay',
              band: e.aiCheckResult.final.overallScore,
              checkedAt: e.aiCheckResult.checkedAt || e.createdAt || 0,
              level: e.level || e.chartType || e.essayType,
              content: typeof e.content === 'string' ? e.content : undefined,
              aiResult: e.aiCheckResult.final,
              fullCheck: e.aiCheckResult,
              style: e.aiCheckResult.style,
              contentLang: e.contentLang || e.aiCheckResult.contentLang,
              langLabel: e.langLabel || e.aiCheckResult.langLabel,
              source,
            });
          }
        }
      }
    };
    pushFrom(savedEssaysMap, 'Writing Practice');
    pushFrom(t1EssaysMap, 'IELTS Writing Task 1');
    pushFrom(t2EssaysMap, 'IELTS Writing Task 2');
    for (const m of writingMockLog) {
      const band = typeof m.band1 === 'number' && typeof m.band2 === 'number'
        ? Math.round(((m.band1 + m.band2) / 2) * 2) / 2
        : (typeof m.band2 === 'number' ? m.band2 : typeof m.band1 === 'number' ? m.band1 : null);
      if (band == null) continue;
      out.push({
        title: m.title || 'IELTS Writing Mock',
        band,
        checkedAt: m.timestamp || 0,
        level: 'Mock',
        content: [m.t1Content, m.t2Content].filter(Boolean).join('\n\n'),
        aiResult: m.aiResult2?.final || m.aiResult1?.final || null,
        fullCheck: m.aiResult2 || m.aiResult1,
        style: 'ielts',
        contentLang: m.contentLang || 'en',
        langLabel: m.langLabel || 'English',
        source: 'IELTS Writing Mock',
      });
    }
    return out.sort((a, b) => b.checkedAt - a.checkedAt).filter(matchLang);
  }, [savedEssaysMap, t1EssaysMap, t2EssaysMap, writingMockLog, matchLang]);

  const gradedSpeaking = useMemo(() => {
    const out: { topicKey: string; band: number; checkedAt: number; aiResult: any; transcript?: string; fullCheck?: any; style?: string; contentLang?: string; langLabel?: string; source?: string; question?: string; part?: string; audioKey?: string }[] = [];
    for (const [topicKey, arr] of Object.entries(speakingGraded) as [string, any[]][]) {
      for (const session of arr || []) {
        if (session?.result?.final?.overallScore != null) {
          out.push({
            topicKey,
            band: session.result.final.overallScore,
            checkedAt: session.result.checkedAt || 0,
            aiResult: session.result.final,
            transcript: session.transcript,
            fullCheck: session.result,
            style: session.result.style,
            contentLang: session.contentLang || session.result.contentLang,
            langLabel: session.langLabel || session.result.langLabel,
            source: 'Speaking Practice',
            audioKey: session.audioKey || ((speakingIdx[topicKey] || []).length
              ? `speak_blob_${topicKey}_${(speakingIdx[topicKey] || []).length - 1}`
              : undefined),
          });
        }
      }
    }
    for (const s of ieltsSpeakingLog) {
      if (s?.aiResult?.final?.overallScore != null) {
        out.push({
          topicKey: `${s.part || 'IELTS'} · ${s.topic || 'Speaking'}`,
          band: s.aiResult.final.overallScore,
          checkedAt: s.aiResult.checkedAt || s.practicedAt || 0,
          aiResult: s.aiResult.final,
          transcript: s.transcript,
          fullCheck: s.aiResult,
          style: s.aiResult.style || 'ielts',
          contentLang: s.contentLang || s.aiResult.contentLang || 'en',
          langLabel: s.langLabel || s.aiResult.langLabel || 'English',
          source: 'IELTS Speaking',
          question: s.question,
          part: s.part,
          audioKey: s.audioKey,
        });
      } else if (s?.practicedAt) {
        out.push({
          topicKey: `${s.part || 'IELTS'} · ${s.topic || 'Speaking'}`,
          band: 0,
          checkedAt: s.practicedAt,
          aiResult: null,
          transcript: s.transcript,
          fullCheck: null,
          style: 'ielts',
          contentLang: s.contentLang || 'en',
          langLabel: s.langLabel || 'English',
          source: 'IELTS Speaking',
          question: s.question,
          part: s.part,
          audioKey: s.audioKey,
        });
      }
    }
    return out.sort((a, b) => b.checkedAt - a.checkedAt).filter(matchLang);
  }, [speakingGraded, ieltsSpeakingLog, speakingIdx, matchLang]);

  const now      = Date.now();
  const filterMs = dashboardFilter === 'all' ? Infinity : (parseInt(String(dashboardFilter), 10) || 7) * 86400000;
  const minTs    = now - filterMs;
  const inRange  = (ts: number) => ts >= minTs;

  const gradedEssaysInRange = gradedEssays.filter(e => inRange(e.checkedAt));
  const gradedSpeakingScored = gradedSpeaking.filter(e => e.band > 0);
  const gradedSpeakingInRange = gradedSpeakingScored.filter(e => inRange(e.checkedAt));
  const avgWritingBandPeriod = gradedEssaysInRange.length > 0
    ? (gradedEssaysInRange.reduce((s, e) => s + e.band, 0) / gradedEssaysInRange.length).toFixed(1)
    : null;
  const avgSpeakingBandPeriod = gradedSpeakingInRange.length > 0
    ? (gradedSpeakingInRange.reduce((s, e) => s + e.band, 0) / gradedSpeakingInRange.length).toFixed(1)
    : null;
  const avgWritingBand = gradedEssays.length > 0
    ? (gradedEssays.reduce((s, e) => s + e.band, 0) / gradedEssays.length).toFixed(1)
    : null;
  const avgSpeakingBand = gradedSpeakingScored.length > 0
    ? (gradedSpeakingScored.reduce((s, e) => s + e.band, 0) / gradedSpeakingScored.length).toFixed(1)
    : null;

  const essayList   = Object.values(essays).filter((e: any) => e.content?.trim() && matchLang(e));
  const totalWords  = essayList.reduce((s: number, e: any) => s + (e.wordCount || 0), 0);
  const essaysByLevel = LEVELS.map(l => essayList.filter((e: any) => e.level === l).length);

  const speakingIdxFiltered = useMemo(() => {
    const out: Record<string, any[]> = {};
    for (const [k, arr] of Object.entries(speakingIdx) as [string, any[]][]) {
      const filtered = (arr || []).filter(matchLang);
      if (filtered.length) out[k] = filtered;
    }
    return out;
  }, [speakingIdx, matchLang]);
  const recordedTopics   = Object.keys(speakingIdxFiltered).length;
  const totalRecordings  = Object.values(speakingIdxFiltered).reduce((s: number, r: any[]) => s + r.length, 0);
  const speakingByLevel  = LEVELS.map(l =>
    Object.keys(speakingIdxFiltered).filter(k => k.startsWith(l + '__')).length
  );

  let pronSessions = 0, pronAccSum = 0, pronWords = 0;
  const pronHistory: any[] = [];
  Object.entries(history).forEach(([textId, recs]) => {
    (recs as any[]).forEach(r => {
      if (!matchLang(r)) return;
      pronHistory.push({ textId, ...r });
      if (inRange(r.timestamp)) {
        pronSessions++; pronAccSum += r.accuracy;
        for (const lvl of Object.keys(LEVEL_TEXTS)) {
          if (textId === 'custom-text') { pronWords += 50; break; }
          const t = LEVEL_TEXTS[lvl as keyof typeof LEVEL_TEXTS].find(x => x.id === textId);
          if (t) { pronWords += Math.round(t.text.split(/\s+/).length * r.accuracy / 100); break; }
        }
      }
    });
  });
  pronHistory.sort((a, b) => b.timestamp - a.timestamp);
  const avgAcc = pronSessions > 0 ? Math.round(pronAccSum / pronSessions) : 0;

  const crFiltered  = crLog.filter(c => inRange(c.timestamp));
  const crByLevel   = LEVELS.map(l => crFiltered.filter(c => c.level === l).length);
  const crAvgScore  = crFiltered.length > 0 ? Math.round(crFiltered.reduce((s, c) => s + (c.score / (c.total || 1)) * 100, 0) / crFiltered.length) : 0;

  const clFiltered  = clLog.filter(c => inRange(c.timestamp));
  const clByLevel   = LEVELS.map(l => clFiltered.filter(c => c.level === l).length);
  const clAvgScore  = clFiltered.length > 0 ? Math.round(clFiltered.reduce((s, c) => s + (c.score / (c.total || 1)) * 100, 0) / clFiltered.length) : 0;

  const ldFiltered  = ldLog.filter(c => inRange(c.timestamp));
  const ldByLevel   = LEVELS.map(l => ldFiltered.filter(c => c.level === l).length);
  const ldAvgScore  = ldFiltered.length > 0 ? Math.round(ldFiltered.reduce((s, c) => s + (c.score / (c.total || 1)) * 100, 0) / ldFiltered.length) : 0;

  const isFiltered  = isLog.filter(c => inRange(c.timestamp));
  const isByLevel   = LEVELS.map(l => isFiltered.filter(c => c.level === l).length);

  const exFiltered  = exercisesHistoryLang.filter((e: any) => inRange(e.timestamp));
  const vocabCount  = statsLang === 'all'
    ? discoverVocabLangs().reduce((s, l) => s + readVocabCountForLang(l), 0)
    : (statsLang === contentLang
        ? Object.keys(savedVocab).length
        : readVocabCountForLang(statsLang));

  /* Mistakes scoped to language via pronunciation session tags (legacy bag only for active lang / all). */
  const problemWordsScoped = useMemo(() => {
    const fromSessions = (recs: any[]) => {
      const map: Record<string, { count: number; lastMissed: number }> = {};
      for (const r of recs) {
        const words: string[] = Array.isArray(r.mistakeWords) ? r.mistakeWords : [];
        for (const w of words) {
          if (!w) continue;
          if (!map[w]) map[w] = { count: 0, lastMissed: 0 };
          map[w].count += 1;
          map[w].lastMissed = Math.max(map[w].lastMissed, r.timestamp || 0);
        }
      }
      return map;
    };
    if (statsLang === 'all') {
      const allRecs: any[] = [];
      Object.values(history || {}).forEach((recs: any) => {
        if (Array.isArray(recs)) allRecs.push(...recs);
      });
      const mapped = fromSessions(allRecs);
      return Object.keys(mapped).length > 0 ? mapped : problemWords;
    }
    const mapped = fromSessions(pronHistory);
    if (Object.keys(mapped).length > 0) return mapped;
    return statsLang === contentLang ? problemWords : {};
  }, [statsLang, contentLang, history, pronHistory, problemWords]);

  const totalActivities = pronSessions + essayList.length + recordedTopics + crFiltered.length + clFiltered.length + ldFiltered.length + isFiltered.length + exFiltered.length;
  const isEmpty = totalActivities === 0 && essayList.length === 0 && recordedTopics === 0 && vocabCount === 0;

  /* Languages for the dashboard filter — packs + any lang that already has activity/vocab */
  const availableStatsLangs = useMemo(() => {
    const set = new Set<ContentLang>();
    CONTENT_LANGS_WITH_PACKS.forEach(l => set.add(l));
    set.add(contentLang);
    discoverVocabLangs().forEach(l => set.add(l));
    const scan = (arr: any[]) => {
      for (const e of arr) {
        const lang = e?.contentLang || e?.aiCheckResult?.contentLang || e?.detail?.contentLang;
        if (isContentLang(lang)) set.add(lang);
      }
    };
    scan(crLogRaw); scan(clLogRaw); scan(ldLogRaw); scan(isLogRaw);
    scan(shadowingLogRaw); scan(writingMockLogRaw); scan(ieltsSpeakingLogRaw);
    scan(exercisesHistory || []);
    scan(Object.values(essays) as any[]);
    Object.values(history || {}).forEach((recs: any) => {
      if (Array.isArray(recs)) scan(recs);
    });
    for (const arr of Object.values(savedEssaysMap) as any[][]) scan(arr || []);
    for (const arr of Object.values(t1EssaysMap) as any[][]) scan(arr || []);
    for (const arr of Object.values(t2EssaysMap) as any[][]) scan(arr || []);
    for (const arr of Object.values(speakingGraded) as any[][]) scan(arr || []);
    for (const arr of Object.values(speakingIdx) as any[][]) scan(arr || []);
    return CONTENT_LANGS.filter(l => set.has(l));
  }, [
    contentLang, essays, crLogRaw, clLogRaw, ldLogRaw, isLogRaw, shadowingLogRaw,
    writingMockLogRaw, ieltsSpeakingLogRaw, exercisesHistory, history,
    savedEssaysMap, t1EssaysMap, t2EssaysMap, speakingGraded, speakingIdx,
  ]);

  /* ── History popup state ── */
  const [historyFilter, setHistoryFilter] = useState<'all'|'essay'|'speaking'|'reading'|'listening'|'dictation'|'story'|'exercise'|'pronunciation'>('all');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [detailAudioPlaying, setDetailAudioPlaying] = useState(false);
  const [detailAudioMissing, setDetailAudioMissing] = useState(false);
  const [listPlayingId, setListPlayingId] = useState<string | null>(null);
  const detailAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopDetailAudio = useCallback(() => {
    if (detailAudioRef.current) {
      detailAudioRef.current.pause();
      detailAudioRef.current = null;
    }
    setDetailAudioPlaying(false);
    setListPlayingId(null);
  }, []);

  const playDetailAudio = useCallback(async (opts: {
    audioKey?: string;
    textId?: string;
    timestamp?: number;
    entryId?: string;
  }) => {
    const { audioKey, textId, timestamp, entryId } = opts;
    setDetailAudioMissing(false);
    if (entryId && listPlayingId === entryId && detailAudioPlaying) {
      stopDetailAudio();
      return;
    }
    if (!entryId && detailAudioPlaying) {
      stopDetailAudio();
      return;
    }
    stopDetailAudio();
    try {
      let blob: Blob | undefined;
      if (audioKey) blob = await idbGet<Blob>(audioKey);
      if (!blob && textId && timestamp) blob = await idbGet<Blob>(`audio_${textId}_${timestamp}`);
      if (!blob && textId) {
        playHistoryAudio(textId, timestamp);
        if (entryId) setListPlayingId(entryId);
        return;
      }
      if (!blob) {
        setDetailAudioMissing(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      detailAudioRef.current = audio;
      setDetailAudioPlaying(true);
      if (entryId) setListPlayingId(entryId);
      audio.onended = () => {
        setDetailAudioPlaying(false);
        setListPlayingId(null);
        detailAudioRef.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setDetailAudioPlaying(false);
        setListPlayingId(null);
        detailAudioRef.current = null;
        URL.revokeObjectURL(url);
        setDetailAudioMissing(true);
      };
      await audio.play();
    } catch {
      setDetailAudioMissing(true);
      setDetailAudioPlaying(false);
      setListPlayingId(null);
    }
  }, [detailAudioPlaying, listPlayingId, playHistoryAudio, stopDetailAudio]);

  const downloadEntryAudio = useCallback(async (audioKey?: string, textId?: string, timestamp?: number) => {
    try {
      if (textId) {
        downloadAudio(textId, timestamp);
        return;
      }
      if (!audioKey) return;
      const blob = await idbGet<Blob>(audioKey);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smarty-recording-${timestamp || Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [downloadAudio]);

  useEffect(() => {
    if (!selectedEntry) {
      setDetailAudioMissing(false);
    }
  }, [selectedEntry]);

  // Build a unified chronological activity feed from all local sources
  const allHistory = useMemo(() => {
    type CriterionFull = {
      name: string;
      score: number;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      improvements?: { what_you_did?: string; what_you_could_have_done?: string; reason?: string }[];
      unavailable?: boolean;
    };
    type QDetail = {
      question?: string;
      options?: string[];
      correctIndex?: number;
      pickedIndex?: number;
      isCorrect?: boolean;
      expected?: string;
      actual?: string;
      word?: string;
    };
    type EntryDetail = {
      criterionScores?: Record<string, number>;
      criteriaFull?: CriterionFull[];
      generalFeedback?: string;
      strengths?: string[];
      improvements?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      transcript?: string;
      content?: string;
      levelLabel?: string;
      style?: string;
      mistakeWords?: string[];
      correctWords?: string[];
      wordStatuses?: { word: string; status: string }[];
      questions?: QDetail[];
      storyPath?: { step?: number; passage?: string; choice?: string; text?: string }[];
      correct?: number;
      total?: number;
      accuracy?: number;
      contentLang?: string;
      langLabel?: string;
      source?: string;
      question?: string;
      part?: string;
      /** IndexedDB key for speaking / pronunciation audio */
      audioKey?: string;
      textId?: string;
      hasAudio?: boolean;
      raw?: any;
    };
    type Entry = {
      id: string;
      type: 'essay'|'speaking'|'reading'|'listening'|'dictation'|'story'|'exercise'|'pronunciation';
      title: string;
      subtitle?: string;
      timestamp: number;
      score?: number;
      scoreLabel?: string;
      band?: number;
      langLabel?: string;
      detail?: EntryDetail;
    };
    const out: Entry[] = [];

    const withLang = (obj: any, detail: EntryDetail): EntryDetail => {
      const contentLang = obj?.contentLang || detail.contentLang || obj?.fullCheck?.contentLang || obj?.aiCheckResult?.contentLang;
      const langLabel = resolveLangLabel(contentLang, obj?.langLabel || detail.langLabel || obj?.fullCheck?.langLabel);
      return { ...detail, contentLang, langLabel };
    };

    const packAiDetail = (e: {
      fullCheck?: any; aiResult?: any; transcript?: string; content?: string; style?: string;
      contentLang?: string; langLabel?: string; source?: string; question?: string; part?: string;
      audioKey?: string;
    }): EntryDetail => {
      const criteria: CriterionFull[] = Array.isArray(e.fullCheck?.criteria)
        ? e.fullCheck.criteria.filter((c: any) => c && c.name)
        : [];
      const criterionScores: Record<string, number> = {};
      for (const c of criteria) {
        if (typeof c.score === 'number') criterionScores[c.name] = c.score;
      }
      const strengths = criteria.flatMap(c => c.strengths || []);
      const weaknesses = criteria.flatMap(c => c.weaknesses || []);
      const recommendations = criteria.flatMap(c => c.recommendations || []);
      return withLang(e, {
        criterionScores: Object.keys(criterionScores).length ? criterionScores : e.aiResult?.criterionScores,
        criteriaFull: criteria,
        generalFeedback: e.aiResult?.summary || e.aiResult?.generalFeedback,
        strengths,
        weaknesses,
        recommendations,
        improvements: e.aiResult?.topPriorities || e.aiResult?.improvements || [],
        transcript: e.transcript,
        content: e.content,
        levelLabel: e.aiResult?.levelLabel,
        style: e.style || e.fullCheck?.style,
        source: e.source,
        question: e.question,
        part: e.part,
        audioKey: e.audioKey,
        hasAudio: !!e.audioKey,
        raw: { fullCheck: e.fullCheck, aiResult: e.aiResult, transcript: e.transcript, content: e.content, source: e.source, question: e.question, part: e.part, audioKey: e.audioKey },
      });
    };

    // Graded essays (practice + Task 1/2 + mock with bands)
    gradedEssays.forEach((e, i) => {
      const detail = packAiDetail(e);
      out.push({
        id: `essay-${i}`, type: 'essay', title: e.title || 'Essay',
        subtitle: [e.source, e.level].filter(Boolean).join(' · ') || undefined,
        timestamp: e.checkedAt, band: e.band,
        scoreLabel: (e.style === 'ielts' || (e.source || '').includes('IELTS')) ? `Band ${e.band}` : `Score ${e.band}`,
        langLabel: detail.langLabel,
        detail,
      });
    });

    // Saved essays without AI check (Writing Practice / Task 1 / Task 2)
    const pushUngradedEssays = (map: Record<string, any[]>, source: string, idPrefix: string) => {
      for (const [topicKey, arr] of Object.entries(map)) {
        (arr || []).forEach((e: any, i: number) => {
          if (e?.aiCheckResult?.final?.overallScore != null) return;
          if (!matchLang(e)) return;
          const ts = e.createdAt || e.checkedAt || 0;
          if (!ts) return;
          const detail = withLang(e, {
            content: typeof e.content === 'string' ? e.content : undefined,
            source,
            raw: e,
          });
          out.push({
            id: `${idPrefix}-${topicKey}-${i}`,
            type: 'essay',
            title: e.title || e.promptTitle || e.categoryName || 'Essay',
            subtitle: [source, e.level || e.chartType || e.essayType].filter(Boolean).join(' · ') || undefined,
            timestamp: ts,
            scoreLabel: 'Saved',
            langLabel: detail.langLabel,
            detail,
          });
        });
      }
    };
    pushUngradedEssays(savedEssaysMap, 'Writing Practice', 'essay-saved');
    pushUngradedEssays(t1EssaysMap, 'IELTS Writing Task 1', 't1-saved');
    pushUngradedEssays(t2EssaysMap, 'IELTS Writing Task 2', 't2-saved');

    // Graded speaking (practice + IELTS)
    gradedSpeaking.forEach((e, i) => {
      const detail = packAiDetail(e);
      const hasBand = e.band > 0;
      const isIelts = e.style === 'ielts' || e.source === 'IELTS Speaking';
      out.push({
        id: `speaking-${i}`, type: 'speaking', title: e.topicKey.replace(/__/g, ' · #'),
        subtitle: e.source || undefined,
        timestamp: e.checkedAt,
        band: hasBand ? e.band : undefined,
        scoreLabel: hasBand ? (isIelts ? `Band ${e.band}` : `Score ${e.band}`) : 'Practiced',
        langLabel: detail.langLabel,
        detail,
      });
    });

    // General speaking recordings without AI (speaking_index_v2)
    {
      const gradedKeys = new Set(
        gradedSpeaking
          .filter(e => e.source === 'Speaking Practice')
          .map(e => e.audioKey)
          .filter(Boolean) as string[],
      );
      let speakIdx = 0;
      for (const [topicKey, arr] of Object.entries(speakingIdx) as [string, any[]][]) {
        (arr || []).forEach((rec: any, i: number) => {
          if (!matchLang(rec)) return;
          const audioKey = rec.audioKey || `speak_blob_${topicKey}_${(arr.length - 1 - i)}`;
          if (gradedKeys.has(audioKey)) return;
          const ts = typeof rec.timestamp === 'number'
            ? rec.timestamp
            : (rec.date ? Date.parse(rec.date) : 0);
          if (!ts || Number.isNaN(ts)) return;
          const detail = withLang(rec, {
            audioKey,
            hasAudio: true,
            source: 'Speaking Practice',
            raw: rec,
          });
          out.push({
            id: `speak-rec-${speakIdx++}`,
            type: 'speaking',
            title: String(topicKey).replace(/__/g, ' · #'),
            subtitle: 'Speaking Practice',
            timestamp: ts,
            scoreLabel: 'Practiced',
            langLabel: detail.langLabel,
            detail,
          });
        });
      }
    }

    // Comprehensive Reading
    crLog.forEach((c, i) => {
      if (c.timestamp) {
        const pct = Math.round((c.score / (c.total || 1)) * 100);
        const detail = withLang(c, {
          correct: c.score, total: c.total,
          questions: Array.isArray(c.details) ? c.details : undefined,
          raw: c,
        });
        out.push({
          id: `cr-${i}`, type: 'reading', title: c.title || 'Reading Passage', subtitle: c.level,
          timestamp: c.timestamp, score: pct, scoreLabel: `${c.score}/${c.total}`,
          langLabel: detail.langLabel, detail,
        });
      }
    });

    // Comprehensive Listening
    clLog.forEach((c, i) => {
      if (c.timestamp) {
        const pct = Math.round((c.score / (c.total || 1)) * 100);
        const detail = withLang(c, {
          correct: c.score, total: c.total,
          questions: Array.isArray(c.details) ? c.details : undefined,
          raw: c,
        });
        out.push({
          id: `cl-${i}`, type: 'listening', title: c.title || 'Listening Passage', subtitle: c.level,
          timestamp: c.timestamp, score: pct, scoreLabel: `${c.score}/${c.total}`,
          langLabel: detail.langLabel, detail,
        });
      }
    });

    // Audio Dictation
    ldLog.forEach((c, i) => {
      if (c.timestamp) {
        const pct = Math.round((c.score / (c.total || 1)) * 100);
        const detail = withLang(c, {
          correct: c.score, total: c.total,
          questions: Array.isArray(c.details) ? c.details : undefined,
          raw: c,
        });
        out.push({
          id: `ld-${i}`, type: 'dictation', title: c.title || c.label || 'Dictation', subtitle: c.level,
          timestamp: c.timestamp, score: pct, scoreLabel: `${c.score}/${c.total}`,
          langLabel: detail.langLabel, detail,
        });
      }
    });

    // Interactive Stories
    isLog.forEach((c, i) => {
      if (c.timestamp) {
        const path = Array.isArray(c.details) ? c.details : Array.isArray(c.path) ? c.path.map((h: any, idx: number) => ({ step: idx + 1, passage: h.text, choice: h.choice })) : undefined;
        const detail = withLang(c, { storyPath: path, raw: c });
        out.push({
          id: `is-${i}`, type: 'story', title: c.title || 'Interactive Story', subtitle: c.level,
          timestamp: c.timestamp, langLabel: detail.langLabel, detail,
        });
      }
    });

    // Exercises (+ IELTS Reading/Listening via recordExercise)
    exercisesHistoryLang.forEach((ex: any, i: number) => {
      if (ex.timestamp) {
        const mistakesArr = Array.isArray(ex.data?.mistakes) ? ex.data.mistakes : [];
        const mistakeCount = Array.isArray(ex.data?.mistakes) ? ex.data.mistakes.length : (typeof ex.data?.mistakes === 'number' ? ex.data.mistakes : 0);
        const totalFromQ = Array.isArray(ex.data?.questions) ? ex.data.questions.length : 0;
        const total = totalFromQ || ((ex.data?.score || 0) + mistakeCount) || ex.data?.total || undefined;
        const correct = typeof ex.data?.score === 'number' ? ex.data.score : (typeof ex.data?.correct === 'number' ? ex.data.correct : undefined);
        const pct = (typeof correct === 'number' && typeof total === 'number' && total > 0)
          ? Math.round((correct / total) * 100) : null;
        const qDetails = Array.isArray(ex.data?.questions) ? ex.data.questions : undefined;
        const detail = withLang(ex, {
          correct,
          total,
          mistakeWords: mistakesArr.filter((m: any) => typeof m === 'string'),
          correctWords: Array.isArray(ex.data?.correctWords) ? ex.data.correctWords : [],
          questions: qDetails,
          raw: ex,
        });
        const rawType = String(ex.type || 'exercise');
        let histType: Entry['type'] = 'exercise';
        let title = rawType.replace(/-/g, ' ');
        let subtitle: string | undefined;
        if (rawType === 'ielts-reading') {
          histType = 'reading';
          title = ex.data?.title || ex.data?.testTitle || 'IELTS Reading';
          subtitle = 'IELTS Reading';
        } else if (rawType === 'ielts-listening') {
          histType = 'listening';
          title = ex.data?.title || ex.data?.testTitle || 'IELTS Listening';
          subtitle = 'IELTS Listening';
        }
        out.push({
          id: `ex-${i}`, type: histType, title,
          subtitle,
          timestamp: ex.timestamp, score: pct ?? undefined,
          scoreLabel: pct !== null ? `${correct}/${total}` : (typeof correct === 'number' ? String(correct) : undefined),
          langLabel: detail.langLabel, detail,
        });
      }
    });

    // Pronunciation sessions (from history prop)
    pronHistory.forEach((r: any, i: number) => {
      if (r.timestamp) {
        let label = r.title || (r.textId === 'custom-text' ? 'Custom Text' : r.textId);
        if (!r.title) {
          for (const lvl of Object.keys(LEVEL_TEXTS)) {
            const t = LEVEL_TEXTS[lvl as keyof typeof LEVEL_TEXTS].find((x: any) => x.id === r.textId);
            if (t) { label = t.title; break; }
          }
        }
        const detail = withLang(r, {
          accuracy: r.accuracy,
          correctWords: Array.isArray(r.correctWords) ? r.correctWords : [],
          mistakeWords: Array.isArray(r.mistakeWords) ? r.mistakeWords : [],
          wordStatuses: Array.isArray(r.wordStatuses) ? r.wordStatuses : undefined,
          correct: r.attempted ? Math.round((r.accuracy / 100) * r.attempted) : undefined,
          total: r.totalWords || r.attempted,
          textId: r.textId,
          hasAudio: !!r.hasAudio,
          audioKey: r.hasAudio && r.textId && r.timestamp ? `audio_${r.textId}_${r.timestamp}` : undefined,
          raw: r,
        });
        out.push({
          id: `pron-${i}`, type: 'pronunciation', title: label,
          subtitle: r.level, timestamp: r.timestamp,
          score: r.accuracy, scoreLabel: `${r.accuracy}%`,
          langLabel: detail.langLabel, detail,
        });
      }
    });

    // Shadowing practice takes
    shadowingLog.forEach((s: any, i: number) => {
      if (!s?.timestamp) return;
      const detail = withLang(s, { raw: s });
      const secs = typeof s.durationMs === 'number' ? Math.round(s.durationMs / 1000) : undefined;
      out.push({
        id: `shadow-${i}`, type: 'speaking', title: s.title || 'Shadowing',
        subtitle: [s.level, secs != null ? `${secs}s` : null].filter(Boolean).join(' · ') || 'Shadowing',
        timestamp: s.timestamp,
        scoreLabel: 'Practiced',
        langLabel: detail.langLabel,
        detail,
      });
    });

    // Writing mock attempts (including those without AI bands yet)
    writingMockLog.forEach((m: any, i: number) => {
      if (!m?.timestamp) return;
      // Skip if already represented via gradedEssays (has a band)
      const hasBand = typeof m.band1 === 'number' || typeof m.band2 === 'number';
      if (hasBand) return;
      const detail = withLang(m, {
        content: [m.t1Content, m.t2Content].filter(Boolean).join('\n\n'),
        source: 'IELTS Writing Mock',
        raw: m,
      });
      out.push({
        id: `wmock-${i}`, type: 'essay', title: m.title || 'IELTS Writing Mock',
        subtitle: 'Mock exam',
        timestamp: m.timestamp,
        scoreLabel: 'Completed',
        langLabel: detail.langLabel,
        detail,
      });
    });

    return out.sort((a, b) => b.timestamp - a.timestamp);
  }, [gradedEssays, gradedSpeaking, savedEssaysMap, t1EssaysMap, t2EssaysMap, speakingIdx, crLog, clLog, ldLog, isLog, exercisesHistoryLang, pronHistory, shadowingLog, writingMockLog, LEVEL_TEXTS, matchLang]);

  const activityChartData = useMemo(() => {
    const days = dashboardFilter === 'all' ? 30 : Math.min(parseInt(String(dashboardFilter), 10) || 7, 30);
    const now = new Date();
    const buckets: { key: string; label: string; sessions: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({
        key,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sessions: 0,
      });
    }
    const byKey = new Map(buckets.map(b => [b.key, b]));
    const cutoff = Date.now() - days * 86400000;
    for (const entry of allHistory) {
      if (entry.timestamp < cutoff) continue;
      const key = new Date(entry.timestamp).toISOString().slice(0, 10);
      const bucket = byKey.get(key);
      if (bucket) bucket.sessions += 1;
    }
    return buckets;
  }, [allHistory, dashboardFilter]);

  const HISTORY_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
    essay:         { label: 'Writing',       icon: <PenLine className="w-4 h-4" />,    bg: 'bg-amber-100',  text: 'text-amber-600'  },
    speaking:      { label: 'Speaking',      icon: <Mic className="w-4 h-4" />,        bg: 'bg-rose-100',   text: 'text-rose-600'   },
    reading:       { label: 'Reading',       icon: <BookOpen className="w-4 h-4" />,   bg: 'bg-blue-100',   text: 'text-blue-600'   },
    listening:     { label: 'Listening',     icon: <Headphones className="w-4 h-4" />, bg: 'bg-teal-100',   text: 'text-teal-600'   },
    dictation:     { label: 'Dictation',     icon: <Volume2 className="w-4 h-4" />,    bg: 'bg-indigo-100', text: 'text-indigo-600' },
    story:         { label: 'Story',         icon: <BookOpen className="w-4 h-4" />,   bg: 'bg-purple-100', text: 'text-purple-600' },
    exercise:      { label: 'Exercise',      icon: <Brain className="w-4 h-4" />,      bg: 'bg-zinc-100',   text: 'text-zinc-600'   },
    pronunciation: { label: 'Pronunciation', icon: <Mic className="w-4 h-4" />,        bg: 'bg-emerald-100',text: 'text-emerald-600'},
  };

  /* ── Widget content renderer ── */
  const renderContent = (id: WidgetId): React.ReactNode => {
    switch (id) {

      case 'continue': {
        const streak = habit?.globalStreak?.current ?? 0;
        const xp = userProfile?.xp ?? 0;
        return (
          <div className="flex flex-col gap-2.5 lg:gap-4">
            {accountProfile && (
              <ProfileIdentityCard
                photoURL={user?.photoURL}
                displayName={accountProfile.displayName || user?.displayName}
                accountProfile={accountProfile}
                streak={streak}
                xp={xp}
                showEmail={false}
              />
            )}
            <div>
              <div className="text-[13px] font-bold text-slate-400 mb-2.5">Keep going</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {[
                  { label: 'Lessons', icon: '📖', bg: 'bg-emerald-50', color: 'text-emerald-700', go: () => setActiveTab('lessons') },
                  { label: 'Practice', icon: '🎧', bg: 'bg-sky-50', color: 'text-sky-700', go: () => setActiveTab('practice') },
                  { label: 'Vocabulary', icon: '📚', bg: 'bg-amber-50', color: 'text-amber-700', go: () => setActiveTab('vocabulary') },
                  { label: 'League', icon: '🏆', bg: 'bg-violet-50', color: 'text-violet-700', go: () => setActiveTab('gamification') },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.go}
                    className={`flex items-center gap-2 p-3.5 lg:p-4 rounded-xl ${item.bg} ${item.color} font-bold text-[13px] lg:text-[14px] text-left transition-transform active:scale-[0.99] hover:-translate-y-px`}
                  >
                    <span className="text-[20px] lg:text-[22px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'quick-actions':
        return (
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {([
              { tab: 'reading',      view: 'menu', label: 'Reading',    icon: <BookOpen className="w-5 h-5" />    },
              { tab: 'listening',    view: '',     label: 'Listening',  icon: <Headphones className="w-5 h-5" /> },
              { tab: 'speaking',     view: '',     label: 'Speaking',   icon: <Mic className="w-5 h-5" />        },
              { tab: 'writing',      view: '',     label: 'Writing',    icon: <PenLine className="w-5 h-5" />    },
              { tab: 'exercises',    view: '',     label: 'Exercises',  icon: <Brain className="w-5 h-5" />      },
              { tab: 'vocabulary',   view: '',     label: 'Vocabulary', icon: <GraduationCap className="w-5 h-5" /> },
            ] as { tab: string; view: string; label: string; icon: React.ReactNode }[]).map(({ tab, view, label, icon }) => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (view) setReadingView(view); }}
                className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:border-zinc-400 hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors text-slate-500">{icon}</div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        );

      case 'stat-cards': {
        const PERIODS: { id: typeof dashboardFilter | string; label: string }[] = [
          { id: '1', label: t('common.day') },
          { id: '7', label: t('common.7d') },
          { id: '30', label: t('common.30d') },
          { id: '365', label: t('common.year') },
          { id: 'all', label: t('common.allTime') },
        ];
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-100 text-zinc-600"><BarChart2 className="w-4 h-4" /></span>
                {t('dash.statistics')}
              </h2>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                {PERIODS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDashboardFilter(p.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      dashboardFilter === p.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >{p.label}</button>
                ))}
              </div>
            </div>
            <div className="px-4 pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Activity</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="sessions" name="Sessions" fill="#18181b" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      }

      case 'srs-review': {
        const due = dueSrsWords(savedVocab);
        return (
          <button
            type="button"
            onClick={() => {
              setSelectedVocabWords?.(() => due.slice(0, 40));
              try { localStorage.removeItem('exercise_session_v1'); } catch {}
              setActiveExercise?.('flashcards');
              setActiveTab('exercises');
            }}
            className={`${seCard} w-full p-4 lg:p-5 flex items-center gap-3.5 text-left hover:border-zinc-300 transition-colors`}
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SRS</div>
              <div className="font-bold text-zinc-900 text-[16px]">
                {due.length > 0 ? `${due.length} words due for review` : 'Spaced repetition'}
              </div>
              <div className="text-[12px] text-slate-400">Review saved words with flashcards</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        );
      }

      case 'league-xp': {
        const league = leagueMeta(userProfile?.league);
        const xp = userProfile?.xp ?? 0;
        return (
          <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('gamification')}
              className={`${seCard} p-4 lg:p-5 text-left hover:border-zinc-300 transition-colors`}
              style={{ background: league.soft }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4" style={{ color: league.ink }} />
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: league.ink }}>League</div>
              </div>
              <div className="font-extrabold text-[18px] lg:text-[22px] tracking-tight" style={{ color: league.ink }}>
                {league.label}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: league.ink, opacity: 0.75 }}>View rankings</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gamification')}
              className={`${seCard} p-4 lg:p-5 text-left hover:border-zinc-300 transition-colors`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">XP</div>
              </div>
              <div className="font-extrabold text-[18px] lg:text-[22px] tracking-tight text-zinc-900">
                {xp.toLocaleString()}
              </div>
              <div className="text-[12px] text-slate-400 mt-0.5">Total experience</div>
            </button>
          </div>
        );
      }

      case 'activity-history': {
        const filtered = historyFilter === 'all' ? allHistory : allHistory.filter(e => e.type === historyFilter);
        const FILTER_TABS: { id: typeof historyFilter; label: string }[] = [
          { id: 'all', label: 'All' },
          { id: 'essay', label: 'Writing' },
          { id: 'speaking', label: 'Speaking' },
          { id: 'pronunciation', label: 'Pronunciation' },
          { id: 'exercise', label: 'Exercises' },
          { id: 'reading', label: 'Reading' },
          { id: 'listening', label: 'Listening' },
          { id: 'dictation', label: 'Dictation' },
          ...(isEnglish ? [{ id: 'story' as const, label: 'IELTS' }] : []),
        ];
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900 text-white"><Clock className="w-4 h-4" /></span>
                {t('dash.activityHistory')}
              </h2>
              <p className="text-[11px] font-medium text-slate-400">
                {allHistory.length} {t('dash.sessions')}
              </p>
            </div>
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex gap-1.5 overflow-x-auto">
              {FILTER_TABS.map(tab => {
                const count = tab.id === 'all' ? allHistory.length : allHistory.filter(e => e.type === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryFilter(tab.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      historyFilter === tab.id ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 text-[10px] font-black ${historyFilter === tab.id ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 sm:p-6 space-y-3 max-h-[28rem] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 opacity-20 mx-auto mb-3" />
                  <p>No activity yet.</p>
                </div>
              ) : filtered.map((entry) => {
                const meta = HISTORY_META[entry.type];
                const pct = entry.score;
                const d = entry.detail || {};
                const canAudio = entry.type === 'speaking' || entry.type === 'pronunciation';
                const isPlaying = listPlayingId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3 hover:border-zinc-400 hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>{meta.icon}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 capitalize text-sm truncate">{entry.title}</p>
                        <p className="text-xs text-slate-400">
                          {meta.label}{entry.subtitle ? ` · ${entry.subtitle}` : ''}{entry.langLabel ? ` · ${entry.langLabel}` : ''} · {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canAudio && (
                        <>
                          <button
                            type="button"
                            title={isPlaying ? 'Stop' : 'Play recording'}
                            onClick={(e) => {
                              e.stopPropagation();
                              playDetailAudio({
                                audioKey: d.audioKey,
                                textId: d.textId,
                                timestamp: entry.timestamp,
                                entryId: entry.id,
                              });
                            }}
                            className={`p-2 rounded-xl border transition-colors ${
                              isPlaying
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-zinc-400 hover:text-zinc-900'
                            }`}
                          >
                            {isPlaying ? <X className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            title="Download recording"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadEntryAudio(d.audioKey, d.textId, entry.timestamp);
                            }}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {entry.scoreLabel && (
                        <div className={`px-3 py-1.5 rounded-lg font-black text-sm ${
                          (pct ?? (entry.band ? entry.band * 10 : 0)) >= 80 || (entry.band ?? 0) >= 7
                            ? 'bg-emerald-100 text-emerald-700'
                            : (pct ?? 0) >= 50 || (entry.band ?? 0) >= 5.5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}>{entry.scoreLabel}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="p-1 text-slate-300 group-hover:text-zinc-900 transition-colors"
                        title="Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'writing':
        return (
          <SectionCard title="Writing Practice" icon={<PenLine className="w-4 h-4" />} iconColor="bg-amber-100 text-amber-600"
            onNavigate={() => setActiveTab('writing')} navLabel="Write">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${essayList.length === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{essayList.length}</span>
              <span className="text-slate-400 font-medium">essays · {totalWords.toLocaleString()} words total</span>
              {avgWritingBand && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <Sparkles className="w-3 h-3" /> avg {avgWritingBand}
                </span>
              )}
            </div>
            <LevelBreakdown counts={essaysByLevel} />
            {gradedEssays.length > 0 && (
              <div className="mt-4 space-y-1.5 max-h-32 overflow-y-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Recent AI Reports</p>
                {gradedEssays.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate flex-1 mr-2">{e.title}</span>
                    <span className={`font-mono font-bold shrink-0 px-1.5 py-0.5 rounded ${e.band >= 7 ? 'bg-emerald-100 text-emerald-700' : e.band >= 5.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {e.band}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {essayList.length === 0 && <p className="text-slate-400 text-sm mt-4">No essays written yet.</p>}
          </SectionCard>
        );

      case 'speaking':
        return (
          <SectionCard title="Speaking Practice" icon={<Mic className="w-4 h-4" />} iconColor="bg-rose-100 text-rose-600"
            onNavigate={() => setActiveTab('speaking')} navLabel="Speak">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${recordedTopics === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{recordedTopics}</span>
              <span className="text-slate-400 font-medium">topics · {totalRecordings} recordings total</span>
              {avgSpeakingBand && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <Sparkles className="w-3 h-3" /> avg {avgSpeakingBand}
                </span>
              )}
            </div>
            <LevelBreakdown counts={speakingByLevel} />
            {gradedSpeaking.length > 0 && (
              <div className="mt-4 space-y-1.5 max-h-32 overflow-y-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Recent AI Reports ({gradedSpeaking.length})</p>
                {gradedSpeaking.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate flex-1 mr-2 font-mono">{e.topicKey.replace(/__/g, ' · #')}</span>
                    <span className={`font-mono font-bold shrink-0 px-1.5 py-0.5 rounded ${e.band >= 7 ? 'bg-emerald-100 text-emerald-700' : e.band >= 5.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {e.band}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {recordedTopics === 0 && <p className="text-slate-400 text-sm mt-4">No topics recorded yet.</p>}
          </SectionCard>
        );

      case 'comp-reading':
        return (
          <SectionCard title="Comprehensive Reading" icon={<BookOpen className="w-4 h-4" />} iconColor="bg-blue-100 text-blue-600"
            onNavigate={() => setActiveTab('comprehensive')} navLabel="Read">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${crFiltered.length === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{crFiltered.length}</span>
              <span className="text-slate-400 font-medium">passages{crFiltered.length > 0 ? ` · avg ${crAvgScore}%` : ''}</span>
            </div>
            <LevelBreakdown counts={crByLevel} />
            {crFiltered.length > 0 && (
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {crFiltered.slice(-5).reverse().map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate flex-1 mr-2">{c.title}</span>
                    <span className={`font-bold shrink-0 ${(c.score/c.total)>=0.8?'text-emerald-600':(c.score/c.total)>=0.5?'text-amber-600':'text-rose-600'}`}>{c.score}/{c.total}</span>
                  </div>
                ))}
              </div>
            )}
            {crFiltered.length === 0 && <p className="text-slate-400 text-sm mt-4">No passages completed yet.</p>}
          </SectionCard>
        );

      case 'comp-listening':
        return (
          <SectionCard title="Comprehensive Listening" icon={<Headphones className="w-4 h-4" />} iconColor="bg-teal-100 text-teal-600"
            onNavigate={() => setActiveTab('listening')} navLabel="Listen">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${clFiltered.length === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{clFiltered.length}</span>
              <span className="text-slate-400 font-medium">passages{clFiltered.length > 0 ? ` · avg ${clAvgScore}%` : ''}</span>
            </div>
            <LevelBreakdown counts={clByLevel} />
            {clFiltered.length > 0 && (
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {clFiltered.slice(-5).reverse().map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate flex-1 mr-2">{c.title}</span>
                    <span className={`font-bold shrink-0 ${(c.score/c.total)>=0.8?'text-emerald-600':(c.score/c.total)>=0.5?'text-amber-600':'text-rose-600'}`}>{c.score}/{c.total}</span>
                  </div>
                ))}
              </div>
            )}
            {clFiltered.length === 0 && <p className="text-slate-400 text-sm mt-4">No passages completed yet.</p>}
          </SectionCard>
        );

      case 'dictation':
        return (
          <SectionCard title="Audio Dictation" icon={<Volume2 className="w-4 h-4" />} iconColor="bg-indigo-100 text-indigo-600"
            onNavigate={() => setActiveTab('listening')} navLabel="Practice">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${ldFiltered.length === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{ldFiltered.length}</span>
              <span className="text-slate-400 font-medium">exercises{ldFiltered.length > 0 ? ` · avg ${ldAvgScore}%` : ''}</span>
            </div>
            <LevelBreakdown counts={ldByLevel} />
            {ldFiltered.length === 0 && <p className="text-slate-400 text-sm mt-4">No dictation exercises completed yet.</p>}
          </SectionCard>
        );

      case 'interactive-reading': {
        const ieltsReading = exercisesHistory.filter((e: any) =>
          e.type === 'ielts-reading' || e.data?.exerciseType === 'ielts-reading'
        ).filter(matchLang);
        const ieltsInRange = ieltsReading.filter((c: any) => inRange(c.timestamp));
        const avgBand = (() => {
          const bands = ieltsInRange.map((e: any) => e.data?.band).filter((b: any) => typeof b === 'number');
          if (!bands.length) return null;
          return Math.round((bands.reduce((a: number, b: number) => a + b, 0) / bands.length) * 10) / 10;
        })();
        return (
          <SectionCard title="IELTS Reading" icon={<BookOpen className="w-4 h-4" />} iconColor="bg-purple-100 text-purple-600"
            onNavigate={() => setActiveTab('ielts-reading')} navLabel="Take Test">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl font-black ${ieltsInRange.length === 0 ? 'text-slate-200' : 'text-slate-900'}`}>{ieltsInRange.length}</span>
              <span className="text-slate-400 font-medium">
                test{ieltsInRange.length !== 1 ? 's' : ''}
                {avgBand != null ? ` · avg band ${avgBand}` : ''}
              </span>
            </div>
            {ieltsInRange.length === 0 && <p className="text-slate-400 text-sm mt-4">No IELTS Reading tests taken yet.</p>}
            {ieltsInRange.slice(0, 3).map((e: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-t border-slate-50">
                <span className="text-slate-700 truncate">{e.data?.title || 'IELTS Reading'}</span>
                <span className="font-bold text-violet-600 shrink-0 ml-2">
                  {e.data?.score ?? '—'}/40{e.data?.band != null ? ` · ${e.data.band}` : ''}
                </span>
              </div>
            ))}
          </SectionCard>
        );
      }

      case 'pronunciation':
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600"><Mic className="w-4 h-4" /></span>
                Reading Pronunciation
              </h2>
              <button onClick={() => { setActiveTab('reading'); setReadingView('levels'); }} className="text-xs font-bold text-slate-400 hover:text-zinc-900 flex items-center gap-1 transition-colors">
                Practice <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Sessions',   val: pronSessions,                       cls: pronSessions === 0 ? 'text-slate-200' : 'text-slate-900' },
                  { label: 'Avg Accuracy', val: `${avgAcc}%`,                     cls: avgAcc === 0 ? 'text-slate-200' : 'text-emerald-600' },
                  { label: 'Words Read', val: pronWords.toLocaleString(),          cls: pronWords === 0 ? 'text-slate-200' : 'text-slate-900' },
                  { label: 'Mistakes',   val: Object.keys(problemWordsScoped).length,   cls: Object.keys(problemWordsScoped).length === 0 ? 'text-slate-200' : 'text-rose-600' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="text-center p-4 bg-slate-50 rounded-2xl">
                    <p className={`text-2xl md:text-3xl font-black ${cls}`}>{val}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
              {pronHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pronHistory.map((record, idx) => {
                    let textInfo: { level: string; title: string } | null = null;
                    for (const l of Object.keys(LEVEL_TEXTS)) {
                      const t = LEVEL_TEXTS[l as keyof typeof LEVEL_TEXTS].find(x => x.id === record.textId);
                      if (t) { textInfo = { level: l, title: t.title }; break; }
                    }
                    if (record.textId === 'custom-text') textInfo = { level: 'Custom', title: 'Your Custom Text' };
                    if (!textInfo) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{textInfo.level}</p>
                          <p className="font-bold text-slate-800 text-sm truncate">{textInfo.title}</p>
                          <p className="text-xs text-slate-400">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(record.timestamp))}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {record.hasAudio && (
                            <>
                              <button onClick={() => playHistoryAudio(record.textId, record.timestamp)} className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"><Play className="w-3.5 h-3.5" /></button>
                              <button onClick={() => downloadAudio(record.textId, record.timestamp)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          <div className={`px-3 py-1.5 rounded-lg border-2 ${record.accuracy >= 80 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            <span className="font-black text-sm">{record.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-slate-400 text-sm">No pronunciation sessions yet.</p>}
            </div>
          </div>
        );

      case 'mistakes':
        return Object.keys(problemWordsScoped).length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600"><AlertCircle className="w-4 h-4" /></span>
                Pronunciation Mistakes
              </h2>
            </div>
            <div className="p-6"><p className="text-slate-400 text-sm">No mistakes logged yet. Keep practising!</p></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600"><AlertCircle className="w-4 h-4" /></span>
                Pronunciation Mistakes
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setWordsToPracticePage(p => Math.max(1, p - 1))} disabled={wordsToPracticePage === 1}
                  className="p-1 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"><ArrowLeft className="w-4 h-4" /></button>
                <span className="text-sm font-bold text-slate-500">{wordsToPracticePage} / {Math.ceil(Object.keys(problemWordsScoped).length / 6) || 1}</span>
                <button onClick={() => setWordsToPracticePage(p => Math.min(Math.ceil(Object.keys(problemWordsScoped).length / 6), p + 1))}
                  disabled={wordsToPracticePage >= Math.ceil(Object.keys(problemWordsScoped).length / 6)}
                  className="p-1 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(problemWordsScoped as Record<string, { count: number; lastMissed: number }>)
                .sort((a, b) => b[1].count - a[1].count)
                .slice((wordsToPracticePage - 1) * 6, wordsToPracticePage * 6)
                .map(([word, data]) => (
                  <React.Fragment key={word}>
                    <DashboardWordCard word={word} data={data} type="practice"
                      playWord={playWord} practicingWord={practicingWord}
                      startPracticeWord={startPracticeWord} allVocabMap={allVocabMap} />
                  </React.Fragment>
                ))}
            </div>
          </div>
        );

      case 'exercises':
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-100 text-zinc-600"><Brain className="w-4 h-4" /></span>
                Exercise History
              </h2>
              <select value={exerciseProgressFilter} onChange={e => setExerciseProgressFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em', paddingRight: '2.5rem' }}>
                {['all','flashcards','definition-quiz','listening-match','true-false-quiz','memory-match','word-match','spelling-practice','pronunciation','word-scramble'].map(f => (
                  <option key={f} value={f}>{f === 'all' ? 'All Exercises' : f === 'definition-quiz' ? 'Quiz' : f === 'listening-match' ? 'Listening' : f.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {exercisesHistoryLang
                .filter((ex: any) => exerciseProgressFilter === 'all' || ex.type === exerciseProgressFilter)
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .map((ex: any, i: number) => {
                  const total = (ex.data?.score || 0) + (Array.isArray(ex.data?.mistakes) ? ex.data.mistakes.length : (ex.data?.mistakes || 0));
                  const pct = total > 0 ? Math.round((ex.data?.score || 0) / total * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {ex.type === 'flashcards' ? <BookOpen className="w-4 h-4 text-slate-500" /> : ex.type === 'pronunciation' ? <Mic className="w-4 h-4 text-slate-500" /> : <Brain className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 capitalize text-sm">{ex.type.replace(/-/g, ' ')}</p>
                          <p className="text-xs text-slate-400">{new Date(ex.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400">Score</p>
                          <p className="font-black text-slate-900 text-sm">{ex.data?.score || 0}/{total}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg font-black text-sm ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              {exercisesHistoryLang.filter((ex: any) => exerciseProgressFilter === 'all' || ex.type === exerciseProgressFilter).length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Brain className="w-8 h-8 opacity-20 mx-auto mb-3" />
                  <p>No exercise history yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Widget wrapper: returns a drag-enabled div (plain function, not component) ── */
  const wrapWidget = (id: WidgetId, content: React.ReactNode) => {
    const isDragging = dragId === id;
    const isOver     = dragOverId === id && dragId !== id;
    return (
      <div
        key={id}
        draggable={editMode}
        onDragStart={editMode ? (e: React.DragEvent) => onDragStart(e, id) : undefined}
        onDragEnter={editMode ? (e: React.DragEvent) => onDragEnter(e, id) : undefined}
        onDragLeave={editMode ? onDragLeave : undefined}
        onDragOver={editMode ? onDragOver : undefined}
        onDrop={editMode ? (e: React.DragEvent) => onDrop(e, id) : undefined}
        onDragEnd={editMode ? onDragEnd : undefined}
        className={`relative transition-all duration-200 ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 rounded-3xl' : ''}`}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-zinc-900 text-white rounded-xl px-3 py-1.5 shadow-lg cursor-grab active:cursor-grabbing select-none">
          <GripVertical className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{WIDGET_META[id].label}</span>
        </div>
        <button
          onClick={() => hideWidget(id)}
          className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="mt-6">{content}</div>
      </div>
    );
  };

  /* ── Render ordered widgets ── */
  const enOnlyWidgets = new Set<WidgetId>(['interactive-reading']);
  const visibleIds = effectiveLayout.order.filter((id): id is WidgetId =>
    !effectiveLayout.hidden.includes(id as WidgetId) && (isEnglish || !enOnlyWidgets.has(id as WidgetId))
  );

  // Group consecutive MEDIUM widgets for 2-col layout in view mode
  const renderWidgets = () => {
    if (editMode) {
      return visibleIds.map(id => wrapWidget(id, renderContent(id)));
    }

    const result: React.ReactNode[] = [];
    let mediumGroup: WidgetId[] = [];

    const flushGroup = () => {
      if (!mediumGroup.length) return;
      if (mediumGroup.length === 1) {
        result.push(<div key={mediumGroup[0]}>{renderContent(mediumGroup[0])}</div>);
      } else {
        result.push(
          <div key={mediumGroup.join('-')} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mediumGroup.map(id => <div key={id}>{renderContent(id)}</div>)}
          </div>
        );
      }
      mediumGroup = [];
    };

    for (const id of visibleIds) {
      if (MEDIUM.has(id)) { mediumGroup.push(id); }
      else { flushGroup(); result.push(<div key={id}>{renderContent(id)}</div>); }
    }
    flushGroup();
    return result;
  };

  /* ── Render ── */
  const beginnerCert = loadCertificateMeta(contentLang, 'Beginner');

  const shellClass = embedded
    ? 'w-full'
    : 'flex-1 w-full bg-white dark:bg-zinc-950';
  const innerClass = embedded
    ? 'w-full flex flex-col gap-4'
    : 'mx-auto w-full max-w-[480px] lg:max-w-[760px] xl:max-w-[860px] px-4 pt-5 pb-8 lg:px-8 lg:pt-10 lg:pb-14 flex flex-col gap-2.5 lg:gap-4';

  return (
    <main className={shellClass}>
      <div className={innerClass}>

        {isHome && beginnerCert?.awarded && (
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold"
          >
            <Award className="w-4 h-4" /> Beginner Certificate earned
          </button>
        )}

        {isHome && (
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold text-slate-500 bg-slate-100"
              >
                <Languages className="w-3.5 h-3.5" />
                {statsLang === 'all' ? 'All languages' : CONTENT_LANG_NATIVE[statsLang]}
              </button>
              {langMenuOpen && (
                <>
                  <button type="button" aria-label="Close" className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 min-w-[10rem] rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                    <button type="button" onClick={() => { setStatsLang('all'); setLangMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold ${statsLang === 'all' ? 'bg-zinc-900 text-white' : 'text-slate-700'}`}>All languages</button>
                    {availableStatsLangs.map(l => (
                      <button key={l} type="button" onClick={() => { setStatsLang(l); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm font-semibold ${statsLang === l ? 'bg-zinc-900 text-white' : 'text-slate-700'}`}>{CONTENT_LANG_NATIVE[l]}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-zinc-900 hover:border-zinc-400 shadow-sm transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        )}

        {/* Full (legacy customize) header */}
        {isFull && (
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-[22px] font-serif font-black text-zinc-900 tracking-tight mb-1.5">
                Keep learning
              </h1>
              <p className="text-slate-500 text-base md:text-lg">
                {statsLang === 'all'
                  ? 'Pick up where you left off — then check your progress.'
                  : `${CONTENT_LANG_NATIVE[statsLang]} only — stats and activity for this language.`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setLangMenuOpen(v => !v); setEditMode(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all shadow-sm ${
                    langMenuOpen || statsLang !== 'all'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  <Languages className="w-4 h-4" />
                  <span className="max-w-[9rem] truncate">
                    {statsLang === 'all' ? 'All languages' : CONTENT_LANG_NATIVE[statsLang]}
                  </span>
                </button>
                {langMenuOpen && (
                  <>
                    <button type="button" aria-label="Close language menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-40 min-w-[11rem] max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                      <button type="button" onClick={() => { setStatsLang('all'); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors ${statsLang === 'all' ? 'bg-zinc-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>All languages</button>
                      {availableStatsLangs.map(l => (
                        <button key={l} type="button" onClick={() => { setStatsLang(l); setLangMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors ${statsLang === l ? 'bg-zinc-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>{CONTENT_LANG_NATIVE[l]}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => { setEditMode(m => !m); setLangMenuOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all shadow-sm ${
                  editMode ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-slate-600 border-slate-200 hover:border-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                {editMode ? t('action.done') : t('action.customize')}
              </button>
            </div>
          </header>
        )}

        {isFull && editMode && (
          <div className="bg-zinc-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">Layout Edit Mode</p>
              <p className="text-zinc-400 text-xs mt-0.5">Drag widgets to reorder • Click × to hide • Add hidden widgets below</p>
            </div>
            <button onClick={resetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Layout
            </button>
          </div>
        )}

        {/* Empty state — profile only (home always shows Continue) */}
        {isProfile && isEmpty && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <BarChart2 className="w-8 h-8 text-zinc-300" />
            </div>
            <h2 className="text-xl font-serif font-black text-zinc-900 tracking-tight mb-2">No activity yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Complete a lesson or practice session to see stats here.
            </p>
            <button onClick={() => setActiveTab('lessons')}
              className="px-5 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black transition-colors inline-flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Start learning
            </button>
          </div>
        )}

        {/* Widgets */}
        {!(isProfile && isEmpty) && renderWidgets()}

        {isFull && editMode && layout.hidden.length > 0 && (
          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Hidden Widgets — click to restore
            </p>
            <div className="flex flex-wrap gap-3">
              {layout.hidden.filter(id => isEnglish || id !== 'interactive-reading').map(id => (
                <button
                  key={id}
                  onClick={() => showWidget(id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:border-zinc-400 hover:text-zinc-900 hover:shadow-sm transition-all group"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-zinc-900 transition-colors">
                    {WIDGET_META[id].icon}
                  </span>
                  {WIDGET_META[id].label}
                  <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Activity detail (in-depth) ── */}
      {selectedEntry && (() => {
        const entry = selectedEntry;
        const meta = HISTORY_META[entry.type];
        const fmt2 = (ts: number) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
        const scorePct = entry.score ?? (entry.band
          ? Math.round((entry.band / ((entry.detail?.style === 'ielts') ? 9 : 10)) * 100)
          : undefined);
        const scoreColorClass = scorePct !== undefined
          ? scorePct >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : scorePct >= 55 ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-rose-100 text-rose-700 border-rose-200'
          : '';
        const d = entry.detail || {};
        const criteriaFull = Array.isArray(d.criteriaFull) ? d.criteriaFull : [];
        const hasCriteria = criteriaFull.length > 0 || (d.criterionScores && Object.keys(d.criterionScores).length > 0);
        const incorrect = (d.correct != null && d.total != null) ? d.total - d.correct : null;
        const scoreMax = d.style === 'ielts' ? 9 : 10;
        const close = () => setSelectedEntry(null);

        const ListBlock = ({ title, color, items }: { title: string; color: 'emerald' | 'amber' | 'rose' | 'indigo'; items: string[] }) => {
          if (!items?.length) return null;
          const styles = {
            emerald: { label: 'text-emerald-600', box: 'bg-emerald-50 border-emerald-100', badge: 'bg-emerald-500', text: 'text-emerald-900' },
            amber: { label: 'text-amber-600', box: 'bg-amber-50 border-amber-100', badge: 'bg-amber-500', text: 'text-amber-900' },
            rose: { label: 'text-rose-500', box: 'bg-rose-50 border-rose-100', badge: 'bg-rose-500', text: 'text-rose-900' },
            indigo: { label: 'text-indigo-600', box: 'bg-indigo-50 border-indigo-100', badge: 'bg-indigo-500', text: 'text-indigo-900' },
          }[color];
          return (
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${styles.label} mb-2`}>{title}</p>
              <div className="space-y-2">
                {items.map((s, i) => (
                  <div key={i} className={`flex items-start gap-2.5 border rounded-xl p-3 ${styles.box}`}>
                    <span className={`w-5 h-5 ${styles.badge} rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5`}>·</span>
                    <p className={`text-sm leading-relaxed ${styles.text}`}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={close}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${meta.text}`}>{meta.label}{entry.subtitle ? ` · ${entry.subtitle}` : ''}</p>
                  <p className="font-bold text-zinc-900 text-sm capitalize truncate leading-tight">{entry.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmt2(entry.timestamp)}</p>
                </div>
                {(entry.langLabel || d.langLabel) && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 shrink-0">
                    {entry.langLabel || d.langLabel}
                  </div>
                )}
                {entry.scoreLabel && (
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-black border shrink-0 ${scoreColorClass}`}>
                    {entry.scoreLabel}
                  </div>
                )}
                <button type="button" onClick={close} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 min-h-0 p-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.language')}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{entry.langLabel || d.langLabel || 'Unknown'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.type')}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{meta.label}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.when')}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.score')}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{entry.scoreLabel || '—'}</p>
                  </div>
                </div>

                {(d.source || d.part || d.question) && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                    {d.source && <p className="text-sm text-slate-700"><span className="font-bold">Source:</span> {d.source}</p>}
                    {d.part && <p className="text-sm text-slate-700"><span className="font-bold">Part:</span> {d.part}</p>}
                    {d.question && <p className="text-sm text-slate-700"><span className="font-bold">Prompt:</span> {d.question}</p>}
                  </div>
                )}

                {(entry.type === 'speaking' || entry.type === 'pronunciation') && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.recording')}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {entry.type === 'speaking' ? 'Your speaking audio' : 'Your pronunciation audio'}
                      </p>
                      {detailAudioMissing && (
                        <p className="text-xs text-rose-500 mt-1">No recording found for this session.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => playDetailAudio({
                          audioKey: d.audioKey,
                          textId: d.textId,
                          timestamp: entry.timestamp,
                          entryId: entry.id,
                        })}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                          detailAudioPlaying && listPlayingId === entry.id
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-zinc-900 text-white hover:bg-black'
                        }`}
                      >
                        {detailAudioPlaying && listPlayingId === entry.id ? <><X className="w-4 h-4" /> {t('action.stop')}</> : <><Play className="w-4 h-4" /> {t('action.play')}</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadEntryAudio(d.audioKey, d.textId, entry.timestamp)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                        title={t('action.download')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {(entry.type === 'essay' || entry.type === 'speaking') && (
                  <>
                    {entry.band != null && (
                      <div className={`flex items-center gap-5 p-5 rounded-2xl border ${entry.band >= 7 ? 'bg-emerald-50 border-emerald-100' : entry.band >= 5.5 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className={`text-6xl font-black tracking-tighter leading-none ${entry.band >= 7 ? 'text-emerald-600' : entry.band >= 5.5 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {entry.band}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Overall Score</p>
                          <p className={`text-base font-black ${entry.band >= 7 ? 'text-emerald-700' : entry.band >= 5.5 ? 'text-amber-700' : 'text-rose-600'}`}>
                            {d.levelLabel || (entry.band >= 8.5 ? 'Expert' : entry.band >= 7.5 ? 'Very Good' : entry.band >= 7 ? 'Good' : entry.band >= 6 ? 'Competent' : entry.band >= 5 ? 'Modest' : 'Limited')}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{d.style === 'ielts' ? (entry.type === 'essay' ? 'IELTS Writing' : 'IELTS Speaking') : 'Practice check'} · out of {scoreMax}</p>
                        </div>
                      </div>
                    )}

                    {d.generalFeedback && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Overall Feedback</p>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-sm text-slate-700 leading-relaxed">{d.generalFeedback}</p>
                        </div>
                      </div>
                    )}

                    <ListBlock title="Fix these next" color="rose" items={d.improvements || []} />

                    {criteriaFull.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criterion Breakdown</p>
                        {criteriaFull.map((c: any) => {
                          const num = typeof c.score === 'number' ? c.score : 0;
                          const pct = Math.round((num / scoreMax) * 100);
                          const color = num >= 7 ? 'bg-emerald-500' : num >= 5.5 ? 'bg-amber-400' : 'bg-rose-400';
                          const badge = num >= 7 ? 'bg-emerald-100 text-emerald-700' : num >= 5.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
                          return (
                            <div key={c.name} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                              <div className="flex justify-between items-center gap-3">
                                <span className="text-sm font-bold text-slate-800">{c.name}{c.unavailable ? ' (n/a)' : ''}</span>
                                {!c.unavailable && <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${badge}`}>{num}</span>}
                              </div>
                              {!c.unavailable && (
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                              )}
                              {(c.strengths || []).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Strengths</p>
                                  <ul className="space-y-1">{(c.strengths as string[]).map((s, i) => <li key={i} className="text-sm text-slate-700">· {s}</li>)}</ul>
                                </div>
                              )}
                              {(c.weaknesses || []).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">Weaknesses</p>
                                  <ul className="space-y-1">{(c.weaknesses as string[]).map((s, i) => <li key={i} className="text-sm text-slate-700">· {s}</li>)}</ul>
                                </div>
                              )}
                              {(c.recommendations || []).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">Recommendations</p>
                                  <ul className="space-y-1">{(c.recommendations as string[]).map((s, i) => <li key={i} className="text-sm text-slate-700">· {s}</li>)}</ul>
                                </div>
                              )}
                              {(c.improvements || []).length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Rewrites</p>
                                  {(c.improvements as any[]).map((imp, i) => (
                                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                                      {imp.what_you_did && <p className="text-xs text-rose-700"><span className="font-bold">You wrote:</span> “{imp.what_you_did}”</p>}
                                      {imp.what_you_could_have_done && <p className="text-xs text-emerald-700"><span className="font-bold">Better:</span> “{imp.what_you_could_have_done}”</p>}
                                      {imp.reason && <p className="text-[11px] text-slate-500">{imp.reason}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : hasCriteria && d.criterionScores ? (
                      <div className="bg-white rounded-2xl border border-slate-100 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Criterion Breakdown</p>
                        <div className="space-y-4">
                          {Object.entries(d.criterionScores as Record<string, number>).map(([key, val]) => {
                            const num = typeof val === 'number' ? val : Number(val) || 0;
                            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim();
                            const pct = Math.round((num / scoreMax) * 100);
                            const color = num >= 7 ? 'bg-emerald-500' : num >= 5.5 ? 'bg-amber-400' : 'bg-rose-400';
                            const badge = num >= 7 ? 'bg-emerald-100 text-emerald-700' : num >= 5.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
                            return (
                              <div key={key}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs font-bold text-slate-700">{label}</span>
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${badge}`}>{num}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <ListBlock title="Strengths" color="emerald" items={d.strengths || []} />
                    <ListBlock title="Weaknesses" color="amber" items={d.weaknesses || []} />
                    <ListBlock title="Recommendations" color="indigo" items={d.recommendations || []} />

                    {entry.type === 'speaking' && d.transcript && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transcript</p>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{d.transcript}"</p>
                        </div>
                      </div>
                    )}

                    {entry.type === 'essay' && d.content && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Essay</p>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-64 overflow-y-auto">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{d.content}</p>
                        </div>
                      </div>
                    )}

                    {!hasCriteria && !d.generalFeedback && !d.strengths?.length && entry.band == null && (
                      <div className="py-8 text-center text-slate-400">
                        <Sparkles className="w-8 h-8 opacity-20 mx-auto mb-3" />
                        <p className="text-sm">No AI feedback available for this session.</p>
                      </div>
                    )}
                  </>
                )}

                {entry.type === 'exercise' && (
                  <>
                    {d.correct != null && d.total != null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                          <p className="text-3xl font-black text-emerald-600">{d.correct}</p>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Correct</p>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                          <p className="text-3xl font-black text-rose-500">{incorrect ?? 0}</p>
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mt-1">Incorrect</p>
                        </div>
                        {entry.score != null && (
                          <div className={`p-4 rounded-2xl border text-center ${scoreColorClass}`}>
                            <p className="text-3xl font-black">{entry.score}%</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider mt-1">Score</p>
                          </div>
                        )}
                      </div>
                    )}
                    {d.correctWords?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Correct Words ({d.correctWords.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.correctWords.map((w: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold capitalize">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.mistakeWords?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Incorrect Words ({d.mistakeWords.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.mistakeWords.map((w: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold capitalize">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(d.questions) && d.questions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question details</p>
                        {d.questions.map((q: any, i: number) => (
                          <div key={i} className={`rounded-xl border p-3 ${q.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <p className="text-sm font-bold text-slate-800">{q.question || q.word || `Item ${i + 1}`}</p>
                            {q.expected != null && <p className="text-xs text-slate-500 mt-1">Expected: {q.expected}</p>}
                            {q.actual != null && <p className="text-xs text-slate-500">Your answer: {q.actual}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {d.correct == null && !d.correctWords?.length && !d.questions?.length && (
                      <div className="py-8 text-center text-slate-400">
                        <Brain className="w-8 h-8 opacity-20 mx-auto mb-3" />
                        <p className="text-sm">Session recorded.</p>
                      </div>
                    )}
                  </>
                )}

                {(entry.type === 'reading' || entry.type === 'listening' || entry.type === 'dictation') && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-3xl font-black text-emerald-600">{d.correct ?? '—'}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Correct</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-3xl font-black text-slate-500">{d.total != null && d.correct != null ? d.total - d.correct : '—'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Wrong</p>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-2xl text-center">
                        <p className="text-3xl font-black text-white">{d.total ?? '—'}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Total</p>
                      </div>
                    </div>
                    {entry.score != null && (
                      <div className={`p-5 rounded-2xl border text-center ${scoreColorClass}`}>
                        <p className="text-5xl font-black">{entry.score}%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Final Score</p>
                      </div>
                    )}
                    {Array.isArray(d.questions) && d.questions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Per-question detail</p>
                        {d.questions.map((q: any, i: number) => (
                          <div key={i} className={`rounded-xl border p-3 space-y-2 ${q.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-slate-800">{q.question || `Question ${i + 1}`}</p>
                              <span className={`text-[10px] font-black uppercase shrink-0 ${q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{q.isCorrect ? 'Correct' : 'Wrong'}</span>
                            </div>
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <ul className="space-y-1">
                                {q.options.map((opt: string, oi: number) => {
                                  const isCorrect = oi === q.correctIndex;
                                  const isPicked = oi === q.pickedIndex;
                                  return (
                                    <li key={oi} className={`text-xs rounded-lg px-2 py-1 ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-bold' : isPicked ? 'bg-rose-100 text-rose-800' : 'text-slate-600'}`}>
                                      {opt}{isCorrect ? ' ✓' : ''}{isPicked && !isCorrect ? ' (your pick)' : ''}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            {q.expected != null && <p className="text-xs text-slate-600"><span className="font-bold">Expected:</span> {q.expected}</p>}
                            {q.actual != null && <p className="text-xs text-slate-600"><span className="font-bold">You wrote:</span> {q.actual}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {(!d.questions || d.questions.length === 0) && (
                      <p className="text-xs text-slate-400 text-center">Question-level detail is saved for new sessions going forward.</p>
                    )}
                  </>
                )}

                {entry.type === 'pronunciation' && (
                  <div className="space-y-4">
                    <div className={`p-6 rounded-2xl border text-center ${(d.accuracy ?? entry.score ?? 0) >= 80 ? 'bg-emerald-50 border-emerald-100' : (d.accuracy ?? entry.score ?? 0) >= 60 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                      <p className={`text-6xl font-black ${(d.accuracy ?? entry.score ?? 0) >= 80 ? 'text-emerald-600' : (d.accuracy ?? entry.score ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {d.accuracy ?? entry.score ?? '—'}%
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Pronunciation Accuracy</p>
                      {(d.correct != null || d.total != null) && (
                        <p className="text-sm text-slate-500 mt-2">{d.correct ?? '—'} / {d.total ?? '—'} words attempted</p>
                      )}
                    </div>
                    {d.correctWords?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Correct ({d.correctWords.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.correctWords.map((w: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold capitalize">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.mistakeWords?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Missed ({d.mistakeWords.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.mistakeWords.map((w: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold capitalize">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(d.wordStatuses) && d.wordStatuses.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Word-by-word</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.wordStatuses.map((w: any, i: number) => (
                            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              w.status === 'correct' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : w.status === 'incorrect' ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>{w.word}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {entry.type === 'story' && (
                  <div className="space-y-4">
                    <div className="py-4 text-center space-y-2">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="font-bold text-slate-700">Session completed</p>
                      {entry.subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{entry.subtitle} Level</p>}
                    </div>
                    {Array.isArray(d.storyPath) && d.storyPath.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your path</p>
                        {d.storyPath.map((step: any, i: number) => (
                          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Step {step.step || i + 1}</p>
                            {(step.passage || step.text) && <p className="text-sm text-slate-700">{step.passage || step.text}</p>}
                            {step.choice && <p className="text-xs font-bold text-slate-500">Choice: {step.choice}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
}

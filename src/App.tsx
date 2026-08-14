import { useVosk, isMobileDevice } from './hooks/useVosk';
import { useAppRoute } from './hooks/useAppRoute';
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { CheckCircle2, Clock, Volume2, X, BookOpen, Home, Play, XCircle, Download, StopCircle, Loader2, Pencil } from 'lucide-react';
import { accountTypeOf, isFreeUser, isPreviewMode, canPractice, ACCOUNT_TYPE_LABEL } from './lib/access';
import { Level, ReadingText, alignWords, isMatch, cleanSpeechToken } from './lib/reading-logic';
import { tokenizeForLang, normalizeForMatch } from './lib/pronunciationProfile';
import { loadLevelTexts, EMPTY_LEVEL_TEXTS, type LevelTexts } from './data/levelTexts';
import { logActivity } from './lib/activity-tracker';
import { get, set } from 'idb-keyval';
import { calculateSM2 } from './lib/srs';
import { useFirebaseSync } from './useFirebaseSync';
import { AuthGate } from './features/AuthGate';
import { Onboarding } from './features/Onboarding';
import { PaywallScreen } from './components/PaywallScreen';
import { playSound } from './lib/audio';
import { WordDetailsModal } from './components/WordDetailsModal';
import { playWord as sharedPlayWord } from './lib/speech';
import { lookupDictionary } from './lib/dictionary';
import { EN_ONLY_TABS, vocabStorageKey, type ContentLang } from './lib/contentLang';
import { activityLangStamp, sessionsForLang } from './lib/activityMeta';
import {
  saveReadingSession,
  clearReadingSession,
  saveAssignmentExerciseResume,
  clearAssignmentExerciseResume,
  loadAssignmentExerciseResume,
} from './lib/midSession';
import { bumpWeeklyGoal, trackExerciseStreak } from './lib/weeklyGoals';
import { requestExerciseResume, loadExerciseSession } from './lib/exerciseSession';
import { readScopedJSON, writeScopedJSON } from './lib/userStorage';
import { recordCompletion, bandFromScore40 } from './lib/completions';
import {
  type HabitState,
  emptyHabit,
  normalizeHabit,
  applyXpToHabit,
  leagueForXp,
  levelForXp,
  unlockBadge,
  DAILY_GOAL_XP,
} from './lib/habitEngine';
import Sidebar from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { EditModeProvider, useEditMode } from './contexts/EditModeContext';
import { useContentLang } from './contexts/ContentLangContext';
import { useUiLang } from './contexts/UiLangContext';
import { loadVocab, lookupWord, vocabDbEnabled } from './lib/vocabDb';
import { ContentEditorDrawer } from './components/ContentEditorDrawer';
import { AppTopBar } from './components/AppTopBar';
import { HabitCelebrateModal } from './components/HabitCelebrateModal';
const ReadingView       = lazy(() => import('./features/ReadingView').then(m => ({ default: m.ReadingView })));
const LessonsView       = lazy(() => import('./features/Lessons').then(m => ({ default: m.LessonsView })));
const PracticeHub       = lazy(() => import('./features/Lessons').then(m => ({ default: m.PracticeHub })));
const IELTSHub          = lazy(() => import('./features/IELTSHub').then(m => ({ default: m.IELTSHub })));
import type { UiLang } from './lib/uiLang';
import { readPreferredTranslationCode } from './lib/preferredTranslationLang';
import { auth, submitAssignment, saveOnboarding } from './firebase';
import type { Assignment } from './firebase';

// Lazy-loaded heavy features (each becomes its own chunk)
const PronunciationDrill   = lazy(() => import('./Exercises').then(m => ({ default: m.PronunciationDrill })));
const HomePage             = lazy(() => import('./features/HomePage').then(m => ({ default: m.HomePage })));
const SpeakingPractice     = lazy(() => import('./features/SpeakingPractice').then(m => ({ default: m.SpeakingPractice })));
const SpeakingHub          = lazy(() => import('./features/SpeakingHub').then(m => ({ default: m.SpeakingHub })));
const AdminPanel           = lazy(() => import('./features/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ContentManagerPage   = lazy(() => import('./features/ContentManager').then(m => ({ default: m.ContentManager })));
const TeacherDashboard     = lazy(() => import('./features/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const WritingPractice      = lazy(() => import('./features/WritingPractice').then(m => ({ default: m.WritingPractice })));
const WritingHub           = lazy(() => import('./features/WritingHub').then(m => ({ default: m.WritingHub })));
const Gamification         = lazy(() => import('./features/Gamification').then(m => ({ default: m.GamificationDash })));
const PaymentPlans         = lazy(() => import('./features/PaymentPlans').then(m => ({ default: m.PaymentPlans })));
const InteractiveStory     = lazy(() => import('./features/InteractiveStory').then(m => ({ default: m.InteractiveStory })));
const IELTSReading         = lazy(() => import('./features/IELTSReading').then(m => ({ default: m.IELTSReading })));
const ComprehensiveReading = lazy(() => import('./features/ComprehensiveReading').then(m => ({ default: m.ComprehensiveReading })));
const ComprehensiveListening = lazy(() => import('./features/ComprehensiveListening').then(m => ({ default: m.ComprehensiveListening })));
const ListeningPractice    = lazy(() => import('./features/ListeningPractice').then(m => ({ default: m.ListeningPractice })));
const DashboardView        = lazy(() => import('./features/DashboardView'));
const VocabularyView       = lazy(() => import('./features/VocabularyView'));
const ExercisesView        = lazy(() => import('./features/ExercisesView'));
const StudentClasses       = lazy(() => import('./features/StudentClasses').then(m => ({ default: m.StudentClasses })));
const OrganizationPanel    = lazy(() => import('./features/OrganizationPanel').then(m => ({ default: m.OrganizationPanel })));
const ProfilePage          = lazy(() => import('./features/ProfilePage').then(m => ({ default: m.ProfilePage })));

const LazyFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
  </div>
);

/** Map the current app tab to the most relevant ContentManager sub-tab. */
const TAB_TO_CONTENT_SUBTAB: Record<string, string> = {
  'listening':      'ielts-listening',
  'reading':        'ielts-reading',
  'ielts-reading':  'ielts-reading',
  'speaking':       'ielts-speaking',
  'writing':        'task2',
  'exercises':      'dictation',
};

/** Floating edit-mode toggle + quick-open editor button. Visible to admin & content-manager only. */
function EditModeToggle({ activeTab }: { activeTab: string }) {
  const { editMode, toggleEditMode, openEditor } = useEditMode();
  const subTab = TAB_TO_CONTENT_SUBTAB[activeTab];

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 flex flex-col items-end gap-2">
      {/* Context-sensitive "Edit this content" button */}
      {editMode && subTab && (
        <button
          onClick={() => openEditor(subTab)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-bold rounded-full shadow-xl hover:bg-sky-700 active:scale-95 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Content
        </button>
      )}

      {/* Main toggle button */}
      <button
        onClick={toggleEditMode}
        title={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
          editMode
            ? 'bg-sky-600 text-white ring-4 ring-sky-200 dark:ring-sky-800'
            : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:border-sky-400 hover:text-sky-600'
        }`}
      >
        <Pencil className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function App() {
  const { contentLang, speechLocale, isEnglish, nativeName, dictCode } = useContentLang();
  const { uiLang } = useUiLang();
  const [level, setLevel] = useState<Level>('Beginner');
  const appliedStartingLevel = useRef(false);
  const [LEVEL_TEXTS, setLevelTexts] = useState<LevelTexts>(EMPTY_LEVEL_TEXTS);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [realtime, setRealtime] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [problemWords, setProblemWords] = useState<Record<string, { count: number; lastMissed: number }>>({});
  const [savedVocab, setSavedVocab] = useState<Record<string, { definition: string; timestamp: number; favorite?: boolean; srs?: { interval: number, repetition: number, easeFactor: number, nextReviewDate: number }; senseId?: string }>>({});
  const [streak, setStreak] = useState<{current: number, max: number, lastDate: string}>({current: 0, max: 0, lastDate: ''});

  const [userProfile, setUserProfile] = useState<{xp: number, coins: number, level: number, league: string}>(() => {
    const p = readScopedJSON('readmaster_profile', { xp: 0, coins: 0, level: 1, league: 'Bronze' });
    return { ...p, level: levelForXp(p.xp || 0), league: p.league || leagueForXp(p.xp || 0) };
  });

  const [habit, setHabit] = useState<HabitState>(() =>
    normalizeHabit(readScopedJSON('habit_v1', emptyHabit())),
  );

  const [habitCelebrate, setHabitCelebrate] = useState<{
    goalJustCompleted?: boolean;
    streakTicked?: boolean;
    streak?: number;
    newBadges?: string[];
  } | null>(null);

  const awardXP = (xpAmount: number, coinsAmount: number) => {
    setUserProfile(prev => {
      const next = {
        ...prev,
        xp: prev.xp + xpAmount,
        coins: prev.coins + coinsAmount,
      };
      next.level = levelForXp(next.xp);
      next.league = leagueForXp(next.xp);
      writeScopedJSON('readmaster_profile', next);
      try { localStorage.setItem('readmaster_profile', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setHabit(prev => {
      const { habit: next, goalJustCompleted, streakTicked, newBadges } = applyXpToHabit(prev, xpAmount);
      writeScopedJSON('habit_v1', next);
      if (goalJustCompleted || streakTicked || newBadges.length) {
        setHabitCelebrate({
          goalJustCompleted,
          streakTicked,
          streak: next.globalStreak.current,
          newBadges,
        });
      }
      return next;
    });
  };

  const [improvedWords, setImprovedWords] = useState<Record<string, { timestamp: number }>>({});
  const [vocabFilter, setVocabFilter] = useState<'all' | 'favorites'>('all');

  const trackActivity = () => {
    setStreak(prev => {
      const today = new Date().toDateString();
      if (prev.lastDate !== today) {
         const lastDateStr = prev.lastDate;
         let newCurrent = prev.current;
         if (lastDateStr) {
           const lastDate = new Date(lastDateStr);
           const todayDate = new Date(today);
           const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           if (diffDays <= 1) {
              newCurrent += 1;
           } else {
              newCurrent = 1;
           }
         } else {
           newCurrent = 1;
         }
         const newStreak = {
           current: newCurrent,
           max: Math.max(prev.max || 0, newCurrent),
           lastDate: today
         };
         localStorage.setItem('readmaster_streak', JSON.stringify(newStreak));
         return newStreak;
      }
      return prev;
    });
  };

  const [sessionAudioBlob, setSessionAudioBlob] = useState<Blob | null>(null);
  // True when the session ended with no recognized speech, so UI can clearly say
  // accuracy is unavailable instead of showing a misleading 0%.
  const [transcriptionUnavailable, setTranscriptionUnavailable] = useState(false);
  // True when transcription finished but produced no usable text (accuracy unknown).
  const [transcriptionFailed, setTranscriptionFailed] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('smarty_dark') === 'true'; } catch { return false; }
  });

  const onToggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('smarty_dark', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load level texts asynchronously — keeps 700+ KB out of the main bundle.
  useEffect(() => {
    loadLevelTexts(contentLang).then(setLevelTexts);
  }, [contentLang]);

  useEffect(() => {
    if (!vocabDbEnabled()) return;
    loadVocab(contentLang, uiLang).catch(() => {});
  }, [contentLang, uiLang]);

  // Reload vocabulary pack when learning language changes.
  useEffect(() => {
    try {
      const savedV = localStorage.getItem(vocabStorageKey(contentLang));
      setSavedVocab(savedV ? JSON.parse(savedV) : {});
    } catch {
      setSavedVocab({});
    }
  }, [contentLang]);

  // Active assignment being worked on (set when student starts a reading assignment)
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  // Jump contexts for assignment-driven navigation
  const [speakingJump, setSpeakingJump]       = useState<{ level: string; topicIndex: number; key: number } | null>(null);
  const [writingJump, setWritingJump]         = useState<{ level: string; topicIndex: number; key: number } | null>(null);
  const [listeningJump, setListeningJump]     = useState<{ level: string; passageTitle: string; key: number } | null>(null);
  const [compReadingJump, setCompReadingJump] = useState<{ level: string; passageTitle: string; key: number } | null>(null);

  const {
    activeTab,
    setActiveTab,
    setReadingView,
    setSubPath,
    navigate,
    path: appPath,
    sub: appSub,
  } = useAppRoute({ tab: 'home', path: [] });

  const handleStartAssignment = useCallback((assignment: Assignment) => {
    if (assignment.type === 'reading') {
      if (assignment.passageId && assignment.passageLevel) {
        setLevel(assignment.passageLevel as Level);
        setCurrentTextId(assignment.passageId);
        setIsCustomMode(false);
        setReadingView('practice');
        setActiveAssignment(assignment);
      }
      setActiveTab('reading');
    } else if (assignment.type === 'listening') {
      if (assignment.listeningLevel && assignment.listeningPassageTitle) {
        setListeningJump(prev => ({
          level: assignment.listeningLevel!,
          passageTitle: assignment.listeningPassageTitle!,
          key: (prev?.key ?? 0) + 1,
        }));
      }
      navigate({ tab: 'listening', path: ['comprehensive'] });
    } else if (assignment.type === 'speaking') {
      if (assignment.speakingLevel && assignment.speakingTopicIndex !== undefined) {
        setSpeakingJump(prev => ({
          level: assignment.speakingLevel!,
          topicIndex: assignment.speakingTopicIndex!,
          key: (prev?.key ?? 0) + 1,
        }));
      }
      navigate({ tab: 'speaking', path: ['general'] });
    } else if (assignment.type === 'writing') {
      if (assignment.writingLevel && assignment.writingTopicIndex !== undefined) {
        setWritingJump(prev => ({
          level: assignment.writingLevel!,
          topicIndex: assignment.writingTopicIndex!,
          key: (prev?.key ?? 0) + 1,
        }));
      }
      navigate({ tab: 'writing', path: ['general'] });
    } else if (assignment.type === 'comp-reading') {
      if (assignment.compReadingLevel && assignment.compReadingPassageTitle) {
        setCompReadingJump(prev => ({
          level: assignment.compReadingLevel!,
          passageTitle: assignment.compReadingPassageTitle!,
          key: (prev?.key ?? 0) + 1,
        }));
      }
      setActiveTab('reading');
      setReadingView('menu');
    } else if (assignment.type === 'exercise') {
      setActiveAssignment(assignment);
      if (assignment.exerciseType) {
        setActiveExercise(assignment.exerciseType);
      }
      const words = assignment.exerciseWords && assignment.exerciseWords.length > 0
        ? assignment.exerciseWords
        : [];
      if (words.length > 0) {
        setSelectedVocabWords(words);
      }
      if (assignment.id && assignment.exerciseType) {
        saveAssignmentExerciseResume({
          assignmentId: assignment.id,
          exerciseType: assignment.exerciseType,
          words,
        });
      }
      // Resume unfinished session for this assignment if one exists
      const snap = loadExerciseSession();
      if (snap && snap.type === assignment.exerciseType) {
        requestExerciseResume();
      }
      setActiveTab('exercises');
    }
  }, [navigate, setActiveTab, setReadingView]); // eslint-disable-line react-hooks/exhaustive-deps

  const { user, accountProfile, setAccountProfile, isSyncing, authReady, loginWithGoogle, logout } = useFirebaseSync(
    streak, setStreak,
    history, setHistory,
    problemWords, setProblemWords,
    improvedWords, setImprovedWords,
    savedVocab, setSavedVocab,
    contentLang,
    userProfile, setUserProfile,
    habit, setHabit,
  );

  // Returning signed-in users land on Stats (Continue), not the marketing homepage.
  const didRedirectHome = useRef(false);
  useEffect(() => {
    if (!authReady || !user || didRedirectHome.current) return;
    if (activeTab === 'home') {
      didRedirectHome.current = true;
      setActiveTab('dashboard');
    }
  }, [authReady, user, activeTab, setActiveTab]);

  const sessionTimestampRef = useRef<number>(0);
  // Web Speech (useVosk) for everyone — desktop continuous + mobile discrete sessions.
  const { startRecognition, stopRecognition: stopVoskRecognition, isReady: voskReady, modelLoading: voskLoading, modelError: voskError } = useVosk(speechLocale);
  const speechReady = voskReady;
  const speechLoading = voskLoading;

  // Bounce off English-only tabs when switching to RU/TL.
  useEffect(() => {
    if (!isEnglish && EN_ONLY_TABS.has(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [contentLang, isEnglish]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Human-readable title shown in the mobile top bar for each section. */
  const TAB_TITLES: Record<string, string> = {
    dashboard:        'Home',
    lessons:          'Learn',
    practice:         'Practice',
    gamification:     'League',
    ielts:            'IELTS',
    reading:          'Reading',
    listening:        'Listening',
    speaking:         'Speaking',
    writing:          'Writing',
    exercises:        'Exercises',
    vocabulary:       'Vocabulary',
    classes:          'My Classes',
    teacher:          'Teacher',
    organization:     'Organization',
    admin:            'Admin',
    content:          'Content',
    profile:          'Profile',
    plans:            'Plans',
    'ielts-reading':  'IELTS Reading',
    comprehensive:    'Comprehensive',
    story:            'Story',
  };

  /** Brief fade transition when switching tabs (purely visual, no re-mount). */
  const [tabTransit, setTabTransit] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setTabTransit(true);
      const t = setTimeout(() => setTabTransit(false), 180);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  // Auto-redirect to dashboard (or plans) only on the transition from signed-out to signed-in.
  // (NOT on initial mount when user was already authenticated from a previous session.)
  // If the user clicked a "Subscribe" button on the homepage before logging in,
  // pendingPostLoginTab is set to 'plans' so they go straight to checkout after auth.
  const prevSignedIn = useRef<boolean | null>(null);
  const pendingPostLoginTab = useRef<'plans' | null>(null);
  const requestLoginThenPlans = () => {
    pendingPostLoginTab.current = 'plans';
    loginWithGoogle();
  };
  useEffect(() => {
    if (!authReady) return;
    const signedIn = !!(user && accountProfile);
    if (prevSignedIn.current === false && signedIn) {
      const next = pendingPostLoginTab.current ?? 'dashboard';
      pendingPostLoginTab.current = null;
      setActiveTab(next as any);
    }
    prevSignedIn.current = signedIn;
  }, [user, authReady, accountProfile]);

  // ── Post-payment redirect handler ───────────────────────────────────────
  // When ATMOS sends the user back to /?payment=success, finalize the pending
  // payment record (stashed in sessionStorage before redirect) and activate
  // the user's plan. Errors are caught so they don't block the app.
  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  useEffect(() => {
    if (!user || !accountProfile) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment !== 'success' && payment !== 'cancel') return;

    if (payment === 'cancel') {
      sessionStorage.removeItem('smarty_pending_payment');
      setPaymentToast('Payment cancelled.');
      window.history.replaceState(
        { tab: activeTab, path: appPath },
        '',
        window.location.pathname + window.location.hash,
      );
      return;
    }

    const raw = sessionStorage.getItem('smarty_pending_payment');
    if (!raw) {
      // No stash — still clear the param so refreshes don't re-trigger.
      window.history.replaceState(
        { tab: activeTab, path: appPath },
        '',
        window.location.pathname + window.location.hash,
      );
      return;
    }
    let pending: any;
    try { pending = JSON.parse(raw); } catch { return; }

    (async () => {
      try {
        const { recordPayment, setUserPlan } = await import('./firebase');

        // Branch by payment type: 'seats' is a seat add-on, anything else is a plan purchase.
        if (pending.type === 'seats') {
          await recordPayment({
            uid: pending.uid,
            email: pending.email,
            displayName: pending.displayName,
            planId: pending.planId,
            seats: pending.additionalSeats,
            amountUSD: pending.amountUSD,
            amountUZS: pending.amountUZS,
            status: 'completed',
            paidAt: Date.now(),
          });
          // Set the new total — keeps the existing plan, just bumps seat count.
          await setUserPlan(pending.uid, pending.planId, { seats: pending.newSeats });
          setPaymentToast(`✓ ${pending.additionalSeats} seat${pending.additionalSeats === 1 ? '' : 's'} added — total ${pending.newSeats}.`);
        } else {
          await recordPayment({
            uid: pending.uid,
            email: pending.email,
            displayName: pending.displayName,
            planId: pending.planId,
            seats: pending.seats,
            amountUSD: pending.amountUSD,
            amountUZS: pending.amountUZS,
            status: 'completed',
            paidAt: Date.now(),
          });
          await setUserPlan(pending.uid, pending.planId, { seats: pending.seats });
          setAccountProfile(prev => prev ? {
            ...prev,
            plan: pending.planId,
            planSeats: pending.seats,
            planStartedAt: Date.now(),
            role: pending.planId === 'teacher' ? 'teacher' : pending.planId === 'organization' ? 'organization' : prev.role,
          } : prev);
          setPaymentToast(`✓ ${pending.planId === 'smarty-max' ? 'Smarty Max' : pending.planId === 'teacher' ? 'Teacher' : 'Organization'} plan activated!`);
        }
      } catch (e) {
        console.error('Failed to finalize payment:', e);
        setPaymentToast('Payment received, but plan activation failed. Contact support.');
      } finally {
        const wasSeats = pending.type === 'seats';
        sessionStorage.removeItem('smarty_pending_payment');
        const nextTab = wasSeats
          ? (pending.planId === 'organization' ? 'organization' : 'teacher')
          : 'dashboard';
        navigate({ tab: nextTab as any, path: [] }, { replace: true });
        // Strip payment query params while keeping the hash route.
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({ tab: nextTab, path: [] }, '', clean);
      }
    })();
  }, [user, accountProfile]);

  const [dashboardFilter, setDashboardFilter] = useState<'1'|'7'|'30'|'365'|'all'>('all');
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [selectedVocabWords, setSelectedVocabWords] = useState<string[]>([]);
  const [showExerciseWordSelector, setShowExerciseWordSelector] = useState<'flashcards' | 'pronunciation' | 'word-match' | null>(null);
  const [exerciseSourceType, setExerciseSourceType] = useState<'saved' | 'level' | 'topic' | 'custom'>('saved');
  const [exerciseSourceLevel, setExerciseSourceLevel] = useState<Level>('Beginner');
  const [exerciseSourceTopic, setExerciseSourceTopic] = useState<string>('');
  const [exerciseSourceCustomTextSel, setExerciseSourceCustomTextSel] = useState<string>('');
  const [dictionarySearchQuery, setDictionarySearchQuery] = useState('');
  const [isSearchingDict, setIsSearchingDict] = useState(false);
  const [dictResult, setDictResult] = useState<any>(null);
  const [dictSearchQuery, setDictSearchQuery] = useState('');
  const [dictError, setDictError] = useState<string | null>(null);
  const [targetLangs, setTargetLangs] = useState<string[]>(() => {
    try {
      const code = readPreferredTranslationCode();
      return code ? [code] : ['en'];
    } catch {
      return ['en'];
    }
  });
  const [defLang, setDefLangState] = useState<string>(
    () => { try { return localStorage.getItem('preferred_definition_lang') || contentLang; } catch { return contentLang; } }
  );
  const [defPickerOpen, setDefPickerOpen] = useState(false);

  const setDefLang = (code: string) => {
    try { localStorage.setItem('preferred_definition_lang', code); } catch {}
    setDefLangState(code);
  };

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  const translateText = async (id: string, text: string) => {
    if (!text || isTranslating[id]) return;
    setIsTranslating(prev => ({ ...prev, [id]: true }));
    try {
      const { translateWithCache } = await import('./lib/networkCache');
      const { isGarbageTranslation } = await import('./lib/translationQuality');
      // Prefer translating the bare word when the payload is "word: definition"
      const bare = text.includes(':') ? text.split(':')[0].trim() : text.trim();
      const gloss = text.includes(':') ? text.slice(text.indexOf(':') + 1).trim() : undefined;
      for (const lang of targetLangs) {
        if (translations[`${lang}_${id}`]) continue;
        if (vocabDbEnabled()) {
          await loadVocab(dictCode, lang);
          const card = lookupWord(bare, { knownLang: lang });
          if (card?.knownWord || card?.definition) {
            setTranslations(prev => ({ ...prev, [`${lang}_${id}`]: card.knownWord || card.definition }));
            continue;
          }
        }
        const raw = await translateWithCache(bare, dictCode, lang, { fallback: gloss });
        if (raw && !isGarbageTranslation(raw, bare)) {
          setTranslations(prev => ({ ...prev, [`${lang}_${id}`]: raw }));
        } else if (gloss) {
          const defT = await translateWithCache(gloss, dictCode, lang);
          if (defT && !isGarbageTranslation(defT, gloss)) {
            setTranslations(prev => ({ ...prev, [`${lang}_${id}`]: defT }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDictSearch = async (e?: any) => {
    e?.preventDefault();
    if (!dictSearchQuery.trim()) return;
    setIsSearchingDict(true);
    setDictError(null);
    setDictResult(null);
    try {
      const result = await lookupDictionary(dictSearchQuery.trim(), contentLang, defLang);
      if (!result) throw new Error(`Word not found in ${nativeName} dictionary.`);
      setDictResult(result);
    } catch (err: any) {
      setDictError(err.message || 'An error occurred.');
    } finally {
      setIsSearchingDict(false);
    }
  };

  const persistVocab = (next: typeof savedVocab) => {
    try { localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggleSavedVocab = (word: string, def?: string) => {
    setSavedVocab(prev => {
      const next = { ...prev };
      const lp = word.toLowerCase();
      if (next[lp]) {
        delete next[lp];
      } else {
        next[lp] = { definition: def || 'Saved word', timestamp: Date.now() };
      }
      persistVocab(next);
      return next;
    });
  };

  const [newVocabWord, setNewVocabWord] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [addVocabError, setAddVocabError] = useState('');

  const handleToggleVocab = async (word: string, fallbackDef: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (savedVocab[cleanWord]) {
      setSavedVocab(prev => {
        const next = { ...prev };
        delete next[cleanWord];
        persistVocab(next);
        return next;
      });
    } else {
      handleAddVocab(cleanWord, fallbackDef);
    }
  };

  const handleAddVocab = async (word: string, fallbackDef: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (savedVocab[cleanWord]) return;
    // Optimistic: show as saved immediately, then enrich definition in background
    const placeholder = fallbackDef || '…';
    setSavedVocab(prev => {
      if (prev[cleanWord]) return prev;
      const next = { ...prev, [cleanWord]: { definition: placeholder, timestamp: Date.now() } };
      persistVocab(next);
      return next;
    });
    try {
      if (vocabDbEnabled()) {
        await loadVocab(contentLang, defLang);
        const card = lookupWord(cleanWord, { knownLang: defLang });
        if (card) {
          setSavedVocab(prev => {
            if (!prev[cleanWord]) return prev;
            const next = {
              ...prev,
              [cleanWord]: {
                ...prev[cleanWord],
                definition: card.definition,
                senseId: card.senseId,
              },
            };
            persistVocab(next);
            return next;
          });
          return;
        }
      }
      const result = await lookupDictionary(cleanWord, contentLang, defLang);
      const definition = result?.meanings?.[0]?.definitions?.[0]?.definition;
      if (!definition) return;
      setSavedVocab(prev => {
        if (!prev[cleanWord]) return prev;
        const next = { ...prev, [cleanWord]: { ...prev[cleanWord], definition } };
        persistVocab(next);
        return next;
      });
    } catch {
      /* keep placeholder — already saved */
    }
  };

  const handleAddNewVocab = async () => {
    if (!newVocabWord.trim()) return;
    const cleanWord = newVocabWord.trim().toLowerCase();
    if (savedVocab[cleanWord]) {
      setAddVocabError(`"${cleanWord}" is already in your vocabulary.`);
      return;
    }
    setIsAddingVocab(true);
    setAddVocabError('');
    try {
      if (vocabDbEnabled()) {
        await loadVocab(contentLang, defLang);
        const card = lookupWord(cleanWord, { knownLang: defLang });
        if (card) {
          setSavedVocab(prev => {
            const next = {
              ...prev,
              [cleanWord]: { definition: card.definition, timestamp: Date.now(), senseId: card.senseId },
            };
            persistVocab(next);
            return next;
          });
          setNewVocabWord('');
          return;
        }
      }
      const result = await lookupDictionary(cleanWord, contentLang, defLang);
      if (!result) {
        setAddVocabError(`"${cleanWord}" is not recognized as a ${nativeName} word.`);
      } else {
        const definition = result.meanings?.[0]?.definitions?.[0]?.definition || 'Definition not found.';
        setSavedVocab(prev => {
          const next = { ...prev, [cleanWord]: { definition, timestamp: Date.now() } };
          persistVocab(next);
          return next;
        });
        setNewVocabWord('');
      }
    } catch {
      setAddVocabError('Network error. Please try again.');
    } finally {
      setIsAddingVocab(false);
    }
  };

  const searchDictionary = async (query = dictionarySearchQuery) => {
    if (!query.trim()) return;
    setIsSearchingDict(true);
    setDictResult(null);
    try {
      const result = await lookupDictionary(query.trim(), contentLang, defLang);
      if (!result) {
        setDictResult('not_found');
      } else {
        setDictResult(result);
      }
    } catch {
      setDictResult('error');
    } finally {
      setIsSearchingDict(false);
    }
  };

  const readingView = (
    ['menu', 'levels', 'library', 'practice', 'custom-entry'].includes(appSub)
      ? appSub
      : 'menu'
  ) as 'menu' | 'levels' | 'library' | 'practice' | 'custom-entry';
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  const [topicPage, setTopicPage] = useState(1);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontScale, setFontScale] = useState(3);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [customText, setCustomText] = useState('');
  const [savedCustomTexts, setSavedCustomTexts] = useState<string[]>(
    () => { try { return JSON.parse(localStorage.getItem('readmaster_saved_custom_texts') || '[]'); } catch { return []; } }
  );
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isActivityPopupOpen, setIsActivityPopupOpen] = useState(false);
  const [clickedWordInfo, setClickedWordInfo] = useState<{word: string, index: number, cleanWord: string, definition?: string} | null>(null);
  const [wordModal, setWordModal] = useState<{word: string, mode: 'dictionary' | 'translation'} | null>(null);

  // Persist mid-session reading progress for Continue
  useEffect(() => {
    if (readingView !== 'practice' || isFinished) return;
    if (!isCustomMode && !currentTextId) return;
    saveReadingSession({
      textId: currentTextId || 'custom',
      level,
      isCustomMode,
      customText: isCustomMode ? customText : undefined,
      timedMode,
      timeLeft,
      transcript,
      isFinished: false,
      contentLang,
    });
  }, [readingView, currentTextId, level, isCustomMode, customText, timedMode, timeLeft, transcript, isFinished, contentLang]);

  const [exercisesHistory, setExercisesHistory] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('readmaster_exercises_history') || '[]'); } catch { return []; }
  });

  const [exerciseProgressFilter, setExerciseProgressFilter] = useState<'all' | 'flashcards' | 'pronunciation' | 'word-match' | 'definition-quiz' | 'spelling-practice' | 'word-scramble' | 'memory-match' | 'listening-match' | 'true-false-quiz'>('all');
  const [selectedExerciseSession, setSelectedExerciseSession] = useState<any | null>(null);

  const [isExerciseCompleteModalOpen, setIsExerciseCompleteModalOpen] = useState(false);
  const [exerciseCompleteData, setExerciseCompleteData] = useState<any | null>(null);

  const recordExercise = (type: string, data: any = {}) => {
     const scoreXP = data.score ? Math.min(250, data.score * 10) : 50;
     const coinsEarned = data.score ? Math.min(50, data.score * 2) : 10;
     awardXP(scoreXP, coinsEarned);
     const langMeta = activityLangStamp(contentLang);

     const total =
       data.total ||
       (Array.isArray(data.questions) && data.questions.length) ||
       (Array.isArray(data.correctWords) && Array.isArray(data.mistakes)
         ? data.correctWords.length + data.mistakes.length
         : undefined);
     const accuracy = (typeof data.score === 'number' && typeof total === 'number' && total > 0)
       ? Math.round((data.score / total) * 100) : undefined;

     const isIeltsReading = type === 'ielts-reading';
     const isIeltsListening = type === 'ielts-listening';
     const band = (isIeltsReading || isIeltsListening) && typeof data.score === 'number'
       ? (data.band ?? bandFromScore40(data.score))
       : data.band;

     recordCompletion(
       isIeltsReading ? 'ielts-reading' : isIeltsListening ? 'ielts-listening' : 'exercise',
       {
         title: data.title || type.replace(/-/g, ' '),
         score: data.score,
         total: typeof total === 'number' ? total : undefined,
         accuracy,
         band,
         contentLang,
         data: { ...data, exerciseType: type, ...langMeta },
         skipActivity: false,
       },
     );

     if ((isIeltsReading || isIeltsListening) && !habit.badges.includes('firstIelts')) {
       setHabit(prev => {
         const next = unlockBadge(prev, 'firstIelts');
         writeScopedJSON('habit_v1', next);
         return next;
       });
     }

     setExercisesHistory(prev => {
        const next = [{ type, timestamp: Date.now(), data, ...langMeta }, ...prev];
        writeScopedJSON('readmaster_exercises_history', next);
        try { localStorage.setItem('readmaster_exercises_history', JSON.stringify(next)); } catch { /* ignore */ }
        return next;
     });

     trackActivity();
     trackExerciseStreak();
     bumpWeeklyGoal('exercises');

     // Complete teacher assignment if this finishes an assigned exercise
     const asg = loadAssignmentExerciseResume();
     if (asg && asg.exerciseType === type && asg.assignmentId) {
       submitAssignment(asg.assignmentId, {
         studentUid: auth?.currentUser?.uid ?? '',
         studentName: auth?.currentUser?.displayName ?? '',
         completedAt: Date.now(),
         score: data.score,
         accuracy: typeof data.score === 'number' ? data.score : undefined,
       }).catch(console.error);
       clearAssignmentExerciseResume();
       setActiveAssignment(null);
     }

     if (data.correctWords || data.mistakes) {
        setSavedVocab(prev => {
           const next = { ...prev };
           let changed = false;
           if (data.correctWords) {
              data.correctWords.forEach((w: string) => {
                 const clean = w.toLowerCase();
                 if (next[clean]) {
                    changed = true;
                    next[clean] = { ...next[clean], srs: calculateSM2(4, next[clean].srs) };
                 }
              });
           }
           if (data.mistakes && Array.isArray(data.mistakes)) {
              data.mistakes.forEach((w: string) => {
                 const clean = w.toLowerCase();
                 if (next[clean]) {
                    changed = true;
                    next[clean] = { ...next[clean], srs: calculateSM2(1, next[clean].srs) };
                 }
              });
           }
           if (changed) {
              persistVocab(next);
           }
           return changed ? next : prev;
        });
     }
  };

  const allTexts = useMemo(() => {
    return (Object.entries(LEVEL_TEXTS) as [Level, ReadingText[]][]).flatMap(([lvl, texts]) =>
      texts.map(t => ({ ...t, levelInfo: lvl }))
    );
  }, [LEVEL_TEXTS]);

  const srsDueWords = useMemo(() => {
     const now = Date.now();
     return Object.entries(savedVocab as any).filter(([w, d]: any) => d.srs && d.srs.nextReviewDate && d.srs.nextReviewDate <= now).map(x => x[0]);
  }, [savedVocab]);

  const dailyGoals = useMemo(() => {
     const today = new Date().setHours(0,0,0,0);
     let readsToday = 0;
     Object.values(history).forEach((h: any) => {
        h.forEach((entry: any) => {
           if (new Date(entry.timestamp).setHours(0,0,0,0) === today) readsToday++;
        });
     });
     let exercisesToday = 0;
     exercisesHistory.forEach(xh => {
        if (new Date(xh.timestamp).setHours(0,0,0,0) === today) exercisesToday++;
     });
     return { readsToday, exercisesToday };
  }, [history, exercisesHistory]);

  const allVocabMap = useMemo(() => {
    const map = new Map<string, string>();
    allTexts.forEach(text => {
      text.vocabulary?.forEach(v => {
        map.set(v.word.toLowerCase(), v.definition);
      });
    });
    return map;
  }, [allTexts]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allTexts.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.text.toLowerCase().includes(query)
    );
  }, [searchQuery, allTexts]);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(isRecording);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const shouldSaveAudioRef = useRef(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [practicingWord, setPracticingWord] = useState<string | null>(null);
  const [wordsToPracticePage, setWordsToPracticePage] = useState(1);
  const [myVocabPage, setMyVocabPage] = useState(1);
  const [myVocabSearchQuery, setMyVocabSearchQuery] = useState('');
  const [improvedWordsPage, setImprovedWordsPage] = useState(1);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const startPracticeWord = async (word: string) => {
    if (practicingWord) return;
    if (!voskReady) {
        alert("Speech Recognition model is still loading...");
        return;
    }
    setPracticingWord(word);
    let hasMatched = false;
    try {
      await startRecognition((finalText) => {
          if (hasMatched) return;
          checkMatch(finalText);
      }, (partialText) => {
          if (hasMatched) return;
          checkMatch(partialText);
      });

      const checkMatch = (text: string) => {
        const cleanTarget = normalizeForMatch(word, contentLang);
        const transcriptWords = tokenizeForLang(text, contentLang)
          .map(w => normalizeForMatch(w, contentLang))
          .filter(Boolean);

        let matched = false;
        for (let i = 0; i < transcriptWords.length; i++) {
            let combined = "";
            for(let j = 0; j < 5 && i + j < transcriptWords.length; j++) {
               combined += transcriptWords[i+j];
               if (isMatch(cleanTarget, combined, contentLang) || isMatch(cleanTarget, transcriptWords[i+j], contentLang)) {
                   matched = true;
                   break;
               }
            }
            if(matched) break;
        }

        if (matched) {
          hasMatched = true;
          setProblemWords(prev => {
            const next = { ...prev };
            const key = cleanSpeechToken(word) || word.toLowerCase();
            if (next[key]) {
              next[key].count -= 1;
              if (next[key].count <= 0) {
                delete next[key];
                setImprovedWords(prevImp => {
                  const nextImp = { ...prevImp, [key]: { timestamp: Date.now() } };
                  localStorage.setItem('readmaster_improved_words', JSON.stringify(nextImp));
                  return nextImp;
                });
              }
            }
            localStorage.setItem('readmaster_problem_words', JSON.stringify(next));
            return next;
          });
          setPracticingWord(null);
          stopVoskRecognition();
        }
      };
    } catch (e) {
      alert("Failed to start speech recognition.");
      setPracticingWord(null);
    }
  };

  const currentTextObj = useMemo(() => {
    if (isCustomMode && customText.trim()) {
      return {
        id: 'custom-text',
        title: 'Custom Practice',
        text: customText,
        vocabulary: []
      };
    }
    const texts = LEVEL_TEXTS[level] || [];
    if (texts.length === 0) {
      // Texts haven't loaded yet — return placeholder
      return { id: '__loading__', title: 'Loading…', text: '', vocabulary: [], targetSeconds: 60 };
    }
    if (currentTextId) {
      return texts.find(t => t.id === currentTextId) || texts[0];
    }
    const unread = texts.find(t => sessionsForLang(history[t.id], contentLang).length === 0);
    return unread || texts[0];
  }, [level, currentTextId, history, isCustomMode, customText, LEVEL_TEXTS, contentLang]);

  const currentIndex = useMemo(() => {
    return (LEVEL_TEXTS[level] || []).findIndex(t => t.id === currentTextObj.id);
  }, [level, currentTextObj.id, LEVEL_TEXTS]);

  const hasNextText = currentIndex >= 0 && currentIndex < (LEVEL_TEXTS[level]?.length || 0) - 1;
  const hasPrevText = currentIndex > 0;

  const handleNextText = () => {
    if (hasNextText) {
      setCurrentTextId(LEVEL_TEXTS[level][currentIndex + 1].id);
      if (isRecording) stopRecording();
      setTranscript('');
      setIsFinished(false);
      setVocabOpen(false);
    }
  };

  const handlePrevText = () => {
    if (hasPrevText) {
      setCurrentTextId(LEVEL_TEXTS[level][currentIndex - 1].id);
      if (isRecording) stopRecording();
      setTranscript('');
      setIsFinished(false);
      setVocabOpen(false);
    }
  };

  const targetTime = currentTextObj.targetSeconds || 60;
  const sourceText = currentTextObj.text;
  const sourceWords = useMemo(() => tokenizeForLang(sourceText, contentLang), [sourceText, contentLang]);
  const transcriptWords = useMemo(() => tokenizeForLang(transcript, contentLang), [transcript, contentLang]);
  const rawStatuses = useMemo(
    () => alignWords(sourceWords, transcriptWords, contentLang),
    [sourceWords, transcriptWords, contentLang]
  );

  const activeWordIndex = useMemo(() => {
    if (!isRecording) return -1;
    const idx = rawStatuses.findIndex(s => s === 'pending');
    return idx === -1 ? sourceWords.length - 1 : idx;
  }, [rawStatuses, isRecording, sourceWords.length]);

  const activeWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isRecording && activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWordIndex, isRecording]);

  useEffect(() => {
    if (isRecording && sourceWords.length > 0 && !rawStatuses.includes('pending')) {
      stopRecording();
    }
  }, [rawStatuses, isRecording, sourceWords.length]);

  const displayStatuses = useMemo(() => {
    if (realtime || isFinished) return rawStatuses;
    return new Array(sourceWords.length).fill('pending');
  }, [realtime, isFinished, rawStatuses, sourceWords.length]);

  const readStats = useMemo(() => {
    let attemptedCount = 0;
    let correctCount = 0;
    for (const st of rawStatuses) {
      if (st !== 'pending') attemptedCount += 1;
      if (st === 'correct') correctCount += 1;
    }
    const readAccuracy =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const passageAccuracy =
      sourceWords.length > 0
        ? Math.round((attemptedCount / sourceWords.length) * 100)
        : 0;
    return { attemptedCount, correctCount, readAccuracy, passageAccuracy };
  }, [rawStatuses, sourceWords.length]);

  // `accuracy` is kept as an alias for read accuracy (pronunciation quality of
  // the words actually attempted) to stay backward compatible with existing
  // history / assignment / XP logic, while the UI shows both metrics.
  const accuracy = readStats.readAccuracy;
  const readAccuracy = readStats.readAccuracy;
  const passageAccuracy = readStats.passageAccuracy;

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('readmaster_history');
      if (savedHistory) {
         const parsed = JSON.parse(savedHistory);
         const migratedHistory: Record<string, any[]> = {};
         for (const [k, v] of Object.entries(parsed)) {
            if (Array.isArray(v)) {
               migratedHistory[k] = v;
            } else {
               migratedHistory[k] = [v];
            }
         }
         setHistory(migratedHistory);
      }
      const savedWords = localStorage.getItem('readmaster_problem_words');
      if (savedWords) setProblemWords(JSON.parse(savedWords));
      const savedStreak = localStorage.getItem('readmaster_streak');
      if (savedStreak) {
        const parsedStreak = JSON.parse(savedStreak);
        if (parsedStreak.lastDate) {
          setStreak(parsedStreak);
        }
      }
      const savedV = localStorage.getItem(vocabStorageKey(contentLang));
      if (savedV) setSavedVocab(JSON.parse(savedV));
      const savedImproved = localStorage.getItem('readmaster_improved_words');
      if (savedImproved) setImprovedWords(JSON.parse(savedImproved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRecording && timedMode && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => {
        if (prev <= 6 && prev > 1) {
          playSound('tick');
        }
        return prev - 1;
      }), 1000);
    } else if (isRecording && timedMode && timeLeft === 0) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [isRecording, timedMode, timeLeft]);

  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (transcript === '') {
      finalTranscriptRef.current = '';
    }
  }, [transcript]);

  const sessionSavedRef = useRef(false);

  useEffect(() => {
    if (isFinished && !isRecording && !sessionSavedRef.current) {
        sessionSavedRef.current = true;
        let finalAccuracy = 0;
        const attemptedCount = rawStatuses.filter(s => s !== 'pending').length;
        if (attemptedCount > 0) {
          const correctCount = rawStatuses.filter(s => s === 'correct').length;
          finalAccuracy = Math.round((correctCount / attemptedCount) * 100);
        }

        const missed = sourceWords
          .filter((w, i) => rawStatuses[i] === 'incorrect' || rawStatuses[i] === 'slight_mistake')
          .map(w => w.replace(/[^\p{L}\p{N}'’-]/gu, '').toLowerCase())
          .filter(w => w.length > 0);
        const correctWords = sourceWords.filter((w, i) => rawStatuses[i] === 'correct').map(w => w.replace(/[^\p{L}\p{N}'’-]/gu, '').toLowerCase()).filter(w => w.length > 0);
        const wordStatuses = sourceWords.map((w, i) => ({
          word: w,
          status: rawStatuses[i],
        }));

        setHistory(prev => {
          const newHistory = { ...prev };
          if (!newHistory[currentTextObj.id]) newHistory[currentTextObj.id] = [];
          newHistory[currentTextObj.id] = [
            ...newHistory[currentTextObj.id],
            {
              accuracy: finalAccuracy,
              readAccuracy,
              passageAccuracy,
              timestamp: sessionTimestampRef.current || Date.now(),
              hasAudio: !!mediaRecorderRef.current,
              title: currentTextObj.title || 'Reading Practice',
              level: (currentTextObj as any).level || level,
              correctWords,
              mistakeWords: missed,
              wordStatuses,
              attempted: attemptedCount,
              totalWords: sourceWords.length,
              ...activityLangStamp(contentLang),
            }
          ];
          localStorage.setItem('readmaster_history', JSON.stringify(newHistory));
          return newHistory;
        });

        clearReadingSession();
        bumpWeeklyGoal('reading');

        awardXP(finalAccuracy * 2, finalAccuracy > 80 ? 10 : 5);
        trackActivity();
        try {
          recordCompletion('reading-pronunciation', {
            title: currentTextObj.title || 'Reading Practice',
            accuracy: finalAccuracy,
            contentLang,
            data: {
              textId: currentTextObj.id,
              level: (currentTextObj as any).level || level,
              correctWords,
              mistakeWords: missed,
              details: wordStatuses.map(ws => ({
                word: ws.word,
                status: ws.status,
                isCorrect: ws.status === 'correct',
              })),
            },
            skipActivity: true,
          });
          logActivity({
            type: 'reading_pronunciation',
            title: currentTextObj.title || 'Reading Practice',
            level: (currentTextObj as any).level || level,
            accuracy: finalAccuracy,
            details: wordStatuses.slice(0, 50).map(ws => ({
              word: ws.word,
              expected: ws.word,
              isCorrect: ws.status === 'correct',
            })),
          });
        } catch (e) {
          console.warn('reading completion log failed:', e);
        }

        if (missed.length > 0) {
          setProblemWords(prev => {
            const next = { ...prev };
            missed.forEach(w => {
              if (!next[w]) next[w] = { count: 0, lastMissed: 0 };
              next[w].count += 1;
              next[w].lastMissed = Date.now();
            });
            localStorage.setItem('readmaster_problem_words', JSON.stringify(next));
            return next;
          });
        }

        // Auto-submit reading assignment results if one is active
        setActiveAssignment(prev => {
          if (prev?.id && prev.type === 'reading') {
            const wordsAttempted = rawStatuses.filter(s => s !== 'pending').length;
            submitAssignment(prev.id, {
              studentUid: auth?.currentUser?.uid ?? '',
              studentName: auth?.currentUser?.displayName ?? '',
              completedAt: Date.now(),
              accuracy: finalAccuracy,
              wordsRead: wordsAttempted,
              errors: missed.length > 0 ? missed : undefined,
            }).catch(console.error);
          }
          return null; // clear active assignment
        });
    }
  }, [isFinished, isRecording, rawStatuses, sourceWords, currentTextObj.id, currentTextObj.title, level, accuracy, contentLang]);

  const stopRecording = () => {
    if (!isRecording) return;
    playSound('stop_record');
    setIsRecording(false);
    isRecordingRef.current = false;
    stopVoskRecognition();
    const mobile = isMobileDevice();
    if (!mobile && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) { console.error(e); }
    }
    setTranscriptionUnavailable(!transcript.trim());
    setIsFinished(true);
    setShowFeedbackModal(true);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!speechReady) {
      setRecognitionError(voskError || 'Speech Recognition model is still loading...');
      return;
    }

    setTranscript('');
    finalTranscriptRef.current = '';
    setIsFinished(false);
    setTranscriptionFailed(false);
    setTranscriptionUnavailable(false);
    sessionSavedRef.current = false;
    sessionTimestampRef.current = Date.now();
    setRecognitionError(null);
    if (timedMode) setTimeLeft(targetTime);

    try {
      isRecordingRef.current = true;
      const mobile = isMobileDevice();
      const stream = await startRecognition((finalText) => {
         const current = finalTranscriptRef.current.trim();
         const incoming = finalText.trim();
         if (!incoming) return;
         const prevTokens = current.split(/\s+/);
         const nextTokens = incoming.split(/\s+/);
         let overlap = 0;
         const maxOverlap = Math.min(prevTokens.length, nextTokens.length);
         for (let n = maxOverlap; n > 0; n--) {
           if (prevTokens.slice(-n).join(' ').toLowerCase() === nextTokens.slice(0, n).join(' ').toLowerCase()) {
             overlap = n;
             break;
           }
         }
         finalTranscriptRef.current = (current + ' ' + nextTokens.slice(overlap).join(' ')).trim();
         setTranscript(finalTranscriptRef.current);
      }, (partialText) => {
         setTranscript((finalTranscriptRef.current + ' ' + partialText).trim());
      }, !mobile);

      if (mobile) {
        setIsRecording(true);
        setTimeout(() => { playSound('start_record'); }, 100);
        return;
      }

      if (!stream) throw new Error("No stream returned from recognition");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        const timestamp = sessionTimestampRef.current;
        const capturedTextId = currentTextObj.id;
        setSessionAudioBlob(audioBlob);
        try {
          await set(`audio_${capturedTextId}_${timestamp}`, audioBlob);
        } catch (e) {
          console.error("Failed to save audio", e);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => { playSound('start_record'); }, 100);
    } catch (error: any) {
      console.error("Recording start failed:", error);
      setRecognitionError("Failed to access microphone or start recognition.");
      isRecordingRef.current = false;
    }
  };

  const reset = () => {
    if (isRecording) stopRecording();
    setTranscriptionFailed(false);
    setTranscript('');
    setIsFinished(false);
    if (timedMode) setTimeLeft(targetTime);
  };

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playHistoryAudio = async (textId: string, timestamp?: number) => {
    const playId = timestamp ? `${textId}_${timestamp}` : textId;
    if (playingAudioId === playId) {
      if (currentAudioRef.current) {
         currentAudioRef.current.pause();
         currentAudioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }
    if (currentAudioRef.current) {
       currentAudioRef.current.pause();
       setPlayingAudioId(null);
       currentAudioRef.current = null;
    }
    try {
      let blob: Blob | undefined;
      if (timestamp) {
          blob = await get<Blob>(`audio_${textId}_${timestamp}`);
      } else if (textId === currentTextObj.id && sessionAudioBlob) {
          blob = sessionAudioBlob;
      } else {
          const historyArr = history[textId];
          const latest = historyArr?.[historyArr.length - 1];
          if (latest) {
              blob = await get<Blob>(`audio_${textId}_${latest.timestamp}`);
          } else {
              blob = await get<Blob>(`audio_${textId}`);
          }
      }
      if (blob) {
        setPlayingAudioId(playId);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          setPlayingAudioId(null);
          currentAudioRef.current = null;
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setPlayingAudioId(null);
          currentAudioRef.current = null;
          URL.revokeObjectURL(url);
        };
        audio.play();
      }
    } catch (e) {
      console.error("Could not play audio", e);
    }
  };

  const downloadAudio = async (textId: string, timestamp?: number) => {
    try {
      let blob: Blob | undefined;
      if (timestamp) {
          blob = await get<Blob>(`audio_${textId}_${timestamp}`);
      } else if (textId === currentTextObj.id && sessionAudioBlob) {
          blob = sessionAudioBlob;
      } else {
          const historyArr = history[textId];
          const latest = historyArr?.[historyArr.length - 1];
          if (latest) {
              blob = await get<Blob>(`audio_${textId}_${latest.timestamp}`);
          } else {
              blob = await get<Blob>(`audio_${textId}`);
          }
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording_${textId}_${timestamp || 'latest'}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch(e) { console.error("Error downloading audio", e); }
  };

  const playWord = (word: string) => {
    sharedPlayWord(word, speechRate, speechLocale);
  };

  const handleContentLangChange = useCallback((_lang: ContentLang) => {
    setReadingView('menu');
    setActiveTab(prev => (EN_ONLY_TABS.has(prev) ? 'dashboard' : prev));
  }, []);

  const needsOnboarding = !!(
    accountProfile &&
    accountProfile.role === 'student' &&
    !accountProfile.onboardingCompletedAt &&
    Object.keys(history).length === 0
  );

  useEffect(() => {
    appliedStartingLevel.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (appliedStartingLevel.current) return;
    const sl = accountProfile?.startingLevel;
    if (!sl) return;
    setLevel(sl);
    appliedStartingLevel.current = true;
  }, [accountProfile?.startingLevel, user?.uid]);

  const finishOnboarding = async (result: {
    contentLang: ContentLang;
    uiLang: UiLang;
    goal: 'daily' | 'school' | 'exam';
    startingLevel: Level;
    startLessons: boolean;
  }) => {
    if (!user) return;
    setLevel(result.startingLevel);
    appliedStartingLevel.current = true;
    try {
      await saveOnboarding(user.uid, {
        startingLevel: result.startingLevel,
        learningGoal: result.goal,
      });
    } catch (e) {
      console.error('saveOnboarding failed:', e);
    }
    setAccountProfile(prev => prev ? {
      ...prev,
      startingLevel: result.startingLevel,
      learningGoal: result.goal,
      onboardingCompletedAt: Date.now(),
    } : prev);
    if (result.startLessons && canPractice(accountProfile)) {
      setActiveTab('lessons');
    } else if (!canPractice(accountProfile)) {
      setActiveTab('plans');
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <EditModeProvider>
    <div className="h-dvh bg-white dark:bg-zinc-950 flex font-sans text-slate-900 dark:text-zinc-100 overflow-hidden">

      {/* Sidebar — only for fully authenticated users AND not on homepage */}
      {user && accountProfile && !needsOnboarding && activeTab !== 'home' && activeTab !== 'plans' && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab as any}
          setReadingView={setReadingView as any}
          userRole={accountProfile.role}
          accountProfile={accountProfile}
          user={user}
          uid={user.uid}
          loginWithGoogle={loginWithGoogle}
          logout={logout}
          darkMode={darkMode}
          onToggleDark={onToggleDark}
          habit={habit}
          xp={userProfile.xp}
        />
      )}

      <div className="flex-1 flex flex-col h-dvh overflow-hidden bg-white dark:bg-zinc-950 relative">
      {user && accountProfile && !needsOnboarding && activeTab !== 'home' && activeTab !== 'plans' && (
        <div className="lg:hidden">
          <AppTopBar
            activeTab={activeTab}
            title={TAB_TITLES[activeTab]}
            habit={habit}
            xp={userProfile.xp}
            user={user}
            uid={user.uid}
            onNavigate={setActiveTab as any}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        </div>
      )}

      {/* Main Content — this is the mobile scroller; padding clears the fixed bottom nav */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-y-contain transition-opacity duration-150 ${tabTransit ? 'opacity-0' : 'opacity-100'} ${user && accountProfile && !needsOnboarding && activeTab !== 'home' && activeTab !== 'plans' ? 'pb-[var(--se-mobile-nav)]' : ''}`}>
      {activeTab === 'home' && !(user && accountProfile && needsOnboarding) ? (
        /* Home page — always public */
        <Suspense fallback={<LazyFallback />}>
          <HomePage
            user={user}
            loginWithGoogle={loginWithGoogle}
            requestSubscribe={requestLoginThenPlans}
            setActiveTab={setActiveTab as any}
            setReadingView={setReadingView as any}
          />
        </Suspense>
      ) : !authReady ? (
        /* Resolving auth — brief spinner */
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
        </div>
      ) : !user ? (
        /* Not signed in — show auth screen */
        <AuthGate loginWithGoogle={loginWithGoogle} />
      ) : !accountProfile ? (
        /* Signed in, profile being provisioned — brief spinner */
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
        </div>
      ) : needsOnboarding && activeTab !== 'plans' ? (
        <Onboarding
          canStartLessons={canPractice(accountProfile)}
          onComplete={finishOnboarding}
        />
      ) : (() => {
        /* ── Access-tier gates ────────────────────────────────────────── */
        const acctType   = accountTypeOf(accountProfile);
        const free       = isFreeUser(accountProfile);
        const previewing = isPreviewMode(accountProfile);

        // Pages a free User is still allowed to see (no practice material).
        const ALWAYS_ALLOWED = new Set(['dashboard', 'profile', 'plans']);
        // Practice / learning tabs that Teachers + Organizations may preview.
        const PREVIEWABLE_TABS = new Set([
          'lessons', 'practice', 'ielts', 'gamification', 'reading', 'listening', 'speaking', 'writing', 'exercises',
          'story', 'ielts-reading', 'comprehensive', 'vocabulary',
        ]);

        // Free Users see a lock screen on every feature tab.
        if (free && !ALWAYS_ALLOWED.has(activeTab)) {
          return (
            <PaywallScreen
              email={accountProfile.email}
              accountLabel={ACCOUNT_TYPE_LABEL[acctType]}
              onUpgrade={() => setActiveTab('plans')}
              onBack={() => setActiveTab('dashboard')}
            />
          );
        }

        // Teacher / Organization browse the material freely. A class on the
        // body lets each feature gate its own practice controls (mic, submit,
        // save) without touching navigation, scrolling, or content drill-down.
        return (
        <Suspense fallback={<LazyFallback />}>

      {/* Preview-mode banner — sticky at top of practice tabs */}
      {previewing && PREVIEWABLE_TABS.has(activeTab) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-6 py-3 flex items-center gap-3 text-sm">
          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <span className="text-amber-700 dark:text-amber-300 text-xs font-black">i</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 dark:text-amber-100">Preview mode — {ACCOUNT_TYPE_LABEL[acctType]} accounts</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Click through any material to evaluate it for your learners. Recording, submissions, and AI scoring are disabled — your activity isn't saved.
            </p>
          </div>
        </div>
      )}

      <div className={previewing && PREVIEWABLE_TABS.has(activeTab) ? 'preview-mode' : ''}>

      {activeTab === 'dashboard' && (
        <DashboardView
          variant="home"
          startingLevel={accountProfile.startingLevel}
          dashboardFilter={dashboardFilter}
          setDashboardFilter={setDashboardFilter}
          history={history}
          problemWords={problemWords}
          savedVocab={savedVocab}
          savedCustomTexts={savedCustomTexts}
          playWord={playWord}
          practicingWord={practicingWord}
          startPracticeWord={startPracticeWord}
          allVocabMap={allVocabMap}
          wordsToPracticePage={wordsToPracticePage}
          setWordsToPracticePage={setWordsToPracticePage as any}
          playHistoryAudio={playHistoryAudio}
          downloadAudio={downloadAudio}
          exercisesHistory={exercisesHistory}
          exerciseProgressFilter={exerciseProgressFilter}
          setExerciseProgressFilter={setExerciseProgressFilter}
          setActiveTab={setActiveTab as any}
          setReadingView={setReadingView as any}
          setSelectedVocabWords={setSelectedVocabWords as any}
          setActiveExercise={setActiveExercise as any}
          setShowExerciseWordSelector={setShowExerciseWordSelector as any}
          habit={habit}
          userProfile={userProfile}
          user={user}
          accountProfile={accountProfile}
          navigate={navigate as any}
        />
      )}

      {activeTab === 'vocabulary' && (
        <VocabularyView
          savedVocab={savedVocab}
          setSavedVocab={setSavedVocab}
          vocabFilter={vocabFilter}
          setVocabFilter={setVocabFilter}
          myVocabPage={myVocabPage}
          setMyVocabPage={setMyVocabPage as any}
          myVocabSearchQuery={myVocabSearchQuery}
          setMyVocabSearchQuery={setMyVocabSearchQuery}
          targetLangs={targetLangs}
          setTargetLangs={setTargetLangs as any}
          translations={translations}
          setTranslations={setTranslations as any}
          translateText={translateText}
          isTranslating={isTranslating}
          playWord={playWord}
          srsDueWords={srsDueWords}
          setSelectedVocabWords={setSelectedVocabWords}
          setShowExerciseWordSelector={setShowExerciseWordSelector}
          setActiveExercise={setActiveExercise}
          setActiveTab={setActiveTab as any}
          newVocabWord={newVocabWord}
          setNewVocabWord={setNewVocabWord}
          isAddingVocab={isAddingVocab}
          addVocabError={addVocabError}
          handleAddNewVocab={handleAddNewVocab}
          onShowModal={(w, mode) => setWordModal({ word: w, mode })}
        />
      )}

      {activeTab === 'exercises' && (
        <ExercisesView
          savedVocab={savedVocab}
          allVocabMap={allVocabMap}
          activeExercise={activeExercise}
          setActiveExercise={setActiveExercise}
          selectedVocabWords={selectedVocabWords}
          setSelectedVocabWords={setSelectedVocabWords as any}
          showExerciseWordSelector={showExerciseWordSelector}
          setShowExerciseWordSelector={setShowExerciseWordSelector}
          exerciseSourceType={exerciseSourceType}
          setExerciseSourceType={setExerciseSourceType}
          exerciseSourceLevel={exerciseSourceLevel}
          setExerciseSourceLevel={setExerciseSourceLevel}
          exerciseSourceTopic={exerciseSourceTopic}
          setExerciseSourceTopic={setExerciseSourceTopic}
          exerciseSourceCustomTextSel={exerciseSourceCustomTextSel}
          setExerciseSourceCustomTextSel={setExerciseSourceCustomTextSel}
          savedCustomTexts={savedCustomTexts}
          recordExercise={recordExercise}
          setIsExerciseCompleteModalOpen={setIsExerciseCompleteModalOpen}
          setExerciseCompleteData={setExerciseCompleteData}
        />
      )}

      {activeTab === 'lessons' && (
        <LessonsView
          level={level}
          setLevel={setLevel}
          startingLevel={accountProfile.startingLevel}
          currentTextObj={currentTextObj}
          setCurrentTextId={setCurrentTextId}
          setIsCustomMode={setIsCustomMode}
          isRecording={isRecording}
          isFinished={isFinished}
          setIsFinished={setIsFinished}
          transcript={transcript}
          setTranscript={setTranscript}
          timedMode={timedMode}
          setTimedMode={setTimedMode}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft as any}
          realtime={realtime}
          setRealtime={setRealtime}
          sourceWords={sourceWords}
          displayStatuses={displayStatuses}
          rawStatuses={rawStatuses}
          activeWordIndex={activeWordIndex}
          activeWordRef={activeWordRef as any}
          accuracy={accuracy}
          readAccuracy={readAccuracy}
          passageAccuracy={passageAccuracy}
          transcriptWords={transcriptWords}
          fontScale={fontScale}
          setFontScale={setFontScale}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          savedVocab={savedVocab}
          setSavedVocab={setSavedVocab}
          playWord={playWord}
          toggleRecording={toggleRecording}
          stopRecording={stopRecording}
          reset={reset}
          targetTime={targetTime}
          sessionAudioBlob={sessionAudioBlob}
          downloadAudio={downloadAudio}
          voskLoading={speechLoading}
          voskReady={speechReady}
          isAnalyzing={false}
          transcriptionUnavailable={transcriptionUnavailable}
          transcriptionFailed={transcriptionFailed}
          recognitionError={recognitionError}
          setRecognitionError={setRecognitionError}
          allVocabMap={allVocabMap}
          recordExercise={recordExercise}
          srsDueWords={srsDueWords}
          studentName={user?.displayName || accountProfile?.displayName || ''}
          showFeedbackModal={showFeedbackModal}
          setShowFeedbackModal={setShowFeedbackModal}
          history={history}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          topicPage={topicPage}
          setTopicPage={setTopicPage as any}
          customText={customText}
          setCustomText={setCustomText}
          savedCustomTexts={savedCustomTexts}
          setSavedCustomTexts={setSavedCustomTexts as any}
          isCustomMode={isCustomMode}
          vocabOpen={vocabOpen}
          setVocabOpen={setVocabOpen}
          clickedWordInfo={clickedWordInfo}
          setClickedWordInfo={setClickedWordInfo}
          wordModal={wordModal}
          setWordModal={setWordModal}
          handleToggleVocab={handleToggleVocab}
          handleAddVocab={handleAddVocab}
          hasNextText={hasNextText}
          hasPrevText={hasPrevText}
          handleNextText={handleNextText}
          handlePrevText={handlePrevText}
          currentAudioRef={currentAudioRef}
          playingAudioId={playingAudioId}
          setPlayingAudioId={setPlayingAudioId}
          setActiveTab={setActiveTab as any}
          setReadingView={setReadingView as any}
        />
      )}

      {activeTab === 'practice' && (
        <PracticeHub
          setActiveTab={setActiveTab as any}
          setReadingView={setReadingView as any}
        />
      )}

      {activeTab === 'ielts' && isEnglish && (
        <IELTSHub
          navigate={navigate as any}
          setActiveTab={setActiveTab as any}
        />
      )}

      {activeTab === 'reading' && readingView === 'menu' && (
        <ComprehensiveReading
          key={compReadingJump?.key}
          onBack={() => setActiveTab('practice')}
          onAddVocab={handleToggleVocab}
          savedVocab={savedVocab}
          onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})}
          initialLevel={compReadingJump?.level}
          initialPassageTitle={compReadingJump?.passageTitle}
          accountProfile={accountProfile}
        />
      )}

      {activeTab === 'reading' && readingView !== 'menu' && (
        <ReadingView
          readingView={readingView}
          setReadingView={setReadingView as any}
          setActiveTab={setActiveTab as any}
          level={level}
          setLevel={setLevel}
          history={history}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          topicPage={topicPage}
          setTopicPage={setTopicPage as any}
          customText={customText}
          setCustomText={setCustomText}
          savedCustomTexts={savedCustomTexts}
          setSavedCustomTexts={setSavedCustomTexts as any}
          isCustomMode={isCustomMode}
          setIsCustomMode={setIsCustomMode}
          isRecording={isRecording}
          isFinished={isFinished}
          setIsFinished={setIsFinished}
          setTranscript={setTranscript}
          transcript={transcript}
          timedMode={timedMode}
          setTimedMode={setTimedMode}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft as any}
          realtime={realtime}
          setRealtime={setRealtime}
          currentTextObj={currentTextObj}
          setCurrentTextId={setCurrentTextId}
          sourceWords={sourceWords}
          displayStatuses={displayStatuses}
          rawStatuses={rawStatuses}
          activeWordIndex={activeWordIndex}
          activeWordRef={activeWordRef as any}
          accuracy={accuracy}
          readAccuracy={readAccuracy}
          passageAccuracy={passageAccuracy}
          transcriptWords={transcriptWords}
          fontScale={fontScale}
          setFontScale={setFontScale}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          vocabOpen={vocabOpen}
          setVocabOpen={setVocabOpen}
          savedVocab={savedVocab}
          setSavedVocab={setSavedVocab}
          clickedWordInfo={clickedWordInfo}
          setClickedWordInfo={setClickedWordInfo}
          wordModal={wordModal}
          setWordModal={setWordModal}
          playWord={playWord}
          handleToggleVocab={handleToggleVocab}
          recognitionError={recognitionError}
          setRecognitionError={setRecognitionError}
          toggleRecording={toggleRecording}
          stopRecording={stopRecording}
          reset={reset}
          hasNextText={hasNextText}
          hasPrevText={hasPrevText}
          handleNextText={handleNextText}
          handlePrevText={handlePrevText}
          targetTime={targetTime}
          sessionAudioBlob={sessionAudioBlob}
          downloadAudio={downloadAudio}
          showFeedbackModal={showFeedbackModal}
          setShowFeedbackModal={setShowFeedbackModal}
          currentAudioRef={currentAudioRef}
          playingAudioId={playingAudioId}
          setPlayingAudioId={setPlayingAudioId}
          voskLoading={speechLoading}
          voskReady={speechReady}
          isAnalyzing={false}
          transcriptionUnavailable={transcriptionUnavailable}
          transcriptionFailed={transcriptionFailed}
        />
      )}

      {activeTab === 'teacher' && (accountProfile.role === 'teacher' || accountProfile.role === 'organization' || accountProfile.role === 'admin') && <TeacherDashboard setActiveTab={setActiveTab as any} />}
      {activeTab === 'admin' && accountProfile.role === 'admin' && <AdminPanel />}
      {activeTab === 'content' && (accountProfile.role === 'content-manager' || accountProfile.role === 'admin') && (
        <Suspense fallback={<LazyFallback />}><ContentManagerPage /></Suspense>
      )}
      {activeTab === 'organization' && (accountProfile.role === 'organization' || accountProfile.role === 'admin') && <OrganizationPanel setActiveTab={setActiveTab as any} />}
      {activeTab === 'classes' && accountProfile.role === 'student' && (
        <StudentClasses onNavigate={setActiveTab as any} onStartAssignment={handleStartAssignment} />
      )}
      {activeTab === 'profile' && (
        <ProfilePage
          user={user}
          accountProfile={accountProfile}
          darkMode={darkMode}
          onToggleDark={onToggleDark}
          onLogout={logout}
          onProfileUpdate={(updated) => setAccountProfile(updated)}
          onContentLangChange={handleContentLangChange}
          streak={habit?.globalStreak?.current ?? 0}
          xp={userProfile?.xp ?? 0}
        />
      )}
      {activeTab === 'listening' && (
        <ListeningPractice
          key={listeningJump?.key}
          onBack={() => setActiveTab('dashboard')}
          onToggleVocab={handleToggleVocab}
          savedVocab={savedVocab}
          onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})}
          initialLevel={listeningJump?.level}
          initialPassageTitle={listeningJump?.passageTitle}
          accountProfile={accountProfile}
          recordExercise={recordExercise}
          navView={appSub || undefined}
          onNavView={(v: string) => setSubPath(v ? [v] : [])}
          onIeltsBack={() => setActiveTab('ielts')}
        />
      )}
      {activeTab === 'gamification' && (
        <Gamification
          profile={userProfile}
          habit={habit}
          uid={user?.uid}
          displayName={user?.displayName || accountProfile?.displayName || undefined}
        />
      )}
      {activeTab === 'plans' && (
        <PaymentPlans
          user={user}
          currentPlan={(accountProfile as any)?.plan ?? null}
          onPlanActivated={(planId, seats) => {
            setAccountProfile(prev => prev ? {
              ...prev,
              plan: planId,
              planSeats: seats,
              planStartedAt: Date.now(),
              role: planId === 'teacher' ? 'teacher' : planId === 'organization' ? 'organization' : prev.role,
            } : prev);
          }}
        />
      )}
      {activeTab === 'story' && <InteractiveStory onBack={() => setActiveTab('reading')} onToggleVocab={handleToggleVocab} savedVocab={savedVocab} onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})} />}
      {activeTab === 'ielts-reading' && <IELTSReading onBack={() => setActiveTab(isEnglish ? 'ielts' : 'practice')} recordExercise={recordExercise} />}
      {activeTab === 'comprehensive' && (
        <ComprehensiveReading
          key={compReadingJump?.key}
          onBack={() => setActiveTab('practice')}
          onAddVocab={handleToggleVocab}
          savedVocab={savedVocab}
          onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})}
          initialLevel={compReadingJump?.level}
          initialPassageTitle={compReadingJump?.passageTitle}
          accountProfile={accountProfile}
        />
      )}
      {activeTab === 'speaking' && (
        <SpeakingHub
          key={speakingJump?.key}
          initialTopicIndex={speakingJump?.topicIndex}
          onToggleVocab={handleToggleVocab}
          savedVocab={savedVocab}
          onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})}
          navMode={appSub || undefined}
          onNavMode={(m: string) => setSubPath(m && m !== 'hub' ? [m] : [])}
          onIeltsBack={() => setActiveTab('ielts')}
        />
      )}
      {activeTab === 'writing' && (
        <WritingHub
          key={writingJump?.key}
          onBack={() => setActiveTab('dashboard')}
          initialLevel={writingJump?.level}
          initialTopicIndex={writingJump?.topicIndex}
          onToggleVocab={handleToggleVocab}
          savedVocab={savedVocab}
          onShowModal={(w: string, mode: 'dictionary' | 'translation') => setWordModal({word: w, mode})}
          navMode={appSub || undefined}
          onNavMode={(m: string) => setSubPath(m && m !== 'hub' ? [m] : [])}
          onIeltsBack={() => setActiveTab('ielts')}
        />
      )}

      {/* Mobile bottom navigation — hidden on homepage */}
      {user && accountProfile && !needsOnboarding && activeTab !== 'home' && activeTab !== 'plans' && (
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab as any}
          setReadingView={setReadingView as any}
          userRole={accountProfile.role}
          user={user}
          darkMode={darkMode}
          onToggleDark={onToggleDark}
          logout={logout}
          menuOpen={mobileMenuOpen}
          onMenuOpenChange={setMobileMenuOpen}
        />
      )}
        </div>
        </Suspense>
        );
      })()}
      </div>{/* end fade-transition wrapper */}

      {/* Feedback Modal — skipped in Lessons tab (lesson UI handles continue) */}
      {habitCelebrate && (
        <HabitCelebrateModal
          open
          onClose={() => setHabitCelebrate(null)}
          goalJustCompleted={habitCelebrate.goalJustCompleted}
          streakTicked={habitCelebrate.streakTicked}
          streak={habitCelebrate.streak}
          newBadges={habitCelebrate.newBadges}
        />
      )}

      {showFeedbackModal && activeTab !== 'lessons' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                if (currentAudioRef.current) {
                  currentAudioRef.current.pause();
                  currentAudioRef.current = null;
                }
                setPlayingAudioId(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-6">Session Complete!</h2>

            <div className="flex items-center gap-8 mb-8">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Read Accuracy</span>
                {transcriptionFailed || transcriptionUnavailable ? (
                  <span className="text-2xl font-mono font-bold tracking-tight text-amber-500">N/A</span>
                ) : (
                  <span className={`text-4xl font-black ${readAccuracy >= 80 ? 'text-emerald-500' : readAccuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{readAccuracy}%</span>
                )}
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Passage Accuracy</span>
                {transcriptionFailed || transcriptionUnavailable ? (
                  <span className="text-2xl font-mono font-bold tracking-tight text-amber-500">N/A</span>
                ) : (
                  <span className={`text-4xl font-black ${passageAccuracy >= 80 ? 'text-emerald-500' : passageAccuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{passageAccuracy}%</span>
                )}
              </div>
              <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Words Read</span>
                <span className="text-4xl font-black text-slate-800">{transcriptWords.length}</span>
              </div>
            </div>

            {(transcriptionFailed || transcriptionUnavailable) && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-700 mb-1">Accuracy unavailable</p>
                <p className="text-sm text-amber-600">
                  We could not transcribe your reading, so accuracy couldn&apos;t be calculated.
                  Your recording is saved below — you can still listen to it or download it.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {rawStatuses.some(s => s === 'incorrect' || s === 'slight_mistake') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Words to Practice</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2 overflow-x-hidden">
                    {Array.from<string>(new Set(sourceWords.filter((w, i) => rawStatuses[i] === 'incorrect' || rawStatuses[i] === 'slight_mistake'))).map((word, i) => {
                      const cleanWord = word.replace(/[^\p{L}\p{N}'’-]/gu, '');
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-zinc-300 transition-colors">
                          <div className="flex items-center gap-3 w-full min-w-0">
                            <button
                              onClick={() => playWord(word)}
                              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                            <span className="font-semibold text-slate-800 text-lg truncate flex-1 min-w-0">{cleanWord || word}</span>
                            <a
                              href={`https://dictionary.cambridge.org/dictionary/english/${cleanWord.toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-zinc-100 text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors tooltip items-center gap-2"
                              title="Pronunciation Guide"
                            >
                              <BookOpen className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h3 className="text-sm font-bold text-slate-900 mb-1">Feedback</h3>
                 <p className="text-slate-600 text-sm">
                  {transcriptionFailed || transcriptionUnavailable
                    ? "We couldn't decode a readable transcript, so accuracy is unavailable (this can happen if no speech was captured or the device's speech engine isn't supported). Your recording is saved below — listen to it to self-check."
                    : accuracy >= 90 ? "Excellent reading! You have great fluency and pronunciation." :
                    accuracy >= 70 ? "Good job! Focus on practicing the highlighted words." :
                    "Keep practicing! Try reading a bit slower to improve clarity. Click on words to hear their pronunciation."}
                 </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                 onClick={() => playHistoryAudio(currentTextObj.id)}
                 className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                 {playingAudioId === currentTextObj.id ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                 {playingAudioId === currentTextObj.id ? 'Stop Playing' : 'Listen to my reading'}
              </button>

              <button
                 onClick={() => downloadAudio(currentTextObj.id)}
                 className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                 <Download className="w-5 h-5" />
                 Download Audio
              </button>

              <button
                 onClick={() => {
                   setShowFeedbackModal(false);
                   if (isCustomMode) {
                     setReadingView('custom-entry');
                   } else {
                     setReadingView('library');
                   }
                 }}
                 className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-black active:scale-95 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                 {isCustomMode ? 'Return to Entry' : 'Return to Library'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Complete Modal */}
      {isExerciseCompleteModalOpen && exerciseCompleteData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Exercise Complete!</h2>
              <p className="text-slate-500 mb-6 capitalize">{exerciseCompleteData.type.replace('-', ' ')} session finished.</p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2">
                 {exerciseCompleteData.score !== undefined && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">Score</span>
                     <span className="font-bold text-slate-800">{exerciseCompleteData.score}</span>
                   </div>
                 )}
                 {exerciseCompleteData.memorized !== undefined && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">Memorized</span>
                     <span className="font-bold text-emerald-600">{exerciseCompleteData.memorized}</span>
                   </div>
                 )}
                 {exerciseCompleteData.mistakes && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">Mistakes</span>
                     <span className="font-bold text-rose-500">{exerciseCompleteData.mistakes.length}</span>
                   </div>
                 )}
              </div>

              <button
                onClick={() => {
                  setIsExerciseCompleteModalOpen(false);
                  setExerciseCompleteData(null);
                  if (exerciseCompleteData.mistakes && exerciseCompleteData.mistakes.length > 0) {
                     setSelectedExerciseSession(exerciseCompleteData);
                  }
                }}
                className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl transition-colors active:scale-95"
              >
                Continue
              </button>
           </div>
        </div>
      )}

      {/* Exercise Session Details Modal */}
      {selectedExerciseSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-100 max-h-[80vh] flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-slate-800 capitalize">{selectedExerciseSession.type?.replace('-', ' ') || 'Exercise'} Details</h2>
                <button onClick={() => setSelectedExerciseSession(null)} className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
                {selectedExerciseSession.data?.mistakes && selectedExerciseSession.data.mistakes.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <XCircle className="w-5 h-5 text-rose-500" />
                       Mistakes
                    </h3>
                    <div className="space-y-2">
                       {selectedExerciseSession.data.mistakes.map((word: string, i: number) => {
                         const def = (allVocabMap.get(word.toLowerCase()) || savedVocab[word.toLowerCase()]?.definition || 'Unknown definition');
                         return (
                           <div key={i} className="flex flex-col p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                             <span className="font-bold text-rose-900 flex items-center gap-2 capitalize">
                                {word}
                                <button onClick={(e) => { e.stopPropagation(); playWord(word); }} className="p-1 hover:bg-rose-200 rounded-md transition-colors text-rose-600"><Volume2 className="w-4 h-4"/></button>
                             </span>
                             {def && <span className="text-sm text-rose-700 mt-1">{def}</span>}
                           </div>
                         )
                       })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-emerald-600 font-bold">Perfect session!</p>
                  </div>
                )}

                {selectedExerciseSession.data?.correctWords && selectedExerciseSession.data.correctWords.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       Correct Words
                    </h3>
                    <div className="space-y-2">
                       {selectedExerciseSession.data.correctWords.map((word: string, i: number) => {
                         const def = (allVocabMap.get(word.toLowerCase()) || savedVocab[word.toLowerCase()]?.definition || 'Unknown definition');
                         return (
                           <div key={`cw-${i}`} className="flex flex-col p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                             <span className="font-bold text-emerald-900 flex items-center gap-2 capitalize">
                                {word}
                                <button onClick={(e) => { e.stopPropagation(); playWord(word); }} className="p-1 hover:bg-emerald-200 rounded-md transition-colors text-emerald-600"><Volume2 className="w-4 h-4"/></button>
                             </span>
                             {def && <span className="text-sm text-emerald-700 mt-1">{def}</span>}
                           </div>
                         )
                       })}
                    </div>
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

      <WordDetailsModal
        word={wordModal?.word || null}
        mode={wordModal?.mode || null}
        onClose={() => setWordModal(null)}
        savedVocab={savedVocab}
        onToggleVocab={async (w) => handleToggleVocab(w, 'From dictionary modal')}
      />

      {/* Post-payment toast */}
      {paymentToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold">
          {paymentToast}
          <button onClick={() => setPaymentToast(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Edit Mode — visible only to admin & content-manager */}
      {user && accountProfile && (accountProfile.role === 'admin' || accountProfile.role === 'content-manager') && activeTab !== 'home' && activeTab !== 'plans' && activeTab !== 'admin' && activeTab !== 'content' && (
        <>
          <EditModeToggle activeTab={activeTab} />
          <ContentEditorDrawer />
        </>
      )}
      </div>
    </div>
    </EditModeProvider>
  );
}

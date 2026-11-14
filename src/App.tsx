import { DialogSurface } from './components/DialogSurface';
import { useVosk, isMobileDevice } from './hooks/useVosk';
import { useAppRoute } from './hooks/useAppRoute';
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { CheckCircle2, Volume2, X, BookOpen, Play, XCircle, Download, StopCircle, Pencil, Flame, Target, Medal, Sparkles } from 'lucide-react';
import { accountTypeOf, isFreeUser, isPreviewMode, canPractice, canUseBites, hasUnlimitedHearts, isFreeLearningRoute, ACCOUNT_TYPE_LABEL, isBusinessRole, maxEnded } from './lib/access';
import { initializeHearts, gainHearts } from './lib/hearts/heartsStore';
import { completeDailySession } from './lib/bites/dailySession';
import { Level, ReadingText, alignWords } from './lib/reading-logic';
import { tokenizeForLang } from './lib/pronunciationProfile';
import { tokenizePassageForSpeech } from './lib/dialogueText';
import { loadLevelTexts, EMPTY_LEVEL_TEXTS, type LevelTexts } from './data/levelTexts';
import { logActivity } from './lib/activity-tracker';
import { get, set } from 'idb-keyval';
import { applySrsFromResult } from './lib/srs';
import { ProgressProvider } from './contexts/ProgressContext';
import { biteXp, goalXpForMinutes } from './lib/bites/xp';
import type { BiteResult } from './lib/bites/types';
import { getPrefs, setPrefs, useSmartyPrefs, type DailyMinutes } from './lib/smarty/prefs';
import { findCurrentLesson } from './lib/bites/biteProgress';
import { useFirebaseSync } from './useFirebaseSync';
import { AuthGate } from './features/AuthGate';
import { AgeGate } from './features/Legal';
import { Onboarding } from './features/Onboarding';
import { PaywallScreen } from './components/PaywallScreen';
import { playSound } from './lib/audio';
import { WordDetailsModal } from './components/WordDetailsModal';
import { playWord as sharedPlayWord } from './lib/speech';
import { DEFAULT_SPEECH_RATE } from './lib/speechRates';
import { lookupDictionary } from './lib/dictionary';
import { wordMatchesLearningLang } from './lib/vocabLangGuard';
import { EN_ONLY_TABS, vocabStorageKey, CONTENT_LANG_LABEL, type ContentLang } from './lib/contentLang';
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
import { earnFishPiece, MEAL_XP, MEAL_COINS } from './lib/smarty/pantry';
import { SmartyRoom } from './features/Room/SmartyRoom';
import { PracticeView } from './features/Practice/PracticeView';
import { QuestsView } from './features/Quests/QuestsView';
import { planDisplayName } from './lib/plans';
import { recordCompletion, bandFromScore40 } from './lib/completions';
import { transformArabicContent } from './lib/arabicText';
import {
  type HabitState,
  emptyHabit,
  normalizeHabit,
  visibleStreak,
  applyXpToHabit,
  leagueForXp,
  leagueMeta,
  levelForXp,
  unlockBadge,
  BADGE_META,
  LEAGUE_TIERS,
} from './lib/habitEngine';

const LEAGUE_ORDER: string[] = LEAGUE_TIERS.map((t) => t.id);
import Sidebar from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { EditModeProvider, useEditMode } from './contexts/EditModeContext';
import { useContentLang } from './contexts/ContentLangContext';
import { useUiLang } from './contexts/UiLangContext';
import { loadVocab, lookupAllSenses, vocabDbEnabled } from './lib/vocabDb';
import { ContentEditorDrawer } from './components/ContentEditorDrawer';
import { AppTopBar } from './components/AppTopBar';
import { HabitCelebrateModal } from './components/HabitCelebrateModal';
import { SmartyHost } from './components/feedback/SmartyHost';
import { SmartyLoader } from './components/feedback/SmartyLoader';
import { emitSmarty } from './lib/smarty/bus';
import { setSmartyCtx } from './lib/smarty/context';
import { shouldShowChrome } from './lib/chrome';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
import { ReminderController } from './features/Today/ReminderController';
import { prefetchStickers } from './components/stickers/loader';
import { Sticker } from './components/stickers/Sticker';
const ReadingView       = lazy(() => import('./features/ReadingView').then(m => ({ default: m.ReadingView })));
const LessonsView       = lazy(() => import('./features/Lessons').then(m => ({ default: m.LessonsView })));
import type { UiLang } from './lib/uiLang';
import { uiLangLabel } from './lib/uiLang';
import { auth, confirmPayment, submitAssignment, saveOnboarding, getStudentClasses } from './firebase';
import type { Assignment } from './firebase';

// Lazy-loaded heavy features (each becomes its own chunk)
const HomePage             = lazy(() => import('./features/HomePage').then(m => ({ default: m.HomePage })));
const SpeakingHub          = lazy(() => import('./features/SpeakingHub').then(m => ({ default: m.SpeakingHub })));
const AdminPanel           = lazy(() => import('./features/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ContentManagerPage   = lazy(() => import('./features/ContentManager').then(m => ({ default: m.ContentManager })));
const TeacherDashboard     = lazy(() => import('./features/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const WritingHub           = lazy(() => import('./features/WritingHub').then(m => ({ default: m.WritingHub })));
const Gamification         = lazy(() => import('./features/Gamification').then(m => ({ default: m.GamificationDash })));
const PaymentPlans         = lazy(() => import('./features/PaymentPlans').then(m => ({ default: m.PaymentPlans })));
const ComprehensiveReading = lazy(() => import('./features/ComprehensiveReading').then(m => ({ default: m.ComprehensiveReading })));
const ListeningPractice    = lazy(() => import('./features/ListeningPractice').then(m => ({ default: m.ListeningPractice })));
const VocabularyView       = lazy(() => import('./features/VocabularyView'));
const ExercisesView        = lazy(() => import('./features/ExercisesView'));
const StudentClasses       = lazy(() => import('./features/StudentClasses').then(m => ({ default: m.StudentClasses })));
const ProfilePage          = lazy(() => import('./features/ProfilePage').then(m => ({ default: m.ProfilePage })));
const StickerGallery       = lazy(() => import('./components/stickers/StickerGallery').then(m => ({ default: m.StickerGallery })));

const LazyFallback = () => <SmartyLoader />;

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
  const { t } = useUiLang();
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
          <Pencil className="w-3.5 h-3.5" />  {t("site.app.edit_content_64e78c")}</button>
      )}

      {/* Main toggle button */}
      <button
        onClick={toggleEditMode}
        title={editMode ? t("site.app.exit_edit_mode_a32023") : t("site.app.enter_edit_mode_7138a6")}
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
  const { contentLang, setContentLang, speechLocale, isEnglish, nativeName, dictCode, arabicDisplayMode } = useContentLang();
  const { uiLang, t, tText } = useUiLang();
  const smartyPrefs = useSmartyPrefs();
  const dailyGoalTarget = goalXpForMinutes(smartyPrefs.dailyMinutes);
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
    return { ...p, level: levelForXp(p.xp || 0), league: p.league ? leagueMeta(p.league).id : leagueForXp(p.xp || 0) };
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

  /** XP / daily-goal rewards shown inside the reading stats modal */
  const [sessionReward, setSessionReward] = useState<{
    xp: number;
    coins: number;
    goalJustCompleted?: boolean;
    streakTicked?: boolean;
    streak?: number;
    newBadges?: string[];
    dailyGoalXpEarned?: number;
    dailyGoalCompleted?: boolean;
  } | null>(null);

  /** Set when XP is earned now (not loaded from the server) so celebrations only fire for real progress. */
  const xpAwardedAt = useRef(0);
  const awardXP = (
    xpAmount: number,
    coinsAmount: number,
    opts?: { mergeIntoFeedback?: boolean; bite?: boolean },
  ) => {
    xpAwardedAt.current = Date.now();
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
      const { habit: next, goalJustCompleted, streakTicked, newBadges } = applyXpToHabit(prev, xpAmount, goalXpForMinutes(getPrefs().dailyMinutes));
      writeScopedJSON('habit_v1', next);
      const celebrate = {
        goalJustCompleted,
        streakTicked,
        streak: next.globalStreak.current,
        newBadges,
      };
      if (opts?.bite) {
        // BiteComplete owns its reward UI; don't stack a second modal over it.
        setHabitCelebrate(null);
        setSessionReward(null);
      } else if (opts?.mergeIntoFeedback) {
        setHabitCelebrate(null);
        setSessionReward({
          xp: xpAmount,
          coins: coinsAmount,
          ...celebrate,
          dailyGoalXpEarned: next.dailyGoal.xpEarned,
          dailyGoalCompleted: next.dailyGoal.completed,
        });
      } else if (goalJustCompleted || streakTicked || newBadges.length) {
        setHabitCelebrate(celebrate);
      }
      return next;
    });
  };

  const [improvedWords, setImprovedWords] = useState<Record<string, { timestamp: number }>>({});

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
      document.documentElement.classList.toggle('dark', next);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next ? '#09090b' : '#ffffff');
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', darkMode ? '#09090b' : '#ffffff');
  }, [darkMode]);

  // Load level texts asynchronously — keeps 700+ KB out of the main bundle.
  useEffect(() => {
    let cancelled = false;
    setLevelTexts(EMPTY_LEVEL_TEXTS);
    loadLevelTexts(contentLang).then(texts => { if (!cancelled) setLevelTexts(texts); });
    return () => { cancelled = true; };
  }, [contentLang]);

  useEffect(() => {
    if (!vocabDbEnabled()) return;
    loadVocab(contentLang, uiLang).catch(() => {});
  }, [contentLang, uiLang]);

  // Reload vocabulary pack when learning language changes (strictly scoped per language).
  useEffect(() => {
    try {
      const savedV = localStorage.getItem(vocabStorageKey(contentLang));
      const parsed = savedV ? JSON.parse(savedV) : {};
      const next: typeof savedVocab = {};
      for (const [word, data] of Object.entries(parsed || {})) {
        const row = data as any;
        // Drop entries tagged for a different learning language (legacy bleed).
        if (row?.lang && row.lang !== contentLang) continue;
        next[word] = { ...row, lang: contentLang };
      }
      setSavedVocab(next);
      try { localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next)); } catch { /* ignore */ }
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

  const isBiteRoute = activeTab === 'lessons' && appSub === 'bite';
  useEffect(() => {
    const lang = appPath[1];
    if (isBiteRoute && Object.hasOwn(CONTENT_LANG_LABEL, lang) && lang !== contentLang) {
      setContentLang(lang as ContentLang);
    }
  }, [isBiteRoute, appPath[1], contentLang, setContentLang]);

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

  useEffect(() => {
    if (authReady && user && accountProfile && !isPreviewMode(accountProfile)) {
      initializeHearts(userProfile.xp === 0 && Object.keys(history).length === 0);
    }
  }, [authReady, user?.uid, !!accountProfile]);

  const coinBalance = useRef(userProfile.coins);
  coinBalance.current = userProfile.coins;
  const spendCoins = (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0 || isPreviewMode(accountProfile) || coinBalance.current < amount) return false;
    coinBalance.current -= amount;
    setUserProfile(prev => {
      const next = { ...prev, coins: prev.coins - amount };
      writeScopedJSON('readmaster_profile', next);
      return next;
    });
    return true;
  };

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
  const lessonFeedbackContinueRef = useRef<(() => void) | null>(null);
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
    stickers:         'Stickers',
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
    teacher:          'Business',
    business:         'Business',
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
  // When Dodo Payments sends the user back to /?payment=success, finalize the pending
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

    const paymentId = params.get('payment_id') || params.get('paymentId') || '';
    const status = params.get('status') || '';
    if (!paymentId || !['succeeded', 'active'].includes(status)) {
      window.history.replaceState(
        { tab: activeTab, path: appPath },
        '',
        window.location.pathname + window.location.hash,
      );
      return;
    }

    const raw = sessionStorage.getItem('smarty_pending_payment');
    let pending: any = { uid: user.uid };
    if (raw) {
      try { pending = { ...JSON.parse(raw), uid: user.uid }; } catch { /* use uid-only recovery */ }
    }

    (async () => {
      try {
        const updatedProfile = await confirmPayment(pending, paymentId);
        if (pending.type === 'seats') {
          setPaymentToast(`✓ ${pending.additionalSeats} seat${pending.additionalSeats === 1 ? '' : 's'} added — total ${pending.newSeats}.`);
        } else {
          if (updatedProfile) setAccountProfile(updatedProfile);
          setPaymentToast(`✓ ${planDisplayName(pending.planId)} plan activated!`);
        }
      } catch (e) {
        console.error('Failed to finalize payment:', e);
        setPaymentToast('Payment received, but plan activation failed. Contact support.');
      } finally {
        const wasSeats = pending.type === 'seats';
        sessionStorage.removeItem('smarty_pending_payment');
        const nextTab = wasSeats ? 'business' : 'dashboard';
        navigate({ tab: nextTab as any, path: [] }, { replace: true });
        // Strip payment query params while keeping the hash route.
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({ tab: nextTab, path: [] }, '', clean);
      }
    })();
  }, [user, accountProfile]);

  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [selectedVocabWords, setSelectedVocabWords] = useState<string[]>([]);
  const [showExerciseWordSelector, setShowExerciseWordSelector] = useState<'flashcards' | 'pronunciation' | 'word-match' | null>(null);
  const [exerciseSourceType, setExerciseSourceType] = useState<'saved' | 'level' | 'topic' | 'custom'>('saved');
  const [exerciseSourceLevel, setExerciseSourceLevel] = useState<Level>('Beginner');
  const [exerciseSourceTopic, setExerciseSourceTopic] = useState<string>('');
  const [exerciseSourceCustomTextSel, setExerciseSourceCustomTextSel] = useState<string>('');
  const [defLang, setDefLangState] = useState<string>(
    () => { try { return localStorage.getItem('preferred_definition_lang') || contentLang; } catch { return contentLang; } }
  );





  const persistVocab = (next: typeof savedVocab) => {
    try { localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next)); } catch { /* ignore */ }
  };


  const [newVocabWord, setNewVocabWord] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [addVocabError, setAddVocabError] = useState('');

  const handleToggleVocab = async (word: string, fallbackDef: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (savedVocab[cleanWord]) {
      const removed = savedVocab[cleanWord];
      setSavedVocab(prev => {
        const next = { ...prev };
        delete next[cleanWord];
        persistVocab(next);
        return next;
      });
      emitSmarty({
        type: 'vocab.removed',
        word: cleanWord,
        undo: () => setSavedVocab(prev => {
          if (prev[cleanWord]) return prev;
          const next = { ...prev, [cleanWord]: removed };
          persistVocab(next);
          return next;
        }),
      });
    } else {
      handleAddVocab(cleanWord, fallbackDef);
    }
  };

  const handleAddVocab = async (word: string, fallbackDef: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (savedVocab[cleanWord]) return;
    const match = wordMatchesLearningLang(word.trim(), contentLang);
    if (!match.ok) return;
    // Optimistic: show as saved immediately, then enrich definition in background
    const placeholder = fallbackDef || '…';
    setSavedVocab(prev => {
      if (prev[cleanWord]) return prev;
      const next = { ...prev, [cleanWord]: { definition: placeholder, timestamp: Date.now(), lang: contentLang } };
      persistVocab(next);
      return next;
    });
    const savedCount = Object.keys(savedVocab).length + 1;
    if (savedCount === 10 || savedCount === 50 || savedCount % 25 === 0) emitSmarty({ type: 'vocab.milestone', n: savedCount });
    else emitSmarty({ type: 'vocab.saved', word: cleanWord });
    try {
      if (vocabDbEnabled()) {
        await loadVocab(contentLang, defLang);
        const cards = lookupAllSenses(cleanWord, { knownLang: defLang, limit: 4 });
        if (cards.length) {
          setSavedVocab(prev => {
            if (!prev[cleanWord]) return prev;
            const definition = cards.length === 1
              ? cards[0].definition
              : cards.map((c) => `(${c.pos}) ${c.definition}`).join(' · ');
            const next = {
              ...prev,
              [cleanWord]: {
                ...prev[cleanWord],
                definition,
                senseId: cards[0].senseId,
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
    const displayWord = newVocabWord.trim().replace(/\s+/g, ' ');
    const cleanWord = displayWord.toLocaleLowerCase();
    const langCheck = wordMatchesLearningLang(displayWord, contentLang);
    if (langCheck.ok === false) {
      setAddVocabError(langCheck.reason);
      return;
    }
    if (savedVocab[cleanWord]) {
      setAddVocabError(`"${displayWord}" is already in your ${CONTENT_LANG_LABEL[contentLang]} vocabulary.`);
      return;
    }
    setIsAddingVocab(true);
    setAddVocabError('');
    try {
      let definition = '';
      let senseId: string | undefined;
      let pos: string | undefined;
      if (vocabDbEnabled()) {
        await loadVocab(contentLang, defLang);
        const cards = lookupAllSenses(displayWord, { knownLang: defLang, limit: 6 });
        if (cards.length) {
          senseId = cards[0].senseId;
          pos = cards[0].pos;
          definition = cards.length === 1
            ? cards[0].definition
            : cards.map((c) => `(${c.pos}) ${c.definition}`).join(' · ');
        }
      }
      if (!definition) {
        const result = await lookupDictionary(displayWord, contentLang, defLang);
        if (result?.meanings?.length) {
          pos = pos || result.meanings[0].partOfSpeech;
          definition = result.meanings
            .flatMap((m) => m.definitions.map((d) => `(${m.partOfSpeech}) ${d.definition}`))
            .slice(0, 4)
            .join(' · ');
        }
      }
      if (!definition) {
        try {
          const { translateWithCache } = await import('./lib/networkCache');
          // Gloss into the UI/definition language so the learner can read it.
          const glossLang = defLang && defLang !== contentLang ? defLang : 'en';
          const gloss = await translateWithCache(displayWord, contentLang, glossLang);
          if (gloss) definition = gloss;
        } catch { /* ignore */ }
      }
      if (!definition) definition = 'Saved word / phrase';
      setSavedVocab(prev => {
        const next = {
          ...prev,
          [cleanWord]: {
            definition,
            timestamp: Date.now(),
            lang: contentLang,
            ...(senseId ? { senseId } : {}),
            ...(pos ? { pos } : {}),
            displayWord,
          },
        };
        persistVocab(next);
        return next;
      });
      setNewVocabWord('');
    } catch {
      setAddVocabError('Network error. Please try again.');
    } finally {
      setIsAddingVocab(false);
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
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_SPEECH_RATE);
  const [customText, setCustomText] = useState('');
  const [savedCustomTexts, setSavedCustomTexts] = useState<string[]>(
    () => { try { return JSON.parse(localStorage.getItem('readmaster_saved_custom_texts') || '[]'); } catch { return []; } }
  );
  const [isCustomMode, setIsCustomMode] = useState(false);
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

  // Per-account lists: reload when the signed-in account changes (startup reads ran before sign-in).
  const storageUser = user?.uid ?? null;

  // "My class" only appears once an organization has put this student in a class.
  const [inClass, setInClass] = useState(false);
  useEffect(() => {
    if (!user?.uid || accountProfile?.role !== 'student') { setInClass(false); return; }
    let cancelled = false;
    getStudentClasses(user.uid).then((list) => { if (!cancelled) setInClass(list.length > 0); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid, accountProfile?.role]);
  useEffect(() => {
    setExercisesHistory(readScopedJSON<any[]>('readmaster_exercises_history', []));
    setSavedCustomTexts(readScopedJSON<string[]>('readmaster_saved_custom_texts', []));
  }, [storageUser]);

  const [selectedExerciseSession, setSelectedExerciseSession] = useState<any | null>(null);

  const [isExerciseCompleteModalOpen, setIsExerciseCompleteModalOpen] = useState(false);
  const [exerciseCompleteData, setExerciseCompleteData] = useState<any | null>(null);

  const recordExercise = (type: string, data: any = {}) => {
     const scoreXP = data.score ? Math.min(250, data.score * 10) : 50;
     // Coins come from tests and feeding Smarty, not from vocabulary games.
     awardXP(scoreXP, 0);
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

     setSavedVocab(prev => {
       const next = applySrsFromResult(prev, data);
       if (next !== prev) persistVocab(next);
       return next;
     });
  };

  // IELTS has been removed and Exercises now live in Practice: old links go to Practice.
  useEffect(() => {
    // Exercises open from Practice: once you leave the word picker or finish, you're back in Practice.
    if (activeTab === 'exercises' && !activeExercise && !showExerciseWordSelector && !isExerciseCompleteModalOpen) { setActiveTab('practice' as any); return; }
    const ieltsView = activeTab.startsWith('ielts') || ((activeTab === 'speaking' || activeTab === 'writing' || activeTab === 'listening') && appPath[0] === 'ielts');
    if (ieltsView) setActiveTab('practice' as any);
  }, [activeTab, appPath, activeExercise, showExerciseWordSelector, isExerciseCompleteModalOpen]);

  const awardBiteXP = (result: BiteResult, title: string) => {
    const goal = goalXpForMinutes(getPrefs().dailyMinutes);
    const preview = isPreviewMode(accountProfile);
    const claim = !preview && result.def.kind === 'today'
      ? completeDailySession(contentLang, result.def.date!, result.accuracy) : null;
    // A unit test is any bite of a unit's last lesson (units are 10 lessons).
    const unitLessons = (Object.values(LEVEL_TEXTS) as ReadingText[][]).find((list) => list.some((tx) => tx.id === result.def.passageId)) ?? [];
    const at = unitLessons.findIndex((tx) => tx.id === result.def.passageId);
    const unitTest = at >= 0 && (at % 10 === 9 || at === unitLessons.length - 1);
    const reward = preview || (claim && !claim.xp) ? { xp: 0, coins: 0 } : biteXp(result.def.kind, result.accuracy, result.perfect, unitTest);
    const heartGained = !preview && !hasUnlimitedHearts(accountProfile) && (claim?.heart || result.def.kind === 'heart-practice') ? gainHearts(1) : 0;
    const next = applyXpToHabit(habit, reward.xp, goal).habit;
    // Every bite that earns XP adds a piece of Smarty's fish (4 pieces = a meal to feed him).
    const fish = !preview && reward.xp > 0 ? earnFishPiece() : null;
    if (!preview) {
      if (reward.xp > 0) awardXP(reward.xp, reward.coins, { bite: true });
      recordCompletion('lesson-bite', {
        title, accuracy: result.accuracy, contentLang,
        data: { biteId: result.def.id, passageId: result.def.passageId, kind: result.def.kind, xp: reward.xp, coins: reward.coins, ms: result.ms, correctWords: result.correctWords, mistakes: result.mistakes, ...activityLangStamp(contentLang) },
      });
      setSavedVocab(prev => {
        const updated = applySrsFromResult(prev, result);
        if (updated !== prev) persistVocab(updated);
        return updated;
      });
      if (result.mistakes.length) setProblemWords(prev => {
        const updated = { ...prev };
        for (const word of new Set(result.mistakes)) updated[word] = { count: (prev[word]?.count ?? 0) + 1, lastMissed: Date.now() };
        writeScopedJSON('readmaster_problem_words', updated);
        return updated;
      });
      trackActivity();
      trackExerciseStreak();
      bumpWeeklyGoal('exercises');
    }
    return { xp: reward.xp, xpToday: next.dailyGoal.xpEarned, goal, streak: next.globalStreak.current, goalDone: next.dailyGoal.completed, heartGained, dailyReplay: !!claim && !claim.xp,
      fish: fish ? { part: fish.part, mealCompleted: fish.mealCompleted, pieces: fish.state.pieces, meals: fish.state.meals } : undefined };
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

  const isRecordingRef = useRef(isRecording);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);


  const currentTextObj = useMemo<ReadingText>(() => {
    if (isBiteRoute) {
      // Deep links and browser Back select the route's passage across all levels.
      return (Object.values(LEVEL_TEXTS) as ReadingText[][]).flat().find(text => text.id === appPath[2])
        ?? { id: '__loading__', title: 'Loading…', text: '', vocabulary: [], targetSeconds: 60 };
    }
    if (isCustomMode && customText.trim()) {
      return {
        id: 'custom-text',
        title: 'Custom Practice',
        text: customText,
        vocabulary: [],
        targetSeconds: 60,
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
  }, [level, currentTextId, history, isCustomMode, customText, LEVEL_TEXTS, contentLang, isBiteRoute, appPath[2]]);

  const displayCurrentTextObj = useMemo(
    () => transformArabicContent(currentTextObj, contentLang, arabicDisplayMode),
    [currentTextObj, contentLang, arabicDisplayMode],
  );

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
  const sourceText = displayCurrentTextObj.text;
  const sourceWords = useMemo(
    () =>
      tokenizePassageForSpeech(
        sourceText,
        contentLang,
        displayCurrentTextObj.format,
      ),
    [sourceText, contentLang, displayCurrentTextObj.format],
  );
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

        if (!isBiteRoute) awardXP(finalAccuracy * 2, finalAccuracy > 80 ? 10 : 5, { mergeIntoFeedback: true });
        trackActivity();
        try {
          if (!isBiteRoute) recordCompletion('reading-pronunciation', {
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
          if (!isBiteRoute) logActivity({
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
    setShowFeedbackModal(!isBiteRoute);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!speechReady) {
      setRecognitionError(voskError || t("site.app.speech_recognition_model_is_still_a98ff7"));
      return;
    }

    setTranscript('');
    finalTranscriptRef.current = '';
    setIsFinished(false);
    setShowFeedbackModal(false);
    setSessionReward(null);
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
      setRecognitionError(t("site.app.failed_to_access_microphone_or_677726"));
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

  // Clear stale read-aloud results on direct links, Back/Forward, and bite exit.
  const lastBiteRoute = useRef('');
  const biteRouteKey = isBiteRoute ? appPath.join('/') : '';
  useEffect(() => {
    if (lastBiteRoute.current === biteRouteKey) return;
    lastBiteRoute.current = biteRouteKey;
    reset();
    setShowFeedbackModal(false);
    setSessionReward(null);
  }, [biteRouteKey]); // The route transition, rather than reading-state changes, resets a session.

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
        emitSmarty({ type: 'download' });
      }
    } catch(e) { console.error("Error downloading audio", e); }
  };

  const playWord = (word: string) => {
    sharedPlayWord(word, speechRate, speechLocale);
  };

  const handleContentLangChange = useCallback((lang: ContentLang) => {
    emitSmarty({ type: 'lang.switch', to: uiLangLabel(lang) });
    setReadingView('menu');
    setActiveTab(prev => (EN_ONLY_TABS.has(prev) ? 'dashboard' : prev));
  }, []);

  const needsOnboarding = !!(
    accountProfile &&
    accountProfile.role === 'student' &&
    !accountProfile.onboardingCompletedAt &&
    Object.keys(history).length === 0
  );

  // ── Smarty: keep his knowledge of the learner fresh + celebrate real progress ──
  useEffect(() => {
    const weak = (Object.entries(problemWords) as [string, { count: number; lastMissed: number }][])
      .sort((a, b) => (b[1].count - a[1].count) || (b[1].lastMissed - a[1].lastMissed))
      .slice(0, 3).map(([w]) => w);
    setSmartyCtx({
      displayName: accountProfile?.displayName || user?.displayName || undefined,
      streak: visibleStreak(normalizeHabit(habit)),
      xpToday: habit.dailyGoal.xpEarned,
      goalDone: habit.dailyGoal.completed,
      weakWords: weak,
      isMax: canPractice(accountProfile) && !isPreviewMode(accountProfile),
      createdAt: accountProfile?.createdAt,
    });
  }, [accountProfile, user, habit, problemWords]);

  // Welcome back after a break (once per app session, after the account has loaded).
  const greetedReturn = useRef(false);
  useEffect(() => {
    if (greetedReturn.current || !authReady || !user || !accountProfile) return;
    greetedReturn.current = true;
    const last = habit.globalStreak.lastDate;
    if (!last) return;
    const days = Math.round((Date.now() - Date.parse(`${last}T12:00:00`)) / 86400000);
    if (days >= 3) window.setTimeout(() => emitSmarty({ type: 'return', daysAway: days }), 1500);
  }, [authReady, user, accountProfile, habit.globalStreak.lastDate]);

  const celebrated = useRef<{ level: number; league: string; streak: number; badges: number } | null>(null);
  useEffect(() => {
    const now = { level: userProfile.level, league: userProfile.league, streak: habit.globalStreak.current, badges: habit.badges.length };
    const prev = celebrated.current;
    celebrated.current = now;
    // Only celebrate changes caused by XP earned in the last few seconds (not server loads).
    if (!prev || Date.now() - xpAwardedAt.current > 4000) return;
    if (now.level > prev.level) emitSmarty({ type: 'xp.levelUp', level: now.level });
    if (now.league !== prev.league && LEAGUE_ORDER.indexOf(now.league) > LEAGUE_ORDER.indexOf(prev.league)) emitSmarty({ type: 'league.promoted', to: now.league });
    if (now.streak > prev.streak && [7, 30, 100, 365].includes(now.streak)) emitSmarty({ type: 'streak.milestone', n: now.streak });
    if (now.badges > prev.badges) emitSmarty({ type: 'badge', id: habit.badges[habit.badges.length - 1] });
  }, [userProfile.level, userProfile.league, habit.globalStreak.current, habit.badges]);

  // Warm the hot sticker chunks (moods + answer feedback) once the learner is in.
  useEffect(() => { if (user) prefetchStickers(); }, [user]);

  const showChrome = shouldShowChrome({
    signedIn: !!user, hasProfile: !!accountProfile, needsOnboarding, tab: activeTab, path: appPath,
  }) && !(activeTab === 'exercises' && activeExercise); // a running exercise takes the whole screen

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
    preferredName: string;
    dailyMinutes: DailyMinutes;
  }) => {
    if (!user) throw new Error('Sign in to save onboarding');
    // Resolve content before marking setup complete, including a newly selected language.
    const texts = result.startLessons ? await loadLevelTexts(result.contentLang) : null;
    const first = texts ? findCurrentLesson(result.contentLang, texts[result.startingLevel]) : null;
    const completedAt = Date.now();
    await saveOnboarding(user.uid, {
      startingLevel: result.startingLevel,
      learningGoal: result.goal,
      onboardingCompletedAt: completedAt,
      dailyMinutes: result.dailyMinutes,
    });
    setPrefs({ preferredName: result.preferredName, dailyMinutes: result.dailyMinutes });
    setLevel(result.startingLevel);
    appliedStartingLevel.current = true;
    const nextProfile = accountProfile ? {
      ...accountProfile,
      startingLevel: result.startingLevel,
      learningGoal: result.goal,
      onboardingCompletedAt: completedAt,
      dailyMinutes: result.dailyMinutes,
    } : accountProfile;
    if (nextProfile) setAccountProfile(nextProfile);
    if (result.startLessons && canUseBites(nextProfile)) {
      navigate({ tab: 'lessons', path: first ? ['bite', result.contentLang, first.text.id, String(first.bite)] : ['path'] });
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <ProgressProvider value={{ userProfile, habit, contentLang, previewMode: isPreviewMode(accountProfile), unlimitedHearts: hasUnlimitedHearts(accountProfile), accountProfile, savedVocab, problemWords, history, level, navigate, spendCoins, saveWord: handleAddVocab, awardBiteXP }}>
    <EditModeProvider>
      <ReminderController enabled={!!user && authReady && !!accountProfile && !needsOnboarding} />
    <div className="h-dvh bg-white dark:bg-zinc-950 flex font-sans text-slate-900 dark:text-zinc-100 overflow-hidden">

      {/* Sidebar — only for fully authenticated users AND not on homepage */}
      {showChrome && (
        <Sidebar
          inClass={inClass}
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
      {showChrome && (
        <div className="lg:hidden">
          <AppTopBar
            activeTab={activeTab}
            title={tText(TAB_TITLES[activeTab] || '')}
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
      <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-y-contain transition-opacity duration-150 ${tabTransit ? 'opacity-0' : 'opacity-100'} ${showChrome ? 'pb-[var(--se-mobile-nav)]' : ''}`}>
      {activeTab === 'stickers' && import.meta.env.DEV && !user ? (
        /* Dev-only: sticker gallery without signing in */
        <Suspense fallback={<LazyFallback />}><StickerGallery /></Suspense>
      ) : activeTab === 'home' && !(user && accountProfile && needsOnboarding) ? (
        /* Home page — always public */
        <Suspense fallback={<LazyFallback />}>
          <HomePage
            key={uiLang}
            user={user}
            loginWithGoogle={loginWithGoogle}
            requestSubscribe={requestLoginThenPlans}
            setActiveTab={setActiveTab as any}
            setReadingView={setReadingView as any}
            darkMode={darkMode}
            onToggleDark={onToggleDark}
          />
        </Suspense>
      ) : !authReady ? (
        /* Resolving auth — brief spinner */
        <SmartyLoader className="" />
      ) : !user ? (
        /* Not signed in — show auth screen */
        <AuthGate loginWithGoogle={loginWithGoogle} />
      ) : !accountProfile ? (
        /* Signed in but profile missing — should be rare after fallback; show retry */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <SmartyLoader className="" delayMs={0} sticker="pers.dramatic-entrance" size={150} />
          <p className="text-sm text-zinc-500 max-w-sm">{t('smarty.connecting')}</p>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-700 underline underline-offset-2"
            onClick={() => window.location.reload()}
          >
            {t("site.app.refresh_56e3ba")}</button>
        </div>
      ) : accountProfile.role !== 'admin' && (accountProfile as any).agePolicyVersion !== 1 ? (
        <AgeGate onReady={() => window.location.reload()} />
      ) : needsOnboarding && activeTab !== 'plans' ? (
        <Onboarding
          canStartLessons={canUseBites(accountProfile)}
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
          'story', 'ielts-reading', 'ielts-full-mock', 'comprehensive', 'vocabulary',
        ]);

        // Free Users see a lock screen on every feature tab.
        if (free && !ALWAYS_ALLOWED.has(activeTab) && !(canUseBites(accountProfile) && isFreeLearningRoute(activeTab, appPath))) {
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
        <ErrorBoundary resetKey={activeTab} onHome={() => setActiveTab('dashboard')}>
        <Suspense fallback={<LazyFallback />}>

      {/* Preview-mode banner — sticky at top of practice tabs */}
      {previewing && PREVIEWABLE_TABS.has(activeTab) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-6 py-3 flex items-center gap-3 text-sm">
          <Sticker id="premium.trial-activated" size={44} mode="once" className="shrink-0 -my-2" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 dark:text-amber-100">{t("site.app.preview_mode_2b0258")}{ACCOUNT_TYPE_LABEL[acctType]}  {t("site.app.accounts_10db27")}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("site.app.click_through_any_material_to_2f9f57")}</p>
          </div>
        </div>
      )}

      <div className={previewing && PREVIEWABLE_TABS.has(activeTab) ? 'preview-mode' : ''}>

      {(activeTab === 'dashboard' || (activeTab === 'profile' && !appPath[0])) && user && accountProfile && (
        <SmartyRoom
          xp={userProfile?.xp ?? 0}
          league={userProfile?.league ?? 'Bronze'}
          canTalk={canPractice(accountProfile) && !isPreviewMode(accountProfile)}
          showIelts={false}
          onMealEaten={() => { if (!isPreviewMode(accountProfile)) awardXP(MEAL_XP, MEAL_COINS, { bite: true }); }}
          onOpenSettings={() => navigate({ tab: 'profile', path: ['settings'] })}
          onOpenPlans={() => setActiveTab('plans' as any)}
        />
      )}


      {activeTab === 'vocabulary' && (
        <VocabularyView
          savedVocab={savedVocab}
          setSavedVocab={setSavedVocab}
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
          onReview={() => navigate({ tab: 'practice', path: ['review'] })}
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
        />
      )}

      {activeTab === 'lessons' && (
        <LessonsView
          path={appPath}
          navigatePath={setSubPath}
          level={level}
          setLevel={setLevel}
          startingLevel={accountProfile.startingLevel}
          currentTextObj={displayCurrentTextObj}
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
          feedbackContinueRef={lessonFeedbackContinueRef}
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

      {activeTab === 'quests' && (
        <QuestsView xp={userProfile?.xp ?? 0} league={userProfile?.league ?? 'Bronze'} />
      )}

      {activeTab === 'practice' && (
        <PracticeView path={appPath} navigatePath={(path) => navigate({ tab: 'practice', path })}
          onOpenExercise={(id) => { setActiveExercise(null); setSelectedVocabWords([]); setShowExerciseWordSelector(id as any); setActiveTab('exercises' as any); }} />
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
          currentTextObj={displayCurrentTextObj}
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

      {activeTab === 'business' && (isBusinessRole(accountProfile.role) || accountProfile.role === 'admin') && <TeacherDashboard setActiveTab={setActiveTab as any} />}
      {activeTab === 'admin' && accountProfile.role === 'admin' && <AdminPanel />}
      {activeTab === 'content' && (accountProfile.role === 'content-manager' || accountProfile.role === 'admin') && (
        <Suspense fallback={<LazyFallback />}><ContentManagerPage /></Suspense>
      )}
      {activeTab === 'classes' && accountProfile.role === 'student' && (
        <StudentClasses onNavigate={setActiveTab as any} onStartAssignment={handleStartAssignment} />
      )}
      {activeTab === 'stickers' && (accountProfile.role === 'admin' || accountProfile.role === 'content-manager' || import.meta.env.DEV) && (
        <StickerGallery />
      )}
      {activeTab === 'profile' && appPath[0] === 'settings' && (
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
          league={userProfile?.league}
          badges={habit?.badges?.length ?? 0}
          path={appPath}
          onNavigate={(path) => navigate({ tab: 'profile', path })}
          onOpenTab={(tab) => setActiveTab(tab)}
          onMealEaten={() => { if (!isPreviewMode(accountProfile)) awardXP(MEAL_XP, MEAL_COINS, { bite: true }); }}
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
          currentPlan={maxEnded(accountProfile) ? null : (accountProfile as any)?.plan ?? null}
          profile={accountProfile}
          onProfileChange={(next) => setAccountProfile(prev => prev ? { ...prev, ...next } as typeof prev : prev)}
          onPlanActivated={(planId, seats, languages) => {
            setAccountProfile(prev => prev ? {
              ...prev,
              plan: planId,
              planSeats: seats,
              planLanguages: languages ?? 1,
              planStartedAt: Date.now(),
              role: planId === 'business' ? 'business' : ['admin', 'content-manager'].includes(prev.role) ? prev.role : 'student',
            } : prev);
          }}
        />
      )}
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
          startingLevel={accountProfile.startingLevel}
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
          startingLevel={accountProfile.startingLevel}
        />
      )}

      {/* Mobile bottom navigation — hidden on homepage */}
      {showChrome && (
        <MobileNav
          inClass={inClass}
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
        </ErrorBoundary>
        );
      })()}
      </div>{/* end fade-transition wrapper */}

      {/* Smarty: floating reactions, toasts and big celebrations */}
      <SmartyHost
        signedIn={!!(user && accountProfile) || (import.meta.env.DEV && activeTab === 'stickers')}
        stageEnabled={showChrome || (import.meta.env.DEV && activeTab === 'stickers')}
      />

      {/* Feedback Modal — skipped in Lessons tab (lesson UI handles continue) */}
      {habitCelebrate && !showFeedbackModal && !sessionReward && (
        <HabitCelebrateModal
          open
          onClose={() => setHabitCelebrate(null)}
          goalJustCompleted={habitCelebrate.goalJustCompleted}
          streakTicked={habitCelebrate.streakTicked}
          streak={habitCelebrate.streak}
          newBadges={habitCelebrate.newBadges}
        />
      )}

      {showFeedbackModal && (
        <DialogSurface onClose={() => setShowFeedbackModal(false)} className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200 bg-zinc-900/55 backdrop-blur-[2px]">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900">
            <button aria-label={t('a11y.close')}
              onClick={() => {
                setShowFeedbackModal(false);
                setSessionReward(null);
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

            <h2 className="font-serif text-2xl font-extrabold text-slate-900 mb-6">{t("site.app.session_complete_c001a7")}</h2>

            <div className="flex items-center gap-8 mb-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t("site.app.read_accuracy_04ba3a")}</span>
                {transcriptionFailed || transcriptionUnavailable ? (
                  <span className="text-2xl font-mono font-bold tracking-tight text-amber-500">{t("site.app.na_08d2e9")}</span>
                ) : (
                  <span className={`text-4xl font-black ${readAccuracy >= 80 ? 'text-emerald-500' : readAccuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{readAccuracy}%</span>
                )}
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t("site.app.passage_accuracy_7ea618")}</span>
                {transcriptionFailed || transcriptionUnavailable ? (
                  <span className="text-2xl font-mono font-bold tracking-tight text-amber-500">{t("site.app.na_08d2e9")}</span>
                ) : (
                  <span className={`text-4xl font-black ${passageAccuracy >= 80 ? 'text-emerald-500' : passageAccuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{passageAccuracy}%</span>
                )}
              </div>
              <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t("site.app.words_read_bf9cd2")}</span>
                <span className="text-4xl font-black text-slate-800">{transcriptWords.length}</span>
              </div>
            </div>

            {sessionReward && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 border border-amber-100 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t("site.app.rewards_2f4f4b")}</div>
                  <div className="text-sm font-bold text-amber-800">
                    +{sessionReward.xp}  {t("site.app.xp_fa2e31")}{sessionReward.coins}  {t("site.app.coins_c2cc5f")}</div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />  {t("site.app.daily_goal_55da47")}</span>
                    <span>
                      {Math.min(sessionReward.dailyGoalXpEarned ?? 0, dailyGoalTarget)}/{dailyGoalTarget} XP
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/90 rounded-full overflow-hidden border border-amber-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sessionReward.dailyGoalCompleted ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                      style={{ width: `${Math.min(100, ((sessionReward.dailyGoalXpEarned ?? 0) / dailyGoalTarget) * 100)}%` }}
                    />
                  </div>
                </div>
                {sessionReward.goalJustCompleted && (
                  <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />  {t("site.app.daily_goal_complete_8cd2dd")}</p>
                )}
                {sessionReward.streakTicked && sessionReward.streak != null && sessionReward.streak > 0 && (
                  <p className="text-sm font-semibold text-orange-600 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" /> {sessionReward.streak}{t("site.app.day_streak_6df0e5")}</p>
                )}
                {(sessionReward.newBadges?.length ?? 0) > 0 && (
                  <div className="space-y-2 pt-1">
                    {sessionReward.newBadges!.map(id => (
                      <div key={id} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100/80 border border-amber-200 text-left">
                        <Medal className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-amber-900 text-xs">{tText(BADGE_META[id]?.label || id)}</div>
                          <div className="text-[11px] text-amber-800/80">{tText(BADGE_META[id]?.desc || '')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(transcriptionFailed || transcriptionUnavailable) && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-700 mb-1">{t("site.app.accuracy_unavailable_b2cbe7")}</p>
                <p className="text-sm text-amber-600">
                  {t("site.app.we_could_not_transcribe_your_a9294b")}</p>
              </div>
            )}

            <div className="space-y-6">
              {rawStatuses.some(s => s === 'incorrect' || s === 'slight_mistake') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t("site.app.words_to_practice_75754a")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2 overflow-x-hidden">
                    {Array.from<string>(new Set(sourceWords.filter((w, i) => rawStatuses[i] === 'incorrect' || rawStatuses[i] === 'slight_mistake'))).map((word, i) => {
                      const cleanWord = word.replace(/[^\p{L}\p{N}'’-]/gu, '');
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-slate-200 hover:border-zinc-300 transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
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
                              title={t("site.app.pronunciation_guide_604551")}
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

               <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                 <h3 className="text-sm font-bold text-slate-900 mb-1">{t("site.app.feedback_c8d767")}</h3>
                 <p className="text-slate-600 text-sm">
                  {transcriptionFailed || transcriptionUnavailable
                    ? t("site.app.we_couldnt_decode_a_readable_85fa61")
                    : accuracy >= 90 ? t("site.app.excellent_reading_you_have_great_1b5097") :
                    accuracy >= 70 ? t("site.app.good_job_focus_on_practicing_e861f3") :
                    t("site.app.keep_practicing_try_reading_a_11ed5a")}
                 </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                 onClick={() => playHistoryAudio(currentTextObj.id)}
                 className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                 {playingAudioId === currentTextObj.id ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                 {playingAudioId === currentTextObj.id ? t("site.app.stop_playing_91dc50") : t("site.app.listen_to_my_reading_08de80")}
              </button>

              <button
                 onClick={() => downloadAudio(currentTextObj.id)}
                 className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                 <Download className="w-5 h-5" />
                 {t("site.app.download_audio_9b36f9")}</button>

              <button
                 onClick={() => {
                   setShowFeedbackModal(false);
                   setSessionReward(null);
                   if (activeTab === 'lessons') {
                     lessonFeedbackContinueRef.current?.();
                   } else if (isCustomMode) {
                     setReadingView('custom-entry');
                   } else {
                     setReadingView('library');
                   }
                 }}
                 className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-black text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
              >
                 {activeTab === 'lessons'
                   ? t("site.app.continue_to_exercises_318bcb")
                   : isCustomMode
                     ? t("site.app.return_to_entry_9a75fa")
                     : t("site.app.return_to_library_0b0fb0")}
              </button>
            </div>
          </div>
        </DialogSurface>
      )}

      {/* Exercise Complete Modal */}
      {isExerciseCompleteModalOpen && exerciseCompleteData && (
        <DialogSurface onClose={() => setIsExerciseCompleteModalOpen(false)} className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-zinc-900/55 backdrop-blur-[2px]">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center transform transition-all animate-in zoom-in-95 duration-200 border-2 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("site.app.exercise_complete_8cdae8")}</h2>
              <p className="text-slate-500 mb-6 capitalize">{exerciseCompleteData.type.replace('-', ' ')}  {t("site.app.session_finished_2e441e")}</p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2">
                 {exerciseCompleteData.score !== undefined && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">{t("common.score")}</span>
                     <span className="font-bold text-slate-800">{exerciseCompleteData.score}</span>
                   </div>
                 )}
                 {exerciseCompleteData.memorized !== undefined && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">{t("site.app.memorized_ab3c16")}</span>
                     <span className="font-bold text-emerald-600">{exerciseCompleteData.memorized}</span>
                   </div>
                 )}
                 {exerciseCompleteData.mistakes && (
                   <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                     <span className="text-slate-500 font-medium">{t("site.app.mistakes_7868f6")}</span>
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
                className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
              >
                {t("path.continueBite")}</button>
           </div>
        </DialogSurface>
      )}

      {/* Exercise Session Details Modal */}
      {selectedExerciseSession && (
        <DialogSurface onClose={() => setSelectedExerciseSession(null)} className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-zinc-900/55 backdrop-blur-[2px]">
           <div className="bg-white rounded-3xl max-w-lg w-full border-2 max-h-[80vh] flex flex-col overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="font-serif text-xl font-extrabold text-slate-800 capitalize">{selectedExerciseSession.type?.replace('-', ' ') || t("site.app.exercise_20863c")}  {t("site.app.details_dc3dec")}</h2>
                <button aria-label={t('a11y.close')} onClick={() => setSelectedExerciseSession(null)} className="p-2 rounded-xl border-2 border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
                {selectedExerciseSession.data?.mistakes && selectedExerciseSession.data.mistakes.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <XCircle className="w-5 h-5 text-rose-500" />
                       {t("site.app.mistakes_7868f6")}</h3>
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
                    <p className="text-emerald-600 font-bold">{t("site.app.perfect_session_55e16b")}</p>
                  </div>
                )}

                {selectedExerciseSession.data?.correctWords && selectedExerciseSession.data.correctWords.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       {t("site.app.correct_words_cc6f83")}</h3>
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
        </DialogSurface>
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
    </ProgressProvider>
  );
}

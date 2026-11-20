import React, { useEffect, useRef, useState } from 'react';
import {
  auth,
  ensureUserProfile,
  fallbackAccountProfile,
  loginWithGoogle,
  logout,
  User,
  UserAccountProfile,
} from './firebase';
import { apiRequest, dataRequest } from './lib/selfHostedApi';
import { syncVocabulary, vocabularyChanges } from './lib/vocabularySync';
import { type ContentLang } from './lib/contentLang';
import { setStorageUid, readScopedJSON, writeScopedJSON } from './lib/userStorage';
import { isBusinessRole } from './lib/access';
import { hydrateLessonUnlocksFromCloud } from './lib/lessonProgress';
import { hydrateCompletionsFromCloud } from './lib/completions';
import { applySyncedStores, syncedSnapshot, subscribeSyncedStores } from './lib/syncedStores';
import './lib/smarty/prefs';
import './lib/hearts/heartsStore';
import './lib/smarty/pantry';
import './lib/smarty/room';
import './lib/bites/dailySession';
import './lib/bites/sections';
import './lib/questState';
import './lib/practiceMastery';
import './lib/unitOnePilot/progress';
import './lib/workshop/store';
import './lib/house/store';
import { type HabitState, normalizeHabit, emptyHabit, leagueForXp, levelForXp, leagueMeta } from './lib/habitEngine';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefined(item)]),
  ) as T;
}

/** Last account signed in on this browser (to spot an account switch on a shared device). */
const LAST_UID_KEY = 'smarty_last_uid';

async function loadVocab(uid: string, lang: ContentLang): Promise<Record<string, any>> {
  return dataRequest<Record<string, any>>('vocab.list', { uid, lang });
}

export type UserProfileState = { xp: number; coins: number; level: number; league: string };

export function useFirebaseSync(
  streak: any,
  setStreak: React.Dispatch<React.SetStateAction<any>>,
  history: any,
  setHistory: React.Dispatch<React.SetStateAction<any>>,
  problemWords: any,
  setProblemWords: React.Dispatch<React.SetStateAction<any>>,
  improvedWords: any,
  setImprovedWords: React.Dispatch<React.SetStateAction<any>>,
  savedVocab: any,
  setSavedVocab: React.Dispatch<React.SetStateAction<any>>,
  contentLang: ContentLang = 'en',
  userProfile?: UserProfileState,
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfileState>>,
  habit?: HabitState,
  setHabit?: React.Dispatch<React.SetStateAction<HabitState>>,
) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [accountProfile, setAccountProfile] = useState<UserAccountProfile | null>(null);
  const canSyncAccount = !!accountProfile && (accountProfile.role === 'admin' || (accountProfile as any).agePolicyVersion === 1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const resolvedUid = useRef<string | null>(null);
  // Bumps when a synced store (Smarty prefs, hearts…) changes so progress re-uploads.
  const [syncedTick, setSyncedTick] = useState(0);
  useEffect(() => subscribeSyncedStores(() => setSyncedTick((n) => n + 1)), []);
  const prevVocab = usePrevious(savedVocab);
  const savedVocabRef = useRef(savedVocab);
  const profileRef = useRef(userProfile);
  const habitRef = useRef(habit);
  const contentLangRef = useRef(contentLang);
  const skipNextVocabSync = useRef(false);
  const progressWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressKey = useRef('');
  const lastStoreVersion = useRef(0);
  const storeWritePending = useRef(false);
  const criticalProgress = useRef<{ uid: string; data: Record<string, unknown> } | null>(null);

  useEffect(() => {
    const flush = () => {
      const pending = criticalProgress.current;
      if (!pending || pending.uid !== auth.currentUser?.uid) return;
      // Keep this payload small enough for the browser's keepalive limit.
      apiRequest('/api/data', { method: 'POST', body: JSON.stringify({ action: 'progress.set', args: pending }), keepalive: true })
        .then(() => { if (criticalProgress.current === pending) { criticalProgress.current = null; storeWritePending.current = false; } })
        .catch(console.error);
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('online', flush); document.removeEventListener('visibilitychange', onHidden); };
  }, []);

  useEffect(() => { savedVocabRef.current = savedVocab; }, [savedVocab]);
  useEffect(() => { profileRef.current = userProfile; }, [userProfile]);
  useEffect(() => { habitRef.current = habit; }, [habit]);
  useEffect(() => {
    if (contentLangRef.current !== contentLang) {
      contentLangRef.current = contentLang;
      skipNextVocabSync.current = true;
    }
  }, [contentLang]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = auth.onAuthStateChanged(async (nextUser) => {
      if (cancelled) return;
      setStorageUid(nextUser?.uid ?? null);
      if (!nextUser) {
        setUser(null);
        setAccountProfile(null);
        setInitialLoadDone(true);
        return;
      }

      // Shared devices: if a different account was signed in here before, the
      // progress already in memory (loaded from this browser) is theirs. Clear it
      // before syncing so it is neither shown nor uploaded into this account.
      // Pause uploads until this account's data has loaded.
      let lastUid: string | null = null;
      try { lastUid = localStorage.getItem(LAST_UID_KEY); localStorage.setItem(LAST_UID_KEY, nextUser.uid); } catch { /* private mode */ }
      const switched = !!lastUid && lastUid !== nextUser.uid;
      setInitialLoadDone(false);
      if (switched) {
        skipNextVocabSync.current = true; // emptying the list must not delete this account's words
        lastProgressKey.current = '';
        criticalProgress.current = null;
        savedVocabRef.current = {};
        profileRef.current = { xp: 0, coins: 0, level: 1, league: 'Bronze' };
        habitRef.current = emptyHabit();
        setStreak({ current: 0, max: 0, lastDate: '' });
        setHistory({});
        setProblemWords({});
        setImprovedWords({});
        setSavedVocab({});
        setUserProfile?.(profileRef.current);
        setHabit?.(habitRef.current);
      }
      setUser(nextUser);

      setIsSyncing(true);
      try {
        let profile: UserAccountProfile;
        try {
          profile = await ensureUserProfile(nextUser);
        } catch (error) {
          console.error('ensureUserProfile failed:', error);
          profile = fallbackAccountProfile(nextUser);
        }
        if (cancelled) return;
        setAccountProfile(profile);

        // Pending accounts can see onboarding, but do not read or upload learning
        // data until the server has accepted their age/parent consent.
        if (profile.role !== 'admin' && (profile as any).agePolicyVersion !== 1) return;

        const progress = await dataRequest<any>('progress.get', { uid: nextUser.uid });
        if (progress) {
          applySyncedStores(progress);
          if (progress.streak !== undefined) setStreak(progress.streak);
          if (progress.history !== undefined) setHistory(progress.history);
          if (progress.problemWords !== undefined) setProblemWords(progress.problemWords);
          if (progress.improvedWords !== undefined) setImprovedWords(progress.improvedWords);
          if (setUserProfile && (progress.xp != null || progress.coins != null || progress.league)) {
            const xp = typeof progress.xp === 'number' ? progress.xp : (profileRef.current?.xp ?? 0);
            const coins = typeof progress.coins === 'number' ? progress.coins : (profileRef.current?.coins ?? 0);
            const next = { xp, coins, level: levelForXp(xp), league: leagueMeta(progress.league || leagueForXp(xp)).id };
            setUserProfile(next);
            writeScopedJSON('readmaster_profile', next, nextUser.uid);
          }
          if (setHabit) {
            const nextHabit = normalizeHabit({
              globalStreak: progress.globalStreak || progress.habit?.globalStreak,
              dailyGoal: progress.dailyGoal || progress.habit?.dailyGoal,
              streakFreezes: progress.streakFreezes ?? progress.habit?.streakFreezes,
              weeklyXp: progress.weeklyXp ?? progress.habit?.weeklyXp,
              weekKey: progress.weekKey ?? progress.habit?.weekKey,
              questId: progress.questId ?? progress.habit?.questId,
              questDone: progress.questDone ?? progress.habit?.questDone,
              badges: progress.badges ?? progress.habit?.badges,
            });
            setHabit(nextHabit);
            writeScopedJSON('habit_v1', nextHabit, nextUser.uid);
          }
        } else {
          const localProfile = profileRef.current || readScopedJSON('readmaster_profile', { xp: 0, coins: 0, level: 1, league: 'Bronze' }, nextUser.uid);
          const localHabit = normalizeHabit(habitRef.current || readScopedJSON('habit_v1', emptyHabit(), nextUser.uid));
          // First sign-in for this account: keep progress made on this device before
          // signing up, unless it belonged to another account (cleared above).
          const carry = switched
            ? { streak: { current: 0, max: 0, lastDate: '' }, history: {}, problemWords: {}, improvedWords: {} }
            : { streak, history, problemWords, improvedWords };
          await dataRequest('progress.set', {
            uid: nextUser.uid,
            data: stripUndefined({
              ...carry,
              xp: localProfile.xp, coins: localProfile.coins, league: localProfile.league,
              globalStreak: localHabit.globalStreak, dailyGoal: localHabit.dailyGoal,
              streakFreezes: localHabit.streakFreezes, weeklyXp: localHabit.weeklyXp,
              weekKey: localHabit.weekKey, questId: localHabit.questId,
              questDone: localHabit.questDone, badges: localHabit.badges,
              ...syncedSnapshot(),
            }),
          });
        }

        const remoteVocab = await loadVocab(nextUser.uid, contentLangRef.current);
        if (Object.keys(remoteVocab).length) {
          skipNextVocabSync.current = true;
          setSavedVocab((previous: any) => ({ ...previous, ...remoteVocab }));
        } else {
          await syncVocabulary(nextUser.uid, contentLangRef.current, vocabularyChanges({}, savedVocabRef.current || {}));
        }
        await hydrateCompletionsFromCloud(nextUser.uid);
        await hydrateLessonUnlocksFromCloud(nextUser.uid);
      } catch (error) {
        console.error('Self-hosted account sync failed:', error);
      } finally {
        if (!cancelled) {
          resolvedUid.current = nextUser.uid;
          setIsSyncing(false);
          setInitialLoadDone(true);
        }
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setStreak, setHistory, setProblemWords, setImprovedWords, setSavedVocab, setUserProfile, setHabit]);

  useEffect(() => {
    if (!user || !initialLoadDone || !canSyncAccount) return;
    let cancelled = false;
    skipNextVocabSync.current = true;
    loadVocab(user.uid, contentLang).then((remote) => {
      if (!cancelled && Object.keys(remote).length) {
        skipNextVocabSync.current = true;
        setSavedVocab((previous: any) => ({ ...previous, ...remote }));
      }
    }).catch((error) => console.error('Vocabulary reload failed:', error));
    return () => { cancelled = true; };
  }, [contentLang, user, initialLoadDone, canSyncAccount, setSavedVocab]);

  useEffect(() => {
    if (!user || !initialLoadDone || !canSyncAccount || isBusinessRole(accountProfile?.role)) { criticalProgress.current = null; return; }
    if (lastStoreVersion.current !== syncedTick) storeWritePending.current = true;
    lastStoreVersion.current = syncedTick;
    const currentHabit = normalizeHabit(habit);
    const xp = userProfile?.xp ?? 0;
    const payload = stripUndefined({
      streak, history, problemWords, improvedWords, xp,
      coins: userProfile?.coins ?? 0, league: userProfile?.league ?? leagueForXp(xp),
      globalStreak: currentHabit.globalStreak, dailyGoal: currentHabit.dailyGoal,
      streakFreezes: currentHabit.streakFreezes, weeklyXp: currentHabit.weeklyXp,
      weekKey: currentHabit.weekKey, questId: currentHabit.questId,
      questDone: currentHabit.questDone, badges: currentHabit.badges,
      ...syncedSnapshot(),
    });
    const totalSessions = Object.values(history as Record<string, any[]>).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
    const accuracies = Object.values(history as Record<string, any[]>).flatMap((rows) => Array.isArray(rows) ? rows.map((row: any) => row.accuracy ?? 0) : []);
    const summary = stripUndefined({
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '', streak, globalStreak: currentHabit.globalStreak,
      totalSessions, avgAccuracy: accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0,
      problemWordCount: Object.keys(problemWords || {}).length, vocabCount: Object.keys(savedVocab || {}).length,
      xp, weeklyXp: currentHabit.weeklyXp, weekKey: currentHabit.weekKey, league: userProfile?.league ?? leagueForXp(xp),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    });
    let key = '';
    try { key = JSON.stringify(payload) + JSON.stringify(summary); } catch { key = String(Date.now()); }
    if (!lastProgressKey.current) { lastProgressKey.current = key; return; }
    if (lastProgressKey.current === key) return;
    if (storeWritePending.current) {
      const { history: _history, problemWords: _problemWords, improvedWords: _improvedWords, ...small } = payload;
      criticalProgress.current = { uid: user.uid, data: small };
    }
    if (progressWriteTimer.current) clearTimeout(progressWriteTimer.current);
    progressWriteTimer.current = setTimeout(() => {
      progressWriteTimer.current = null;
      lastProgressKey.current = key;
      const pending = criticalProgress.current;
      dataRequest('progress.set', { uid: user.uid, data: payload })
        .then(() => { if (criticalProgress.current === pending) { criticalProgress.current = null; storeWritePending.current = false; } })
        .catch(console.error);
      dataRequest('summary.update', { uid: user.uid, data: { ...summary, lastActive: Date.now() } }).catch(console.error);
    }, storeWritePending.current ? 250 : 12_000);
    return () => {
      if (progressWriteTimer.current) clearTimeout(progressWriteTimer.current);
      progressWriteTimer.current = null;
    };
  }, [user, initialLoadDone, canSyncAccount, accountProfile, streak, history, problemWords, improvedWords, userProfile, habit, savedVocab, syncedTick]);

  useEffect(() => {
    if (skipNextVocabSync.current) {
      skipNextVocabSync.current = false;
      return;
    }
    if (!user || !initialLoadDone || !canSyncAccount || !prevVocab || prevVocab === savedVocab || isBusinessRole(accountProfile?.role)) return;
    const lang = contentLangRef.current;
    syncVocabulary(user.uid, lang, vocabularyChanges(prevVocab, savedVocab)).catch(console.error);
  }, [savedVocab, prevVocab, user, initialLoadDone, canSyncAccount, accountProfile, contentLang]);

  // Rehydrating the same account must keep onboarding mounted (and its current
  // question intact). Data uploads still wait for initialLoadDone above.
  const authReady = initialLoadDone || (!!user && resolvedUid.current === user.uid);
  return { user, accountProfile, setAccountProfile, isSyncing, authReady, loginWithGoogle, logout };
}

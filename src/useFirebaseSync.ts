import React, { useEffect, useState, useRef } from 'react';
import { auth, db, loginWithGoogle, logout, processGoogleRedirect, handleFirestoreError, OperationType, isFirebaseConfigured, ensureUserProfile, updateStudentSummary, UserAccountProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, deleteDoc, getDocs } from 'firebase/firestore';
import { type ContentLang, vocabCollectionId } from './lib/contentLang';
import { setStorageUid, readScopedJSON, writeScopedJSON } from './lib/userStorage';
import { hydrateCompletionsFromCloud } from './lib/completions';
import { hydrateLessonUnlocksFromCloud } from './lib/lessonProgress';
import {
  type HabitState,
  normalizeHabit,
  emptyHabit,
  leagueForXp,
  levelForXp,
} from './lib/habitEngine';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/** Firestore rejects `undefined` anywhere in the payload — strip recursively. */
function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(v => stripUndefined(v)).filter(v => v !== undefined) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[k] = stripUndefined(v);
  }
  return out as T;
}

function safeVocabDocId(word: string): string | null {
  const id = String(word || '').trim().toLowerCase();
  if (!id || id.includes('/')) return null;
  if (id.length > 200) return id.slice(0, 200);
  return id;
}

function vocabWordRef(uid: string, lang: ContentLang, word: string) {
  const id = safeVocabDocId(word);
  if (!id) return null;
  return doc(db, 'users', uid, vocabCollectionId(lang), id);
}

async function loadVocabFromFirestore(uid: string, lang: ContentLang): Promise<Record<string, any>> {
  const vocabRef = collection(db, 'users', uid, vocabCollectionId(lang));
  const vocabSnap = await getDocs(vocabRef);
  const firebaseVocab: Record<string, any> = {};
  vocabSnap.forEach(vDoc => {
    firebaseVocab[vDoc.id] = vDoc.data();
  });
  return firebaseVocab;
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
  const [user, setUser] = useState<User | null>(null);
  const [accountProfile, setAccountProfile] = useState<UserAccountProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const prevVocab = usePrevious(savedVocab);
  const contentLangRef = useRef(contentLang);
  const savedVocabRef = useRef(savedVocab);
  const syncLangRef = useRef(contentLang);
  const skipNextVocabSync = useRef(false);
  const profileRef = useRef(userProfile);
  const habitRef = useRef(habit);
  const progressWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressKey = useRef('');

  useEffect(() => {
    if (contentLangRef.current !== contentLang) {
      skipNextVocabSync.current = true;
      syncLangRef.current = contentLang;
    }
    contentLangRef.current = contentLang;
  }, [contentLang]);
  useEffect(() => { savedVocabRef.current = savedVocab; }, [savedVocab]);
  useEffect(() => { profileRef.current = userProfile; }, [userProfile]);
  useEffect(() => { habitRef.current = habit; }, [habit]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setInitialLoadDone(true);
      return;
    }

    processGoogleRedirect().catch(e =>
      console.error('Google redirect sign-in failed:', e?.code, e?.message)
    );

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setStorageUid(u?.uid ?? null);
      if (u) {
        setIsSyncing(true);
        try {
          try {
            const profile = await ensureUserProfile(u);
            setAccountProfile(profile);
          } catch (e) {
            console.error('ensureUserProfile failed:', e);
          }

          const progressRef = doc(db, 'users', u.uid, 'data', 'progress');
          const docSnap = await getDoc(progressRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.streak !== undefined) setStreak(data.streak);
            if (data.history !== undefined) setHistory(data.history);
            if (data.problemWords !== undefined) setProblemWords(data.problemWords);
            if (data.improvedWords !== undefined) setImprovedWords(data.improvedWords);

            if (setUserProfile && (data.xp != null || data.coins != null || data.league)) {
              const xp = typeof data.xp === 'number' ? data.xp : (profileRef.current?.xp ?? 0);
              const coins = typeof data.coins === 'number' ? data.coins : (profileRef.current?.coins ?? 0);
              const next = {
                xp,
                coins,
                level: levelForXp(xp),
                league: typeof data.league === 'string' ? data.league : leagueForXp(xp),
              };
              setUserProfile(next);
              writeScopedJSON('readmaster_profile', next, u.uid);
            }

            if (setHabit) {
              const h = normalizeHabit({
                globalStreak: data.globalStreak || data.habit?.globalStreak,
                dailyGoal: data.dailyGoal || data.habit?.dailyGoal,
                streakFreezes: data.streakFreezes ?? data.habit?.streakFreezes,
                weeklyXp: data.weeklyXp ?? data.habit?.weeklyXp,
                weekKey: data.weekKey ?? data.habit?.weekKey,
                questId: data.questId ?? data.habit?.questId,
                questDone: data.questDone ?? data.habit?.questDone,
                badges: data.badges ?? data.habit?.badges,
              });
              setHabit(h);
              writeScopedJSON('habit_v1', h, u.uid);
            }
          } else {
            const localProfile = profileRef.current || readScopedJSON('readmaster_profile', { xp: 0, coins: 0, level: 1, league: 'Bronze' }, u.uid);
            const localHabit = normalizeHabit(habitRef.current || readScopedJSON('habit_v1', emptyHabit(), u.uid));
            await setDoc(progressRef, stripUndefined({
              streak, history, problemWords, improvedWords,
              xp: localProfile.xp,
              coins: localProfile.coins,
              league: localProfile.league,
              globalStreak: localHabit.globalStreak,
              dailyGoal: localHabit.dailyGoal,
              streakFreezes: localHabit.streakFreezes,
              weeklyXp: localHabit.weeklyXp,
              weekKey: localHabit.weekKey,
              questId: localHabit.questId,
              questDone: localHabit.questDone,
              badges: localHabit.badges,
            })).catch(e => handleFirestoreError(e, OperationType.CREATE, progressRef.path));
          }

          try {
            const firebaseVocab = await loadVocabFromFirestore(u.uid, contentLangRef.current);
            if (Object.keys(firebaseVocab).length > 0) {
              setSavedVocab((prev: any) => ({ ...prev, ...firebaseVocab }));
            } else {
              const local = savedVocabRef.current || {};
              for (const [w, vData] of Object.entries(local)) {
                const ref = vocabWordRef(u.uid, contentLangRef.current, w);
                if (ref) setDoc(ref, vData).catch(console.error);
              }
            }
          } catch (e) {
            console.error('Vocabulary sync failed (continuing without cloud vocab):', e);
          }

          try {
            await hydrateCompletionsFromCloud(u.uid);
          } catch (e) {
            console.error('Completions hydrate failed:', e);
          }
          try {
            await hydrateLessonUnlocksFromCloud(u.uid);
          } catch (e) {
            console.error('Lesson unlocks hydrate failed:', e);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSyncing(false);
          setInitialLoadDone(true);
        }
      } else {
        setAccountProfile(null);
        setStorageUid(null);
        setInitialLoadDone(true);
      }
    });

    return () => unsubscribe();
  }, [setStreak, setHistory, setProblemWords, setImprovedWords, setSavedVocab, setUserProfile, setHabit]);

  useEffect(() => {
    if (!user || !initialLoadDone) return;
    let cancelled = false;
    skipNextVocabSync.current = true;
    (async () => {
      try {
        const firebaseVocab = await loadVocabFromFirestore(user.uid, contentLang);
        if (cancelled) return;
        if (Object.keys(firebaseVocab).length > 0) {
          setSavedVocab((prev: any) => ({ ...prev, ...firebaseVocab }));
        }
      } catch (e) {
        console.error('Vocabulary reload on language change failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [contentLang, user, initialLoadDone, setSavedVocab]);

  // Sync Progress + XP + habit to Firebase (debounced — this used to write on
  // every React state tick and burned Spark write/bandwidth quotas).
  useEffect(() => {
    if (!user || !initialLoadDone) return;
    if (accountProfile?.role === 'teacher' || accountProfile?.role === 'organization') {
      return;
    }

    const uid = user.uid;
    const h = normalizeHabit(habit);
    const xp = userProfile?.xp ?? 0;
    const coins = userProfile?.coins ?? 0;
    const league = userProfile?.league ?? leagueForXp(xp);
    const progressPayload = stripUndefined({
      streak,
      history,
      problemWords,
      improvedWords,
      xp,
      coins,
      league,
      globalStreak: h.globalStreak,
      dailyGoal: h.dailyGoal,
      streakFreezes: h.streakFreezes,
      weeklyXp: h.weeklyXp,
      weekKey: h.weekKey,
      questId: h.questId,
      questDone: h.questDone,
      badges: h.badges,
    });

    const totalSessions = Object.values(history as Record<string, any[]>).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
    const allAccuracies = Object.values(history as Record<string, any[]>).flatMap(arr =>
      Array.isArray(arr) ? arr.map((e: any) => e.accuracy ?? 0) : [],
    );
    const avgAccuracy = allAccuracies.length ? Math.round(allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length) : 0;
    const summary: any = {
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      streak: streak as any,
      globalStreak: h.globalStreak,
      totalSessions,
      avgAccuracy,
      problemWordCount: Object.keys(problemWords as Record<string, any>).length,
      vocabCount: Object.keys(savedVocab as Record<string, any>).length,
      xp,
      weeklyXp: h.weeklyXp,
      weekKey: h.weekKey,
      league,
    };
    if (user.photoURL) summary.photoURL = user.photoURL;

    let key = '';
    try { key = JSON.stringify(progressPayload) + JSON.stringify(summary); } catch { key = String(Date.now()); }
    // Hydrate from cloud then skip echoing the same payload back (quota).
    if (!lastProgressKey.current) {
      lastProgressKey.current = key;
      return;
    }
    if (key === lastProgressKey.current) return;

    if (progressWriteTimer.current) clearTimeout(progressWriteTimer.current);
    progressWriteTimer.current = setTimeout(() => {
      progressWriteTimer.current = null;
      lastProgressKey.current = key;
      const progressRef = doc(db, 'users', uid, 'data', 'progress');
      setDoc(progressRef, progressPayload, { merge: true }).catch(console.error);
      updateStudentSummary(uid, stripUndefined({ ...summary, lastActive: Date.now() }));
    }, 12_000);

    return () => {
      if (progressWriteTimer.current) {
        clearTimeout(progressWriteTimer.current);
        progressWriteTimer.current = null;
      }
    };
  }, [user, initialLoadDone, accountProfile, streak, history, problemWords, improvedWords, userProfile, habit, savedVocab]);

  useEffect(() => {
     if (skipNextVocabSync.current) {
       skipNextVocabSync.current = false;
       return;
     }
     if (user && initialLoadDone && prevVocab && prevVocab !== savedVocab) {
        if (accountProfile?.role === 'teacher' || accountProfile?.role === 'organization') {
          return;
        }
        const lang = syncLangRef.current;
        const prevKeys = Object.keys(prevVocab);
        const currKeys = Object.keys(savedVocab);

        const addedOrChanged = currKeys.filter(k => prevVocab[k] !== savedVocab[k]);
        const deleted = prevKeys.filter(k => !currKeys.includes(k));

        addedOrChanged.forEach(k => {
           const wordRef = vocabWordRef(user.uid, lang, k);
           if (wordRef) setDoc(wordRef, stripUndefined(savedVocab[k])).catch(console.error);
        });

        deleted.forEach(k => {
           const wordRef = vocabWordRef(user.uid, lang, k);
           if (wordRef) deleteDoc(wordRef).catch(console.error);
        });
     }
  }, [savedVocab, prevVocab, user, initialLoadDone, accountProfile, contentLang]);

  return { user, accountProfile, setAccountProfile, isSyncing, authReady: initialLoadDone, loginWithGoogle, logout };
}

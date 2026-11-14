import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, ArrowLeft, Trash2, Search, ChevronRight, Plus, FileText, X } from 'lucide-react';
import { set, get } from 'idb-keyval';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { SPEAKING_TOPICS_BY_LEVEL as _DEFAULT_SPEAKING, SPEAKING_LEVELS as PRACTICE_LEVELS, SpeakingLevel as PracticeLevel } from '../data/speakingTopics';
import { useCMSContent } from '../lib/useCMSContent';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { Sticker } from '../components/stickers/Sticker';
import { checkSpeaking, AiExaminerError, type AiCheckReportData } from '../lib/aiExaminer';
import { AiCheckReport, AiCheckButton, AiCheckError } from '../components/AiCheckReport';
import { recordCompletion } from '../lib/completions';
import { logActivity } from '../lib/activity-tracker';
import { activityLangStamp, matchesContentLang, sessionsForLang } from '../lib/activityMeta';
import { playWord as sharedPlayWord } from '../lib/speech';
import { saveSpeakingSession, loadSpeakingSession } from '../lib/midSession';
import { bumpWeeklyGoal } from '../lib/weeklyGoals';
import { ScreenShell, HubRow } from '../components/ScreenShell';
import { LevelCard, LevelCardGrid, LEVEL_THEMES } from '../components/LevelCards';

type Recording     = { date: string; size: number };
type CustomSession = { id: string; title: string; prompt: string; createdAt: string };

const CUSTOM_KEY = 'speaking_custom_v1';
function loadCustomSessions(): CustomSession[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
}
function persistCustomSessions(list: CustomSession[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function clip(s: string, max = 90) { return s.length > max ? s.slice(0, max).trimEnd() + '…' : s; }

export function SpeakingPractice({
  initialLevel,
  initialTopicIndex,
  onToggleVocab,
  savedVocab = {},
  onShowModal,
  onBack,
  startingLevel,
}: { initialLevel?: string; initialTopicIndex?: number; onToggleVocab?: (w: string, ctx: string) => void; savedVocab?: Record<string, any>; onShowModal?: (w: string, mode: string) => void; onBack?: () => void; startingLevel?: string } = {}) {
  const { speakingTopics: TOPICS_BY_LEVEL } = useCMSContent();
  const { speechLocale, contentLang } = useContentLang();
  const { t, tLevel, tLevelDesc, uiLang } = useUiLang();
  const hasInitial = initialLevel !== undefined && initialTopicIndex !== undefined;
  const [view, setView] = useState<'levels' | 'custom' | 'topics' | 'recording'>(
    hasInitial ? 'recording' : 'levels'
  );
  // level-topic navigation
  const [selectedLevel, setLevel]   = useState<PracticeLevel>((initialLevel as PracticeLevel) || 'Beginner');
  const [topicIdx, setTopicIdx]     = useState<number | null>(initialTopicIndex ?? null);

  // Persist mid-session speaking position
  useEffect(() => {
    if (view !== 'recording' || topicIdx === null) return;
    saveSpeakingSession({ level: selectedLevel, topicIdx, view, contentLang });
  }, [view, selectedLevel, topicIdx, contentLang]);

  // custom sessions
  const [customSessions, setCustomSessions] = useState<CustomSession[]>(loadCustomSessions);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm]       = useState(false);
  const [formTitle, setFormTitle]           = useState('');
  const [formPrompt, setFormPrompt]         = useState('');

  // recording
  const [isRecording, setIsRecording]   = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings]     = useState<Record<string, Recording[]>>({});
  const [playingId, setPlayingId]       = useState<string | null>(null);

  // topics list
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Live transcript
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkReport, setCheckReport] = useState<AiCheckReportData | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<BlobPart[]>([]);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const silTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef           = useRef<number | null>(null);

  /* mount: cleanup + load index */
  useEffect(() => {
    try {
      const s = localStorage.getItem('speaking_index_v2');
      if (s) setRecordings(JSON.parse(s));
    } catch {}
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (mediaRecorderRef.current?.state !== 'inactive') {
        try { mediaRecorderRef.current?.stop(); } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current)      { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
      analyserRef.current = null;
    };
  }, []);

  const saveIndex = (next: Record<string, Recording[]>) => {
    setRecordings(next);
    localStorage.setItem('speaking_index_v2', JSON.stringify(next));
  };

  const promptKey = (level: PracticeLevel, idx: number) => `${level}__${idx}`;

  const recordingsForLang = (arr: Recording[] | undefined) =>
    sessionsForLang(arr as any[], contentLang) as Recording[];

  const hasRecordingForLang = (key: string) =>
    recordingsForLang(recordings[key]).length > 0;

  const recordingsForLevel = (level: PracticeLevel) =>
    TOPICS_BY_LEVEL[level].reduce(
      (n, _, idx) => n + (hasRecordingForLang(promptKey(level, idx)) ? 1 : 0),
      0
    );

  const customTotalRecs = customSessions.reduce(
    (n, s) => n + (hasRecordingForLang(s.id) ? 1 : 0), 0
  );

  /* ── Custom session helpers ── */
  const createSession = () => {
    if (!formTitle.trim() && !formPrompt.trim()) return;
    const id = `custom__${Date.now()}`;
    const session: CustomSession = {
      id,
      title:     formTitle.trim()  || t('learning.untitledSession'),
      prompt:    formPrompt.trim() || formTitle.trim(),
      createdAt: new Date().toLocaleString(uiLang),
    };
    const updated = [session, ...customSessions];
    setCustomSessions(updated);
    persistCustomSessions(updated);
    setShowNewForm(false);
    setFormTitle('');
    setFormPrompt('');
    setActiveCustomId(id);
    setTopicIdx(null);
    setView('recording');
  };

  const deleteSession = (id: string) => {
    const updated = customSessions.filter(s => s.id !== id);
    setCustomSessions(updated);
    persistCustomSessions(updated);
  };

  /* ── Recording helpers ── */
  const startRecording = async () => {
    const key = activeCustomId ?? (topicIdx !== null ? promptKey(selectedLevel, topicIdx) : null);
    if (!key) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const date = new Date().toLocaleString(uiLang);
        const existing: Recording[] = (JSON.parse(localStorage.getItem('speaking_index_v2') || '{}')[key]) || [];
        const blobIdx = existing.length;
        try { await set(`speak_blob_${key}_${blobIdx}`, blob); } catch {}
        const practicedAt = Date.now();
        saveIndex({
          ...recordings,
          [key]: [{
            date,
            size: blob.size,
            timestamp: practicedAt,
            audioKey: `speak_blob_${key}_${blobIdx}`,
            ...activityLangStamp(contentLang),
          }, ...existing],
        });
        bumpWeeklyGoal('speaking');
      };
      mr.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      // VAD: auto-stop on 2.5 s of silence after speech has been detected
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current  = ctx;
        analyserRef.current  = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        let hasSpoken = false;
        const check = () => {
          if (!analyserRef.current) return;
          analyser.getByteFrequencyData(data);
          const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
          if (rms > 4) {
            hasSpoken = true;
            if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
          } else if (hasSpoken && !silTimerRef.current) {
            silTimerRef.current = setTimeout(() => {
              silTimerRef.current = null;
              if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
              if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
              analyserRef.current = null;
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
              if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
              mediaRecorderRef.current?.stop();
              stream.getTracks().forEach(t => t.stop());
              setIsRecording(false);
            }, 2500);
          }
          rafRef.current = requestAnimationFrame(check);
        };
        rafRef.current = requestAnimationFrame(check);
      } catch { /* VAD unavailable — user must stop manually */ }

      // Live transcript via Web Speech API (best-effort)
      setLiveTranscript('');
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const r = new SR();
          r.continuous = true;
          r.interimResults = true;
          r.lang = speechLocale;
          let finalText = '';
          r.onresult = (e: any) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const res = e.results[i];
              if (res.isFinal) finalText += res[0].transcript + ' ';
              else interim += res[0].transcript;
            }
            setLiveTranscript((finalText + interim).trim());
          };
          r.onerror = () => { /* ignore - audio is still recording */ };
          r.onend = () => { if (mediaRecorderRef.current?.state === 'recording') { try { r.start(); } catch {} } };
          recognitionRef.current = r;
          r.start();
        } catch {}
      }
    } catch {
      alert(t("learning.could.not.access.microphone.please.allow.microphone.access.aeb091"));
    }
  };

  const stopRecording = () => {
    if (rafRef.current)      { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  // metas are stored newest-first; display without reversing → newest shown first
  // blobIdx for metas[i] = metas.length - 1 - i
  const playRecording = async (key: string, i: number) => {
    const all = recordings[key] || [];
    const metas = recordingsForLang(all);
    const target = metas[i];
    if (!target) return;
    const fullIdx = all.findIndex(m => m === target || ((m as any).timestamp === (target as any).timestamp && m.date === target.date));
    if (fullIdx < 0) return;
    const blobIdx  = all.length - 1 - fullIdx;
    const id       = `${key}_${i}`;
    if (playingId === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    try {
      const blob: Blob | undefined = await get(`speak_blob_${key}_${blobIdx}`);
      if (!blob) return;
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(id);
      audio.onended = () => { setPlayingId(null); audioRef.current = null; URL.revokeObjectURL(url); };
      audio.play();
    } catch {}
  };

  const deleteRecording = async (key: string, i: number) => {
    const all = recordings[key] || [];
    const metas = recordingsForLang(all);
    const target = metas[i];
    if (!target) return;
    const fullIdx = all.findIndex(m => m === target || ((m as any).timestamp === (target as any).timestamp && m.date === target.date));
    if (fullIdx < 0) return;
    const blobIdx = all.length - 1 - fullIdx;
    const id = `${key}_${i}`;
    if (playingId === id) { audioRef.current?.pause(); audioRef.current = null; setPlayingId(null); }
    try { await set(`speak_blob_${key}_${blobIdx}`, undefined); } catch {}
    saveIndex({ ...recordings, [key]: all.filter((_, j) => j !== fullIdx) });
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const runSpeakingCheck = async (topicKey: string, prompt: string) => {
    const spoken = (liveTranscript || transcriptDraft || '').trim();
    if (!spoken || checking) return;
    setChecking(true);
    setCheckError(null);
    try {
      const levelLabel = [startingLevel, selectedLevel].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' → ') || selectedLevel;
      const report = await checkSpeaking({
        transcript: spoken,
        questions: prompt,
        part: 'practice',
        style: 'practice',
        level: levelLabel,
        duration: recordingTime,
        uiLang,
        contentLang,
      });
      setCheckReport(report);
      const audioKey = (recordings[topicKey] || [])[0]?.['audioKey' as keyof Recording] as string | undefined;
      try {
        const raw = localStorage.getItem('speaking_graded_v1');
        const map = raw ? JSON.parse(raw) : {};
        const entry = {
          transcript: spoken,
          audioKey,
          ...activityLangStamp(contentLang),
          result: report,
        };
        map[topicKey] = [entry, ...(map[topicKey] || [])].slice(0, 30);
        localStorage.setItem('speaking_graded_v1', JSON.stringify(map));
      } catch { /* ignore */ }
      recordCompletion('speaking', {
        title: prompt.slice(0, 80),
        band: report.final.overallScore,
        contentLang,
        data: { report },
      });
      logActivity({ type: 'ai_check_speaking', title: 'Speaking practice', score: report.final.overallScore, level: selectedLevel });
    } catch (e: any) {
      setCheckError(e instanceof AiExaminerError ? e.message : (e?.message || t('learning.checkFailed')));
    } finally {
      setChecking(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════
     RECORDING SCREEN
  ══════════════════════════════════════════════════════════════ */
  if (view === 'recording') {
    const isCustom      = activeCustomId !== null;
    const customSession = isCustom ? customSessions.find(s => s.id === activeCustomId) : null;
    const prompt        = isCustom
      ? (customSession?.prompt || '')
      : (topicIdx !== null ? TOPICS_BY_LEVEL[selectedLevel][topicIdx] : '');
    const key           = isCustom ? activeCustomId! : promptKey(selectedLevel, topicIdx!);
    const metas         = recordingsForLang(recordings[key]);
    const theme         = LEVEL_THEMES[PRACTICE_LEVELS.indexOf(selectedLevel)];

    return (
      <div className="flex-grow overflow-y-auto bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">

          {/* Back */}
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              audioRef.current?.pause(); audioRef.current = null; setPlayingId(null);
              if (isCustom) { setActiveCustomId(null); setView('custom'); }
              else setView('topics');
            }}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 mb-8 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
          >
            <ArrowLeft className="w-4 h-4" />
            {isCustom ? t("learning.back.to.custom.sessions.bdafda") : t("action.backToTopics")}
          </button>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            {isCustom ? (
              <>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-900 text-white">{t("learning.custom.081ae3")}</span>
                {customSession?.title && (
                  <span className="text-sm font-bold text-slate-700 truncate max-w-xs">{customSession.title}</span>
                )}
              </>
            ) : (
              <>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme.badge}`}>{tLevel(selectedLevel)}</span>
                <span className="text-xs text-slate-400 font-bold">#{topicIdx! + 1}</span>
              </>
            )}
          </div>

          {/* Prompt */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 mb-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t("learning.speaking.prompt.674c8f")}</p>
            <p className="text-slate-800 text-xl font-serif leading-relaxed">
              {prompt.split(' ').map((word, i) => {
                const cleanWord = word.replace(/[^\p{L}\p{M}'’-]/gu, '').toLowerCase();
                const isSelected = selectedWord === cleanWord && !!cleanWord;
                const promptWords = prompt.split(' ');
                return (
                  <span key={i} className="cursor-pointer relative inline-block mr-2.5 mb-2"
                    onClick={() => { if (cleanWord) setSelectedWord(isSelected ? null : cleanWord); }}>
                    {word}
                    {isSelected && (
                      <WordPopover
                        word={cleanWord}
                        cleanWord={cleanWord}
                        sentence={sentenceAroundWord(promptWords, i)}
                        savedVocab={savedVocab}
                        onPlay={(w) => sharedPlayWord(w, 1.0, speechLocale)}
                        onToggleVocab={(w) => onToggleVocab?.(w, 'From speaking practice')}
                        onShowModal={(w, mode) => { onShowModal?.(w, mode); setSelectedWord(null); }}
                        onClose={() => setSelectedWord(null)}
                      />
                    )}
                  </span>
                );
              })}
            </p>
            <p className="text-[10px] text-slate-400 mt-3 italic">{t("learning.click.any.word.to.translate.listen.or.save.eba9a3")}</p>
          </div>

          {/* Recorder */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 mb-6 flex flex-col items-center gap-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
            {isRecording ? (
              <>
                <div className="flex items-center gap-3 text-rose-600 font-bold text-lg">
                  <span className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />{t("learning.recording.72f9eb")}{' '}{fmt(recordingTime)}
                </div>
                <button onClick={stopRecording}
                  className="w-24 h-24 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-200/60 transition-colors">
                  <Square className="w-9 h-9 text-white fill-white" />
                </button>
                <p className="text-slate-400 text-sm">{t("learning.stops.automatically.when.you.pause.d1339f")}</p>
              </>
            ) : (
              <>
                <p className="text-slate-500 font-medium">{t("learning.tap.the.mic.to.start.recording.9a2de0")}</p>
                <button onClick={startRecording}
                  className="w-24 h-24 bg-zinc-900 hover:bg-black rounded-full flex items-center justify-center shadow-xl shadow-zinc-300/50 transition-colors">
                  <Mic className="w-10 h-10 text-white" />
                </button>
                <p className="text-slate-400 text-sm">{t("learning.tap.to.record.stops.when.you.stop.talking.34cefa")}</p>
              </>
            )}
          </div>

          {/* Live transcript + AI Check */}
          {(liveTranscript || (!isRecording && liveTranscript === '' && transcriptDraft)) && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 mb-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {isRecording ? t("learning.live.transcript.b5c2d1") : t("learning.your.transcript.3dd480")}
                  </p>
                </div>
                {!isRecording && liveTranscript && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setTranscriptDraft(liveTranscript); setShowTranscriptEditor(true); }}
                      className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider"
                    >{t("learning.edit.530164")}</button>
                    <AiCheckButton onClick={() => runSpeakingCheck(key, prompt)} loading={checking} />
                  </div>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed font-serif text-base whitespace-pre-wrap">
                {liveTranscript || transcriptDraft || <span className="text-slate-400 italic text-sm">{t("learning.no.speech.detected.yet.c9f03d")}</span>}
              </p>
              {checkError && <div className="mt-3"><AiCheckError message={checkError} /></div>}
              {checkReport && <div className="mt-4"><AiCheckReport report={checkReport} compact /></div>}
            </div>
          )}

          {showTranscriptEditor && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={() => setShowTranscriptEditor(false)}>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                  <h2 className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50 text-lg">{t("learning.edit.transcript.f1a89a")}</h2>
                  <button onClick={() => setShowTranscriptEditor(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">{t("learning.fix.any.mistakes.the.speech.recognizer.made.e23a01")}</p>
                  <textarea
                    autoFocus
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                    className="w-full h-64 p-4 bg-slate-50 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 rounded-2xl text-base font-serif leading-relaxed resize-none outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>
                <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 shrink-0">
                  <button
                    onClick={() => setShowTranscriptEditor(false)}
                    className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                  >{t("action.cancel")}</button>
                  <button
                    onClick={() => { setLiveTranscript(transcriptDraft); setShowTranscriptEditor(false); }}
                    className="flex-1 px-4 py-2 text-sm font-bold bg-zinc-900 text-white rounded-xl hover:bg-black transition-colors"
                  >{t("learning.save.transcript.6fe7a4")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Saved recordings – newest first (metas[0] is newest) */}
          {metas.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">{t("learning.your.recordings.f5844b")}</h2>
              <div className="space-y-2">
                {metas.map((rec, i) => (
                  <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t("common.recording")}{' '}{metas.length - i}</p>
                      <p className="text-xs text-slate-400">{rec.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playRecording(key, i)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          playingId === `${key}_${i}` ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {playingId === `${key}_${i}`
                          ? <Square className="w-4 h-4 fill-current" />
                          : <Play  className="w-4 h-4 fill-current" />}
                      </button>
                      <button onClick={() => deleteRecording(key, i)}
                        className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     CUSTOM SESSIONS SCREEN
  ══════════════════════════════════════════════════════════════ */
  if (view === 'custom') {
    return (
      <div className="flex-grow overflow-y-auto w-full bg-white relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <button onClick={() => setView('levels')}
                className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-4 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight">
                {t('speaking.customTitle')} <span className="text-slate-300 font-sans font-light text-3xl">|</span>
                <span className="font-sans text-2xl text-zinc-900 tracking-normal font-medium">{t('library.sessions')}</span>
              </h1>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shrink-0 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
            >
              <Plus className="w-4 h-4" />{' '}{t("speaking.newSession")}</button>
          </header>

          {customSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4"><Sticker id="state2.under-construction" size={140} /></div>
              <h2 className="text-2xl font-serif font-black text-zinc-900 mb-3">{t("learning.no.custom.sessions.yet.e65211")}</h2>
              <p className="text-slate-500 mb-8 max-w-sm">{t("learning.create.a.speaking.prompt.record.yourself.and.come.back.to.680390")}</p>
              <button onClick={() => setShowNewForm(true)}
                className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("speaking.createFirstSession")}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {customSessions.map(session => {
                const recCount = recordingsForLang(recordings[session.id]).length;
                return (
                  <div key={session.id}
                    className="bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-200 hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 transition-all duration-300 group flex flex-col shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-900 text-white">{t("learning.custom.081ae3")}</span>
                        {recCount > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                            {t('learning.recordingCount', { n: recCount })}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-serif font-extrabold text-slate-900 text-lg mb-2">{session.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-3 flex-1 mb-4">{session.prompt}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400">{session.createdAt}</span>
                      <button
                        onClick={() => { setActiveCustomId(session.id); setTopicIdx(null); setView('recording'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-colors">
                        <Mic className="w-3.5 h-3.5" />{' '}{t("home.preview.practice")}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Session Modal */}
        {showNewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/55 backdrop-blur-[2px]">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900">
              <h3 className="font-serif text-2xl font-extrabold text-slate-800 mb-6">{t("learning.new.custom.session.0e9d01")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">{t("common.title")}</label>
                  <input
                    autoFocus
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createSession()}
                    placeholder={t("learning.my.custom.topic.17765b")}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">{t("learning.speaking.prompt.674c8f")}</label>
                  <textarea
                    value={formPrompt}
                    onChange={e => setFormPrompt(e.target.value)}
                    placeholder={t("learning.enter.your.speaking.prompt.here.2f6806")}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-700 min-h-[160px] resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowNewForm(false); setFormTitle(''); setFormPrompt(''); }}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50">{t("action.cancel")}</button>
                <button onClick={createSession}
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">{t("learning.start.practice.ae1bea")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     TOPICS SCREEN
  ══════════════════════════════════════════════════════════════ */
  if (view === 'topics') {
    const levelIdx      = PRACTICE_LEVELS.indexOf(selectedLevel);
    const theme         = LEVEL_THEMES[levelIdx];
    const topics        = TOPICS_BY_LEVEL[selectedLevel];
    const filtered      = search.trim() ? topics.filter(t => t.toLowerCase().includes(search.toLowerCase())) : topics;
    const recordedCount = recordingsForLevel(selectedLevel);
    const totalPages    = Math.ceil(filtered.length / 8);
    const paged         = filtered.slice((page - 1) * 8, page * 8);

    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <button onClick={() => { setSearch(''); setView('levels'); }}
                className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-4 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight">
                {tLevel(selectedLevel)} <span className="text-slate-300 font-sans font-light text-3xl">|</span>
                <span className="font-sans text-2xl text-zinc-900 tracking-normal font-medium">{t('library.topics')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border-2 border-slate-200 flex flex-col items-center shrink-0 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('speaking.topicsRecorded')}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-zinc-900">{recordedCount}</span>
                <span className="font-bold text-slate-400">/ {topics.length}</span>
              </div>
            </div>
          </header>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.searchTopics')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 transition-all shadow-sm"
            />
          </div>

          {/* Continue banner */}
          {(() => {
            const snap = loadSpeakingSession();
            const snapOk = snap && matchesContentLang(snap, contentLang) && snap.level === selectedLevel;
            const snapIdx = snapOk ? snap!.topicIdx : -1;
            const lastIdx = TOPICS_BY_LEVEL[selectedLevel].reduce((found: number, _: string, idx: number) =>
              hasRecordingForLang(promptKey(selectedLevel, idx)) ? idx : found, -1);
            const resumeIdx = snapIdx >= 0 ? snapIdx : lastIdx;
            return resumeIdx >= 0 ? (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{clip(TOPICS_BY_LEVEL[selectedLevel][resumeIdx])}</p>
                  {snapIdx >= 0 && <p className="text-xs text-rose-600 mt-0.5">{t("learning.unfinished.session.4bad19")}</p>}
                </div>
                <button onClick={() => { setTopicIdx(resumeIdx); setView('recording'); }}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition-colors shrink-0">
                  {t('dash.continue')}
                </button>
              </div>
            ) : null;
          })()}

          {/* Topic grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paged.map((topic, i) => {
              const realIdx  = search.trim() ? topics.indexOf(topic) : (page - 1) * 8 + i;
              const key      = promptKey(selectedLevel, realIdx);
              const recCount = recordingsForLang(recordings[key]).length;
              return (
                <button
                  key={realIdx}
                  onClick={() => { setTopicIdx(realIdx); setView('recording'); }}
                  className="bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-200 flex flex-col justify-between hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 transition-all duration-300 text-left group min-h-[220px] shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-300">#{realIdx + 1}</span>
                      {recCount > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                          {t('learning.recordingCount', { n: recCount })}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-base leading-snug group-hover:text-slate-900 transition-colors">
                      {clip(topic)}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">{t('library.status')}</span>
                      <span className="text-sm font-bold text-slate-400">
                        {recCount > 0 ? t('learning.recordingCount', { n: recCount }) : t("learning.unrecorded.79af6c")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-900 font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <span>{t('action.record')}</span>
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-16">
              {topics.length === 0
                ? t("learning.no.speaking.materials.yet.for.this.language.ask.a.content.f07371")
                : t("writing.searchEmpty")}
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-6 bg-white p-4 rounded-full border border-slate-200 shadow-sm w-fit mx-auto">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button key={idx} onClick={() => setPage(idx + 1)}
                    className={`w-3 h-3 rounded-full transition-colors ${page === idx + 1 ? 'bg-zinc-900 scale-125' : 'bg-slate-200 hover:bg-slate-300'}`} />
                ))}
              </div>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     LEVELS SCREEN
  ══════════════════════════════════════════════════════════════ */
  return (
    <ScreenShell size="wide" stickers={['speak.loud-and-clear', 'speak.tongue-twister']} title={t('speaking.general.title')} subtitle={t('speaking.levelSubtitle')}>
        <div className="flex flex-col gap-3">
          <HubRow
            dark
            icon={<Plus className="w-6 h-6" />}
            title={t('speaking.customTitle')}
            desc={customSessions.length === 0
              ? t('speaking.noSessions')
              : t('speaking.sessionsSummary', { n: customSessions.length, recs: customTotalRecs })}
            onClick={() => setView('custom')}
          />
          <LevelCardGrid>
            {PRACTICE_LEVELS.map((level, idx) => {
              const total    = TOPICS_BY_LEVEL[level].length;
              const recorded = recordingsForLevel(level);
              const percent  = Math.round((recorded / total) * 100) || 0;
              return (
                <LevelCard
                  key={level}
                  title={tLevel(level)}
                  desc={tLevelDesc('speaking.desc', level)}
                  pct={percent}
                  themeIndex={idx}
                  icon={<Mic className="w-5 h-5 md:w-6 md:h-6" />}
                  onClick={() => { setLevel(level); setSearch(''); setPage(1); setView('topics'); }}
                />
              );
            })}
          </LevelCardGrid>
        </div>
    </ScreenShell>
  );
}

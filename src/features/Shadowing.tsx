import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw,
  Mic, Square, Trash2, Volume2, Search, X, ChevronRight, Gauge,
} from 'lucide-react';
import { SHADOWING_PASSAGES as _DEFAULT_SHADOWING, type ShadowingPassage } from '../data/shadowingPassages';
import { useCMSContent } from '../lib/useCMSContent';
import { useUiLang } from '../contexts/UiLangContext';
import {
  saveRecording, getPassageRecordings, deleteRecording as dbDelete,
  type SavedRecording,
} from '../lib/recordingDB';
import { appendHistory, SHADOWING_HISTORY_KEY } from '../lib/sessionHistory';
import { PracticeHistory } from '../components/PracticeHistory';
import { activityLangStamp } from '../lib/activityMeta';
import { useContentLang } from '../contexts/ContentLangContext';
import { recordCompletion } from '../lib/completions';

// ─── helpers ───────────────────────────────────────────────────────────────

const RATES = [0.5, 0.75, 1, 1.25, 1.5] as const;

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * Split text into subtitle-sized chunks (≤ 14 words each).
 * Breaks first at sentence endings, then at commas if still too long.
 */
function toSubtitles(text: string): string[] {
  const MAX = 14;
  // Split at sentence-ending punctuation
  const sentences = text.split(/(?<=[.!?؟])\s+/).filter(s => s.trim());
  const chunks: string[] = [];

  for (const raw of sentences) {
    const sent = raw.trim();
    if (!sent) continue;
    if (sent.split(/\s+/).length <= MAX) {
      chunks.push(sent);
      continue;
    }
    // Break at commas
    const parts = sent.split(/,\s*/);
    let cur = '';
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      const candidate = cur ? `${cur}, ${p}` : p;
      if (candidate.split(/\s+/).length <= MAX) {
        cur = candidate;
      } else {
        if (cur) chunks.push(cur);
        cur = p;
      }
    }
    if (cur) chunks.push(cur);
  }

  return chunks.filter(Boolean);
}

// ─── PracticeView ──────────────────────────────────────────────────────────

function PracticeView({
  passage,
  onBack,
}: {
  passage: ShadowingPassage;
  onBack: () => void;
}) {
  const { contentLang } = useContentLang();
  // Audio
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [rate, setRate]               = useState<number>(1);

  // Timing offset: positive = advance subtitles ahead of audio (fixes "text too late")
  const [timingOffset, setTimingOffset] = useState(1.0);

  // Subtitles
  const subtitles  = useMemo(() => toSubtitles(passage.text), [passage.text]);

  // Word-count-weighted cumulative fractions (0..1) — each subtitle's end position
  // Longer lines get proportionally more time than shorter ones
  const subWordRatios = useMemo(() => {
    if (!subtitles.length) return [] as number[];
    const counts = subtitles.map(s => Math.max(1, s.split(/\s+/).length));
    const total = counts.reduce((a, b) => a + b, 0);
    let cum = 0;
    return counts.map(c => { cum += c / total; return cum; });
  }, [subtitles]);

  const activeSub  = useMemo(() => {
    if (!duration || !subtitles.length) return 0;
    const frac = Math.max(0, (currentTime + timingOffset) / duration);
    const idx = subWordRatios.findIndex(end => frac < end);
    return idx === -1 ? subtitles.length - 1 : idx;
  }, [currentTime, duration, subtitles.length, subWordRatios, timingOffset]);

  const activeRef  = useRef<HTMLDivElement>(null);

  // Recording
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const recStartRef    = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds]   = useState(0);
  const recTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Playback of a saved recording
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  // Recordings history
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);

  // ── Mount / passage change ──
  useEffect(() => {
    const audio = new Audio(passage.audioSrc);
    audioRef.current = audio;
    audio.playbackRate = rate;

    const onTime  = () => setCurrentTime(audio.currentTime);
    const onDur   = () => setDuration(audio.duration);
    const onPlay  = () => { setIsPlaying(true); };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); };

    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('play',           onPlay);
    audio.addEventListener('pause',          onPause);
    audio.addEventListener('ended',         onEnded);

    // Poll at 80 ms for smoother subtitle tracking (timeupdate fires only ~4x/sec)
    const pollId = setInterval(() => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    }, 80);

    return () => {
      clearInterval(pollId);
      audio.pause();
      audio.src = '';
    };
  }, [passage.audioSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  // Auto-scroll subtitle
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeSub]);

  // Load saved recordings on mount / passage change
  useEffect(() => {
    getPassageRecordings(passage.id).then(setRecordings).catch(() => {});
  }, [passage.id]);

  // Cleanup blob URL on unmount
  useEffect(() => () => { if (playUrl) URL.revokeObjectURL(playUrl); }, [playUrl]);

  // ── Audio controls ──
  const handlePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) a.pause();
    else a.play().catch(() => {});
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Number(e.target.value);
    a.currentTime = t;
    setCurrentTime(t);
  };

  const handleSkip = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + delta));
  };

  const handleRestart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setCurrentTime(0);
  };

  // ── Recording ──
  const startRec = useCallback(async (withAudio: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime   = getSupportedMimeType();
      const rec    = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current  = [];
      recStartRef.current = Date.now();

      rec.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob    = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
        const durMs   = Date.now() - recStartRef.current;
        const saved: SavedRecording = {
          id:           Date.now().toString(),
          passageId:    passage.id,
          passageTitle: passage.title,
          dateISO:      new Date().toISOString(),
          durationMs:   durMs,
          mimeType:     mime || 'audio/webm',
          blob,
        };
        await saveRecording(saved).catch(() => {});
        setRecordings(prev => [saved, ...prev]);
        appendHistory(SHADOWING_HISTORY_KEY, {
          id: saved.id,
          title: passage.title,
          level: passage.level,
          timestamp: Date.now(),
          durationMs: durMs,
          passageId: passage.id,
          ...activityLangStamp(contentLang),
        });
        recordCompletion('shadowing', {
          title: passage.title,
          contentLang,
          data: {
            id: saved.id,
            level: passage.level,
            durationMs: durMs,
            passageId: passage.id,
            ...activityLangStamp(contentLang),
          },
        });
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        setRecSeconds(0);
      };

      mediaRecRef.current = rec;
      rec.start(100);
      setIsRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);

      if (withAudio) {
        const a = audioRef.current;
        if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      }
    } catch {
      alert('Microphone access was denied. Please allow it in your browser settings.');
    }
  }, [passage.id, passage.title, passage.level, contentLang]);

  const stopRec = () => {
    mediaRecRef.current?.stop();
    setIsRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    // Also pause audio if it was playing in shadow mode
    audioRef.current?.pause();
  };

  // ── Playback of saved recording ──
  const playRecording = (rec: SavedRecording) => {
    if (playUrl) URL.revokeObjectURL(playUrl);
    const url = URL.createObjectURL(rec.blob);
    setPlayUrl(url);
  };

  const deleteRec = async (id: string) => {
    await dbDelete(id).catch(() => {});
    setRecordings(prev => prev.filter(r => r.id !== id));
    if (playUrl) { URL.revokeObjectURL(playUrl); setPlayUrl(null); }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-white overflow-hidden">

      {/* ── Sticky header: back + title + audio player ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 shadow-sm z-20">

        {/* Top row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => { audioRef.current?.pause(); stopRec(); onBack(); }}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Passages</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{passage.title}</p>
            <p className="text-[11px] text-slate-400">{subtitles.length} lines · {passage.text.split(/\s+/).length} words</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-sky-600 font-bold px-2 py-1 bg-sky-50 rounded-full shrink-0">
            <Volume2 className="w-3 h-3" /> Audio
          </span>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 px-4 pb-1">
          <span className="text-[11px] text-slate-400 w-9 text-right shrink-0">{fmtTime(currentTime)}</span>
          <input
            type="range" min={0} max={duration || 0} step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 rounded-full accent-sky-500 cursor-pointer"
          />
          <span className="text-[11px] text-slate-400 w-9 shrink-0">{fmtTime(duration)}</span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-4 pb-3 gap-3">
          {/* Speed */}
          <div className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-300 mr-0.5" />
            {RATES.map(r => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  rate === r ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {r}×
              </button>
            ))}
          </div>
          {/* Text sync offset */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1">
            <button
              onClick={() => setTimingOffset(o => Math.max(-2, parseFloat((o - 0.5).toFixed(1))))}
              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-zinc-900 font-black text-sm leading-none"
              title="Delay text"
            >−</button>
            <span className="text-[11px] font-bold text-slate-600 w-14 text-center select-none">
              Sync {timingOffset >= 0 ? '+' : ''}{timingOffset.toFixed(1)}s
            </span>
            <button
              onClick={() => setTimingOffset(o => Math.min(4, parseFloat((o + 0.5).toFixed(1))))}
              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-zinc-900 font-black text-sm leading-none"
              title="Advance text"
            >+</button>
          </div>
          {/* Playback */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleRestart} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => handleSkip(-5)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all ${
                isPlaying ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={() => handleSkip(5)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable area: subtitles + recording ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Subtitle track */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
          {subtitles.map((line, i) => {
            const isActive = i === activeSub;
            const isPast   = i < activeSub;
            return (
              <div
                key={i}
                ref={isActive ? activeRef : undefined}
                className={`px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer select-text ${
                  isActive
                    ? 'bg-sky-500 text-white text-xl font-semibold leading-snug shadow-lg scale-[1.02]'
                    : isPast
                    ? 'text-slate-300 text-base leading-relaxed hover:text-slate-400'
                    : 'text-slate-600 text-base leading-relaxed hover:bg-slate-50'
                }`}
                onClick={() => {
                  if (!duration) return;
                  const a = audioRef.current;
                  if (!a) return;
                  a.currentTime = (i / subtitles.length) * duration;
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        <div className="h-px bg-slate-100 mx-4" />

        {/* ── Recording section ── */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-400" /> Record Yourself
          </h3>

          {isRecording ? (
            /* Recording in progress */
            <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-700">Recording…</p>
                <p className="text-xs text-rose-500">{fmtTime(recSeconds)}</p>
              </div>
              <button
                onClick={stopRec}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          ) : (
            /* Record buttons */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startRec(false)}
                className="flex flex-col items-center gap-2 bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 rounded-2xl p-5 transition-all group"
              >
                <Mic className="w-7 h-7 text-slate-400 group-hover:text-rose-500 transition-colors" />
                <span className="text-sm font-bold text-slate-600 group-hover:text-rose-600">Record Yourself</span>
                <span className="text-[11px] text-slate-400 text-center">Read the text aloud and record</span>
              </button>
              <button
                onClick={() => startRec(true)}
                className="flex flex-col items-center gap-2 bg-white border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-center gap-1">
                  <Mic className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                  <span className="text-slate-300 group-hover:text-sky-300">+</span>
                  <Volume2 className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-sky-600">Shadow</span>
                <span className="text-[11px] text-slate-400 text-center">Speak along with the audio</span>
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            💡 Use headphones in Shadow mode to avoid echo
          </p>

          {/* ── Playback of last recording ── */}
          {playUrl && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 mb-2">Playing recording</p>
              <audio src={playUrl} controls className="w-full h-9" />
              <button
                onClick={() => { URL.revokeObjectURL(playUrl); setPlayUrl(null); }}
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Recordings history ── */}
          {recordings.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                My Recordings ({recordings.length})
              </h4>
              <div className="space-y-2">
                {recordings.map(rec => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <button
                      onClick={() => playRecording(rec)}
                      className="w-8 h-8 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-sky-600 ml-0.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700">{fmtDate(rec.dateISO)}</p>
                      <p className="text-[11px] text-slate-400">{fmtTime(rec.durationMs / 1000)}</p>
                    </div>
                    <button
                      onClick={() => deleteRec(rec.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-12" /> {/* bottom breathing room */}
      </div>
    </div>
  );
}

// ─── PassageList ────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

function PassageList({
  onSelect,
  onBack,
}: {
  onSelect: (p: ShadowingPassage) => void;
  onBack?: () => void;
}) {
  const { t } = useUiLang();
  const { shadowingCustom, shadowingIsFullOverride } = useCMSContent();
  const SHADOWING_PASSAGES  = useMemo(
    // When admin has saved a full override, use it exclusively; otherwise merge.
    () => shadowingIsFullOverride ? shadowingCustom : [..._DEFAULT_SHADOWING, ...shadowingCustom],
    [shadowingCustom, shadowingIsFullOverride],
  );
  const [query, setQuery]       = useState('');
  const [page, setPage]         = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q
      ? SHADOWING_PASSAGES.filter(p => p.title.toLowerCase().includes(q))
      : SHADOWING_PASSAGES;
  }, [query, SHADOWING_PASSAGES]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changePage = (p: number) => { setPage(p); window.scrollTo(0, 0); };

  // Reset page on search change
  useEffect(() => { setPage(1); }, [query]);

  // Windowed pagination dots
  const WINDOW = 5;
  const half   = Math.floor(WINDOW / 2);
  let dotStart = Math.max(1, page - half);
  let dotEnd   = Math.min(totalPages, dotStart + WINDOW - 1);
  if (dotEnd - dotStart < WINDOW - 1) dotStart = Math.max(1, dotEnd - WINDOW + 1);
  const dotPages = Array.from({ length: dotEnd - dotStart + 1 }, (_, i) => dotStart + i);

  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">

        {/* Header */}
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> {t('action.back')}
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
          {t('speaking.shadow.title')}
        </div>
        <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight leading-tight mb-1.5">
          {t('shadowing.choosePassage')}
        </h1>
        <p className="text-[13px] text-slate-500 mb-4">
          {t('shadowing.subtitle')}
        </p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('shadowing.search', { n: SHADOWING_PASSAGES.length })}
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-sky-400 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">{t('shadowing.searchEmpty', { query })}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pageItems.map(p => {
                const words = p.text.split(/\s+/).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-sky-600 font-bold px-2 py-0.5 bg-sky-50 rounded-full">
                          <Volume2 className="w-2.5 h-2.5" /> Audio
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">~{words} words</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm leading-snug">{p.title}</p>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {p.text.slice(0, 90)}…
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-sky-500 flex items-center justify-center shrink-0 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => changePage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {dotStart > 1 && <span className="text-[11px] text-slate-400 font-bold">1…</span>}
                  {dotPages.map(pg => (
                    <button
                      key={pg}
                      onClick={() => changePage(pg)}
                      className={`rounded-full transition-all duration-150 ${
                        pg === page
                          ? 'w-7 h-7 bg-zinc-900 text-white text-xs font-bold'
                          : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {pg === page ? pg : ''}
                    </button>
                  ))}
                  {dotEnd < totalPages && (
                    <span className="text-[11px] text-slate-400 font-bold">…{totalPages}</span>
                  )}
                </div>
                <button
                  onClick={() => changePage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* How it works */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">💡 How Shadowing Works</h3>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside leading-relaxed">
            <li>Select any passage — real audio plays immediately.</li>
            <li>Follow the highlighted text as the speaker talks (like subtitles).</li>
            <li>Click a line at any time to jump to that part of the audio.</li>
            <li>Hit <strong>Record Yourself</strong> to practise reading the passage aloud.</li>
            <li>Hit <strong>Shadow</strong> to record yourself speaking along with the audio simultaneously — the ultimate technique.</li>
            <li>Play back your recordings to compare with the original.</li>
          </ol>
        </div>

        <PracticeHistory storageKey={SHADOWING_HISTORY_KEY} label="Past Shadowing Sessions" />
      </div>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────

export function Shadowing({ onBack }: { onBack?: () => void }) {
  const [passage, setPassage] = useState<ShadowingPassage | null>(null);

  if (passage) {
    return (
      <PracticeView
        passage={passage}
        onBack={() => setPassage(null)}
      />
    );
  }

  return <PassageList onSelect={setPassage} onBack={onBack} />;
}

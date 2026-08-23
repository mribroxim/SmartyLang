import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Square, Volume2, Loader2 } from 'lucide-react';
import { SPEAKING_LEVELS as PRACTICE_LEVELS, type SpeakingLevel as PracticeLevel } from '../data/speakingTopics';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { speakTextAsync, cancelSpeech } from '../lib/speech';
import { buddyTurn, AiExaminerError } from '../lib/aiExaminer';
import { LevelCard, LevelCardGrid } from '../components/LevelCards';
import { ScreenShell } from '../components/ScreenShell';
import { CONTENT_LANG_NATIVE } from '../lib/contentLang';

type Turn = { role: 'user' | 'assistant'; content: string; note?: string };

const GREETINGS: Record<string, string> = {
  en: 'Hi! I am your speaking buddy. What would you like to talk about today?',
  ru: 'Привет! Я твой собеседник. О чём хочешь поговорить сегодня?',
  es: '¡Hola! Soy tu compañero de conversación. ¿De qué quieres hablar hoy?',
  de: 'Hallo! Ich bin dein Gesprächspartner. Worüber möchtest du heute sprechen?',
  fr: 'Salut ! Je suis ton partenaire de conversation. De quoi veux-tu parler aujourd’hui ?',
  it: 'Ciao! Sono il tuo partner di conversazione. Di cosa vuoi parlare oggi?',
  pt: 'Oi! Sou seu parceiro de conversa. Sobre o que você quer falar hoje?',
  ja: 'こんにちは！スピーキングのパートナーです。今日は何について話しますか？',
  ko: '안녕하세요! 스피킹 파트너예요. 오늘 무엇에 대해 이야기할까요?',
  zh: '你好！我是你的口语伙伴。今天想聊什么？',
  ar: 'مرحبا! أنا رفيق المحادثة. عن ماذا تريد أن نتحدث اليوم؟',
  tr: 'Merhaba! Konuşma partnerinim. Bugün ne hakkında konuşmak istersin?',
  nl: 'Hoi! Ik ben je spreekpartner. Waar wil je het vandaag over hebben?',
  hi: 'नमस्ते! मैं आपका बोलने वाला साथी हूँ। आज आप किस बारे में बात करना चाहते हैं?',
  pl: 'Cześć! Jestem twoim partnerem do rozmowy. O czym chcesz dziś porozmawiać?',
  sv: 'Hej! Jag är din samtalskompis. Vad vill du prata om idag?',
  id: 'Hai! Saya teman bicara kamu. Mau ngobrol tentang apa hari ini?',
  ms: 'Hai! Saya rakan perbualan anda. Tentang apa anda mahu bercakap hari ini?',
  vi: 'Xin chào! Mình là bạn nói chuyện của bạn. Hôm nay bạn muốn nói về gì?',
  th: 'สวัสดี! ฉันเป็นเพื่อนฝึกพูด คุณอยากคุยเรื่องอะไรวันนี้?',
  uk: 'Привіт! Я твій співрозмовник. Про що хочеш поговорити сьогодні?',
  el: 'Γεια! Είμαι ο συνομιλητής σου. Για τι θέλεις να μιλήσουμε σήμερα;',
  cs: 'Ahoj! Jsem tvůj konverzační partner. O čem chceš dnes mluvit?',
  ro: 'Salut! Sunt partenerul tău de conversație. Despre ce vrei să vorbim azi?',
  ur: 'سلام! میں آپ کا اسپیiking ساتھی ہوں۔ آج آپ کس بارے میں بات کرنا چاہتے ہیں؟',
  sw: 'Habari! Mimi ni mwenzako wa kuzungumza. Ungependa kuzungumza nini leo?',
  fa: 'سلام! من همصحبت تو هستم. امروز دوست داری درباره چه حرف بزنیم؟',
  uz: 'Salom! Men suhbatdoshingman. Bugun nima haqida gaplashamiz?',
  tl: 'Hi! Ako ang speaking buddy mo. Ano ang gusto mong pag-usapan ngayon?',
};

export function SpeakingBuddy({
  onBack,
  startingLevel,
}: {
  onBack?: () => void;
  startingLevel?: string;
}) {
  const { contentLang, speechLocale } = useContentLang();
  const { uiLang, tLevel } = useUiLang();
  const defaultLevel = (PRACTICE_LEVELS.includes(startingLevel as PracticeLevel)
    ? startingLevel
    : 'Intermediate') as PracticeLevel;

  const [view, setView] = useState<'level' | 'chat'>('level');
  const [level, setLevel] = useState<PracticeLevel>(defaultLevel);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState('');

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  const greet = GREETINGS[contentLang] || GREETINGS.en;
  const langName = CONTENT_LANG_NATIVE[contentLang] || contentLang;

  const clearVAD = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch { /* ignore */ } audioCtxRef.current = null; }
    analyserRef.current = null;
  }, []);

  useEffect(() => () => { cancelSpeech(); clearVAD(); }, [clearVAD]);

  const startChat = async (lvl: PracticeLevel) => {
    setLevel(lvl);
    setView('chat');
    const first: Turn = { role: 'assistant', content: greet };
    setTurns([first]);
    try {
      await speakTextAsync(greet, 1, speechLocale);
    } catch { /* TTS optional */ }
  };

  const sendUtterance = async (text: string) => {
    const spoken = text.trim();
    if (!spoken || busy) return;
    setBusy(true);
    setError(null);
    const userTurn: Turn = { role: 'user', content: spoken };
    const history = [...turnsRef.current, userTurn].map(t => ({ role: t.role, content: t.content }));
    setTurns(prev => [...prev, userTurn]);
    try {
      const res = await buddyTurn({
        history: history.slice(0, -1),
        utterance: spoken,
        level,
        contentLang,
        uiLang,
      });
      const spokenReply = [res.reply, res.followUp].filter(Boolean).join(' ');
      const bot: Turn = { role: 'assistant', content: spokenReply || res.reply, note: res.correctionNote };
      setTurns(prev => [...prev, bot]);
      if (spokenReply) await speakTextAsync(spokenReply, 1, speechLocale);
    } catch (e: any) {
      setError(e instanceof AiExaminerError ? e.message : (e?.message || 'Buddy failed'));
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = useCallback(() => {
    clearVAD();
    mediaRef.current?.stop();
    setRecording(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* ignore */ }
      recRef.current = null;
    }
  }, [clearVAD]);

  const startRecording = async () => {
    chunksRef.current = [];
    transcriptRef.current = '';
    setLive('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const spoken = transcriptRef.current.trim();
        if (spoken) void sendUtterance(spoken);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);

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
            const text = (finalText + interim).trim();
            transcriptRef.current = text;
            setLive(text);
          };
          r.onend = () => { if (mediaRef.current?.state === 'recording') { try { r.start(); } catch { /* ignore */ } } };
          recRef.current = r;
          r.start();
        } catch { /* STT optional */ }
      }

      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
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
            silTimerRef.current = setTimeout(() => stopRecording(), 2200);
          }
          rafRef.current = requestAnimationFrame(check);
        };
        rafRef.current = requestAnimationFrame(check);
      } catch { /* VAD optional */ }
    } catch {
      setError('Could not access the microphone.');
    }
  };

  if (view === 'level') {
    return (
      <ScreenShell title="Speaking buddy" subtitle={`Chat in ${langName}. Pick a level — we'll keep replies short.`}>
        {onBack && (
          <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <LevelCardGrid>
          {PRACTICE_LEVELS.map((lvl, i) => (
            <LevelCard
              key={lvl}
              title={tLevel(lvl)}
              themeIndex={i}
              onClick={() => startChat(lvl)}
              forYou={lvl === defaultLevel}
            />
          ))}
        </LevelCardGrid>
      </ScreenShell>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-white dark:bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => { cancelSpeech(); stopRecording(); setView('level'); }} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Speaking buddy</p>
          <p className="text-[11px] text-zinc-500">{tLevel(level)} · {langName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-2xl mx-auto w-full">
        {turns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${turn.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100'}`}>
              <p className="text-sm leading-relaxed">{turn.content}</p>
              {turn.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => speakTextAsync(turn.content, 1, speechLocale)}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
                >
                  <Volume2 className="w-3 h-3" /> Hear
                </button>
              )}
              {turn.note && (
                <p className="mt-2 text-[11px] leading-relaxed opacity-80 border-t border-white/20 pt-2">{turn.note}</p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <p className="text-xs text-zinc-400 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
          </p>
        )}
        {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          {live && <p className="text-sm text-zinc-600 dark:text-zinc-300 font-serif text-center">{live}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => recording ? stopRecording() : startRecording()}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-40 ${recording ? 'bg-rose-500 animate-pulse' : 'bg-zinc-900 hover:bg-black'}`}
          >
            {recording ? <Square className="w-6 h-6 text-white fill-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>
          <p className="text-xs text-zinc-400">{recording ? 'Listening… stops when you pause' : 'Tap to speak'}</p>
        </div>
      </div>
    </div>
  );
}

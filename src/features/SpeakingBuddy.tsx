import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mic, PhoneOff, Square, Volume2 } from 'lucide-react';
import { SPEAKING_LEVELS as PRACTICE_LEVELS, type SpeakingLevel as PracticeLevel } from '../data/speakingTopics';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { speakTextAsync, cancelSpeech } from '../lib/speech';
import { buddyTurn, AiExaminerError } from '../lib/aiExaminer';
import { LevelCard, LevelCardGrid } from '../components/LevelCards';
import { ScreenShell } from '../components/ScreenShell';
import { CONTENT_LANG_NATIVE } from '../lib/contentLang';

type Turn = { role: 'user' | 'assistant'; content: string; note?: string };
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

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
  const { t, uiLang, tLevel } = useUiLang();
  const defaultLevel = (PRACTICE_LEVELS.includes(startingLevel as PracticeLevel)
    ? startingLevel
    : 'Intermediate') as PracticeLevel;

  const [view, setView] = useState<'level' | 'chat'>('level');
  const [level, setLevel] = useState<PracticeLevel>(defaultLevel);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState('');

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const utteranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const levelRef = useRef<PracticeLevel>(level);
  const listeningRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  levelRef.current = level;

  const greet = GREETINGS[contentLang] || GREETINGS.en;
  const langName = CONTENT_LANG_NATIVE[contentLang] || contentLang;

  const clearUtteranceTimer = () => {
    if (utteranceTimerRef.current) {
      clearTimeout(utteranceTimerRef.current);
      utteranceTimerRef.current = null;
    }
  };

  const releaseMicrophone = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const stopListening = (submit = true) => {
    const spoken = transcriptRef.current.trim();
    listeningRef.current = false;
    clearUtteranceTimer();
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
    releaseMicrophone();
    transcriptRef.current = '';
    setLive('');
    if (submit && spoken && activeRef.current) {
      void sendUtterance(spoken);
    }
  };

  const startListening = async () => {
    if (!activeRef.current || listeningRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t("learning.speech.recognition.is.not.available.in.this.browser.try.ch.9fca27"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!activeRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      listeningRef.current = true;
      transcriptRef.current = '';
      setLive('');
      if (!speakingRef.current) setVoiceState('listening');

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLocale;
      let finalText = '';
      recognition.onresult = (event: any) => {
        if (recognitionRef.current !== recognition) return;
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += `${result[0].transcript} `;
          else interim += result[0].transcript;
        }
        const text = `${finalText}${interim}`.trim();
        transcriptRef.current = text;
        setLive(text);

        // Listening stays active during TTS. Any detected learner speech
        // immediately barges in and cancels the assistant audio.
        if (speakingRef.current && text) {
          speakingRef.current = false;
          cancelSpeech();
          setVoiceState('listening');
        }
        if (finalText.trim()) {
          clearUtteranceTimer();
          utteranceTimerRef.current = setTimeout(() => stopListening(true), 1400);
        }
      };
      recognition.onerror = (event: any) => {
        if (recognitionRef.current !== recognition) return;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(t("learning.microphone.permission.is.required.for.speaking.buddy.f95b6b"));
          stopListening(false);
        }
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition && listeningRef.current && activeRef.current) {
          try { recognition.start(); } catch { /* browser is already restarting */ }
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError(t("learning.could.not.access.the.microphone.aa31c7"));
      listeningRef.current = false;
      releaseMicrophone();
    }
  };

  const endConversation = () => {
    activeRef.current = false;
    setSessionActive(false);
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    speakingRef.current = false;
    cancelSpeech();
    stopListening(false);
    setVoiceState('idle');
  };

  async function sendUtterance(text: string) {
    const spoken = text.trim();
    if (!spoken || !activeRef.current) return;
    const generation = ++generationRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    speakingRef.current = false;
    cancelSpeech();
    setError(null);
    setVoiceState('thinking');
    const userTurn: Turn = { role: 'user', content: spoken };
    const history = [...turnsRef.current, userTurn].map(t => ({ role: t.role, content: t.content }));
    setTurns(prev => [...prev, userTurn]);

    try {
      const res = await buddyTurn({
        history: history.slice(0, -1),
        utterance: spoken,
        level: levelRef.current,
        contentLang,
        uiLang,
        signal: controller.signal,
      });
      if (!activeRef.current || controller.signal.aborted || generation !== generationRef.current) return;
      const spokenReply = [res.reply, res.followUp].filter(Boolean).join(' ');
      const bot: Turn = { role: 'assistant', content: spokenReply || res.reply, note: res.correctionNote };
      setTurns(prev => [...prev, bot]);
      if (spokenReply) {
        speakingRef.current = true;
        setVoiceState('speaking');
        await startListening();
        if (!activeRef.current || generation !== generationRef.current) return;
        await speakTextAsync(spokenReply, 1, speechLocale);
      }
      speakingRef.current = false;
      if (activeRef.current && generation === generationRef.current) {
        setVoiceState('listening');
        if (!listeningRef.current) await startListening();
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError' && !controller.signal.aborted && activeRef.current && generation === generationRef.current) {
        setError(e instanceof AiExaminerError ? e.message : (e?.message || t("learning.buddy.failed.23eeb0")));
        setVoiceState('listening');
        if (!listeningRef.current) await startListening();
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  const startChat = async (lvl: PracticeLevel) => {
    endConversation();
    setLevel(lvl);
    levelRef.current = lvl;
    setView('chat');
    setError(null);
    activeRef.current = true;
    setSessionActive(true);
    const generation = ++generationRef.current;
    const first: Turn = { role: 'assistant', content: greet };
    speakingRef.current = true;
    setTurns([first]);
    setVoiceState('speaking');
    await startListening();
    if (!activeRef.current || generation !== generationRef.current) return;
    try { await speakTextAsync(greet, 1, speechLocale); } catch { /* TTS optional */ }
    speakingRef.current = false;
    if (activeRef.current && generation === generationRef.current) {
      setVoiceState('listening');
      if (!listeningRef.current) await startListening();
    }
  };

  useEffect(() => () => {
    activeRef.current = false;
    requestRef.current?.abort();
    cancelSpeech();
    clearUtteranceTimer();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    releaseMicrophone();
  }, []);

  const interrupt = () => {
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    speakingRef.current = false;
    cancelSpeech();
    setVoiceState('listening');
    if (!listeningRef.current) void startListening();
  };

  const statusLabel = voiceState === 'speaking'
    ? 'Speaking — interrupt me anytime'
    : voiceState === 'thinking'
    ? 'Thinking…'
    : voiceState === 'listening'
    ? 'Listening — speak naturally'
    : 'Ready';

  if (view === 'level') {
    return (
      <ScreenShell stickers={['speak.conversation-partner']} title={t("site.speakingbuddy.speaking_buddy_cf9c4a")} subtitle={t("learning.have.a.hands.free.conversation.in.v0.pick.a.level.6d0e35", { v0: langName })}>
        {onBack && (
          <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
            <ArrowLeft className="w-4 h-4" />  {t("onboard.back")}</button>
        )}
        <LevelCardGrid>
          {PRACTICE_LEVELS.map((lvl, i) => (
            <LevelCard
              key={lvl}
              title={tLevel(lvl)}
              themeIndex={i}
              onClick={() => void startChat(lvl)}
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
        <button onClick={() => { endConversation(); setView('level'); }} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" aria-label={t("site.speakingbuddy.back_to_levels_81ea41")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{t("site.speakingbuddy.speaking_buddy_cf9c4a")}</p>
          <p className="text-[11px] text-zinc-500">{tLevel(level)} · {langName}</p>
        </div>
        <button
          type="button"
          onClick={() => { endConversation(); setView('level'); }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <PhoneOff className="w-4 h-4" />  {t("site.speakingbuddy.end_a2bb9d")}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-2xl mx-auto w-full">
        {turns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${turn.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100'}`}>
              <p className="text-sm leading-relaxed">{turn.content}</p>
              {turn.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => { cancelSpeech(); void speakTextAsync(turn.content, 1, speechLocale); }}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
                >
                  <Volume2 className="w-3 h-3" />  {t("site.speakingbuddy.hear_d87273")}</button>
              )}
              {turn.note && (
                <p className="mt-2 text-[11px] leading-relaxed opacity-80 border-t border-white/20 pt-2">{turn.note}</p>
              )}
            </div>
          </div>
        ))}
        {live && (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 italic px-4" aria-live="polite">{live}</div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-5">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${voiceState === 'speaking' ? 'bg-violet-500 shadow-[0_0_0_14px_rgba(139,92,246,0.12)] animate-pulse' : voiceState === 'thinking' ? 'bg-zinc-400 shadow-[0_0_0_14px_rgba(161,161,170,0.12)]' : 'bg-emerald-500 shadow-[0_0_0_14px_rgba(16,185,129,0.12)]'}`}>
            {voiceState === 'thinking' ? <Loader2 className="w-9 h-9 text-white animate-spin" /> : <Mic className="w-9 h-9 text-white" />}
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200" aria-live="polite">{statusLabel}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={interrupt}
              disabled={!sessionActive || voiceState === 'listening'}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40"
            >
              <Square className="w-3.5 h-3.5" />  {t("site.speakingbuddy.interrupt_d5db45")}</button>
            <button
              type="button"
              onClick={() => { endConversation(); setView('level'); }}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              <PhoneOff className="w-3.5 h-3.5" />  {t("site.speakingbuddy.end_conversation_4751bc")}</button>
          </div>
          {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2 text-center">{error}</p>}
          <p className="text-[11px] text-zinc-400 text-center">{t("site.speakingbuddy.handsfree_mode_is_on_speak_0e6594")}</p>
        </div>
      </div>
    </div>
  );
}
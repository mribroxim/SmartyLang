import { useState, useRef, useEffect, useCallback } from 'react';
import { useUiLang } from '../contexts/UiLangContext';

/** True on phones/tablets. Used to skip the MediaRecorder mic-on-mobile, because
 * requesting a second getUserMedia alongside SpeechRecognition is what makes Web
 * Speech fail with "cannot transcribe" — on mobile we let recognition own the mic
 * alone and don't push an audio recording to the library. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Mobi|Android/i.test(ua)) return true;
  return /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function useVosk(speechLocale: string = 'en-US') {
  const { t } = useUiLang();
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  // The ONE shared mic capture. It is handed to the MediaRecorder in App.tsx
  // (recording/playback/download) AND is the same physical default mic that
  // SpeechRecognition listens on — only a single getUserMedia acquisition ever
  // happens per session, avoiding the mobile "two mics" conflict that made Web
  // Speech fail with "cannot transcribe".
  const streamRef = useRef<MediaStream | null>(null);
  const speechLocaleRef = useRef(speechLocale);

  useEffect(() => {
    speechLocaleRef.current = speechLocale;
  }, [speechLocale]);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsReady(true);
    } else {
      setModelError(t('learning.speech.recognition.not.supported.9a4ce8'));
    }
  }, [t]);

  const isIntentionallyStopped = useRef<boolean>(false);

  const startRecognition = useCallback(async (
    onResult: (text: string) => void,
    onPartialResult: (text: string) => void,
    captureStream = true,
    onError?: (error: string) => void,
  ) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error(t('learning.speech.recognition.not.supported.9a4ce8'));
    }

    if (recognitionRef.current) {
        try {
            recognitionRef.current.stop();
        } catch (e) {}
    }

    isIntentionallyStopped.current = false;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Chrome on Android does NOT properly support continuous=true — it keeps
    // listening through silence and hallucinates a long continuation that only
    // loosely matches the passage, so saying a couple words appears to "read the
    // whole passage" (Chromium issue 41297427 / MDN BCD PR #25878). On desktop,
    // continuous works reliably and gives PC-grade live accuracy. So on mobile
    // we run discrete sessions (continuous=false) and let onend restart cleanly
    // after each utterance → each result reflects what was actually said.
    const mobileContinuous = isMobileDevice();
    recognition.continuous = !mobileContinuous;
    recognition.interimResults = true;
    recognition.lang = speechLocaleRef.current || 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + event.results[i][0].transcript;
        } else {
          interimTranscript += ' ' + event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
      if (interimTranscript) {
        onPartialResult(interimTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      onError?.(String(event.error || 'speech-error'));
      // Don't throw or stop, let onend handle it if it was a network error
    };
    
    recognition.onend = () => {
       if (!isIntentionallyStopped.current && recognitionRef.current) {
           console.log("Speech recognition ended unexpectedly, restarting...");
           try {
               recognitionRef.current.start();
           } catch (e) {
               console.error("Failed to restart speech recognition", e);
           }
       }
    };

    try {
      // On mobile we deliberately do NOT request a MediaStream for recording —
      // SpeechRecognition opens the mic by itself. Requesting a second
      // getUserMedia (for a MediaRecorder) simultaneously is what triggers
      // "cannot transcribe" on phones (two competing mic acquisitions). So
      // captureStream=false → let recognition own the single mic, skip the
      // explicit getUserMedia, and return null.
      if (!captureStream) {
        recognition.start();
        return null;
      }

      // Desktop path: one getUserMedia acquisition shared for BOTH recognition
      // and recording. If a live stream already exists, reuse it rather than
      // opening a second mic — never two mics at once.
      const stream = streamRef.current && streamRef.current.active
        ? streamRef.current
        : await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
          });
      streamRef.current = stream;

      // Start recognition AFTER the single stream is active (ordering matters:
      // the recorder in App.tsx uses this exact stream, and recognition listens
      // on the same default mic — no second mic is opened).
      recognition.start();
      return stream;
    } catch (e) {
        console.error("Speech recognition start error", e);
        throw e;
    }
  }, [t]);

  const stopRecognition = useCallback(() => {
     isIntentionallyStopped.current = true;
     if (streamRef.current) {
         streamRef.current.getTracks().forEach((t: any) => t.stop());
         streamRef.current = null;
     }
     if (recognitionRef.current) {
         try {
             recognitionRef.current.stop();
         } catch (e) {}
         recognitionRef.current = null;
     }
  }, []);

  return { startRecognition, stopRecognition, isReady, modelLoading, modelError };
}



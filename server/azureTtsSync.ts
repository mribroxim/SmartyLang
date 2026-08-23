/**
 * Azure Speech SDK synthesis with SSML bookmark timepoints for lyric sync.
 */
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { VoiceSpec } from './azureVoices.ts';

export interface TtsTimepoint {
  index: number;
  timeSeconds: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildWordSpans(text: string, words: string[]): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const w of words) {
    if (!w) {
      spans.push({ start: cursor, end: cursor });
      continue;
    }
    const at = text.indexOf(w, cursor);
    if (at < 0) {
      spans.push({ start: cursor, end: cursor + w.length });
      cursor += w.length;
    } else {
      spans.push({ start: at, end: at + w.length });
      cursor = at + w.length;
    }
  }
  return spans;
}

export function buildSsmlWithBookmarks(
  text: string,
  words: string[],
  voiceCfg: VoiceSpec,
  rate: number,
): string {
  const r = Math.min(2, Math.max(0.5, rate || 1));
  const clean = String(text || '').trim();
  const spans = buildWordSpans(clean, words);
  let inner = '';
  let cursor = 0;

  for (let i = 0; i < words.length; i++) {
    const span = spans[i];
    if (span.start > cursor) {
      inner += escapeXml(clean.slice(cursor, span.start));
    }
    inner += `<bookmark mark="${i}"/>`;
    inner += escapeXml(clean.slice(span.start, span.end));
    cursor = span.end;
  }
  if (cursor < clean.length) {
    inner += escapeXml(clean.slice(cursor));
  }

  return (
    `<speak version='1.0' xml:lang='${voiceCfg.locale}'>` +
    `<voice name='${voiceCfg.voice}'>` +
    `<prosody rate='${r.toFixed(2)}'>${inner}</prosody>` +
    `</voice></speak>`
  );
}

export function synthesizeSsmlWithTimepoints(
  ssml: string,
  key: string,
  region: string,
): Promise<{ mp3: Buffer; timepoints: TtsTimepoint[] }> {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const timepoints: TtsTimepoint[] = [];

    synthesizer.bookmarkReached = (_sender, event) => {
      const index = Number.parseInt(String(event.text ?? ''), 10);
      if (!Number.isFinite(index) || index < 0) return;
      timepoints.push({ index, timeSeconds: event.audioOffset / 10_000_000 });
    };

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const mp3 = Buffer.from(result.audioData);
          timepoints.sort((a, b) => a.timeSeconds - b.timeSeconds || a.index - b.index);
          if (timepoints.length && timepoints[0].index !== 0) {
            timepoints.unshift({ index: 0, timeSeconds: 0 });
          }
          resolve({ mp3, timepoints });
          return;
        }
        reject(Object.assign(new Error(result.errorDetails || 'Azure sync TTS failed'), { status: 502 }));
      },
      (err) => {
        synthesizer.close();
        reject(Object.assign(new Error(String(err)), { status: 502 }));
      },
    );
  });
}

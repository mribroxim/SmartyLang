/**
 * Azure Speech SDK synthesis with SSML bookmark timepoints for lyric sync.
 * REST TTS returns audio only; the SDK exposes bookmarkReached audio offsets.
 */
const sdk = require("microsoft-cognitiveservices-speech-sdk");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Align each display token to a character span inside `text`. */
function buildWordSpans(text, words) {
  const spans = [];
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

/** Insert `<bookmark mark="N"/>` before each word for accurate highlight timing. */
function buildSsmlWithBookmarks(text, words, voiceCfg, rate) {
  const r = Math.min(2, Math.max(0.5, Number(rate) || 1));
  const clean = String(text || "").trim();
  const spans = buildWordSpans(clean, words);
  let inner = "";
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

function synthesizeSsmlWithTimepoints(ssml, key, region) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const timepoints = [];

    synthesizer.bookmarkReached = (_sender, event) => {
      const index = Number.parseInt(String(event.text ?? ""), 10);
      if (!Number.isFinite(index) || index < 0) return;
      const timeSeconds = event.audioOffset / 10_000_000;
      timepoints.push({ index, timeSeconds });
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
        const detail = sdk.SpeechSynthesisCancellationDetails.fromResult(result);
        const err = new Error(detail?.errorDetails || "Azure sync TTS failed");
        err.status = 502;
        reject(err);
      },
      (err) => {
        synthesizer.close();
        const wrapped = new Error(String(err));
        wrapped.status = 502;
        reject(wrapped);
      },
    );
  });
}

module.exports = {
  buildSsmlWithBookmarks,
  synthesizeSsmlWithTimepoints,
};

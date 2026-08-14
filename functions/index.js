/**
 * Microsoft Azure Neural Text-to-Speech proxy for Firebase Hosting.
 *
 * Secrets (set via `firebase functions:secrets:set NAME`):
 *   AZURE_SPEECH_KEY     — Azure Speech Services subscription key
 *   AZURE_SPEECH_REGION  — Speech resource region (e.g. eastus, westeurope)
 *
 * POST body:
 *   { text, lang, rate } → audio/mpeg
 *   { text, lang, rate, sync, words } → JSON { audioContent, timepoints }
 *
 * NOTE ON WORD SYNC: Azure's REST endpoint returns only the synthesized audio —
 * it does NOT expose word-boundary timepoints (that requires the Speech SDK over
 * a WebSocket, which is a heavier integration). Synced requests therefore return
 * the mp3 with an EMPTY timepoints array; the client's lyric-highlighting falls
 * back to duration-estimated word timing (see src/lib/speech.ts). Voice quality
 * and language coverage are the premium Azure Neural voices, including Uzbek and
 * Persian which Google Cloud TTS did not provide.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { officialTranslate, cacheDocId, missDocId } = require("./translateCore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const azureKey = defineSecret("AZURE_SPEECH_KEY");
const azureRegion = defineSecret("AZURE_SPEECH_REGION");

// Premium Azure Neural voices (female by default) per app language code.
// Coverage: all 29 content languages, incl. Uzbek (uz-UZ) and Persian (fa-IR)
// which Google Cloud TTS did not offer.
const AZURE_VOICES = {
  en: { locale: "en-US", voice: "en-US-AriaNeural" },
  ru: { locale: "ru-RU", voice: "ru-RU-SvetlanaNeural" },
  tl: { locale: "fil-PH", voice: "fil-PH-BlessicaNeural" },
  fil: { locale: "fil-PH", voice: "fil-PH-BlessicaNeural" },
  es: { locale: "es-ES", voice: "es-ES-ElviraNeural" },
  uz: { locale: "uz-UZ", voice: "uz-UZ-MadinaNeural" },
  de: { locale: "de-DE", voice: "de-DE-KatjaNeural" },
  fr: { locale: "fr-FR", voice: "fr-FR-DeniseNeural" },
  it: { locale: "it-IT", voice: "it-IT-ElsaNeural" },
  pt: { locale: "pt-BR", voice: "pt-BR-FranciscaNeural" },
  ja: { locale: "ja-JP", voice: "ja-JP-NanamiNeural" },
  ko: { locale: "ko-KR", voice: "ko-KR-SunHiNeural" },
  zh: { locale: "zh-CN", voice: "zh-CN-XiaoxiaoNeural" },
  cmn: { locale: "zh-CN", voice: "zh-CN-XiaoxiaoNeural" },
  ar: { locale: "ar-SA", voice: "ar-SA-ZariyahNeural" },
  tr: { locale: "tr-TR", voice: "tr-TR-EmelNeural" },
  nl: { locale: "nl-NL", voice: "nl-NL-ColetteNeural" },
  hi: { locale: "hi-IN", voice: "hi-IN-SwaraNeural" },
  pl: { locale: "pl-PL", voice: "pl-PL-ZofiaNeural" },
  sv: { locale: "sv-SE", voice: "sv-SE-SofieNeural" },
  id: { locale: "id-ID", voice: "id-ID-GadisNeural" },
  ms: { locale: "ms-MY", voice: "ms-MY-YasminNeural" },
  vi: { locale: "vi-VN", voice: "vi-VN-HoaiMyNeural" },
  th: { locale: "th-TH", voice: "th-TH-PremwadeeNeural" },
  uk: { locale: "uk-UA", voice: "uk-UA-PolinaNeural" },
  el: { locale: "el-GR", voice: "el-GR-AthinaNeural" },
  cs: { locale: "cs-CZ", voice: "cs-CZ-VlastaNeural" },
  ro: { locale: "ro-RO", voice: "ro-RO-AlinaNeural" },
  ur: { locale: "ur-PK", voice: "ur-PK-UzmaNeural" },
  sw: { locale: "sw-KE", voice: "sw-KE-ZuriNeural" },
  fa: { locale: "fa-IR", voice: "fa-IR-DilaraNeural" },
};

const CACHE_MAX = 200;
/** @type {Map<string, { mp3: Buffer, timepoints?: {index:number,timeSeconds:number}[], at: number }>} */
const cache = new Map();

function resolveLang(lang) {
  const base = String(lang || "en").split("-")[0].toLowerCase();
  if (base === "fil") return "tl";
  if (base === "cmn" || base === "zh") return "zh";
  if (AZURE_VOICES[base]) return base;
  return "en";
}

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (let i = 0; i < oldest.length - CACHE_MAX; i++) {
    cache.delete(oldest[i][0]);
  }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildAzureSsml(text, lang, rate) {
  const cfg = AZURE_VOICES[lang] || AZURE_VOICES.en;
  const r = Math.min(2, Math.max(0.5, Number(rate) || 1));
  const clean = String(text || "").trim();
  return (
    `<speak version='1.0' xml:lang='${cfg.locale}'>` +
    `<voice name='${cfg.voice}'>` +
    `<prosody rate='${r.toFixed(2)}'>${escapeXml(clean)}</prosody>` +
    `</voice></speak>`
  );
}

async function callAzure(ssml, key, region) {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "smarty-english",
      },
      body: ssml,
    });
  } catch (e) {
    const err = new Error(`Azure TTS network error: ${e?.message || "unknown"}`);
    err.status = 502;
    throw err;
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`Azure TTS failed (${res.status}): ${errText.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) {
    const err = new Error("Azure TTS returned no audio");
    err.status = 502;
    throw err;
  }
  return buf;
}

async function synthesizeMp3(text, langInput, rate, key, region) {
  const clean = String(text || "").trim().slice(0, 4500);
  if (!clean) {
    const err = new Error("Empty text");
    err.status = 400;
    throw err;
  }
  const lang = resolveLang(langInput);
  const speakingRate = Math.min(2, Math.max(0.5, Number(rate) || 1));
  const keyStr = `${lang}|${speakingRate.toFixed(2)}|${clean}`;
  const hit = cache.get(keyStr);
  if (hit) {
    hit.at = Date.now();
    return hit.mp3;
  }

  const mp3 = await callAzure(buildAzureSsml(clean, lang, speakingRate), key, region);
  cache.set(keyStr, { mp3, at: Date.now() });
  pruneCache();
  return mp3;
}

async function synthesizeMp3WithSync(text, langInput, rate, key, region) {
  const clean = String(text || "").trim().slice(0, 4500);
  if (!clean) {
    const err = new Error("Empty text");
    err.status = 400;
    throw err;
  }
  const lang = resolveLang(langInput);
  const speakingRate = Math.min(2, Math.max(0.5, Number(rate) || 1));
  const keyStr = `${lang}|${speakingRate.toFixed(2)}|sync|${clean}`;
  const hit = cache.get(keyStr);
  if (hit) {
    hit.at = Date.now();
    return { mp3: hit.mp3, timepoints: hit.timepoints || [] };
  }

  // Azure REST does not return word-boundary timepoints; the client falls back
  // to estimated duration-based highlighting when timepoints is empty.
  const mp3 = await callAzure(buildAzureSsml(clean, lang, speakingRate), key, region);
  cache.set(keyStr, { mp3, timepoints: [], at: Date.now() });
  pruneCache();
  return { mp3, timepoints: [] };
}

exports.tts = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [azureKey, azureRegion],
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }

    try {
      const key = azureKey.value();
      const region = (azureRegion.value() || "eastus").toLowerCase().trim();
      if (!key) {
        res.status(503).json({ error: "TTS not configured (set AZURE_SPEECH_KEY)" });
        return;
      }
      const { text, lang = "en-US", rate = 1, sync = false, words = [] } = req.body || {};
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing text" });
        return;
      }

      if (sync === true && Array.isArray(words) && words.length > 0) {
        const result = await synthesizeMp3WithSync(text, lang, rate, key, region);
        res.set("Cache-Control", "private, max-age=86400");
        res.status(200).json({
          audioContent: result.mp3.toString("base64"),
          timepoints: result.timepoints,
        });
        return;
      }

      const mp3 = await synthesizeMp3(text, lang, rate, key, region);
      res.set("Content-Type", "audio/mpeg");
      res.set("Cache-Control", "private, max-age=86400");
      res.status(200).send(mp3);
    } catch (error) {
      const status = typeof error?.status === "number" ? error.status : 500;
      console.error("TTS error:", error?.message || error);
      res.status(status).json({ error: error?.message || "TTS failed" });
    }
  },
);

const translateKey = defineSecret("GOOGLE_TRANSLATE_API_KEY");
const rateBuckets = new Map();

function rateLimited(uid) {
  const now = Date.now();
  const hit = rateBuckets.get(uid);
  if (!hit || now - hit.start > 10 * 60 * 1000) {
    rateBuckets.set(uid, { start: now, count: 1 });
    return false;
  }
  hit.count += 1;
  return hit.count > 80;
}

exports.translateFallback = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [translateKey],
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }

    const word = typeof req.body?.word === "string" ? req.body.word.trim() : "";
    const from = typeof req.body?.from === "string" ? req.body.from : "en";
    const to = typeof req.body?.to === "string" ? req.body.to : "en";
    const sentence = typeof req.body?.sentence === "string" ? req.body.sentence.slice(0, 400) : "";
    if (!word) {
      res.status(400).json({ error: "Missing word" });
      return;
    }

    let uid = req.ip || "anon";
    const header = req.get("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token) {
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
      } catch { /* keep ip */ }
    }
    if (rateLimited(uid)) {
      res.status(429).json({ error: "Rate limited" });
      return;
    }

    const db = admin.firestore();
    const cid = cacheDocId(from, to, word);
    try {
      const cached = await db.collection("sharedVocabCache").doc(cid).get();
      if (cached.exists) {
        const data = cached.data() || {};
        if (data.text) {
          res.json({ text: data.text, source: "cache" });
          return;
        }
      }
    } catch (e) {
      console.warn("[translateFallback] cache read", e.message);
    }

    try {
      const apiKey = (() => {
        try { return translateKey.value(); } catch { return ""; }
      })();
      const result = await officialTranslate(word, from, to, apiKey);
      try {
        await db.collection("sharedVocabCache").doc(cid).set({
          text: result.text,
          from,
          to,
          word: word.toLowerCase(),
          source: result.source === "gtx" ? "api" : result.source,
          confidence: result.source === "v3" || result.source === "v2" ? 0.7 : 0.4,
          createdAt: Date.now(),
        });
      } catch (e) {
        console.warn("[translateFallback] cache write", e.message);
      }
      try {
        const mid = missDocId(from, word);
        const mref = db.collection("vocabMisses").doc(mid);
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(mref);
          if (snap.exists) {
            const prev = snap.data() || {};
            tx.update(mref, {
              count: (prev.count || 0) + 1,
              lastAt: Date.now(),
              sampleSentence: sentence || prev.sampleSentence || "",
              lastTranslation: result.text,
            });
          } else {
            tx.set(mref, {
              word,
              lang: from,
              targetLang: to,
              count: 1,
              sampleSentence: sentence || "",
              lastTranslation: result.text,
              source: "api",
              createdAt: Date.now(),
              lastAt: Date.now(),
            });
          }
        });
      } catch (e) {
        console.warn("[translateFallback] miss log", e.message);
      }
      res.json({ text: result.text, source: result.source });
    } catch (error) {
      console.error("translateFallback error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Translation failed" });
    }
  },
);

/**
 * Microsoft Azure Neural Text-to-Speech proxy for Firebase Hosting.
 *
 * Secrets (set via `firebase functions:secrets:set NAME`):
 *   AZURE_SPEECH_KEY     — Azure Speech Services subscription key
 *   AZURE_SPEECH_REGION  — Speech resource region (e.g. eastus, westeurope)
 *
 * Persistent cache: first listener pays Azure; later listeners get Storage/Firestore hit
 * (see functions/ttsCache.js). Response header X-TTS-Cache: memory|storage|miss.
 *
 * POST body:
 *   { text, lang, rate, voice? } → audio/mpeg
 *   { text, lang, rate, sync, words, voice? } → JSON { audioContent, timepoints }
 *
 * NOTE ON WORD SYNC: Synced requests use the Azure Speech SDK with SSML bookmarks
 * so each display word gets an accurate audio offset (see functions/azureTtsSync.js).
 * Plain (non-sync) requests still use the lighter REST endpoint.
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
const openrouterKey = defineSecret("OPENROUTER_API_KEY");
const { handleAiRequest, isMaxOrAdmin, bearerToken } = require("./aiExaminer");
const { buildSsmlWithBookmarks, synthesizeSsmlWithTimepoints } = require("./azureTtsSync");
const { AZURE_VOICES, resolveVoiceCfg } = require("./azureVoices");
const {
  normalizeRate,
  buildCacheId,
  readPersistentCache,
  writePersistentCache,
} = require("./ttsCache");

// Voice map: functions/azureVoices.js (Dragon HD / MAI / neural per language)
// Persistent cache: functions/ttsCache.js (Storage + Firestore)

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

function buildAzureSsml(text, lang, rate, voiceOverride) {
  const cfg = resolveVoiceCfg(lang, voiceOverride);
  const r = normalizeRate(rate);
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
        "User-Agent": "smartylang",
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

async function synthesizeMp3(text, langInput, rate, key, region, voiceOverride) {
  const clean = String(text || "").trim().slice(0, 4500);
  if (!clean) {
    const err = new Error("Empty text");
    err.status = 400;
    throw err;
  }
  const lang = resolveLang(langInput);
  const speakingRate = normalizeRate(rate);
  const voiceTag = voiceOverride ? String(voiceOverride) : "";
  const memKey = `${lang}|${voiceTag}|${speakingRate.toFixed(2)}|${clean}`;
  const hit = cache.get(memKey);
  if (hit) {
    hit.at = Date.now();
    return { mp3: hit.mp3, cache: "memory" };
  }

  const cacheId = buildCacheId({
    text: clean,
    lang,
    rate: speakingRate,
    voice: voiceTag,
    sync: false,
  });
  const persisted = await readPersistentCache(cacheId);
  if (persisted?.mp3?.length) {
    cache.set(memKey, { mp3: persisted.mp3, at: Date.now() });
    pruneCache();
    return { mp3: persisted.mp3, cache: "storage" };
  }

  const mp3 = await callAzure(buildAzureSsml(clean, lang, speakingRate, voiceOverride), key, region);
  cache.set(memKey, { mp3, at: Date.now() });
  pruneCache();
  void writePersistentCache(cacheId, {
    mp3,
    lang,
    rate: speakingRate,
    voice: voiceTag,
    sync: false,
    textLen: clean.length,
  });
  return { mp3, cache: "miss" };
}

async function synthesizeMp3WithSync(text, langInput, rate, key, region, words, voiceOverride) {
  const clean = String(text || "").trim().slice(0, 4500);
  if (!clean) {
    const err = new Error("Empty text");
    err.status = 400;
    throw err;
  }
  const wordList = Array.isArray(words) ? words.filter((w) => typeof w === "string") : [];
  if (!wordList.length) {
    const err = new Error("Missing words for sync");
    err.status = 400;
    throw err;
  }

  const lang = resolveLang(langInput);
  const speakingRate = normalizeRate(rate);
  const voiceTag = voiceOverride ? String(voiceOverride) : "";
  const memKey = `${lang}|${voiceTag}|${speakingRate.toFixed(2)}|sync|${wordList.length}|${clean}`;
  const hit = cache.get(memKey);
  if (hit) {
    hit.at = Date.now();
    return { mp3: hit.mp3, timepoints: hit.timepoints || [], cache: "memory" };
  }

  const cacheId = buildCacheId({
    text: clean,
    lang,
    rate: speakingRate,
    voice: voiceTag,
    sync: true,
    words: wordList,
  });
  const persisted = await readPersistentCache(cacheId);
  if (persisted?.mp3?.length) {
    cache.set(memKey, {
      mp3: persisted.mp3,
      timepoints: persisted.timepoints || [],
      at: Date.now(),
    });
    pruneCache();
    return {
      mp3: persisted.mp3,
      timepoints: persisted.timepoints || [],
      cache: "storage",
    };
  }

  const voiceCfg = resolveVoiceCfg(lang, voiceOverride);
  try {
    const ssml = buildSsmlWithBookmarks(clean, wordList, voiceCfg, speakingRate);
    const { mp3, timepoints } = await synthesizeSsmlWithTimepoints(ssml, key, region);
    cache.set(memKey, { mp3, timepoints, at: Date.now() });
    pruneCache();
    void writePersistentCache(cacheId, {
      mp3,
      timepoints,
      lang,
      rate: speakingRate,
      voice: voiceTag,
      sync: true,
      textLen: clean.length,
    });
    return { mp3, timepoints, cache: "miss" };
  } catch (sdkErr) {
    console.warn("Azure SDK sync failed, falling back to REST:", sdkErr?.message || sdkErr);
    const mp3 = await callAzure(buildAzureSsml(clean, lang, speakingRate, voiceOverride), key, region);
    cache.set(memKey, { mp3, timepoints: [], at: Date.now() });
    pruneCache();
    void writePersistentCache(cacheId, {
      mp3,
      timepoints: [],
      lang,
      rate: speakingRate,
      voice: voiceTag,
      sync: true,
      textLen: clean.length,
    });
    return { mp3, timepoints: [], cache: "miss" };
  }
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
      const { text, lang = "en-US", rate = 1, sync = false, words = [], voice } = req.body || {};
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing text" });
        return;
      }

      if (sync === true && Array.isArray(words) && words.length > 0) {
        const result = await synthesizeMp3WithSync(text, lang, rate, key, region, words, voice);
        res.set("Cache-Control", "public, max-age=86400");
        res.set("X-TTS-Cache", result.cache || "miss");
        res.status(200).json({
          audioContent: result.mp3.toString("base64"),
          timepoints: result.timepoints,
        });
        return;
      }

      const result = await synthesizeMp3(text, lang, rate, key, region, voice);
      res.set("Content-Type", "audio/mpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.set("X-TTS-Cache", result.cache || "miss");
      res.status(200).send(result.mp3);
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
          res.json({
            text: data.text,
            source: "cache",
            alternatives: Array.isArray(data.alternatives) && data.alternatives.length
              ? data.alternatives
              : [data.text],
          });
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
          alternatives: result.alternatives || [result.text],
          from,
          to,
          word: word.toLowerCase(),
          source: result.source === "gtx" || result.source === "mymemory" ? "api" : result.source,
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
      res.json({
        text: result.text,
        source: result.source,
        alternatives: result.alternatives || [result.text],
      });
    } catch (error) {
      console.error("translateFallback error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Translation failed" });
    }
  },
);

const { lookupDictionaryServer } = require("./dictionaryCore");

exports.dictionaryLookup = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ error: "POST or GET only" });
      return;
    }
    const word = typeof (req.body?.word ?? req.query?.word) === "string"
      ? String(req.body?.word ?? req.query?.word).trim()
      : "";
    const lang = typeof (req.body?.lang ?? req.query?.lang) === "string"
      ? String(req.body?.lang ?? req.query?.lang).trim()
      : "en";
    if (!word) {
      res.status(400).json({ error: "Missing word" });
      return;
    }
    try {
      const result = await lookupDictionaryServer(word, lang);
      if (!result) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error("dictionaryLookup error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Dictionary failed" });
    }
  },
);

exports.ai = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "256MiB",
    maxInstances: 10,
    secrets: [openrouterKey],
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    await handleAiRequest(req, res, {
      getApiKey: () => openrouterKey.value(),
      verifyUser: async (r) => {
        const token = bearerToken(r);
        if (!token) {
          const err = new Error("Sign in required");
          err.status = 401;
          throw err;
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const snap = await admin.firestore().collection("userProfiles").doc(decoded.uid).get();
        const profile = snap.exists ? snap.data() : {};
        if (!isMaxOrAdmin(profile)) {
          const err = new Error("SmartyLang Max required for AI checks");
          err.status = 403;
          throw err;
        }
        return { uid: decoded.uid, profile, strict: false };
      },
    });
  },
);

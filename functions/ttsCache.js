/**
 * Shared persistent TTS cache: Firebase Storage (MP3) + Firestore (metadata / timepoints).
 * Memory Map in index.js remains L1; this is L2 across instances and cold starts.
 *
 * Cache key = sha256(version|lang|rate|voice|sync|words|text)
 * Rate is snapped to fixed presets (0.85 / 1.0 / 1.1 / 1.25).
 */
const crypto = require("crypto");
const admin = require("firebase-admin");

const COLLECTION = "ttsCache";
const STORAGE_PREFIX = "tts-cache";
/** Bump when SSML / encoding / bookmark format changes (invalidates old objects). */
const CONTENT_VERSION = "v1";

/** Learner speed presets — must match src/lib/speechRates.ts */
const RATE_PRESETS = [0.85, 1.0, 1.1, 1.25];

/** Snap to nearest speech-rate preset. */
function normalizeRate(rate) {
  const r = Number(rate);
  const target = Number.isFinite(r) ? r : 1.1;
  let best = 1.1;
  let bestDist = Infinity;
  for (const p of RATE_PRESETS) {
    const d = Math.abs(p - target);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/**
 * @param {{ text: string, lang: string, rate: number, voice?: string, sync?: boolean, words?: string[] }} opts
 */
function buildCacheId(opts) {
  const text = String(opts.text || "").trim();
  const lang = String(opts.lang || "en");
  const rate = normalizeRate(opts.rate).toFixed(2);
  const voice = String(opts.voice || "");
  const sync = opts.sync === true;
  const wordsPart =
    sync && Array.isArray(opts.words) && opts.words.length
      ? opts.words.join("\u0001")
      : "";
  const payload = [
    CONTENT_VERSION,
    lang,
    rate,
    voice,
    sync ? "sync" : "plain",
    wordsPart,
    text,
  ].join("|");
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

function storagePath(cacheId) {
  return `${STORAGE_PREFIX}/${cacheId}.mp3`;
}

function getBucket() {
  // Prefer explicit env; else default app bucket from FIREBASE_CONFIG
  const name =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.GCLOUD_STORAGE_BUCKET ||
    undefined;
  return name ? admin.storage().bucket(name) : admin.storage().bucket();
}

/**
 * @returns {Promise<{ mp3: Buffer, timepoints: {index:number,timeSeconds:number}[], cacheId: string } | null>}
 */
async function readPersistentCache(cacheId) {
  try {
    const db = admin.firestore();
    const ref = db.collection(COLLECTION).doc(cacheId);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const meta = snap.data() || {};
    if (meta.version && meta.version !== CONTENT_VERSION) return null;

    const file = getBucket().file(storagePath(cacheId));
    const [exists] = await file.exists();
    if (!exists) return null;

    const [mp3] = await file.download();
    if (!mp3?.length) return null;

    // Fire-and-forget hit counter
    ref
      .update({
        hits: admin.firestore.FieldValue.increment(1),
        lastHitAt: Date.now(),
      })
      .catch(() => {});

    return {
      mp3: Buffer.from(mp3),
      timepoints: Array.isArray(meta.timepoints) ? meta.timepoints : [],
      cacheId,
    };
  } catch (e) {
    console.warn("[ttsCache] read failed:", e?.message || e);
    return null;
  }
}

/**
 * @param {string} cacheId
 * @param {{ mp3: Buffer, timepoints?: any[], lang: string, rate: number, voice?: string, sync?: boolean, textLen: number }} data
 */
async function writePersistentCache(cacheId, data) {
  try {
    const { mp3, timepoints, lang, rate, voice, sync, textLen } = data;
    if (!mp3?.length) return;

    const file = getBucket().file(storagePath(cacheId));
    await file.save(mp3, {
      contentType: "audio/mpeg",
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          lang: String(lang || ""),
          rate: String(normalizeRate(rate)),
          voice: String(voice || ""),
          sync: sync ? "1" : "0",
          version: CONTENT_VERSION,
        },
      },
      resumable: false,
      validation: false,
    });

    const ref = admin.firestore().collection(COLLECTION).doc(cacheId);
    const existing = await ref.get();
    const base = {
      version: CONTENT_VERSION,
      lang: String(lang || ""),
      rate: normalizeRate(rate),
      voice: String(voice || ""),
      sync: !!sync,
      bytes: mp3.length,
      textLen: Number(textLen) || 0,
      timepoints: sync && Array.isArray(timepoints) ? timepoints : [],
      lastHitAt: Date.now(),
    };
    if (!existing.exists) {
      await ref.set({ ...base, createdAt: Date.now(), hits: 1 });
    } else {
      await ref.set(base, { merge: true });
    }
  } catch (e) {
    console.warn("[ttsCache] write failed:", e?.message || e);
  }
}

module.exports = {
  CONTENT_VERSION,
  normalizeRate,
  buildCacheId,
  readPersistentCache,
  writePersistentCache,
};

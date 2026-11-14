/**
 * Shared helpers for Uzbek Learn localization pipeline.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const OUT_DIR = path.join(ROOT, 'public', 'data', 'lang-packs', 'uz');
export const EN_PATH = path.join(ROOT, 'public', 'level-texts.json');
export const GLOSSARY_PATH = path.join(__dirname, 'glossary-uz.json');
export const PARTIAL_PATH = path.join(OUT_DIR, 'level-texts.localize-partial.json');
export const OUT_PATH = path.join(OUT_DIR, 'level-texts.json');
export const BACKUP_PATH = path.join(OUT_DIR, 'level-texts.pre-localize-backup.json');
export const FAILURES_PATH = path.join(__dirname, 'localize-failures.json');
export const PROGRESS_PATH = path.join(__dirname, '.localize-uz-progress.json');

export const API_KEY =
  process.env.VITE_OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  '';

/** Cheap model only for Beginner batch drafts — never the quality path for Int/Adv. */
export const MODEL_CHEAP =
  process.env.LOCALIZE_MODEL_CHEAP ||
  'google/gemini-2.5-flash';
export const MODEL_STRONG =
  process.env.LOCALIZE_MODEL_STRONG ||
  'google/gemini-2.5-flash';
/** Meaning critic must be a real model, not flash-lite-only. */
export const MODEL_CRITIC =
  process.env.LOCALIZE_MODEL_CRITIC ||
  MODEL_STRONG;

export const REBUILD_DIR = path.join(OUT_DIR, 'rebuild');
export const REBUILD_LEVEL_FILES = {
  Beginner: 'Beginner.json',
  Elementary: 'Elementary.json',
  'Pre-Intermediate': 'Pre-Intermediate.json',
  Intermediate: 'Intermediate.json',
  Advanced: 'Advanced.json',
};

/**
 * Deprecated kernel-filler phrases from build-from-kernel.mjs.
 * Any hit = FAIL sense QA (length alone is not enough).
 */
export const KERNEL_FILLER_DENYLIST = [
  'Bu yerda shoshilmasdan qarash muhim, chunki birinchi taassurot',
  'Amaliyot shuni koʻrsatadiki, yozma qoida bilan kundalik odat',
  'Shuning uchun bahsda nafaqat niyat, balki oqibat',
  'Turli odamlar bir xil qarorni turlicha his qiladi',
  'kim foyda koʻradi va kim toʻlaydi',
  'Vaqt oʻtishi bilan kichik tanlovlar katta tizimga aylanadi',
  'Ochiq misollar afsonadan kuchliroq',
  'Jamoaviy oʻrganish shu nuqtada boshlanadi',
  'Qisqa muddatli qulaylik uzoq muddatli ishonchni yemishi mumkin',
  'Mahalliy bilim umumiy modelga qoʻshilmasa',
  'Amaliy sinov: bir hafta davomida shu mavzudagi qarorlarni',
  'Taʼlim maydonida ham xuddi shu mantiq',
  'Xalqaro misollar foydali, lekin ularni koʻr-koʻrona',
  'Texnologiya vaqti kelganda yana shu savol qaytadi',
  'Yopilishdan oldin yana bir eslatma',
  'Xulosa shuki,',
  'jasorat jim',
  'Mening Oxirgi Yozgi',
  'yozgi taʼtilim',
  'Yozgi taʼtil',
];
/** Cap completion size so low OpenRouter balances don't 402 on headroom checks. */
export const MAX_TOKENS = Number(process.env.LOCALIZE_MAX_TOKENS || 4096);
export const MAX_RETRIES = Number(process.env.LOCALIZE_MAX_RETRIES || 3);
export const FAIL_RATE_LIMIT = Number(process.env.LOCALIZE_FAIL_RATE || 0.02);
export const CONCURRENCY = Math.max(1, Number(process.env.LOCALIZE_CONCURRENCY || 3));

export const LEVELS = [
  'Beginner',
  'Elementary',
  'Pre-Intermediate',
  'Intermediate',
  'Advanced',
];

/** EN CEFR word bands; Uzbek allows ±20%. */
export const EN_WORD_TARGETS = {
  Beginner: [80, 150],
  Elementary: [200, 250],
  'Pre-Intermediate': [330, 400],
  Intermediate: [400, 650],
  Advanced: [600, 1100],
};

export function uzWordBand(level) {
  const [lo, hi] = EN_WORD_TARGETS[level];
  // Slightly wider floor for Beginner dialogues (short turns)
  const floorFactor = level === 'Beginner' ? 0.75 : 0.8;
  return [Math.floor(lo * floorFactor), Math.ceil(hi * 1.2)];
}

export function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function targetSecondsFor(text) {
  const w = wordCount(text);
  return Math.max(45, Math.min(600, Math.round((w / 130) * 60)));
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function parseJsonLoose(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const start = Math.min(
      ...['{', '['].map((c) => {
        const i = raw.indexOf(c);
        return i < 0 ? Infinity : i;
      }),
    );
    const endObj = raw.lastIndexOf('}');
    const endArr = raw.lastIndexOf(']');
    const end = Math.max(endObj, endArr);
    if (Number.isFinite(start) && end > start) {
      const slice = raw.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        const repaired = slice
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001f]/g, ' ');
        return JSON.parse(repaired);
      }
    }
    throw new Error('No JSON in response');
  }
}

export function loadGlossary() {
  return readJson(GLOSSARY_PATH);
}

export function isDialogueLesson(enLesson) {
  const fmt = String(enLesson.format || '').toLowerCase();
  if (fmt.includes('dialogue')) return true;
  // Emails/essays often have "Subject:" / "Dear Name," — not dialogue turns
  if (
    /\b(email|essay|article|opinion|feature|narrative|blog)\b/.test(fmt) &&
    !fmt.includes('dialogue')
  ) {
    return false;
  }
  return hasSpeakerLines(enLesson.text);
}

const NON_SPEAKER_LABELS = /^(subject|from|to|cc|bcc|date|dear|re|fwd|ps|p\.s)\b/i;

export function hasSpeakerLines(text) {
  const lines = String(text || '').split(/\n/).filter((l) => l.trim());
  const tagged = lines.filter((l) => {
    const m = l.trim().match(/^([A-Za-zÀ-ÿʻʼ''ʻʼ\u02BB\u2019][\wÀ-ÿʻʼ''ʻʼ\u02BB\u2019 .'-]{0,30}):\s+\S/);
    if (!m) return false;
    if (NON_SPEAKER_LABELS.test(m[1])) return false;
    return true;
  });
  return tagged.length >= 2;
}

export function speakerNames(text) {
  const names = new Set();
  for (const line of String(text || '').split(/\n/)) {
    const m = line.trim().match(/^([A-Za-zÀ-ÿʻʼ''ʻʼ\u02BB\u2019][\wÀ-ÿʻʼ''ʻʼ\u02BB\u2019 .'-]{0,30}):\s+\S/);
    if (m) names.add(m[1].trim());
  }
  return [...names];
}

/** Cyrillic block letters (reject full Cyrillic Uzbek). */
const CYRILLIC_RE = /[\u0400-\u04FF]/;
/** Allow Latin + oʻ/gʻ marks + common punctuation. */
const MOSTLY_LATIN_RE = /^[\s\S]*$/;

export function hasCyrillic(text) {
  return CYRILLIC_RE.test(text || '');
}

const EN_FUNCTION = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for',
  'with', 'from', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'this',
  'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'you',
  'he', 'she', 'his', 'her', 'my', 'our', 'your', 'not', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
  'about', 'into', 'over', 'after', 'before', 'because', 'when', 'where', 'what',
  'which', 'who', 'how', 'if', 'than', 'then', 'also', 'just', 'only', 'very',
  'more', 'most', 'some', 'any', 'all', 'each', 'every', 'there', 'here',
]);

/** Proper nouns / loanwords commonly kept in Latin Uzbek lessons. */
const ALLOW_EN = new Set([
  'ok', 'okay', 'wifi', 'email', 'online', 'internet', 'app', 'sms', 'id',
  'cv', 'pdf', 'usb', 'ai', 'iq', 'ceo', 'nba', 'un', 'eu', 'usa', 'uk',
  'mr', 'mrs', 'ms', 'dr', 'iphone', 'youtube', 'google', 'facebook',
  'instagram', 'whatsapp', 'chatgpt', 'ielts', 'toefl',
]);

export function englishLeakageScore(text) {
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'ʻʼ\u02BB]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 1;
  let hits = 0;
  let longRun = 0;
  let cur = 0;
  for (const t of tokens) {
    if (ALLOW_EN.has(t) || t.length <= 2) {
      cur = 0;
      continue;
    }
    if (EN_FUNCTION.has(t)) {
      hits++;
      cur++;
      longRun = Math.max(longRun, cur);
    } else {
      cur = 0;
    }
  }
  const ratio = hits / tokens.length;
  // Long English phrase run (4+) is a hard smell
  return Math.max(ratio, longRun >= 4 ? 0.35 : 0);
}

function foldUz(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ʻʼ''`´\u02BB\u2018\u2019]/g, "'")
    .replace(/gʻ|g'/g, "g'")
    .replace(/oʻ|o'/g, "o'");
}

export function vocabAppearsInText(word, text) {
  if (!word || !text) return false;
  const w = foldUz(word).trim();
  const hay = foldUz(text);
  if (hay.includes(w)) return true;
  // Soft: stem without common Uzbek endings
  const stem = w.replace(/(lar|dan|ga|ni|ning|da|dir|mi|chi|moq|mak)$/i, '');
  return stem.length >= 3 && hay.includes(stem);
}

/**
 * Local validation for one localized lesson vs EN source.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLesson(level, enLesson, uzLesson) {
  const errors = [];
  if (!uzLesson || typeof uzLesson !== 'object') {
    return { ok: false, errors: ['missing lesson object'] };
  }
  if (uzLesson.id !== enLesson.id) errors.push(`id ${uzLesson.id} !== ${enLesson.id}`);
  if (!String(uzLesson.title || '').trim()) errors.push('empty title');
  if (!String(uzLesson.text || '').trim()) errors.push('empty text');

  if (hasCyrillic(uzLesson.title) || hasCyrillic(uzLesson.text)) {
    errors.push('Cyrillic detected (Latin Uzbek required)');
  }

  const [minW, maxW] = uzWordBand(level);
  const w = wordCount(uzLesson.text);
  if (w < minW) errors.push(`word count ${w} < ${minW}`);
  if (w > maxW) errors.push(`word count ${w} > ${maxW}`);

  // Relative to EN (free/small models often land shorter on Advanced)
  const enW = wordCount(enLesson.text);
  if (enW > 0) {
    const loRel = enW > 500 ? 0.45 : 0.55;
    const hiRel = 1.6;
    if (w < enW * loRel) errors.push(`much shorter than EN (${w} vs ${enW})`);
    if (w > enW * hiRel) errors.push(`much longer than EN (${w} vs ${enW})`);
  }

  if (isDialogueLesson(enLesson)) {
    if (!hasSpeakerLines(uzLesson.text)) {
      errors.push('dialogue missing Speaker: line structure');
    } else {
      const speakers = speakerNames(uzLesson.text);
      if (speakers.length < 2) errors.push('dialogue needs ≥2 speakers');
    }
  }

  const leak = englishLeakageScore(`${uzLesson.title}\n${uzLesson.text}`);
  if (leak >= 0.12) errors.push(`English leakage score ${leak.toFixed(2)}`);

  const vocab = Array.isArray(uzLesson.vocabulary) ? uzLesson.vocabulary : [];
  const minVocab = level === 'Advanced' || level === 'Intermediate' ? 3 : 4;
  if (vocab.length < minVocab) errors.push(`vocab too small (${vocab.length})`);
  for (const v of vocab) {
    if (!v?.word?.trim() || !v?.definition?.trim()) {
      errors.push('empty vocab word/definition');
      continue;
    }
    if (hasCyrillic(v.word) || hasCyrillic(v.definition)) {
      errors.push(`Cyrillic in vocab "${v.word}"`);
    }
    if (!vocabAppearsInText(v.word, uzLesson.text)) {
      errors.push(`vocab "${v.word}" not in text`);
    }
  }

  if (typeof uzLesson.targetSeconds !== 'number' || uzLesson.targetSeconds < 45) {
    errors.push('bad targetSeconds');
  }

  return { ok: errors.length === 0, errors };
}

export function emptyPack() {
  return Object.fromEntries(LEVELS.map((l) => [l, []]));
}

/** Convert common Uzbek Cyrillic letters to Latin; drop other Cyrillic. */
export function latinizeUzbek(text) {
  const map = {
    а: 'a', А: 'A', б: 'b', Б: 'B', в: 'v', В: 'V', г: 'g', Г: 'G',
    д: 'd', Д: 'D', е: 'e', Е: 'E', ё: 'yo', Ё: 'Yo', ж: 'j', Ж: 'J',
    з: 'z', З: 'Z', и: 'i', И: 'I', й: 'y', Й: 'Y', к: 'k', К: 'K',
    л: 'l', Л: 'L', м: 'm', М: 'M', н: 'n', Н: 'N', о: 'o', О: 'O',
    п: 'p', П: 'P', р: 'r', Р: 'R', с: 's', С: 'S', т: 't', Т: 'T',
    у: 'u', У: 'U', ф: 'f', Ф: 'F', х: 'x', Х: 'X', ц: 'ts', Ц: 'Ts',
    ч: 'ch', Ч: 'Ch', ш: 'sh', Ш: 'Sh', ъ: "'", ь: '', э: 'e', Э: 'E',
    ю: 'yu', Ю: 'Yu', я: 'ya', Я: 'Ya',
    ў: "o'", Ў: "O'", қ: 'q', Қ: 'Q', ғ: "g'", Ғ: "G'", ҳ: 'h', Ҳ: 'H',
  };
  return String(text || '').replace(/[\u0400-\u04FF]/g, (ch) => map[ch] ?? '');
}

export function normalizeLesson(raw, enLesson) {
  let text = String(raw.text || '').trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  let title = String(raw.title || '').trim();
  if (hasCyrillic(text) || hasCyrillic(title)) {
    text = latinizeUzbek(text);
    title = latinizeUzbek(title);
  }
  let vocabulary = (Array.isArray(raw.vocabulary) ? raw.vocabulary : [])
    .map((v) => ({
      word: latinizeUzbek(String(v.word || '').trim()),
      definition: latinizeUzbek(String(v.definition || '').trim()),
    }))
    .filter((v) => v.word && v.definition)
    .filter((v) => !hasCyrillic(v.word) && !hasCyrillic(v.definition))
    .filter((v) => vocabAppearsInText(v.word, text) || englishLeakageScore(v.word) < 0.15)
    .filter((v) => englishLeakageScore(v.definition) < 0.4);
  // Keep EN slot alignment — never truncate below the English lesson's vocab count.
  const enVocab = Array.isArray(enLesson.vocabulary) ? enLesson.vocabulary : [];
  if (vocabulary.length > enVocab.length && enVocab.length > 0) {
    vocabulary = vocabulary.slice(0, enVocab.length);
  }
  return {
    id: enLesson.id,
    title,
    text,
    vocabulary,
    targetSeconds: targetSecondsFor(text),
  };
}

export function compactEnPayload(enLesson) {
  const beats = extractBeats(enLesson);
  return {
    id: enLesson.id,
    format: enLesson.format || '',
    title: enLesson.title,
    coreQuestion: enLesson.coreQuestion || '',
    text: enLesson.text,
    beats,
    vocabWords: (enLesson.vocabulary || []).map((v) => v.word).filter(Boolean),
  };
}

/**
 * Heuristic 5–8 meaning beats from EN lesson (local, no API).
 * Covers who/what/why/feeling/example/next when present in text.
 */
export function extractBeats(enLesson) {
  const beats = [];
  const title = String(enLesson?.title || '').trim();
  const core = String(enLesson?.coreQuestion || '').trim();
  const format = String(enLesson?.format || '').trim();
  const text = String(enLesson?.text || '').replace(/\r\n/g, '\n').trim();

  if (title) beats.push(`topic: ${title}`);
  if (core && core.toLowerCase() !== title.toLowerCase()) {
    beats.push(`question: ${core}`);
  }
  if (format) beats.push(`form: ${format}`);

  if (isDialogueLesson(enLesson) || hasSpeakerLines(text)) {
    const speakers = speakerNames(text);
    if (speakers.length) beats.push(`who: ${speakers.slice(0, 4).join(', ')}`);
    const turns = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => /^[A-Za-zÀ-ÿʻʼ''ʻʼ\u02BB\u2019].{0,30}:\s+\S/.test(l));
    for (const turn of turns.slice(0, 4)) {
      const body = turn.replace(/^[^:]+:\s*/, '').trim();
      if (body.length > 12) beats.push(`say: ${body.slice(0, 140)}`);
    }
  } else {
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const chunks = paras.length >= 2
      ? paras
      : (text.match(/[^.!?]+[.!?]+/g) || [text]).map((s) => s.trim()).filter(Boolean);
    const pick = [];
    if (chunks[0]) pick.push(chunks[0]);
    if (chunks.length > 2) pick.push(chunks[Math.floor(chunks.length / 2)]);
    if (chunks.length > 1) pick.push(chunks[chunks.length - 1]);
    // Extra mid beats for longer essays
    if (chunks.length >= 5) {
      pick.splice(1, 0, chunks[1]);
      pick.splice(2, 0, chunks[chunks.length - 2]);
    }
    for (const c of pick) {
      const s = c.replace(/\s+/g, ' ').slice(0, 180);
      if (s.length > 20) beats.push(`claim: ${s}`);
    }
  }

  const feeling = text.match(
    /\b(felt|feel|afraid|proud|lonely|tense|calm|hope|fear|anxious|relief|shame|joy|anger)\b/i,
  );
  if (feeling) beats.push(`feeling-cue: ${feeling[0].toLowerCase()}`);

  const next = text.match(
    /\b(next|then|finally|from now|if you|should|try to|learn that|remember)\b[^.!?]{8,100}[.!?]/i,
  );
  if (next) beats.push(`next: ${next[0].replace(/\s+/g, ' ').trim().slice(0, 140)}`);

  // Dedupe / cap 5–8
  const seen = new Set();
  const out = [];
  for (const b of beats) {
    const key = b.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
    if (out.length >= 8) break;
  }
  while (out.length < 5 && text) {
    const extra = text.replace(/\s+/g, ' ').slice(out.length * 60, out.length * 60 + 120).trim();
    if (!extra) break;
    out.push(`detail: ${extra}`);
  }
  return out.slice(0, 8);
}

/** Local sense gates: kernel fillers, known calques, empty philosophy padding. */
export function validateSense(level, enLesson, uzLesson) {
  const errors = [];
  const text = String(uzLesson?.text || '');
  const title = String(uzLesson?.title || '');
  const hay = `${title}\n${text}`;

  for (const phrase of KERNEL_FILLER_DENYLIST) {
    if (hay.includes(phrase)) {
      errors.push(`kernel/filler phrase: "${phrase.slice(0, 48)}…"`);
    }
  }

  // Generic philosophy bridge density — only when paired with denylist residue.
  // Plain "Shuning uchun" is normal Uzbek discourse; do not fail on connectors alone.
  const denylistHits = KERNEL_FILLER_DENYLIST.filter((phrase) => hay.includes(phrase)).length;
  if (level === 'Advanced' && denylistHits >= 2) {
    errors.push(`multiple kernel phrases (${denylistHits})`);
  }

  // Spot topic mismatch: e1 must be first-day school, not summer vacation
  if (enLesson?.id === 'e1') {
    if (/yozgi\s+ta[ʼ']?til/i.test(hay) || /summer vacation/i.test(hay)) {
      errors.push('e1 must be first day at school, not summer vacation');
    }
    if (/jasorat\s+jim/i.test(hay)) {
      errors.push('e1 calque "jasorat jim" (courage can be quiet)');
    }
  }

  // Beats coverage is for API critic / human review — EN stems rarely appear in UZ.
  // Local gate stays denylist + topic guards only (length ≠ sense).

  return { ok: errors.length === 0, errors, beats: extractBeats(enLesson) };
}

export function systemPrompt(glossary) {
  const glossBrief = {
    classroom: glossary.classroom,
    skills: glossary.skills,
    self_reference: glossary.self_reference,
    preferred_forms: glossary.preferred_forms,
    script: glossary.script,
  };
  return `You are a native Uzbek (Latin Oʻzbekcha) curriculum writer for Smarty English / Smarty Lang.

Task: MEANING-FIRST native rewrite. English is a brief of claims/beats — NOT a sentence to translate word-for-word.

Workflow (do this mentally before writing):
1. Read the provided beats (who / what / why / feeling / example / next).
2. Cover EVERY beat in natural CEFR-level Latin Uzbek.
3. Self-check: Would a human Uzbek reader find this natural? Any English calque? Any generic philosophy filler?
4. If dialogue: keep Speaker: line turns; speech must sound spoken, not essay-translated.

Hard rules:
- Output ONLY JSON matching the requested schema. Keep lesson id unchanged.
- Latin Oʻzbekcha only (oʻ/gʻ). NEVER Cyrillic.
- Match CEFR difficulty (Beginner=short clear turns; Advanced=coherent full essay, real content — NOT stubs, NOT padding).
- Word count near English ±20% with REAL content that serves the beats.
- Vocabulary: 6–12 headwords that APPEAR in the Uzbek text; definitions in clear Uzbek.
- Prefer glossary terms for classroom/domain vocabulary.
- SELF-REFERENCE: learners study oʻzbek tili / oʻzbekcha unless the topic is factually about English/England.
- FORBIDDEN: machine-translation calques (e.g. "jasorat jim" for "courage can be quiet"); generic philosophy bridges to hit word count; Russian-loanword stuffing; meta commentary about "this lesson".
- Escape JSON strings properly.

Glossary (locked):
${JSON.stringify(glossBrief)}`;
}

export async function chatJson({
  system,
  user,
  model,
  temperature = 0.35,
  maxAttempts = 5,
  maxTokens = MAX_TOKENS,
}) {
  if (!API_KEY) throw new Error('Missing OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY');
  let attempt = 0;
  let tokens = maxTokens;
  for (;;) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smartyenglish.uz',
          'X-Title': 'Smarty UZ Localize',
        },
        body: JSON.stringify({
          model,
          max_tokens: tokens,
          temperature,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          ...(String(model).includes(':free')
            ? {}
            : { response_format: { type: 'json_object' } }),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        const afford = errText.match(/can only afford\s+(\d+)/i);
        if (res.status === 402 && afford) {
          const budget = Number(afford[1]);
          if (budget >= 512 && tokens > budget) {
            tokens = Math.max(512, budget - 64);
            console.warn(`  lowering max_tokens → ${tokens} (afford ${budget})`);
            continue;
          }
        }
        if (res.status === 429) {
          if (/free-models-per-day|per-day/i.test(errText)) {
            const err = new Error(`HTTP 429 daily free-model limit: ${errText.slice(0, 180)}`);
            err.status = 429;
            err.dailyLimit = true;
            throw err;
          }
          attempt++;
          const wait = Math.min(60000, 8000 * attempt);
          console.warn(`  rate-limit wait ${wait}ms (${attempt})`);
          await sleep(wait);
          if (attempt < maxAttempts) continue;
        }
        const err = new Error(`HTTP ${res.status}: ${errText.slice(0, 240)}`);
        err.status = res.status;
        err.body = errText;
        throw err;
      }
      const data = await res.json();
      let raw = data?.choices?.[0]?.message?.content || '';
      raw = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return parseJsonLoose(raw);
    } catch (e) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      const wait = 600 * attempt + (e.status === 429 ? 5000 * attempt : 0);
      console.warn(`  retry ${attempt}: ${(e.message || e).toString().slice(0, 140)}`);
      await sleep(wait);
    }
  }
}

/** Plain-text completion (more reliable than JSON for free models on short chunks). */
export async function chatText({
  system,
  user,
  model,
  temperature = 0.3,
  maxTokens = 900,
  maxAttempts = 4,
}) {
  if (!API_KEY) throw new Error('Missing OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY');
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smartyenglish.uz',
          'X-Title': 'Smarty UZ Localize',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) {
          if (/free-models-per-day|per-day/i.test(errText)) {
            const err = new Error(`HTTP 429 daily free-model limit: ${errText.slice(0, 180)}`);
            err.status = 429;
            err.dailyLimit = true;
            throw err;
          }
          attempt++;
          const wait = Math.min(60000, 8000 * attempt);
          console.warn(`  rate-limit wait ${wait}ms (${attempt})`);
          await sleep(wait);
          if (attempt < maxAttempts) continue;
        }
        const err = new Error(`HTTP ${res.status}: ${errText.slice(0, 240)}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      let raw = data?.choices?.[0]?.message?.content || '';
      raw = raw.trim().replace(/^```(?:\w+)?\s*/i, '').replace(/\s*```$/, '').trim();
      if (raw.startsWith('{')) {
        try {
          const j = parseJsonLoose(raw);
          if (j.text || j.t) return String(j.text || j.t).trim();
        } catch {
          /* ignore */
        }
      }
      if (!raw) throw new Error('empty text response');
      return raw;
    } catch (e) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await sleep(600 * attempt + (e.status === 429 ? 5000 : 0));
    }
  }
}

export function modelForLevel(level, strong = false) {
  // Never use lite-only for Intermediate/Advanced quality path.
  if (strong) return MODEL_STRONG;
  if (level === 'Beginner') return MODEL_CHEAP;
  return MODEL_STRONG;
}

export function batchSizeForLevel(level) {
  // Batch only Beginner; 1 lesson/call for all higher levels.
  return level === 'Beginner' ? 5 : 1;
}

// silence unused lint for MOSTLY_LATIN_RE
void MOSTLY_LATIN_RE;

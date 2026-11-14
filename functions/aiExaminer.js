/**
 * AI examiner + speaking buddy — OpenRouter (Gemini 2.5 Flash).
 * Used by Cloud Function POST /api/ai and the local Express server.
 */

const MODEL = "google/gemini-2.5-flash";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const IELTS_WRITING_CRITERIA = [
  "Task Achievement",
  "Coherence and Cohesion",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
];
const IELTS_SPEAKING_CRITERIA = [
  "Fluency and Coherence",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
  "Pronunciation",
];
const PRACTICE_CRITERIA = ["Task Response", "Coherence", "Vocabulary", "Grammar"];

const rateBuckets = new Map();

function rateLimited(uid, max, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) if (now - bucket.start >= windowMs) rateBuckets.delete(key);
  if (!rateBuckets.has(uid) && rateBuckets.size >= 10000) return true;
  const hit = rateBuckets.get(uid);
  if (!hit || now - hit.start > windowMs) {
    rateBuckets.set(uid, { start: now, count: 1 });
    return false;
  }
  hit.count += 1;
  return hit.count > max;
}

function clip(s, n) {
  return String(s || "").slice(0, n);
}

function extractJson(text) {
  if (!text) throw new Error("Empty model response");
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch { /* fall through */ }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("Model did not return JSON");
}

function roundHalf(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 2) / 2;
}

function round1(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function asArr(v) {
  return Array.isArray(v) ? v.map(x => String(x || "").trim()).filter(Boolean).slice(0, 6) : [];
}

function sanitizeImprovements(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 4).map(it => ({
    what_you_did: clip(it?.what_you_did || it?.whatYouDid || "", 400),
    what_you_could_have_done: clip(it?.what_you_could_have_done || it?.whatYouCouldHaveDone || "", 400),
    reason: clip(it?.reason || "", 400),
  })).filter(it => it.what_you_did || it.what_you_could_have_done);
}

function sanitizeCriterion(raw, expectedName, ielts) {
  const max = ielts ? 9 : 10;
  const score = ielts
    ? roundHalf(clamp(Number(raw?.score) || 0, 0, max))
    : round1(clamp(Number(raw?.score) || 0, 0, max));
  return {
    name: expectedName,
    score,
    strengths: asArr(raw?.strengths),
    weaknesses: asArr(raw?.weaknesses),
    recommendations: asArr(raw?.recommendations),
    improvements: sanitizeImprovements(raw?.improvements),
  };
}

function sanitizeReport(raw, { style, levelLabel, contentLang, extraNote }) {
  const ielts = style === "ielts";
  const names = ielts
    ? (Array.isArray(raw?.criteria) && raw.criteria.some(c => /task response/i.test(c?.name || ""))
      ? ["Task Response", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"]
      : IELTS_WRITING_CRITERIA)
    : PRACTICE_CRITERIA;
  const byName = new Map();
  for (const c of Array.isArray(raw?.criteria) ? raw.criteria : []) {
    if (c?.name) byName.set(String(c.name).toLowerCase(), c);
  }
  const criteria = names.map(name => {
    const hit = byName.get(name.toLowerCase())
      || (Array.isArray(raw?.criteria)
        ? raw.criteria.find(c => String(c?.name || "").toLowerCase().includes(name.toLowerCase().split(" ")[0]))
        : null);
    return sanitizeCriterion(hit || {}, name, ielts);
  });

  const avg = criteria.reduce((s, c) => s + c.score, 0) / Math.max(criteria.length, 1);
  const overall = ielts ? roundHalf(clamp(avg, 0, 9)) : round1(clamp(avg, 0, 10));
  const final = raw?.final && typeof raw.final === "object" ? raw.final : {};
  const summary = clip(final.summary || final.generalFeedback || raw?.summary || "", 900);
  const topPriorities = asArr(final.topPriorities || raw?.topPriorities).slice(0, 5);

  return {
    style,
    criteria,
    final: {
      overallScore: overall,
      summary,
      generalFeedback: summary,
      levelLabel: clip(final.levelLabel || levelLabel || "", 80),
      topPriorities,
    },
    pronunciationNote: extraNote ? clip(extraNote, 240) : undefined,
    contentLang: contentLang || "en",
    checkedAt: Date.now(),
  };
}

function langName(code) {
  const map = {
    en: "English", ru: "Russian", es: "Spanish", de: "German", fr: "French",
    it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean", zh: "Chinese",
    ar: "Arabic", tr: "Turkish", nl: "Dutch", hi: "Hindi", pl: "Polish",
    sv: "Swedish", id: "Indonesian", ms: "Malay", vi: "Vietnamese", th: "Thai",
    uk: "Ukrainian", el: "Greek", cs: "Czech", ro: "Romanian", ur: "Urdu",
    sw: "Swahili", fa: "Persian", uz: "Uzbek", tl: "Filipino", fil: "Filipino",
  };
  return map[String(code || "en").split("-")[0]] || String(code || "English");
}

async function callOpenRouter(apiKey, { system, user, temperature = 0.3, maxTokens = 3500 }) {
  const r = await fetch(OPENROUTER_URL, {
      signal: AbortSignal.timeout(45_000),
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://smartylang.com",
      "X-Title": "SmartyLang Examiner",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error(`AI provider unavailable (${r.status})`);
    err.status = r.status === 429 ? 429 : 502;
    throw err;
  }
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error("OpenRouter returned non-JSON");
  }
  const content = data?.choices?.[0]?.message?.content;
  return extractJson(content);
}

function writingSystem({ style, task, uiLang, contentLang, level }) {
  const ui = langName(uiLang);
  const content = langName(contentLang);
  const ielts = style === "ielts";

  if (ielts) {
    const t1 = task === "t1";
    return `You are a certified IELTS Academic Writing examiner. Score using the official public band descriptors (bands 0–9, half bands allowed: 5.0, 5.5, 6.0…).

Criteria (exactly these four names):
1. ${t1 ? "Task Achievement" : "Task Response"}
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

${t1 ? `Task 1 (Academic): assess whether the candidate summarised the visual (chart/table/process/map) with an overview, key features, accurate data comparisons, and at least 150 words. Penalise missing overview, listing without grouping, inaccurate figures, and under-length (under 150: typically cap Task Achievement at 5).`
    : `Task 2: assess a fully developed position on the prompt, relevant ideas with support, at least 250 words. Under 250 words: typically cap Task Response at 5. Off-topic: cap Task Response at 4.`}

Word-count penalties are mandatory. Do not inflate scores. Typical candidate range is 5.0–7.5; 8.0+ requires rare control.

Write ALL examiner comments (strengths, weaknesses, recommendations, improvements, summary, topPriorities) in ${ui}.
Quote learner language examples in ${content} (the essay language).

Return JSON only:
{
  "style": "ielts",
  "criteria": [
    {
      "name": "...",
      "score": 6.5,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendations": ["..."],
      "improvements": [{"what_you_did":"...","what_you_could_have_done":"...","reason":"..."}]
    }
  ],
  "final": { "overallScore": 6.5, "summary": "...", "topPriorities": ["..."] }
}
overallScore MUST be the mean of the four criterion scores, rounded to the nearest 0.0 or 0.5.`;
  }

  return `You are a supportive language tutor scoring a practice writing task (NOT IELTS).
Learner target level: ${level || "Intermediate"}. Score 0–10 against THAT level (a strong Beginner essay can score 8–9 at Beginner; it would not score 8 at Advanced).

Criteria (exactly these four names):
1. Task Response
2. Coherence
3. Vocabulary
4. Grammar

Write comments in ${ui}. Quote learner examples in ${content}.

Return JSON only:
{
  "style": "practice",
  "criteria": [{ "name": "...", "score": 7.5, "strengths": [], "weaknesses": [], "recommendations": [], "improvements": [{"what_you_did":"...","what_you_could_have_done":"...","reason":"..."}] }],
  "final": { "overallScore": 7.5, "summary": "...", "levelLabel": "${level || "Intermediate"}", "topPriorities": [] }
}
overallScore is the mean of the four scores, one decimal.`;
}

function speakingSystem({ style, uiLang, contentLang, level, part }) {
  const ui = langName(uiLang);
  const content = langName(contentLang);
  const ielts = style === "ielts";

  if (ielts) {
    return `You are a certified IELTS Speaking examiner. Part: ${part || "practice"}.
Score 0–9 half-bands using official public descriptors.

Criteria (exactly these four names):
1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

IMPORTANT: You only have an editable transcript (speech-to-text), not audio. Pronunciation MUST be scored conservatively (typically at or below the other three criteria). State clearly that pronunciation is estimated from the transcript, not from audio. Never award band 8–9 pronunciation from text alone.

Write comments in ${ui}. Quote learner speech in ${content}.

Return JSON only with style "ielts", four criteria, and final.overallScore = mean rounded to .0/.5.
Include final.summary and final.topPriorities.`;
  }

  return `You are a supportive speaking tutor (NOT IELTS). Target level: ${level || "Intermediate"}. Score 0–10 at that level.
Criteria: Task Response, Coherence, Vocabulary, Grammar.
Pronunciation is estimated from transcript only — mention that, score conservatively.
Comments in ${ui}. Quote speech in ${content}.
Return JSON with style "practice", four criteria, final.overallScore (mean, 1 decimal), final.levelLabel, final.summary, final.topPriorities.`;
}

async function checkWriting(apiKey, body) {
  const task = body.task === "t1" || body.task === "t2" ? body.task : "practice";
  const style = task === "practice" ? "practice" : "ielts";
  const essay = clip(body.essay, 12000);
  const prompt = clip(body.prompt, 2500);
  if (!essay.trim()) {
    const err = new Error("Missing essay");
    err.status = 400;
    throw err;
  }
  const wordCount = Number(body.wordCount) || essay.trim().split(/\s+/).filter(Boolean).length;
  const visual = clip(body.visualSummary || body.chartType || "", 1500);
  const user = [
    `Task: ${task}`,
    `Level: ${body.level || ""}`,
    `Word count: ${wordCount}`,
    visual ? `Visual / chart: ${visual}` : "",
    `Prompt:\n${prompt}`,
    `Essay:\n${essay}`,
  ].filter(Boolean).join("\n\n");

  const raw = await callOpenRouter(apiKey, {
    system: writingSystem({
      style,
      task,
      uiLang: body.uiLang || "en",
      contentLang: body.contentLang || "en",
      level: body.level,
    }),
    user,
  });
  return sanitizeReport(raw, {
    style,
    levelLabel: body.level,
    contentLang: body.contentLang,
  });
}

async function checkSpeaking(apiKey, body) {
  const part = clip(body.part || "practice", 40);
  const style = body.style === "practice" || part === "practice" ? "practice" : "ielts";
  const transcript = clip(body.transcript, 15000);
  if (!transcript.trim()) {
    const err = new Error("Missing transcript");
    err.status = 400;
    throw err;
  }
  const questions = clip(body.questions || body.prompt || "", 3000);
  const user = [
    `Part: ${part}`,
    `Duration (seconds): ${body.duration || ""}`,
    `Level: ${body.level || ""}`,
    questions ? `Questions / cue:\n${questions}` : "",
    `Transcript:\n${transcript}`,
  ].filter(Boolean).join("\n\n");

  const raw = await callOpenRouter(apiKey, {
    system: speakingSystem({
      style,
      uiLang: body.uiLang || "en",
      contentLang: body.contentLang || "en",
      level: body.level,
      part,
    }),
    user,
  });
  const names = style === "ielts" ? IELTS_SPEAKING_CRITERIA : PRACTICE_CRITERIA;
  const byName = new Map();
  for (const c of Array.isArray(raw?.criteria) ? raw.criteria : []) {
    if (c?.name) byName.set(String(c.name).toLowerCase(), c);
  }
  const ielts = style === "ielts";
  const criteria = names.map(name => sanitizeCriterion(byName.get(name.toLowerCase()) || {}, name, ielts));
  const avg = criteria.reduce((s, c) => s + c.score, 0) / criteria.length;
  const overall = ielts ? roundHalf(clamp(avg, 0, 9)) : round1(clamp(avg, 0, 10));
  const final = raw?.final && typeof raw.final === "object" ? raw.final : {};
  const summary = clip(final.summary || final.generalFeedback || "", 900);
  return {
    style,
    criteria,
    final: {
      overallScore: overall,
      summary,
      generalFeedback: summary,
      levelLabel: clip(final.levelLabel || body.level || "", 80),
      topPriorities: asArr(final.topPriorities).slice(0, 5),
    },
    pronunciationNote: "Pronunciation is estimated from the transcript, not from audio.",
    contentLang: body.contentLang || "en",
    checkedAt: Date.now(),
  };
}

async function buddyTurn(apiKey, body) {
  const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
  const last = clip(body.utterance || body.lastUtterance || "", 2000);
  if (!last.trim()) {
    const err = new Error("Missing utterance");
    err.status = 400;
    throw err;
  }
  const content = langName(body.contentLang || "en");
  const ui = langName(body.uiLang || "en");
  const level = body.level || "Intermediate";

  const histLines = history.map(h => {
    const role = h.role === "assistant" ? "Buddy" : "Student";
    return `${role}: ${clip(h.content || h.text || "", 600)}`;
  }).join("\n");

  const raw = await callOpenRouter(apiKey, {
    temperature: 0.6,
    maxTokens: 500,
    system: `You are a friendly speaking buddy helping a ${level} learner of ${content}.
Speak the conversation reply in ${content} only — short (1–3 sentences), one question at a time, natural spoken language.
If the student made a clear language mistake, put a brief correction in ${ui} in correctionNote (quiet coach note, not spoken). If no important mistake, correctionNote can be "".
followUp is the next question in ${content} (may be empty if reply already contains a question).
Return JSON: { "reply": "...", "followUp": "...", "correctionNote": "..." }`,
    user: `${histLines ? `History:\n${histLines}\n\n` : ""}Student just said:\n${last}`,
  });

  return {
    reply: clip(raw?.reply || raw?.text || "", 500),
    followUp: clip(raw?.followUp || "", 300),
    correctionNote: clip(raw?.correctionNote || raw?.note || "", 400),
  };
}

/** Talking Smarty: the black cat chats with the learner in the language they are learning. */
const SMARTY_MOODS = ["happy", "laugh", "curious", "love", "surprised", "sleepy", "sad", "proud"];
async function smartyTalk(apiKey, body) {
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const last = clip(body.utterance || "", 600);
  if (!last.trim()) {
    const err = new Error("Missing utterance");
    err.status = 400;
    throw err;
  }
  const content = langName(body.contentLang || "en");
  const ui = langName(body.uiLang || "en");
  const level = body.level || "Beginner";
  const name = clip(body.name || "", 40);
  const histLines = history.map(h => `${h.role === "assistant" ? "Smarty" : "Learner"}: ${clip(h.content || "", 300)}`).join("\n");
  const raw = await callOpenRouter(apiKey, {
    temperature: 0.8,
    maxTokens: 300,
    system: `You are Smarty, a friendly black cat who is also a patient ${content} teacher. You chat with a ${level} learner of ${content}${name ? ` called ${name}` : ""} to help them practise.
Always answer in ${content} only, at ${level} level: 1–2 short, simple sentences, warm and a little funny. Each reply should teach something small: use a useful word or phrase naturally, or model the correct form of what they tried to say. End with a short, easy question so they keep talking.
You are a cat, but a classy one: only now and then (about one reply in six, never twice in a row) add a cat sound like "Meow!" or "Purr…". Most replies have no cat sound at all.
Stay kind and child-safe: no grown-up, scary or unsafe topics; if asked, gently steer back to everyday life, food, hobbies, cats or learning.
If the learner made a clear mistake, put a one-line friendly correction in ${ui} in "tip" (shown, not spoken); otherwise "tip" is "".
Pick the mood that matches what you say, from: ${SMARTY_MOODS.join(", ")}.
Return JSON: { "reply": "...", "mood": "...", "tip": "..." }`,
    user: `${histLines ? `Chat so far:\n${histLines}\n\n` : ""}Learner says: ${last}`,
  });
  const mood = SMARTY_MOODS.includes(raw?.mood) ? raw.mood : "happy";
  return { reply: clip(raw?.reply || raw?.text || "", 400), mood, tip: clip(raw?.tip || "", 300) };
}

async function runAction(body, apiKey) {
  const action = String(body?.action || "");
  if (action === "check-writing") return { report: await checkWriting(apiKey, body) };
  if (action === "check-speaking") return { report: await checkSpeaking(apiKey, body) };
  if (action === "buddy-turn") return await buddyTurn(apiKey, body);
  if (action === "smarty-talk") return await smartyTalk(apiKey, body);
  const err = new Error("Unknown action");
  err.status = 400;
  throw err;
}

function isMaxOrAdmin(profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  // A cancelled Max stays on until its end date (planCancelAt), then it is a free account again.
  if (profile.plan === "smarty-max") return !(typeof profile.planCancelAt === "number" && Date.now() >= profile.planCancelAt);
  return false;
}

function bearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  return "";
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {{ getApiKey: () => string, verifyUser: (req: any) => Promise<{ uid: string, profile?: any }> }} ctx
 */
async function handleAiRequest(req, res, ctx) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const apiKey = (ctx.getApiKey() || "").trim();
  if (!apiKey) {
    res.status(503).json({ error: "AI not configured (set OPENROUTER_API_KEY)" });
    return;
  }

  let uid;
  try {
    const user = await ctx.verifyUser(req);
    uid = user.uid;
    if (!isMaxOrAdmin(user.profile) && user.profile !== undefined && user.strict !== false) {
      res.status(403).json({ error: "SmartyLang Max required for AI checks" });
      return;
    }
  } catch (e) {
    res.status(e.status || 401).json({ error: e.message || "Unauthorized" });
    return;
  }

  const action = String(req.body?.action || "");
  const cap = action === "buddy-turn" || action === "smarty-talk" ? 30 : 20;
  if (rateLimited(uid, cap)) {
    res.status(429).json({ error: "Too many AI requests. Try again in a few minutes." });
    return;
  }

  try {
    const result = await runAction(req.body || {}, apiKey);
    res.status(200).json(result);
  } catch (e) {
    const status = typeof e.status === "number" ? e.status : 500;
    console.error("[aiExaminer]", e.message || e);
    res.status(status).json({ error: e.message || "AI request failed" });
  }
}

module.exports = {
  handleAiRequest,
  runAction,
  isMaxOrAdmin,
  bearerToken,
};

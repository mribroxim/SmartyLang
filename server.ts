import "dotenv/config";
import express from "express";
import path from "path";
import { createRequire } from "module";
import { getConfig, synthesizeMp3, synthesizeMp3WithSync } from "./server/googleTts.ts";
import { geminiConfigured, synthesizeGeminiWav, estimateTimepoints } from './server/geminiTts.ts';
import { localTtsConfigured, localTtsLanguages, localTtsSupports, synthesizeLocalWav, warmLocalTts } from './server/localTts.ts';
import { databaseConfigured, query, runMigrations } from "./server/db.ts";
import {
  clearSession,
  getSessionUser,
  googleAuthUrl,
  loginGoogleUser,
  loginUser,
  registerUser,
  setSession,
} from "./server/auth.ts";
import { registerFriends } from "./server/friends.ts";
import { registerLiveWordGames } from './server/liveWordGames.ts';
import { registerPushReminders } from "./server/pushReminders.ts";
import { registerDataApi } from "./server/dataApi.ts";
import { registerPaymentsApi, registerPaymentsWebhook, registerSubscriptionApi } from "./server/paymentsApi.ts";
import { installSecurity, demoLoginEnabled, providerAuth, rateLimit, reserveAiRequest } from './server/security.ts';
import { registerAgeSafety } from './server/ageSafety.ts';
import { registerAccountData } from './server/accountData.ts';
import { installMonitoring, errorHandler } from './server/monitoring.ts';

const require = createRequire(import.meta.url);
const { officialTranslate } = require("./functions/translateCore.js");
const { handleAiRequest, isMaxOrAdmin } = require("./functions/aiExaminer.js");
const { lookupDictionaryServer } = require("./functions/dictionaryCore.js");

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  installSecurity(app);

  registerPaymentsWebhook(app);
  app.use(express.json({ limit: "256kb" }));
  installMonitoring(app);
  registerAgeSafety(app);
  registerAccountData(app);
  registerPaymentsApi(app);
  registerSubscriptionApi(app);

  app.get("/api/health", async (_req, res) => {
    res.json({ ok: true, database: databaseConfigured });
  });
  app.get('/api/ready', async (_req, res) => {
    try { await query('SELECT 1'); return res.json({ ok: true }); }
    catch { return res.status(503).json({ ok: false }); }
  });

  // Self-hosted database-backed authentication.
  app.get("/api/auth/session", async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ error: "Sign in required" });
      return res.json({ user, profile: user.profile });
    } catch (error: any) {
      console.error("Session lookup failed:", error?.message || error);
      return res.status(503).json({ error: "Authentication service unavailable" });
    }
  });
  // Local demo only: one-click sign-in as a demo account.
  // Enabled solely by DEMO_LOGIN=1 outside production (set in the "smarty-demo" launch config).
  if (demoLoginEnabled()) {
    app.get("/api/dev/demo-login", async (req, res) => {
      try {
        const as = ["teacher", "business", "free", "admin"].includes(String(req.query.as)) ? String(req.query.as) : "max";
        const found = await query<{ uid: string }>("SELECT uid FROM app_users WHERE email = $1", [`${as}@demo.test`]);
        const uid = found.rows[0]?.uid;
        if (!uid) return res.status(404).send("Demo account not found");
        await setSession(res, req, uid);
        return res.redirect(as === "admin" ? "/#/admin" : as === "teacher" || as === "business" ? "/#/business" : "/#/dashboard");
      } catch (error: any) {
        return res.status(500).send(error?.message || "Demo sign-in failed");
      }
    });
  }
  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = await registerUser(req, res, req.body || {});
      return res.json({ user, profile: user.profile });
    } catch (error: any) {
      return res.status(error?.status || 500).json({ error: error?.message || "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const user = await loginUser(req, res, req.body?.email, req.body?.password);
      return res.json({ user, profile: user.profile });
    } catch (error: any) {
      return res.status(error?.status || 500).json({ error: error?.message || "Sign-in failed" });
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    try {
      await clearSession(req, res);
      return res.json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Sign-out failed" });
    }
  });
  app.get("/api/auth/google", (req, res) => {
    try {
      return res.redirect(googleAuthUrl(req, res));
    } catch (error: any) {
      return res.status(error?.status || 503).json({ error: error?.message || "Google sign-in is unavailable" });
    }
  });
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      await loginGoogleUser(req, res, String(req.query.code || ""), String(req.query.state || ""));
      return res.redirect("/");
    } catch (error: any) {
      return res.redirect(`/?auth_error=${encodeURIComponent(error?.message || "Google sign-in failed")}`);
    }
  });

  // API Route for translation fallback (vocab DB miss → official provider)
  app.post("/api/translate-fallback", rateLimit(30, 60_000), providerAuth, async (req, res) => {
    try {
      const word = typeof req.body?.word === "string" ? req.body.word.trim() : "";
      const from = typeof req.body?.from === "string" ? req.body.from : "en";
      const to = typeof req.body?.to === "string" ? req.body.to : "en";
      if (!word) {
        return res.status(400).json({ error: "Missing word" });
      }
      if (word.length > 500) return res.status(400).json({ error: 'Text too long' });
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || "";
      const result = await officialTranslate(word, from, to, apiKey);
      res.json({ text: result.text, source: result.source });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/ai", async (req, res) => {
    // Smarty's chat: start his voice clip as soon as the reply text exists, so it's ready (or nearly) when the app asks.
    if (req.body?.action === 'smarty-talk' && geminiConfigured() && process.env.TTS_PROVIDER !== 'azure') {
      const json = res.json.bind(res);
      res.json = (body: any) => {
        if (typeof body?.reply === 'string' && body.reply.trim()) synthesizeGeminiWav(body.reply, String(req.body?.contentLang || 'en')).catch(() => {});
        return json(body);
      };
    }
    await handleAiRequest(req, res, {
      // Smarty's chat can run on Gemini alone; other AI checks need OpenRouter.
      getApiKey: () => process.env.OPENROUTER_API_KEY || (process.env.GEMINI_API_KEY ? "gemini" : ""),
      verifyUser: async (r) => {
        const user = await import('./server/auth.ts').then(({ requireUser }) => requireUser(r));
        if (!user) {
          const err = new Error("Sign in required");
          (err as Error & { status?: number }).status = 401;
          throw err;
        }
        if (!isMaxOrAdmin(user.profile)) {
          const err = new Error("SmartyLang Max required for AI checks");
          (err as Error & { status?: number }).status = 403;
          throw err;
        }
        await reserveAiRequest(user.uid, String(r.body?.action || ''));
        return { uid: user.uid, profile: user.profile, strict: false };
      },
    });
  });

  // Text-to-speech providers: 'local' (sherpa-onnx models on this server, WAV), 'gemini' (WAV), 'azure' (MP3).
  // TTS_PROVIDER picks the first to try; the default order is local (models downloaded) -> gemini -> azure.
  // TTS_PROVIDER=azure forces Azure only. A failing provider falls through to the next configured one.
  type TtsProvider = 'local' | 'gemini' | 'azure';
  const ttsProviderOrder = (lang: string): TtsProvider[] => {
    const pref = (process.env.TTS_PROVIDER || '').trim().toLowerCase();
    if (pref === 'azure') return ['azure'];
    const all: TtsProvider[] = ['local', 'gemini', 'azure'];
    const order = pref === 'gemini' || pref === 'local' ? [pref as TtsProvider, ...all.filter((p) => p !== pref)] : all;
    return order.filter((p) => (p === 'local' ? localTtsConfigured() && localTtsSupports(lang) : p === 'gemini' ? geminiConfigured() : !("missing" in getConfig())));
  };
  app.post("/api/tts", rateLimit(60, 60_000), providerAuth, async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      const lang = typeof req.body?.lang === "string" ? req.body.lang : "en-US";
      const rate = typeof req.body?.rate === "number" ? req.body.rate : 1;
      const sync = req.body?.sync === true;
      const voice = typeof req.body?.voice === "string" ? req.body.voice : undefined;
      const words = Array.isArray(req.body?.words)
        ? req.body.words.filter((w: unknown) => typeof w === "string")
        : [];
      if (!text.trim()) {
        return res.status(400).json({ error: "Missing text" });
      }
      if (text.length > 5000 || words.length > 1000 || !Number.isFinite(rate) || rate < 0.5 || rate > 2) return res.status(400).json({ error: 'Invalid speech request' });

      const providers = ttsProviderOrder(lang);
      if (!providers.length) {
        const cfg = getConfig();
        return res.status(503).json({ error: "TTS not configured", hint: "missing" in cfg ? cfg.missing : "No TTS provider available" });
      }
      let lastError: unknown;
      for (const provider of providers) {
        if (provider === 'azure') break;
        try {
          const wav = provider === 'local'
            ? await synthesizeLocalWav(text, lang, rate, voice)
            : await synthesizeGeminiWav(text, lang, rate, voice);
          res.setHeader("Cache-Control", "private, max-age=86400");
          if (sync && words.length > 0) return res.json({ audioContent: wav.toString("base64"), mime: "audio/wav", timepoints: estimateTimepoints(wav, words) });
          res.setHeader("Content-Type", "audio/wav");
          return res.send(wav);
        } catch (error: any) {
          lastError = error;
          console.warn(`[tts] ${provider} failed, trying next provider:`, error?.message || error);
        }
      }
      if (!providers.includes('azure')) throw lastError ?? new Error("TTS failed");

      if (sync && words.length > 0) {
        const result = await synthesizeMp3WithSync(text, lang, rate, words, voice === 'smarty' ? undefined : voice);
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.json({
          audioContent: result.mp3.toString("base64"),
          timepoints: result.timepoints,
        });
      }

      const mp3 = await synthesizeMp3(text, lang, rate, voice === 'smarty' ? undefined : voice);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.send(mp3);
    } catch (error: any) {
      const status = typeof error?.status === "number" ? error.status : 500;
      console.error("TTS error:", error?.message || error);
      res.status(status).json({ error: error?.message || "TTS failed" });
    }
  });

  app.post("/api/dictionary", rateLimit(60, 60_000), providerAuth, async (req, res) => {
    try {
      const word = typeof req.body?.word === "string" ? req.body.word.trim() : "";
      const lang = typeof req.body?.lang === "string" ? req.body.lang : "en";
      if (!word) return res.status(400).json({ error: "Missing word" });
      if (word.length > 100) return res.status(400).json({ error: 'Word too long' });
      const result = await lookupDictionaryServer(word, lang);
      if (!result) return res.status(404).json({ error: `Could not find definition for ${word}` });
      return res.json(result);
    } catch (error: any) {
      console.error("Dictionary error:", error?.message || error);
      return res.status(502).json({ error: "Dictionary lookup failed" });
    }
  });

  registerDataApi(app);
  registerFriends(app);
  const startLiveGameCleanup = registerLiveWordGames(app);
  const startPushReminders = registerPushReminders(app);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.SERVE_BUILT_APP !== '1') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);
  await runMigrations();
  if (databaseConfigured) startLiveGameCleanup();
  startPushReminders();
  app.listen(PORT, process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'), () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const cfg = getConfig();
    if (process.env.TTS_PROVIDER !== 'azure' && localTtsConfigured()) {
      const fallbacks = [geminiConfigured() ? 'Gemini' : '', "missing" in cfg ? '' : 'Azure'].filter(Boolean).join(' + ');
      console.log(`[tts] Local TTS ready (${localTtsLanguages().join(', ')})${fallbacks ? `, fallback: ${fallbacks}` : ''}`);
      void warmLocalTts(['en']);
    } else if (geminiConfigured() && process.env.TTS_PROVIDER !== 'azure') {
      console.log(`[tts] Google Gemini TTS ready${"missing" in cfg ? '' : ' (Azure as fallback)'}`);
    } else if ("missing" in cfg) {
      console.warn(`[tts] ${cfg.missing} — /api/tts will return 503`);
    } else {
      console.log(`[tts] Microsoft Azure TTS ready (${cfg.region})`);
    }
  });
}

startServer();

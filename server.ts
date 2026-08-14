import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createRequire } from "module";
import { getConfig, synthesizeMp3, synthesizeMp3WithSync } from "./server/googleTts.ts";

const require = createRequire(import.meta.url);
const { officialTranslate } = require("./functions/translateCore.js");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "32kb" }));

  // API Route for translation fallback (vocab DB miss → official provider)
  app.post("/api/translate-fallback", async (req, res) => {
    try {
      const word = typeof req.body?.word === "string" ? req.body.word.trim() : "";
      const from = typeof req.body?.from === "string" ? req.body.from : "en";
      const to = typeof req.body?.to === "string" ? req.body.to : "en";
      if (!word) {
        return res.status(400).json({ error: "Missing word" });
      }
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || "";
      const result = await officialTranslate(word, from, to, apiKey);
      res.json({ text: result.text, source: result.source });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Microsoft Azure Text-to-Speech (MP3; word highlight uses estimated timing
  // because Azure REST doesn't return word-boundary timepoints)
  app.post("/api/tts", async (req, res) => {
    try {
      const cfg = getConfig();
      if ("missing" in cfg) {
        return res.status(503).json({ error: "TTS not configured", hint: cfg.missing });
      }
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      const lang = typeof req.body?.lang === "string" ? req.body.lang : "en-US";
      const rate = typeof req.body?.rate === "number" ? req.body.rate : 1;
      const sync = req.body?.sync === true;
      const words = Array.isArray(req.body?.words)
        ? req.body.words.filter((w: unknown) => typeof w === "string")
        : [];
      if (!text.trim()) {
        return res.status(400).json({ error: "Missing text" });
      }

      if (sync && words.length > 0) {
        const result = await synthesizeMp3WithSync(text, lang, rate);
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.json({
          audioContent: result.mp3.toString("base64"),
          timepoints: result.timepoints,
        });
      }

      const mp3 = await synthesizeMp3(text, lang, rate);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.send(mp3);
    } catch (error: any) {
      const status = typeof error?.status === "number" ? error.status : 500;
      console.error("TTS error:", error?.message || error);
      res.status(status).json({ error: error?.message || "TTS failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const cfg = getConfig();
    if ("missing" in cfg) {
      console.warn(`[tts] ${cfg.missing} — /api/tts will return 503`);
    } else {
      console.log(`[tts] Microsoft Azure TTS ready (${cfg.region})`);
    }
  });
}

startServer();

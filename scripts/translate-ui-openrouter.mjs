#!/usr/bin/env node
/**
 * Fill missing / untranslated UI strings with an LLM through OpenRouter.
 *
 *   node scripts/translate-ui-openrouter.mjs            # all 28 languages
 *   node scripts/translate-ui-openrouter.mjs --langs=ru,uz
 *   node scripts/translate-ui-openrouter.mjs --dry      # count only, no API calls
 *
 * - Source: src/locales/ui.en.json. Targets: src/locales/ui/{lang}.json + ui.generated.json.
 * - Only keys that are missing or still identical to English (and not approved to stay
 *   English) are sent. Reviewed overrides in scripts/ui-locale-overrides-{lang}.json win.
 * - Every result must pass the same checks as scripts/audit-ui-locales.mjs
 *   (placeholders, numbers, brands, artifacts); failures are retried once, then left out.
 * - Progress is saved after every batch, so the run can be stopped and resumed.
 * Needs OPENROUTER_API_KEY in .env. Model: OPENROUTER_MODEL (default google/gemini-2.5-flash).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { LANGS, canStayEnglish, sourceHash, translationIssues } from './ui-locale-tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')); } catch { return fallback; } };
/** Write with retries: on Windows a file being read (dev server, editor) can be briefly locked. */
function write(p, v) {
  const body = JSON.stringify(v, null, 2) + '\n';
  for (let i = 0; ; i++) {
    try { fs.writeFileSync(path.join(root, p), body); return; }
    catch (e) { if (i >= 8) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * (i + 1)); }
  }
}

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const DRY = process.argv.includes('--dry');
const langs = (arg('langs')?.split(',') ?? LANGS).filter((l) => LANGS.includes(l));
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
const KEY = process.env.OPENROUTER_API_KEY;
const BATCH = Number(arg('batch') ?? 70);
const PARALLEL = Number(arg('parallel') ?? 4);

const NAMES = {
  ru: 'Russian', tl: 'Filipino (Tagalog)', es: 'Spanish', uz: 'Uzbek (Latin script)', de: 'German', fr: 'French', it: 'Italian',
  pt: 'Portuguese (Brazilian)', ja: 'Japanese', ko: 'Korean', zh: 'Chinese (Simplified)', ar: 'Arabic', tr: 'Turkish', nl: 'Dutch',
  hi: 'Hindi', pl: 'Polish', sv: 'Swedish', id: 'Indonesian', ms: 'Malay', vi: 'Vietnamese', th: 'Thai', uk: 'Ukrainian',
  el: 'Greek', cs: 'Czech', ro: 'Romanian', fa: 'Persian (Farsi)', ur: 'Urdu', sw: 'Swahili',
};

const source = read('src/locales/ui.en.json', {});
const approved = read('scripts/ui-locale-identical.json', {});
const generated = read('src/locales/ui.generated.json', {});

function needsWork(lang, pack) {
  return Object.keys(source).filter((k) => {
    const v = pack[k];
    if (typeof v !== 'string' || !v.trim()) return true;
    if (v.trim() === source[k].trim() && !canStayEnglish(source[k], lang, approved)) return true;
    return translationIssues(source[k], v, lang, approved).length > 0;
  });
}

const SYSTEM = (lang) => `You translate the interface of SmartyLang, a friendly language-learning app for kids and adults with a black cat mascot called Smarty.
Translate each English UI string into ${NAMES[lang]}.
Rules:
- Keep it short, natural and warm, like a well-localised mobile app (Duolingo tone). Use the informal "you" where the language has one.
- Keep every {placeholder} exactly as written (same name, same braces). Do not translate placeholder names.
- Keep these names in Latin letters exactly: SmartyLang Max, Smarty Max, SmartyLang, Smarty, IELTS, XP, SRS, CEFR, and CEFR levels like A1, B2.
- Keep numbers, ranges (e.g. 3–5), emoji and punctuation like "·" as in the source.
- "Bite" means a short lesson (not a bite of food). "Hearts" are lives. "Streak" is days in a row.
- Return ONLY a JSON object mapping each given key to its translation. No comments, no extra keys.`;

async function translateBatch(lang, entries, attempt = 1) {
  const body = {
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM(lang) },
      { role: 'user', content: JSON.stringify(Object.fromEntries(entries), null, 1) },
    ],
  };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'X-Title': 'SmartyLang UI translation' },
    body: JSON.stringify(body),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 5) throw new Error(`HTTP ${res.status} after retries`);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    return translateBatch(lang, entries, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return { out: JSON.parse(json), usage: data.usage };
}

const totals = { sent: 0, ok: 0, rejected: 0, promptTokens: 0, completionTokens: 0 };

async function runLang(lang) {
  const splitPath = `src/locales/ui/${lang}.json`;
  const overrides = read(`scripts/ui-locale-overrides-${lang}.json`, {});
  const pack = { ...(generated[lang] || {}), ...read(splitPath, {}) };
  const todo = needsWork(lang, pack).filter((k) => !(k in overrides));
  console.log(`${lang}: ${todo.length} to translate`);
  if (DRY || !todo.length) return finish(lang, pack, overrides);
  const rejected = new Set();
  for (let i = 0; i < todo.length; i += BATCH) {
    const keys = todo.slice(i, i + BATCH);
    let pending = keys.map((k) => [k, source[k]]);
    for (let pass = 0; pass < 2 && pending.length; pass++) {
      totals.sent += pending.length;
      let result;
      try { result = await translateBatch(lang, pending); }
      catch (e) {
        // A broken reply (e.g. cut-off JSON): retry once as two smaller halves.
        if (pending.length > 10 && e instanceof SyntaxError) {
          const half = Math.ceil(pending.length / 2);
          const merged = { out: {}, usage: { prompt_tokens: 0, completion_tokens: 0 } };
          try {
            for (const part of [pending.slice(0, half), pending.slice(half)]) {
              const r = await translateBatch(lang, part);
              Object.assign(merged.out, r.out);
              merged.usage.prompt_tokens += r.usage?.prompt_tokens ?? 0;
              merged.usage.completion_tokens += r.usage?.completion_tokens ?? 0;
            }
            result = merged;
          } catch (e2) { console.warn(`  ${lang} batch ${i}: ${e2.message}`); break; }
        } else { console.warn(`  ${lang} batch ${i}: ${e.message}`); break; }
      }
      totals.promptTokens += result.usage?.prompt_tokens ?? 0;
      totals.completionTokens += result.usage?.completion_tokens ?? 0;
      const retry = [];
      for (const [k, en] of pending) {
        const v = typeof result.out[k] === 'string' ? result.out[k].trim() : '';
        const issues = translationIssues(en, v, lang, approved);
        if (!issues.length) { pack[k] = v; totals.ok++; rejected.delete(k); }
        else { retry.push([k, en]); rejected.add(k); }
      }
      pending = retry;
    }
    totals.rejected += pending.length;
    finish(lang, pack, overrides); // save progress
    process.stdout.write(`  ${lang} ${Math.min(i + BATCH, todo.length)}/${todo.length}\n`);
  }
  if (rejected.size) console.warn(`  ${lang}: ${rejected.size} still need review (left as before)`);
  return finish(lang, pack, overrides);
}

/** Write the language: source key order, overrides on top, English fallback only where nothing valid exists. */
function finish(lang, pack, overrides) {
  const out = {};
  for (const k of Object.keys(source)) {
    const o = overrides[k];
    if (typeof o === 'string' && o.trim()) out[k] = o;
    else if (typeof pack[k] === 'string' && pack[k].trim()) out[k] = pack[k];
    else out[k] = source[k];
  }
  generated[lang] = out;
  // Only the language's own pack during the run (parallel writes to one big file lock on Windows).
  if (!DRY) write(`src/locales/ui/${lang}.json`, out);
  return out;
}

if (!DRY && !KEY) { console.error('OPENROUTER_API_KEY is missing in .env'); process.exit(1); }
console.log(`${DRY ? 'DRY RUN · ' : ''}${langs.length} languages · ${Object.keys(source).length} keys · model ${MODEL}`);
const queue = [...langs];
await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
  while (queue.length) await runLang(queue.shift());
}));
if (!DRY) {
  // Rebuild the aggregate from every split pack (also covers languages not in this run).
  for (const l of LANGS) { const split = read(`src/locales/ui/${l}.json`, null); if (split) generated[l] = split; }
  write('src/locales/ui.generated.json', generated);
}
if (!DRY) write('src/locales/ui.generated.meta.json', { sourceHash: sourceHash(source), model: MODEL, updatedAt: new Date().toISOString() });
console.log(`done · ${totals.ok} translated · ${totals.rejected} rejected · tokens in ${totals.promptTokens} / out ${totals.completionTokens}`);

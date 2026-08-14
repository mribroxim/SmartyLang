/**
 * Literary MT polish for Slavic lang packs: ru, uk, pl, cs.
 * Resume-safe. Usage:
 *   npx tsx scripts/polish-slavic-packs.ts
 *   npx tsx scripts/polish-slavic-packs.ts --langs=ru,uk
 *   npx tsx scripts/polish-slavic-packs.ts --only=level-texts,speaking
 *   npx tsx scripts/polish-slavic-packs.ts --force
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'lang-packs');

const API_KEY =
  process.env.VITE_OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  '';
const MODEL = process.env.POLISH_MODEL || process.env.SEED_TRANSLATE_MODEL || 'google/gemini-2.5-flash';
const MAX_TOKENS = Number(process.env.SEED_MAX_TOKENS || 8192);

const FORCE = process.argv.includes('--force');

type Lang = 'ru' | 'uk' | 'pl' | 'cs';

const LANG_META: Record<Lang, { name: string; endonym: string; endonymAdv: string }> = {
  ru: { name: 'Russian', endonym: 'русский', endonymAdv: 'по-русски' },
  uk: { name: 'Ukrainian', endonym: 'українська', endonymAdv: 'українською' },
  pl: { name: 'Polish', endonym: 'polski', endonymAdv: 'po polsku' },
  cs: { name: 'Czech', endonym: 'čeština', endonymAdv: 'česky' },
};

function parseArgList(flag: string): string[] | null {
  const eq = process.argv.find(x => x.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1).split(',').map(s => s.trim()).filter(Boolean);
  const idx = process.argv.findIndex(x => x === flag);
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
}

const LANGS: Lang[] = (() => {
  const raw = parseArgList('--langs') as Lang[] | null;
  return raw?.length ? raw : (['ru', 'uk', 'pl', 'cs'] as Lang[]);
})();

const ONLY = parseArgList('--only');

function want(step: string) {
  return !ONLY || ONLY.includes(step);
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function parseJsonLoose(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
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
    throw new Error('No JSON object in response');
  }
}

function systemPrompt(lang: Lang, kind: string): string {
  const m = LANG_META[lang];
  return `You are a native ${m.name} literary editor polishing machine-translated learning content.

Task: Rewrite the provided ${m.name} strings into natural, grammatically correct, logically coherent literary prose for native speakers.
Context: ${kind}

Rules:
- Return ONLY JSON matching the requested schema.
- Keep meaning and CEFR/level difficulty aligned with the input (and English source if given).
- Fix calques, broken morphology, wrong gender/case/agreement, weird word order, nonsense phrases.
- Do NOT invent new plot points; polish wording.
- SELF-REFERENCE RULE: Learners study ${m.name} (${m.endonym} / ${m.endonymAdv}), NOT English. Rewrite course self-references (learning/speaking/studying English, English teacher/class/lesson/course/test, "in English") to use ${m.endonym} forms. Keep English/England only when factual (history, nationality, tourist signs in English, UN official languages, English as global lingua franca topic).
- Preserve proper nouns and place names (standard local forms OK).
- Keep ids, answer indices, and structural fields unchanged.
- Escape quotes properly in JSON strings.`;
}

async function chatJson(system: string, user: string, maxAttempts = 6): Promise<any> {
  if (!API_KEY) throw new Error('Missing VITE_OPENROUTER_API_KEY');
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smartyenglish.uz',
          'X-Title': 'Smarty Lang Pack Polish',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.25,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      let raw = data?.choices?.[0]?.message?.content || '';
      raw = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return parseJsonLoose(raw);
    } catch (e: any) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      console.warn(`  retry ${attempt}: ${e.message?.slice?.(0, 120) || e}`);
      await sleep(500 * attempt);
    }
  }
}

async function polishStringBatch(
  lang: Lang,
  strings: string[],
  kind: string,
  batchSize: number,
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < strings.length; i += batchSize) {
    const batch = strings.slice(i, i + batchSize);
    const parsed = await chatJson(
      systemPrompt(lang, kind),
      `Polish these ${LANG_META[lang].name} strings. Return { "translations": string[] } same length/order.\n${JSON.stringify(batch)}`,
    );
    const arr = parsed.translations || parsed.items || parsed.strings;
    if (!Array.isArray(arr) || arr.length !== batch.length) {
      throw new Error(`string batch length mismatch at ${i}`);
    }
    out.push(...arr.map((s: any) => String(s)));
    process.stdout.write(`\r  ${kind}: ${Math.min(i + batchSize, strings.length)}/${strings.length}   `);
    await sleep(80);
  }
  process.stdout.write('\n');
  return out;
}

async function polishLevelTexts(lang: Lang) {
  const outFile = path.join(OUT, lang, 'level-texts.json');
  const partialFile = path.join(OUT, lang, 'level-texts.polish-partial.json');
  const en = readJson<Record<string, any[]>>(path.join(ROOT, 'public', 'level-texts.json'));
  const cur = readJson<Record<string, any[]>>(outFile);

  let out: Record<string, any[]> = {};
  if (!FORCE && fs.existsSync(partialFile)) {
    out = readJson(partialFile);
    console.log(`resuming level-texts ${lang} from partial`);
  }

  const levels = Object.keys(cur);
  for (const level of levels) {
    if (out[level]?.length === cur[level].length && !FORCE) {
      console.log(`  skip level-texts ${level} (done)`);
      continue;
    }
    console.log(`== level-texts ${lang} ${level} ==`);
    const items = cur[level];
    const polished: any[] = [];
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const enBatch = (en[level] || []).slice(i, i + batchSize);
      const payload = batch.map((t, j) => ({
        id: t.id,
        title: t.title,
        text: t.text,
        vocabulary: t.vocabulary || [],
        targetSeconds: t.targetSeconds,
        englishTitle: enBatch[j]?.title,
        englishText: enBatch[j]?.text,
      }));
      const parsed = await chatJson(
        systemPrompt(lang, `level-texts reading passages (${level})`),
        `Polish each item's title, text, and vocabulary into natural ${LANG_META[lang].name}.
Keep id and targetSeconds unchanged. Vocabulary "word" must appear in the polished text; definitions = natural ${LANG_META[lang].name} glosses.
Return { "items": [ { "id", "title", "text", "vocabulary":[{"word","definition"}], "targetSeconds" } ] }
Input:\n${JSON.stringify({ items: payload })}`,
      );
      const arr = parsed.items || parsed;
      if (!Array.isArray(arr) || arr.length !== batch.length) {
        throw new Error(`level-texts batch mismatch ${level}@${i}`);
      }
      for (let j = 0; j < arr.length; j++) {
        const src = batch[j];
        const p = arr[j];
        polished.push({
          id: src.id,
          title: String(p.title ?? src.title),
          text: String(p.text ?? src.text),
          vocabulary: Array.isArray(p.vocabulary) ? p.vocabulary : src.vocabulary,
          targetSeconds: src.targetSeconds,
        });
      }
      process.stdout.write(`\r  ${level}: ${polished.length}/${items.length}   `);
      out[level] = [...polished];
      // keep other unfinished levels from cur if needed
      writeJson(partialFile, { ...cur, ...out });
      await sleep(60);
    }
    process.stdout.write('\n');
    out[level] = polished;
    writeJson(partialFile, { ...cur, ...out });
  }

  // Ensure all levels present
  for (const level of levels) {
    if (!out[level] || out[level].length !== cur[level].length) {
      throw new Error(`incomplete level-texts ${lang} ${level}`);
    }
  }
  writeJson(outFile, out);
  if (fs.existsSync(partialFile)) fs.unlinkSync(partialFile);
  console.log(`wrote ${outFile}`);
}

async function polishComprehensive(lang: Lang) {
  const outFile = path.join(OUT, lang, 'comprehensive-reading.json');
  const partialFile = path.join(OUT, lang, 'comprehensive-reading.polish-partial.json');
  const cur = readJson<any[]>(outFile);

  let start = 0;
  let out: any[] = [];
  if (!FORCE && fs.existsSync(partialFile)) {
    out = readJson(partialFile);
    start = out.length;
    console.log(`resuming comprehensive-reading ${lang} from ${start}`);
  }

  console.log(`== comprehensive-reading ${lang} (${cur.length}) ==`);
  const batchSize = 3;
  for (let i = start; i < cur.length; i += batchSize) {
    const batch = cur.slice(i, i + batchSize);
    const payload = batch.map(p => ({
      title: p.title,
      passage: p.passage,
      level: p.level,
      questions: (p.questions || []).map((q: any) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
      })),
    }));
    const parsed = await chatJson(
      systemPrompt(lang, 'comprehensive reading passages + MCQ'),
      `Polish title, passage, question text, and options into natural ${LANG_META[lang].name}.
Keep level, question id, and answer index unchanged. Options length must match.
Return { "items": [ { "title", "passage", "level", "questions":[{"id","text","options","answer"}] } ] }
Input:\n${JSON.stringify({ items: payload })}`,
    );
    const arr = parsed.items || parsed;
    if (!Array.isArray(arr) || arr.length !== batch.length) {
      throw new Error(`CR batch mismatch @${i}`);
    }
    for (let j = 0; j < arr.length; j++) {
      const src = batch[j];
      const p = arr[j];
      const qs = Array.isArray(p.questions) ? p.questions : src.questions;
      out.push({
        title: String(p.title ?? src.title),
        passage: String(p.passage ?? src.passage),
        level: src.level,
        questions: (src.questions || []).map((sq: any, qi: number) => {
          const pq = qs[qi] || {};
          const opts = Array.isArray(pq.options) && pq.options.length === (sq.options || []).length
            ? pq.options.map(String)
            : sq.options;
          return {
            id: sq.id,
            text: String(pq.text ?? sq.text),
            options: opts,
            answer: sq.answer,
          };
        }),
      });
    }
    writeJson(partialFile, out);
    process.stdout.write(`\r  CR: ${out.length}/${cur.length}   `);
    await sleep(60);
  }
  process.stdout.write('\n');
  writeJson(outFile, out);
  if (fs.existsSync(partialFile)) fs.unlinkSync(partialFile);
  console.log(`wrote ${outFile}`);
}

async function polishPromptMap(lang: Lang, file: string, kind: string) {
  const outFile = path.join(OUT, lang, file);
  const partialFile = path.join(OUT, lang, file.replace('.json', '.polish-partial.json'));
  const cur = readJson<Record<string, string[]>>(outFile);
  let out: Record<string, string[]> = {};
  if (!FORCE && fs.existsSync(partialFile)) {
    out = readJson(partialFile);
    console.log(`resuming ${file} ${lang}`);
  }
  for (const [level, items] of Object.entries(cur)) {
    if (out[level]?.length === items.length && !FORCE) {
      console.log(`  skip ${file} ${level}`);
      continue;
    }
    console.log(`== ${file} ${lang} ${level} ==`);
    out[level] = await polishStringBatch(lang, items, `${kind} (${level})`, 20);
    writeJson(partialFile, { ...cur, ...out });
  }
  writeJson(outFile, out);
  if (fs.existsSync(partialFile)) fs.unlinkSync(partialFile);
  console.log(`wrote ${outFile}`);
}

async function polishTask2(lang: Lang) {
  const outFile = path.join(OUT, lang, 'task2.json');
  const cur = readJson<any[]>(outFile);
  console.log(`== task2 ${lang} ==`);

  // Polish meta fields first
  const meta = cur.map(t => ({
    type: t.type,
    label: t.label,
    description: t.description,
    instruction: t.instruction,
  }));
  const metaPolished = await chatJson(
    systemPrompt(lang, 'IELTS writing task2 metadata'),
    `Polish label, description, instruction. Keep type. Return { "items": [...] }\n${JSON.stringify({ items: meta })}`,
  );
  const metaItems = metaPolished.items || metaPolished;
  if (!Array.isArray(metaItems) || metaItems.length !== cur.length) {
    throw new Error('task2 meta mismatch');
  }

  const out = [];
  for (let ti = 0; ti < cur.length; ti++) {
    const t = cur[ti];
    const mp = metaItems[ti];
    const categories = [];
    for (const cat of t.categories || []) {
      const prompts = await polishStringBatch(
        lang,
        cat.prompts || [],
        `task2 prompts (${t.type}/${cat.name})`,
        10,
      );
      const nameArr = await polishStringBatch(lang, [cat.name], 'task2 category name', 1);
      categories.push({ name: nameArr[0], prompts });
    }
    out.push({
      type: t.type,
      label: String(mp.label ?? t.label),
      description: String(mp.description ?? t.description),
      instruction: String(mp.instruction ?? t.instruction),
      categories,
    });
    writeJson(outFile + '.partial', out.concat(cur.slice(out.length)));
  }
  writeJson(outFile, out);
  const partial = outFile + '.partial';
  if (fs.existsSync(partial)) fs.unlinkSync(partial);
  console.log(`wrote ${outFile}`);
}

async function polishDictation(lang: Lang) {
  const dir = path.join(OUT, lang, 'dictation');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
  for (const file of files) {
    const outFile = path.join(dir, file);
    const raw = fs.readFileSync(outFile, 'utf8');
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
    console.log(`== dictation ${lang} ${file} (${lines.length}) ==`);
    const polished = await polishStringBatch(lang, lines, `dictation sentences (${file})`, 25);
    fs.writeFileSync(outFile, polished.map(s => `- ${s}`).join('\n') + '\n', 'utf8');
    console.log(`wrote ${outFile}`);
  }
}

async function main() {
  if (!API_KEY) {
    console.error('Missing API key');
    process.exit(1);
  }
  console.log(`Model: ${MODEL}`);
  console.log(`Langs: ${LANGS.join(', ')}`);
  console.log(`Only: ${ONLY?.join(',') || '(all)'}`);

  for (const lang of LANGS) {
    console.log(`\n######## ${lang} ########`);
    if (want('level-texts')) await polishLevelTexts(lang);
    if (want('comprehensive-reading')) await polishComprehensive(lang);
    if (want('speaking')) await polishPromptMap(lang, 'speaking-topics.json', 'speaking prompts');
    if (want('writing')) await polishPromptMap(lang, 'writing-topics.json', 'writing prompts');
    if (want('task2')) await polishTask2(lang);
    if (want('dictation')) await polishDictation(lang);
  }
  console.log('\nDONE');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

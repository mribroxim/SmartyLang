/**
 * Literary MT polish for Russian (ru) lang pack via OpenRouter.
 * Resume-safe with checkpoint file. Preserves IDs, answers, structure.
 *
 * Usage:
 *   node scripts/polish-ru-literary.mjs
 *   node scripts/polish-ru-literary.mjs --only=level-texts
 *   node scripts/polish-ru-literary.mjs --only=comprehensive-reading,speaking,writing,task2,dictation
 *   node scripts/polish-ru-literary.mjs --level=Beginner
 *   node scripts/polish-ru-literary.mjs --force   # ignore checkpoint for selected only=
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACK = path.join(ROOT, 'public', 'data', 'lang-packs', 'ru');
const EN_LEVEL = path.join(ROOT, 'public', 'level-texts.json');
const PROGRESS = path.join(ROOT, 'scripts', '.polish-ru-progress.json');

const API_KEY =
  process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
const MODEL =
  process.env.POLISH_RU_MODEL ||
  'google/gemma-4-31b-it:free';
const MAX_TOKENS = Number(process.env.POLISH_RU_MAX_TOKENS || 4096);
const CONCURRENCY = Number(process.env.POLISH_RU_CONCURRENCY || 3);
const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const eq = process.argv.find((x) => x.startsWith('--only='));
  if (!eq) return null;
  return eq.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
})();
const ONLY_LEVEL = (() => {
  const eq = process.argv.find((x) => x.startsWith('--level='));
  return eq ? eq.slice(8) : null;
})();

function want(name) {
  return !ONLY || ONLY.includes(name);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadProgress() {
  if (FORCE || !fs.existsSync(PROGRESS)) return { done: {} };
  try {
    return JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
  } catch {
    return { done: {} };
  }
}

function saveProgress(prog) {
  fs.writeFileSync(PROGRESS, JSON.stringify(prog, null, 2) + '\n', 'utf8');
}

function markDone(prog, key) {
  prog.done[key] = true;
  saveProgress(prog);
}

function isDone(prog, key) {
  return !FORCE && !!prog.done[key];
}

function extractJson(raw) {
  let s = (raw || '').trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  try {
    return JSON.parse(s);
  } catch {
    /* fall through */
  }
  const startObj = s.indexOf('{');
  const startArr = s.indexOf('[');
  let i = -1;
  if (startObj >= 0 && (startArr < 0 || startObj < startArr)) i = startObj;
  else if (startArr >= 0) i = startArr;
  if (i < 0) throw new Error('No JSON in model response');
  const open = s[i];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && c === close) {
        return JSON.parse(s.slice(i, j + 1));
      }
    }
  }
  throw new Error('Unbalanced JSON in model response');
}

const SYSTEM = `Ты — опытный литературный редактор и носитель русского языка.
Тебе дают учебные тексты для приложения по изучению русского языка (L2 = русский).
Задача: ПЕРЕПИСАТЬ/отполировать машинный перевод до естественной, грамотной русской прозы. Не оставляй текст «как есть», если есть хоть малейшая неестественность.

Обязательные правки (примеры):
- «потягиваю руки» → «потягиваюсь» или «потягиваю руки и ноги»
- «мама дарит/даёт мне улыбку» → «мама улыбается мне»
- «Умывать: Чистить что-то водой» → «(Глагол) Мыть лицо (или что-либо) водой»
- согласование рода: «чёрный и белый» про кошку → «чёрно-белая» / «чёрная и белая»
- убери кальки вроде «Я чувствую себя счастливым и готовым к дню» → «Я чувствую себя счастливым и готовым к новому дню» / естественнее

Правила:
1) Сохраняй смысл и уровень сложности английского оригинала (если дан).
2) Исправляй кальки, морфологию, согласование, порядок слов, бессмыслицу.
3) Beginner — простой, но естественный. Advanced — аккуратный литературный стиль.
4) L2 SELF-REFERENCE: изучаемый язык = «русский» / «по-русски», НЕ «английский» (уроки, учитель, говорение на L2).
5) KEEP фактические England/English: страна, история, «английский учёный», туристические указатели на английском, языки ООН, тема «английский как глобальный язык».
6) vocabulary.word должен встречаться в тексте (или естественная лемма); definition — живая русская глосса с (Существительное)/(Глагол)/…
7) Не меняй id; сохрани число vocabulary items и questions/options.
8) Верни ТОЛЬКО валидный JSON.`;

async function chat(userPayload, { maxTokens = MAX_TOKENS } = {}) {
  if (!API_KEY) throw new Error('Missing VITE_OPENROUTER_API_KEY');
  let attempt = 0;
  for (;;) {
    attempt++;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://smartyenglish.uz',
        'X-Title': 'Smarty RU literary polish',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content:
              (typeof userPayload === 'string'
                ? userPayload
                : JSON.stringify(userPayload)) +
              '\n\nОтветь одним JSON-объектом без markdown.',
          },
        ],
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      if (attempt < 6 && (res.status === 429 || res.status >= 500)) {
        await sleep(800 * attempt * attempt);
        continue;
      }
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Bad OpenRouter JSON envelope');
    }
    const raw = data?.choices?.[0]?.message?.content || '';
    try {
      return extractJson(raw);
    } catch (e) {
      if (attempt < 4) {
        await sleep(500 * attempt);
        continue;
      }
      throw e;
    }
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------- level-texts ----------
async function polishLevelTexts(prog) {
  if (!want('level-texts')) return;
  const ruPath = path.join(PACK, 'level-texts.json');
  const ru = loadJson(ruPath);
  const en = loadJson(EN_LEVEL);
  const levels = Object.keys(ru);

  for (const level of levels) {
    if (ONLY_LEVEL && level !== ONLY_LEVEL) continue;
    const items = ru[level];
    const enItems = en[level] || [];
    const batches = chunk(
      items.map((it, idx) => ({ it, idx, en: enItems[idx] })),
      Number(process.env.POLISH_RU_LEVEL_BATCH || 3)
    );

    for (let bi = 0; bi < batches.length; bi++) {
      const key = `level-texts:${level}:${bi}`;
      if (isDone(prog, key)) {
        console.log(`  skip ${key}`);
        continue;
      }
      const batch = batches[bi];
      const payload = {
        task: 'polish_level_texts',
        level,
        return_shape:
          '{ "items": [ { "id", "title", "text", "vocabulary":[{"word","definition"}] } ] }',
        items: batch.map(({ it, en: e }) => ({
          id: it.id,
          english: e
            ? {
                title: e.title,
                text: e.text,
                vocabulary: e.vocabulary,
              }
            : null,
          current_ru: {
            title: it.title,
            text: it.text,
            vocabulary: it.vocabulary,
          },
        })),
      };

      console.log(`  polish ${key} (${batch.map((b) => b.it.id).join(',')})`);
      const parsed = await chat(payload);
      const outItems = parsed.items || parsed.passages || parsed;
      if (!Array.isArray(outItems) || outItems.length !== batch.length) {
        throw new Error(
          `${key}: expected ${batch.length} items, got ${outItems?.length}`
        );
      }
      for (let j = 0; j < batch.length; j++) {
        const { it, idx } = batch[j];
        const p = outItems[j];
        if (String(p.id) !== String(it.id)) {
          console.warn(`  warn id mismatch ${it.id} vs ${p.id} — keeping by index`);
        }
        const vocab = Array.isArray(p.vocabulary)
          ? p.vocabulary.map((v) => ({
              word: String(v.word ?? ''),
              definition: String(v.definition ?? ''),
            }))
          : it.vocabulary;
        if (vocab.length !== (it.vocabulary || []).length) {
          console.warn(
            `  warn vocab length ${it.id}: ${vocab.length} vs ${it.vocabulary.length}`
          );
        }
        ru[level][idx] = {
          ...it,
          title: String(p.title ?? it.title),
          text: String(p.text ?? it.text),
          vocabulary: vocab.length === (it.vocabulary || []).length ? vocab : it.vocabulary,
        };
      }
      writeJson(ruPath, ru);
      markDone(prog, key);
      await sleep(120);
    }
  }
  console.log('level-texts done');
}

// ---------- comprehensive-reading ----------
async function polishComprehensive(prog) {
  if (!want('comprehensive-reading')) return;
  const ruPath = path.join(PACK, 'comprehensive-reading.json');
  const ru = loadJson(ruPath);
  const batches = chunk(
    ru.map((it, idx) => ({ it, idx })),
    3
  );

  for (let bi = 0; bi < batches.length; bi++) {
    const key = `comprehensive-reading:${bi}`;
    if (isDone(prog, key)) {
      if (bi % 20 === 0) console.log(`  skip ${key}`);
      continue;
    }
    const batch = batches[bi];
    const payload = {
      task: 'polish_comprehensive_reading',
      return_shape:
        '{ "items": [ { "title", "passage", "questions":[{"id","text","options":[string]}] } ] }',
      note: 'Preserve question id order and options array length. Do NOT include or change answer indices.',
      items: batch.map(({ it }) => ({
        title: it.title,
        passage: it.passage,
        level: it.level,
        questions: (it.questions || []).map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
        })),
      })),
    };
    console.log(
      `  polish ${key} (${batch.map((b) => b.idx).join(',')}) level=${batch[0].it.level}`
    );
    const parsed = await chat(payload);
    const outItems = parsed.items || parsed;
    if (!Array.isArray(outItems) || outItems.length !== batch.length) {
      throw new Error(
        `${key}: expected ${batch.length} items, got ${outItems?.length}`
      );
    }
    for (let j = 0; j < batch.length; j++) {
      const { it, idx } = batch[j];
      const p = outItems[j];
      const qs = Array.isArray(p.questions) ? p.questions : null;
      if (!qs || qs.length !== (it.questions || []).length) {
        console.warn(`  warn questions length idx=${idx}; keeping original Qs text partially`);
      }
      const newQs = (it.questions || []).map((q, qi) => {
        const pq = qs?.[qi];
        if (!pq) return q;
        const opts = Array.isArray(pq.options) ? pq.options.map(String) : null;
        if (!opts || opts.length !== (q.options || []).length) {
          return {
            ...q,
            text: String(pq.text ?? q.text),
          };
        }
        return {
          ...q,
          text: String(pq.text ?? q.text),
          options: opts,
        };
      });
      ru[idx] = {
        ...it,
        title: String(p.title ?? it.title),
        passage: String(p.passage ?? it.passage),
        questions: newQs,
      };
    }
    writeJson(ruPath, ru);
    markDone(prog, key);
    await sleep(100);
  }
  console.log('comprehensive-reading done');
}

// ---------- speaking / writing ----------
async function polishPromptLists(prog, fileName, kind) {
  if (!want(kind)) return;
  const ruPath = path.join(PACK, fileName);
  const ru = loadJson(ruPath);
  for (const level of Object.keys(ru)) {
    if (ONLY_LEVEL && level !== ONLY_LEVEL) continue;
    const arr = ru[level];
    const batches = chunk(
      arr.map((prompt, idx) => ({ prompt, idx })),
      20
    );
    for (let bi = 0; bi < batches.length; bi++) {
      const key = `${kind}:${level}:${bi}`;
      if (isDone(prog, key)) {
        console.log(`  skip ${key}`);
        continue;
      }
      const batch = batches[bi];
      const payload = {
        task: `polish_${kind}_prompts`,
        level,
        return_shape: '{ "prompts": [string, ...] }',
        note: 'Same length array. Natural Russian learner prompts. L2 self-ref → русский/по-русски.',
        prompts: batch.map((b) => b.prompt),
      };
      console.log(`  polish ${key}`);
      const parsed = await chat(payload, { maxTokens: 4096 });
      const prompts = parsed.prompts || parsed.items || parsed;
      if (!Array.isArray(prompts) || prompts.length !== batch.length) {
        throw new Error(
          `${key}: expected ${batch.length}, got ${prompts?.length}`
        );
      }
      for (let j = 0; j < batch.length; j++) {
        ru[level][batch[j].idx] = String(prompts[j] ?? batch[j].prompt);
      }
      writeJson(ruPath, ru);
      markDone(prog, key);
      await sleep(80);
    }
  }
  console.log(`${kind} done`);
}

// ---------- task2 ----------
async function polishTask2(prog) {
  if (!want('task2')) return;
  const ruPath = path.join(PACK, 'task2.json');
  const ru = loadJson(ruPath);
  for (let i = 0; i < ru.length; i++) {
    const key = `task2:${i}`;
    if (isDone(prog, key)) {
      console.log(`  skip ${key}`);
      continue;
    }
    const it = ru[i];
    const payload = {
      task: 'polish_task2',
      return_shape:
        '{ "type", "label", "description", "instruction", "categories":[{"name","prompts":[string]}] }',
      note: 'Preserve type and category/prompt counts. Factual England/English-as-topic OK.',
      item: it,
    };
    console.log(`  polish ${key} ${it.type}`);
    const parsed = await chat(payload, { maxTokens: 8192 });
    const p = parsed.item || parsed;
    if (!p || p.type !== it.type) {
      throw new Error(`${key}: type mismatch or empty`);
    }
    if (!Array.isArray(p.categories) || p.categories.length !== it.categories.length) {
      throw new Error(`${key}: categories length mismatch`);
    }
    const cats = it.categories.map((c, ci) => {
      const pc = p.categories[ci];
      const prompts = Array.isArray(pc.prompts)
        ? pc.prompts.map(String)
        : c.prompts;
      if (prompts.length !== c.prompts.length) {
        console.warn(`  warn prompts length cat ${ci}`);
        return { name: String(pc.name ?? c.name), prompts: c.prompts };
      }
      return { name: String(pc.name ?? c.name), prompts };
    });
    ru[i] = {
      ...it,
      label: String(p.label ?? it.label),
      description: String(p.description ?? it.description),
      instruction: String(p.instruction ?? it.instruction),
      categories: cats,
    };
    writeJson(ruPath, ru);
    markDone(prog, key);
    await sleep(150);
  }
  console.log('task2 done');
}

// ---------- dictation ----------
async function polishDictation(prog) {
  if (!want('dictation')) return;
  const dir = path.join(PACK, 'dictation');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
  for (const file of files) {
    const level = file.replace(/\.txt$/i, '');
    if (ONLY_LEVEL && level !== ONLY_LEVEL) continue;
    const fp = path.join(dir, file);
    const raw = fs.readFileSync(fp, 'utf8');
    const lines = raw.split(/\r?\n/);
    const contentIdx = [];
    const contents = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*-\s+/.test(line)) {
        contentIdx.push(i);
        contents.push(line.replace(/^\s*-\s+/, '').trim());
      }
    }
    const batches = chunk(
      contents.map((text, i) => ({ text, i })),
      40
    );
    for (let bi = 0; bi < batches.length; bi++) {
      const key = `dictation:${file}:${bi}`;
      if (isDone(prog, key)) {
        console.log(`  skip ${key}`);
        continue;
      }
      const batch = batches[bi];
      const payload = {
        task: 'polish_dictation_lines',
        level,
        return_shape: '{ "lines": [string, ...] }',
        note: 'Same count. Natural Russian. Keep short dictation style. No leading "- ".',
        lines: batch.map((b) => b.text),
      };
      console.log(`  polish ${key}`);
      const parsed = await chat(payload, { maxTokens: 4096 });
      const out = parsed.lines || parsed.items || parsed;
      if (!Array.isArray(out) || out.length !== batch.length) {
        throw new Error(`${key}: expected ${batch.length}, got ${out?.length}`);
      }
      for (let j = 0; j < batch.length; j++) {
        const globalI = batch[j].i;
        const lineNo = contentIdx[globalI];
        const polished = String(out[j] ?? batch[j].text).replace(/^\s*-\s+/, '').trim();
        lines[lineNo] = `- ${polished}`;
      }
      fs.writeFileSync(fp, lines.join('\n').replace(/\n+$/, '') + '\n', 'utf8');
      markDone(prog, key);
      await sleep(80);
    }
  }
  console.log('dictation done');
}

async function main() {
  if (!API_KEY) {
    console.error('Missing VITE_OPENROUTER_API_KEY');
    process.exit(1);
  }
  console.log(`Model: ${MODEL}`);
  console.log(`Pack: ${PACK}`);
  console.log(`Only: ${ONLY ? ONLY.join(',') : '(all)'}`);
  const prog = loadProgress();

  await polishLevelTexts(prog);
  await polishComprehensive(prog);
  await polishPromptLists(prog, 'speaking-topics.json', 'speaking');
  await polishPromptLists(prog, 'writing-topics.json', 'writing');
  await polishTask2(prog);
  await polishDictation(prog);

  console.log('\nAll requested polish jobs finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: { model, prepare } } = parseArgs({ options: {
  model: { type: 'string', default: 'translategemma:12b' },
  prepare: { type: 'boolean' },
} });
if (!/^translategemma(?::[\w.-]+)?$/.test(model)) throw new Error('Choose a local TranslateGemma model tag.');

const output = '.tmp-translategemma-review';
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const en = await readJson('public/level-texts.json');
const uz = await readJson('public/data/lang-packs/uz/level-texts.json');
const cases = Object.entries(en).flatMap(([level, lessons]) => {
  const baseline = new Map(uz[level].map((lesson) => [lesson.id, lesson]));
  return [0, 1 / 3, 2 / 3, 1].map((position) => {
    const lesson = lessons[Math.round((lessons.length - 1) * position)];
    const existing = baseline.get(lesson.id);
    if (!lesson.text?.trim() || !existing?.text?.trim()) throw new Error(`Missing passage or baseline for ${lesson.id}`);
    return { level, lesson, existing };
  });
});

const ollama = 'http://127.0.0.1:11434';
if (!prepare) {
  const response = await fetch(`${ollama}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Could not list local Ollama models (HTTP ${response.status}).`);
  const { models } = await response.json();
  if (!models.some(({ name }) => name === (model.includes(':') ? model : `${model}:latest`))) {
    throw new Error(`${model} is not installed in Ollama yet. Wait for the model pull to finish or specify the installed tag with --model.`);
  }
}

await mkdir(output, { recursive: true });
const checkpoint = path.join(output, `${model.replace(':', '-')}.json`);
const translations = await readJson(checkpoint).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return {};
});

async function translate(lesson) {
  const prompt = `You are a professional English (en) to Uzbek (uz-Latn) translator. Convey the meaning and nuances of the English text accurately and follow Uzbek grammar, vocabulary, and cultural conventions.
Output only the Uzbek translation. Translate this English text into Uzbek:\n\n\n${lesson.text}`;
  const response = await fetch(`${ollama}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(240_000),
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: false, options: { temperature: 0 } }),
  });
  if (!response.ok) throw new Error(`${lesson.id}: Ollama returned HTTP ${response.status}. ${await response.text()}`);
  const result = await response.json();
  const translation = result.message?.content?.trim();
  if (!translation || result.done_reason === 'length') throw new Error(`${lesson.id}: Parseable, complete translation required.`);
  return translation;
}

function report() {
  return [
    '# English to Uzbek passage comparison', '',
    `Candidate model: ${model}. Four matched passages per level.`, '',
    'For each passage, score meaning, natural Uzbek, reading level, and teaching alignment from 0 to 2 for each version. Check names, facts, glossary terms, the core question, and any answer it depends on. Flag any material error and record a preference or tie.', '',
    ...cases.flatMap(({ level, lesson, existing }) => [
      `## ${level} · ${lesson.id} · ${lesson.title}`, '',
      ...(lesson.coreQuestion ? [`Core question: ${lesson.coreQuestion}`, ''] : []),
      ...(lesson.languageGoal ? [`Language goal: ${lesson.languageGoal}`, ''] : []),
      '### English source', '', `~~~text\n${lesson.text.trim()}\n~~~`, '',
      '### Current Uzbek passage', '', `~~~text\n${existing.text.trim()}\n~~~`, '',
      '### TranslateGemma', '', `~~~text\n${translations[lesson.id]?.source === lesson.text ? translations[lesson.id].text : 'Pending'}\n~~~`, '',
      'Current scores: ____ / ____ / ____ / ____', '', 'Candidate scores: ____ / ____ / ____ / ____', '', 'Preference and notes: ____', '',
    ]),
  ].join('\n');
}

const reportFile = path.join(output, 'comparison.md');
await writeFile(reportFile, report());
if (!prepare) {
  for (const { lesson } of cases) {
    if (translations[lesson.id]?.source === lesson.text) continue;
    console.log(`Translating ${lesson.id}…`);
    translations[lesson.id] = { source: lesson.text, text: await translate(lesson) };
    await writeFile(checkpoint, `${JSON.stringify(translations, null, 2)}\n`);
    await writeFile(reportFile, report());
  }
}
console.log(`Saved ${cases.length} review cases to ${reportFile}`);

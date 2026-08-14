/**
 * Replace the first Beginner reading topic (id "b1", "My ID Card") with a
 * friendlier introduction passage that avoids ID-card/phone-number content,
 * across the English built-in (public/level-texts.json) and every language
 * pack (public/data/lang-packs/{lang}/level-texts.json).
 *
 * Usage:
 *   npx tsx scripts/replace-beginner-b1.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LANG_NAME: Record<string, string> = {
  ar: 'Arabic', zh: 'Chinese (Simplified)', cs: 'Czech', nl: 'Dutch', el: 'Greek',
  fa: 'Persian (Farsi)', fr: 'French', de: 'German', hi: 'Hindi', id: 'Indonesian',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay', pl: 'Polish',
  pt: 'Portuguese', ro: 'Romanian', ru: 'Russian', sv: 'Swedish', sw: 'Swahili',
  th: 'Thai', tl: 'Tagalog (Filipino)', tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu',
  uz: 'Uzbek', vi: 'Vietnamese',
};

const NEW_EN_TOPIC = {
  id: 'b1',
  title: 'My Morning',
  text: 'Every morning I wake up early. I open my eyes and stretch my arms. First, I wash my face with cold water. Then I brush my teeth. I make a small breakfast with bread and tea. I like to read a book before school. My mother gives me a smile. I feel happy and ready for the day.',
  targetSeconds: 36,
  vocabulary: [
    { word: 'Morning', definition: '(Noun) The first part of the day, before noon.' },
    { word: 'Wake up', definition: '(Phrasal verb) To stop sleeping and open your eyes.' },
    { word: 'Stretch', definition: '(Verb) To move your arms or legs to make them straight.' },
    { word: 'Wash', definition: '(Verb) To clean something with water.' },
    { word: 'Breakfast', definition: '(Noun) The first meal of the day.' },
    { word: 'Ready', definition: '(Adjective) Prepared to do something.' },
  ],
};

async function translateBatch(lang: string, items: { title: string; text: string; vocabulary: { word: string; definition: string }[] }) {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('Missing VITE_OPENROUTER_API_KEY');
  const system = `You are a professional translator for a language-learning app.
Translate the following beginner reading topic into natural ${LANG_NAME[lang]}.
Return ONLY JSON: { "title": string, "text": string, "vocabulary": [{"word","definition"}] }.
Rules:
- Keep id and targetSeconds unchanged (not part of response).
- Translate title, text, and each vocabulary word + definition into ${LANG_NAME[lang]}.
- The vocabulary "word" should be the ${LANG_NAME[lang]} word or phrase appearing in the text (or the closest natural equivalent).
- Keep definitions simple and learner-friendly (include the part of speech, e.g. "(Noun) ...").
- Do not add numbering or commentary.`;
  const user = JSON.stringify({ title: NEW_EN_TOPIC.title, text: NEW_EN_TOPIC.text, vocabulary: NEW_EN_TOPIC.vocabulary });
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://smartyenglish.uz',
      'X-Title': 'Smarty b1 topic seed',
    },
    body: JSON.stringify({
      model: process.env.SEED_TRANSLATE_MODEL || 'google/gemini-2.5-flash-lite',
      max_tokens: 1024,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  let raw = (data?.choices?.[0]?.message?.content || '').trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(raw);
  return {
    id: 'b1',
    title: String(parsed.title ?? ''),
    text: String(parsed.text ?? ''),
    targetSeconds: 36,
    vocabulary: Array.isArray(parsed.vocabulary)
      ? parsed.vocabulary.map((v: any) => ({ word: String(v.word ?? ''), definition: String(v.definition ?? '') }))
      : [],
  };
}

function loadJson(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const LANGS = fs.readdirSync(path.join(ROOT, 'public', 'data', 'lang-packs'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

async function main() {
  // 1. English built-in
  const enPath = path.join(ROOT, 'public', 'level-texts.json');
  const en = loadJson(enPath);
  const enBeginner = en.Beginner as any[];
  const idx = enBeginner.findIndex(t => t.id === 'b1');
  if (idx === -1) throw new Error('b1 not found in English level-texts.json');
  enBeginner[idx] = { ...NEW_EN_TOPIC };
  writeJson(enPath, en);
  console.log(`Updated EN b1 → "${NEW_EN_TOPIC.title}"`);

  // 2. Language packs
  for (const lang of LANGS) {
    const file = path.join(ROOT, 'public', 'data', 'lang-packs', lang, 'level-texts.json');
    if (!fs.existsSync(file)) { console.log(`skip ${lang} (no level-texts.json)`); continue; }
    const data = loadJson(file);
    const beginner = data.Beginner as any[];
    const idx = beginner.findIndex(t => t.id === 'b1');
    if (idx === -1) { console.log(`skip ${lang} (no b1)`); continue; }
    let translated = beginner[idx];
    try {
      translated = await translateBatch(lang, NEW_EN_TOPIC);
    } catch (e: any) {
      console.warn(`  [${lang}] translation failed (${e.message?.slice(0, 80)}); keeping existing b1`);
    }
    beginner[idx] = translated;
    writeJson(file, data);
    console.log(`Updated ${lang} b1 → "${translated.title}"`);
    await new Promise(r => setTimeout(r, 150));
  }
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });

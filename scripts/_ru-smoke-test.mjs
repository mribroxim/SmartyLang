import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const MODEL = process.env.POLISH_RU_MODEL || 'google/gemma-4-31b-it:free';

const SYSTEM = `Ты — литературный редактор русского. Отполируй тексты.
Обязательно исправь: «потягиваю руки» → «потягиваюсь»; определение «Умывать: Чистить что-то водой» → нормальное.
Верни JSON: {"items":[{"id","title","text","vocabulary":[{"word","definition"}]}]}`;

const lt = JSON.parse(
  fs.readFileSync('public/data/lang-packs/ru/level-texts.json', 'utf8')
);
const en = JSON.parse(fs.readFileSync('public/level-texts.json', 'utf8'));
const items = lt.Beginner.slice(0, 2).map((it, i) => ({
  id: it.id,
  english: {
    title: en.Beginner[i].title,
    text: en.Beginner[i].text,
    vocabulary: en.Beginner[i].vocabulary,
  },
  current_ru: {
    title: it.title,
    text: it.text,
    vocabulary: it.vocabulary,
  },
}));

const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://smartyenglish.uz',
    'X-Title': 'Smarty RU smoke',
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 2500,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: JSON.stringify({ items }) + '\nОтветь одним JSON-объектом.',
      },
    ],
  }),
});
const t = await res.text();
console.log('status', res.status, 'model', MODEL);
console.log(t.slice(0, 3500));

import dotenv from 'dotenv';
dotenv.config();
const key = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const models = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-2-9b-it:free',
];
for (const model of models) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 60,
      messages: [{ role: 'user', content: 'Return only: {"polished":["ok"]}' }],
    }),
  });
  const t = await res.text();
  console.log(model, res.status, t.slice(0, 140).replace(/\s+/g, ' '));
}

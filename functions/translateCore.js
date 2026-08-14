/**
 * Official Cloud Translation helper (server / Cloud Function only).
 * Prefer Translation API v3 via ADC, then v2 with API key, then gtx last resort.
 */
const GTX =
  'https://translate.googleapis.com/translate_a/single?client=gtx';

function normalizeLang(code) {
  if (!code) return 'en';
  const c = String(code).toLowerCase();
  if (c === 'fil' || c === 'tl-ph') return 'tl';
  if (c.startsWith('zh')) return 'zh-CN';
  return c.split('-')[0];
}

async function gtxTranslate(text, from, to) {
  const url =
    `${GTX}&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}` +
    `&dt=t&q=${encodeURIComponent(String(text).slice(0, 450))}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`gtx ${r.status}`);
  const d = await r.json();
  const out = (Array.isArray(d?.[0]) ? d[0] : [])
    .map((part) => (Array.isArray(part) ? String(part[0] || '') : ''))
    .join('')
    .trim();
  return out || null;
}

async function v2Translate(text, from, to, apiKey) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: String(text).slice(0, 450),
      source: from,
      target: to === 'zh' ? 'zh-CN' : to,
      format: 'text',
    }),
  });
  if (!r.ok) throw new Error(`v2 ${r.status}`);
  const d = await r.json();
  return d?.data?.translations?.[0]?.translatedText || null;
}

async function v3Translate(text, from, to) {
  const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) return null;
  let GoogleAuth;
  try {
    ({ GoogleAuth } = require('google-auth-library'));
  } catch {
    return null;
  }
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-translation', 'https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const access = token?.token || token;
  if (!access) return null;
  const url = `https://translation.googleapis.com/v3/projects/${project}/locations/global:translateText`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [String(text).slice(0, 450)],
      sourceLanguageCode: from,
      targetLanguageCode: to === 'zh' ? 'zh-CN' : to,
      mimeType: 'text/plain',
    }),
  });
  if (!r.ok) throw new Error(`v3 ${r.status}`);
  const d = await r.json();
  return d?.translations?.[0]?.translatedText || null;
}

/**
 * @returns {{ text: string, source: 'v3' | 'v2' | 'gtx' }}
 */
async function officialTranslate(text, fromRaw, toRaw, apiKey) {
  const from = normalizeLang(fromRaw);
  const to = normalizeLang(toRaw);
  if (!text || from === to) return { text: String(text || ''), source: 'v3' };

  try {
    const t = await v3Translate(text, from, to);
    if (t) return { text: t, source: 'v3' };
  } catch (e) {
    console.warn('[translate] v3 failed:', e.message);
  }

  if (apiKey) {
    try {
      const t = await v2Translate(text, from, to, apiKey);
      if (t) return { text: t, source: 'v2' };
    } catch (e) {
      console.warn('[translate] v2 failed:', e.message);
    }
  }

  const t = await gtxTranslate(text, from, to);
  if (!t) throw new Error('translate empty');
  return { text: t, source: 'gtx' };
}

function cacheDocId(from, to, word) {
  const key = `${normalizeLang(from)}|${normalizeLang(to)}|${String(word).trim().toLowerCase().slice(0, 180)}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${normalizeLang(from)}_${normalizeLang(to)}_${(h >>> 0).toString(16)}`;
}

function missDocId(lang, word) {
  const w = String(word || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\u0400-\u04ff\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/gi, '_')
    .slice(0, 80);
  return `${normalizeLang(lang)}_${w || 'x'}`.slice(0, 120);
}

module.exports = { officialTranslate, cacheDocId, missDocId, normalizeLang };

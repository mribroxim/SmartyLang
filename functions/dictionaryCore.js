/**
 * Server-side dictionary proxy (Free Dictionary + Wiktionary).
 * Browser clients often can't reach dictionaryapi.dev reliably.
 *
 * Also tries common English morphology + accent folding so passage
 * surface forms like "opens" / "café" still resolve.
 */
function sanitize(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(list) {
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const v = String(item || '').trim();
    if (!v) continue;
    const key = v.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Fold Latin accents: café → cafe */
function asciiFold(word) {
  try {
    return String(word || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  } catch {
    return String(word || '');
  }
}

/**
 * Candidate surface → lemma forms for dictionary APIs that only
 * index headwords (opens → open, preparing → prepare, children → child).
 */
function lookupCandidates(word) {
  const raw = String(word || '').trim();
  if (!raw) return [];
  const lower = raw.toLocaleLowerCase();
  const ascii = asciiFold(lower).toLocaleLowerCase();
  const forms = [raw, lower];
  if (ascii !== lower) forms.push(ascii);

  const stemFrom = (base) => {
    if (!/^[a-z][a-z'-]*$/i.test(base)) return;
    if (base.endsWith('ies') && base.length > 4) forms.push(`${base.slice(0, -3)}y`);
    if (base.endsWith('ves') && base.length > 4) {
      forms.push(`${base.slice(0, -3)}f`);
      forms.push(`${base.slice(0, -3)}fe`);
    }
    if (/(?:sses|xes|zes|ches|shes)$/.test(base) && base.length > 5) {
      forms.push(base.slice(0, -2));
    }
    if (base.endsWith('es') && base.length > 3) forms.push(base.slice(0, -2));
    if (base.endsWith('s') && !base.endsWith('ss') && base.length > 3) {
      forms.push(base.slice(0, -1));
    }
    if (base.endsWith('ying') && base.length > 5) forms.push(`${base.slice(0, -4)}ie`);
    if (base.endsWith('ing') && base.length > 5) {
      forms.push(base.slice(0, -3));
      forms.push(`${base.slice(0, -3)}e`);
      if (/(.)\1ing$/.test(base)) forms.push(base.slice(0, -4));
    }
    if (base.endsWith('ied') && base.length > 4) forms.push(`${base.slice(0, -3)}y`);
    if (base.endsWith('ed') && base.length > 3) {
      forms.push(base.slice(0, -2));
      forms.push(`${base.slice(0, -1)}`); // liked → like
      if (/(.)\1ed$/.test(base)) forms.push(base.slice(0, -3));
    }
    if (base.endsWith('ly') && base.length > 4) forms.push(base.slice(0, -2));
    if (base.endsWith('men') && base.length > 4) forms.push(`${base.slice(0, -3)}man`);
    if (base.endsWith('dren') && base.length > 5) forms.push(base.slice(0, -3)); // children → child
  };

  stemFrom(lower);
  if (ascii !== lower) stemFrom(ascii);

  // Elisions: l'amour → amour
  for (const rx of [
    /^(?:d|j|l|m|n|s|t|c|qu)['’]/i,
    /^(?:de[ls]|à[ls]|a[ls]|dell['’])['’]?/i,
  ]) {
    if (rx.test(lower)) {
      const stripped = lower.replace(rx, '').trim();
      if (stripped) forms.push(stripped);
    }
  }

  return unique(forms).slice(0, 8);
}

async function fetchJson(url, opts = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupEnglish(word) {
  const data = await fetchJson(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );
  const entry = data?.[0];
  if (!entry) return null;
  const meanings = (entry.meanings || []).map((m) => ({
    partOfSpeech: m.partOfSpeech || 'unknown',
    definitions: (m.definitions || [])
      .map((d) => ({
        definition: sanitize(d.definition || ''),
        example: d.example ? sanitize(d.example) : undefined,
      }))
      .filter((d) => d.definition),
    synonyms: m.synonyms || [],
  })).filter((m) => m.definitions.length > 0);
  if (!meanings.length) return null;
  return {
    word: entry.word,
    phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text,
    audio: entry.phonetics?.find((p) => p.audio)?.audio,
    meanings,
  };
}

async function lookupWiktionary(word, code) {
  const data = await fetchJson(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
    { headers: { Accept: 'application/json' } },
    6000,
  );
  if (!data) return null;
  const section = code === 'zh' || code === 'zh-CN' || code === 'zh-TW' ? 'zh' : code;
  const entries = Array.isArray(data?.[section])
    ? data[section]
    : (Object.entries(data || {}).find(([k]) => k.toLowerCase() === section.toLowerCase())?.[1]);
  if (!Array.isArray(entries) || !entries.length) return null;
  const meanings = entries.map((e) => ({
    partOfSpeech: e.partOfSpeech || 'unknown',
    definitions: (e.definitions || []).slice(0, 8).map((d) => ({
      definition: sanitize(String(d.definition || '')),
      example: d.examples?.[0] ? sanitize(String(d.examples[0])) : undefined,
    })).filter((d) => d.definition),
    synonyms: [],
  })).filter((m) => m.definitions.length > 0);
  if (!meanings.length) return null;
  return { word, meanings };
}

function isLatinish(word) {
  return /[A-Za-z]/.test(word) && /^[\p{L}'’ -]+$/u.test(word);
}

function isFormOfGloss(text) {
  return /^(?:plural|singular|third-person|simple past|past participle|present participle|comparative|superlative|inflection|alternate form|alternative form)\b/i.test(
    String(text || '').trim(),
  );
}

function isFullDefinition(result) {
  if (!result?.meanings?.length) return false;
  const first = result.meanings[0]?.definitions?.[0]?.definition || '';
  return !isFormOfGloss(first);
}

/**
 * @returns {Promise<object|null>}
 */
async function lookupDictionaryServer(word, lang) {
  const candidates = lookupCandidates(word);
  if (!candidates.length) return null;
  const code = String(lang || 'en').toLowerCase().split('-')[0];
  let formOfFallback = null;

  if (code === 'en') {
    for (const c of candidates) {
      const wikt = await lookupWiktionary(c, 'en');
      if (wikt) {
        if (isFullDefinition(wikt)) return wikt;
        if (!formOfFallback) formOfFallback = wikt;
      }
      const en = await lookupEnglish(c);
      if (en) {
        if (isFullDefinition(en)) return en;
        if (!formOfFallback) formOfFallback = en;
      }
    }
    return formOfFallback;
  }

  for (const c of candidates) {
    const wikt = await lookupWiktionary(c, code === 'zh' ? 'zh' : code);
    if (wikt) {
      if (isFullDefinition(wikt)) return wikt;
      if (!formOfFallback) formOfFallback = wikt;
    }
  }

  for (const c of candidates) {
    if (!isLatinish(c)) continue;
    const folded = asciiFold(c);
    const wiktEn = await lookupWiktionary(folded, 'en');
    if (wiktEn) {
      if (isFullDefinition(wiktEn)) return wiktEn;
      if (!formOfFallback) formOfFallback = wiktEn;
    }
    const en = await lookupEnglish(folded);
    if (en) {
      if (isFullDefinition(en)) return en;
      if (!formOfFallback) formOfFallback = en;
    }
  }
  return formOfFallback;
}

module.exports = { lookupDictionaryServer, lookupCandidates };

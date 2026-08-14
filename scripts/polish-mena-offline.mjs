/**
 * Offline / low-credit literary repair for MENA-SA packs:
 * 1) Translate leftover English passages/titles via Google gtx
 * 2) Apply language-specific calque / morphology fixes
 * 3) Run L2 self-ref replacements (imported logic duplicated lightly)
 *
 * Usage: node scripts/polish-mena-offline.mjs [--langs=ar,fa,ur,hi,tr,uz,sw,el]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

const LANGS = (() => {
  const eq = process.argv.find((a) => a.startsWith('--langs='));
  if (eq) return eq.slice(8).split(',').map((s) => s.trim()).filter(Boolean);
  return ['ar', 'fa', 'ur', 'hi', 'tr', 'uz', 'sw', 'el'];
})();

const GTX = {
  ar: 'ar',
  fa: 'fa',
  ur: 'ur',
  hi: 'hi',
  tr: 'tr',
  uz: 'uz',
  sw: 'sw',
  el: 'el',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isMostlyEnglish(s, lang) {
  if (!s || s.length < 40) return false;
  // Latin L2s (tr/uz/sw): require strong English function-word density + low L2 markers
  const latinLang = ['tr', 'uz', 'sw'].includes(lang);
  const letters = (s.match(/\p{L}/gu) || []).length;
  if (letters < 30) return false;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const ratio = latin / letters;
  const engHits = (s.match(/\b(the|and|of|to|in|is|for|that|with|are|was|this|have|from)\b/gi) || [])
    .length;
  if (latinLang) {
    // Turkish/Uzbek/Swahili share Latin letters — only flag near-pure English
    if (lang === 'tr' && /[çğıöşüÇĞİÖŞÜ]/.test(s)) return false;
    if (lang === 'uz' && /[ʻʼʻ''']|[oO]['ʻʼ]/.test(s)) {
      // has uzbek apostrophe letters — likely Uzbek; still catch pure English
      if (engHits < 12) return false;
    }
    if (lang === 'sw' && /\b(na|ya|wa|ni|kwa|katika|hii|hizo)\b/i.test(s) && engHits < 10) {
      return false;
    }
    return ratio > 0.92 && engHits >= 10;
  }
  // Non-Latin scripts: any long Latin-majority string is leftover English
  return ratio > 0.75 && engHits >= 6;
}

async function gtxTranslate(lang, text) {
  if (!text?.trim()) return text ?? '';
  if (text.length > 4200) {
    const parts = [];
    let rest = text;
    while (rest.length > 4000) {
      let cut = rest.lastIndexOf('. ', 4000);
      if (cut < 1600) cut = rest.lastIndexOf(' ', 4000);
      if (cut < 1600) cut = 4000;
      parts.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    if (rest) parts.push(rest);
    const out = [];
    for (const p of parts) {
      out.push(await gtxTranslate(lang, p));
      await sleep(60);
    }
    return out.join('');
  }
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
    encodeURIComponent(GTX[lang]) +
    '&dt=t&q=' +
    encodeURIComponent(text);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gtx ${res.status}`);
      const data = await res.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((row) => row?.[0] ?? '').join('')
        : '';
      if (!translated) throw new Error('empty');
      return translated;
    } catch (e) {
      await sleep(200 * (attempt + 1));
      if (attempt === 4) throw e;
    }
  }
  return text;
}

/** Per-lang deterministic literary repairs on already-L2 text */
const LOCAL_FIXES = {
  ar: [
    [/ما هو اسمك الكامل\؟/g, 'ما اسمك الكامل؟'],
    [/قم بتلخيص المعلومات عن طريق اختيار السمات الرئيسية والإبلاغ عنها/g, 'لخّص المعلومات باختيار السمات الرئيسة وذكرها'],
    [/اكتب ما لا يقل عن/g, 'اكتب ما لا يقل عن'],
  ],
  fa: [
    [/اسمت کامل چیست\؟/g, 'اسم کامل‌ات چیست؟'],
    [/بیا در مورد/g, 'بیایید درباره‌ی'],
  ],
  ur: [
    [/آئیں آپ کے نام کے بارے میں بات کرتے ہیں۔/g, 'آئیے آپ کے نام پر بات کرتے ہیں۔'],
  ],
  hi: [
    [/आपका पूरा नाम क्या है\?/g, 'आपका पूरा नाम क्या है?'],
  ],
  tr: [
    [/Mutlu ve güne hazırım hissediyorum\./g, 'Kendimi mutlu ve güne hazır hissediyorum.'],
    [/Annem bana gülümsüyor\./g, 'Annem bana gülümsüyor.'],
    [/Tam adın nedir\?/g, 'Tam adın ne?'],
  ],
  uz: [
    [/uy hayvonot mushuk/g, "uy mushugi"],
    [/To'liq ismingiz nima\?/g, "Toʻliq ismingiz nima?"],
  ],
  sw: [
    [/Jina lako kamili ni nani\?/g, 'Jina lako kamili ni nini?'],
    [/Je, una wanyama wowote wa kufuga\?/g, 'Je, una wanyama wa kufuga?'],
  ],
  el: [
    [/Ποιο είναι το πλήρες όνομά σου;/g, 'Ποιο είναι το πλήρες όνομά σου;'],
  ],
};

function applyLocalFixes(lang, s) {
  let out = s;
  for (const [re, to] of LOCAL_FIXES[lang] || []) out = out.replace(re, to);
  return out;
}

function walkFix(lang, obj, skipKeys = new Set(['chartData', 'vocabulary', 'id', 'answer', 'targetSeconds', 'level', 'type'])) {
  if (typeof obj === 'string') return applyLocalFixes(lang, obj);
  if (Array.isArray(obj)) return obj.map((x) => walkFix(lang, x, skipKeys));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = skipKeys.has(k) ? v : walkFix(lang, v, skipKeys);
    }
    return out;
  }
  return obj;
}

async function fixEnglishInJson(lang, fp, fields) {
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let n = 0;

  async function fixString(s) {
    if (typeof s !== 'string') return s;
    if (!isMostlyEnglish(s, lang)) return applyLocalFixes(lang, s);
    n++;
    const tr = await gtxTranslate(lang, s);
    await sleep(40);
    return applyLocalFixes(lang, tr);
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      for (const f of fields) {
        if (typeof item[f] === 'string') item[f] = await fixString(item[f]);
      }
      if (Array.isArray(item.questions)) {
        for (const q of item.questions) {
          if (typeof q.text === 'string' && isMostlyEnglish(q.text, lang)) {
            q.text = await fixString(q.text);
          }
          if (Array.isArray(q.options)) {
            for (let i = 0; i < q.options.length; i++) {
              if (isMostlyEnglish(String(q.options[i]), lang)) {
                q.options[i] = await fixString(String(q.options[i]));
              }
            }
          }
        }
      }
    }
  } else if (data && typeof data === 'object') {
    // level-texts style
    for (const level of Object.keys(data)) {
      if (!Array.isArray(data[level])) continue;
      for (const item of data[level]) {
        if (typeof item === 'string') {
          // speaking/writing arrays of strings
          continue;
        }
        for (const f of fields) {
          if (typeof item[f] === 'string') item[f] = await fixString(item[f]);
        }
      }
      // speaking/writing: array of strings
      if (data[level].length && typeof data[level][0] === 'string') {
        for (let i = 0; i < data[level].length; i++) {
          data[level][i] = await fixString(data[level][i]);
        }
      }
    }
  }

  const walked = walkFix(lang, data);
  fs.writeFileSync(fp, JSON.stringify(walked, null, 2) + '\n', 'utf8');
  return n;
}

async function fixDictation(lang) {
  const dir = path.join(PACKS, lang, 'dictation');
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt'))) {
    const fp = path.join(dir, f);
    let raw = fs.readFileSync(fp, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (isMostlyEnglish(t, lang)) {
        const indent = lines[i].match(/^\s*/)?.[0] || '';
        lines[i] = indent + (await gtxTranslate(lang, t));
        n++;
        await sleep(40);
      } else {
        const indent = lines[i].match(/^\s*/)?.[0] || '';
        lines[i] = indent + applyLocalFixes(lang, t);
      }
    }
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
  }
  return n;
}

async function fixTask1Prompts(lang) {
  const fp = path.join(PACKS, lang, 'task1.json');
  if (!fs.existsSync(fp)) return 0;
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let n = 0;
  for (const typ of Object.keys(data.byType || {})) {
    for (const item of data.byType[typ]) {
      for (const f of ['title', 'instruction']) {
        if (typeof item[f] !== 'string') continue;
        if (isMostlyEnglish(item[f], lang)) {
          item[f] = await gtxTranslate(lang, item[f]);
          n++;
          await sleep(40);
        }
        item[f] = applyLocalFixes(lang, item[f]);
      }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return n;
}

async function fixTask2(lang) {
  const fp = path.join(PACKS, lang, 'task2.json');
  if (!fs.existsSync(fp)) return 0;
  const data = walkFix(lang, JSON.parse(fs.readFileSync(fp, 'utf8')));
  // translate leftover English prompts
  let n = 0;
  for (const block of data) {
    for (const f of ['label', 'description', 'instruction']) {
      if (typeof block[f] === 'string' && isMostlyEnglish(block[f], lang)) {
        block[f] = await gtxTranslate(lang, block[f]);
        n++;
      }
      if (typeof block[f] === 'string') block[f] = applyLocalFixes(lang, block[f]);
    }
    for (const cat of block.categories || []) {
      if (typeof cat.name === 'string') {
        if (isMostlyEnglish(cat.name, lang)) {
          cat.name = await gtxTranslate(lang, cat.name);
          n++;
        }
        cat.name = applyLocalFixes(lang, cat.name);
      }
      if (Array.isArray(cat.prompts)) {
        for (let i = 0; i < cat.prompts.length; i++) {
          if (isMostlyEnglish(cat.prompts[i], lang)) {
            cat.prompts[i] = await gtxTranslate(lang, cat.prompts[i]);
            n++;
            await sleep(40);
          }
          cat.prompts[i] = applyLocalFixes(lang, cat.prompts[i]);
        }
      }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return n;
}

async function main() {
  const report = {};
  for (const lang of LANGS) {
    console.log(`\n=== offline polish ${lang} ===`);
    const dir = path.join(PACKS, lang);
    let enFixed = 0;
    enFixed += await fixEnglishInJson(lang, path.join(dir, 'level-texts.json'), ['title', 'text']);
    console.log(`  LT EN→L2: ${enFixed}`);
    let cr = await fixEnglishInJson(lang, path.join(dir, 'comprehensive-reading.json'), [
      'title',
      'passage',
    ]);
    console.log(`  CR EN→L2: ${cr}`);
    enFixed += cr;
    for (const f of ['speaking-topics.json', 'writing-topics.json']) {
      const n = await fixEnglishInJson(lang, path.join(dir, f), []);
      console.log(`  ${f} local/EN: ${n}`);
      enFixed += n;
    }
    const t2 = await fixTask2(lang);
    console.log(`  task2 EN: ${t2}`);
    const t1 = await fixTask1Prompts(lang);
    console.log(`  task1 prompt EN: ${t1}`);
    const d = await fixDictation(lang);
    console.log(`  dictation EN: ${d}`);
    report[lang] = { enFixed: enFixed + t2 + t1 + d };
  }

  // self-ref pass for these langs
  console.log('\nRunning fix-l2-selfrefs.mjs ...');
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'fix-l2-selfrefs.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'fix-l2-selfrefs-pass2.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  console.log('\nREPORT', report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

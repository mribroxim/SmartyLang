#!/usr/bin/env node
/** Offline authoring validation. No network, dependencies, model calls or writes. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LESSON_SCHEMA = JSON.parse(fs.readFileSync(new URL('../../content/schema/lesson-v2.schema.json', import.meta.url), 'utf8'));
export const LIMITS = {
  beginner: { sentence: 12, story: 60, items: [3, 6] }, elementary: { sentence: 18, story: 110, items: [4, 6] },
  'pre-intermediate': { sentence: 24, story: 160, items: [5, 7] }, intermediate: { sentence: 30, story: 220, items: [6, 8] }, advanced: { sentence: 40, story: 300, items: [6, 8] },
};
/** Sections whose scenes may use glossed exposure words. */
const EXPOSURE_SECTIONS = new Set(['pre-intermediate', 'intermediate', 'advanced']);
// Explicit registry, never a capitalization heuristic. Countries must be taught.
export const LANGUAGE_WHITELISTS = {
  en: { names: ['Smarty', 'Mia', 'Sam', 'Ben', 'Leo', 'Ana', 'Lily', 'Omar', 'Zara', 'Tom'], numbers: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] },
  es: { names: ['Smarty', 'Lucía', 'Mateo', 'Sofía', 'Diego', 'Valeria', 'Pablo', 'Ana', 'Leo', 'Mia'], numbers: ['cero', 'uno', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'] },
  fr: { names: ['Smarty', 'Léa', 'Hugo', 'Chloé', 'Lucas', 'Inès', 'Jules', 'Emma', 'Nathan', 'Mia'], numbers: ['zéro', 'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'] },
  de: { names: ['Smarty', 'Lena', 'Paul', 'Mia', 'Felix', 'Emma', 'Jonas', 'Lea', 'Ben', 'Anna'], numbers: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'] },
  ru: { names: ['Смарти', 'Маша', 'Саша', 'Аня', 'Миша', 'Лена', 'Дима', 'Катя', 'Иван', 'Оля'], numbers: ['ноль', 'один', 'одна', 'одно', 'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'] },
  uz: { names: ['Smarti', 'Aziz', 'Malika', 'Jasur', 'Nilufar', 'Bobur', 'Madina', 'Sardor', 'Dilnoza', 'Timur'], numbers: ['nol', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz", "o'n"] },
  tl: { names: ['Smarty', 'Maria', 'Jose', 'Ana', 'Miguel', 'Liza', 'Paolo', 'Bea', 'Carlo', 'Mia'], numbers: ['sero', 'wala', 'isa', 'dalawa', 'tatlo', 'apat', 'lima', 'anim', 'pito', 'walo', 'siyam', 'sampu'] },
  ar: { names: ['سمارتي', 'ليلى', 'عمر', 'مريم', 'يوسف', 'سارة', 'علي', 'نور', 'آدم', 'هدى'], numbers: ['صفر', 'واحد', 'واحدة', 'اثنان', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'] },
  zh: { names: ['斯玛蒂', '小明', '小红', '丽丽', '大伟', '安娜', '米娅'], numbers: ['零', '一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十'] },
};
/** Course order: words taught in an earlier level count as known in later ones. */
export const SECTION_ORDER = ['beginner', 'elementary', 'pre-intermediate', 'intermediate', 'advanced'];
const sectionRank = s => { const i = SECTION_ORDER.indexOf(s); return i < 0 ? 0 : i; };
/** One-letter words that must be taught like any other word (not treated as spelled letters). */
const ONE_LETTER_WORDS = { en: 'ai', es: 'aeouy', fr: 'ay', ru: 'вксуоия', uz: '', tl: '', de: '', ar: '' };
const FR_ELISION = /^(l|d|j|m|t|s|c|n|qu|jusqu|lorsqu|puisqu)'(.+)$/u;
const AR_PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'س'];
const AR_SUFFIXES = ['هما', 'كما', 'هم', 'هن', 'كم', 'كن', 'نا', 'ها', 'ه', 'ك', 'ي'];
const CONTRACTIONS = { "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "what's": 'what is', "where's": 'where is', "name's": 'name is', "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "aren't": 'are not', "can't": 'can not', "i've": 'i have', "i'll": 'i will' };
export function tokens(text, lang = 'en') {
  let normalized = String(text).normalize('NFKC').toLowerCase().replace(/[’‘ʼʻ`]/g, "'");
  // Arabic: vowel marks and alef/ya variants don't change the word.
  if (lang === 'ar') normalized = normalized.replace(/[\u064B-\u065F\u0670\u0640]/gu, '').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي');
  // Chinese has no spaces: every character is a token (its characters must have been taught).
  if (lang === 'zh') return (normalized.match(/\p{Script=Han}|[a-z0-9üāáǎàēéěèīíǐìōóǒòūúǔù]+/gu) || []);
  const words = normalized.match(/[\p{L}\p{M}\p{N}]+(?:'[\p{L}\p{M}\p{N}]+)*/gu) || [];
  return words.flatMap(word => {
    if (lang === 'en' && CONTRACTIONS[word]) return CONTRACTIONS[word].split(' ');
    // Possessive 's (Mia's, the cat's) adds no new word.
    if (lang === 'en' && /^\p{L}+'s$/u.test(word)) return [word.slice(0, -2)];
    const el = lang === 'fr' && word.match(FR_ELISION);
    return el ? [`${el[1]}'`, el[2]] : [word];
  });
}

/**
 * Is a token taught? 'yes', 'inflected' (looks like a form of a taught word:
 * a warning, add it to forms) or 'no'. Arabic clitics (wa-, al-, -ha…) are
 * stripped first; other languages compare stems.
 */
export function tokenStatus(token, known, lang = 'en') {
  if (known.has(token)) return 'yes';
  // Single letters spoken one by one (spelling: "M-I-A") are fine, except one-letter words of the language.
  if (lang !== 'zh' && /^\p{L}$/u.test(token) && !(ONE_LETTER_WORDS[lang] ?? '').includes(token)) return 'yes';
  if (lang === 'zh') return 'no';
  const candidates = [token];
  if (lang === 'ar') {
    for (const pre of AR_PREFIXES) if (token.startsWith(pre) && token.length - pre.length >= 2) candidates.push(token.slice(pre.length));
    for (const c of [...candidates]) for (const suf of AR_SUFFIXES) if (c.endsWith(suf) && c.length - suf.length >= 2) candidates.push(c.slice(0, -suf.length));
    if (candidates.some(c => known.has(c) || known.has('ال' + c))) return 'yes';
  }
  for (const c of candidates) {
    if (c.length < 4) continue;
    for (const k of known) {
      if (k.length < 4 || Math.abs(k.length - c.length) > 6) continue;
      let n = 0; while (n < k.length && n < c.length && k[n] === c[n]) n++;
      if (n >= Math.max(4, k.length - 2)) return 'inflected';
    }
  }
  return 'no';
}
export const normalizeTarget = (text, lang = 'en') => tokens(text, lang).join(' ');
/**
 * Forms a typed reply is matched in: normal, plus apostrophes dropped and
 * hyphens joined ("oclock", "lets", "tshirt") or spaced ("t shirt").
 * Keep in sync with acceptsReply in src/lib/lessons/v2.ts.
 */
export function replyVariants(text, lang = 'en') {
  const raw = String(text).normalize('NFKC').toLowerCase().replace(/[’‘ʼʻ`]/g, "'");
  const clean = s => s.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  return [...new Set([normalizeTarget(text, lang), clean(raw.replace(/(\p{L})['-](\p{L})/gu, '$1$2')), clean(raw.replace(/[-']/g, ' '))])];
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const answers = task => task.answers || (task.answer === undefined ? [] : [task.answer]);

/** Tiles may contain chunks; words inside one tile cannot be rearranged. */
export function canBuildTarget(answer, tiles, lang = 'en') {
  if (tiles.length > 24) return false;
  const wanted = tokens(answer, lang), chunks = tiles.map(tile => tokens(tile, lang));
  const failed = new Set();
  function find(offset, used) {
    if (offset === wanted.length) return true;
    const key = `${offset}:${used}`;
    if (failed.has(key)) return false;
    const tried = new Set();
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i], same = chunk.join(' ');
      if ((used & (1 << i)) || !chunk.length || tried.has(same)) continue;
      tried.add(same);
      if (chunk.every((word, n) => word === wanted[offset + n]) && find(offset + chunk.length, used | (1 << i))) return true;
    }
    failed.add(key); return false;
  }
  return wanted.length > 0 && find(0, 0);
}

/** Interpret exactly the JSON Schema keywords used by the committed schema. */
function schemaErrors(value, schema, at = '$') {
  if (schema.$ref) return schemaErrors(value, schema.$ref.split('/').slice(1).reduce((node, key) => node[key], LESSON_SCHEMA), at);
  const errors = [];
  const add = message => errors.push({ path: at, message });
  if (schema.oneOf) {
    const variants = schema.oneOf.map(branch => schemaErrors(value, branch, at));
    const valid = variants.filter(result => !result.length);
    if (valid.length !== 1) {
      if (!valid.length) errors.push(...variants.reduce((best, result) => result.length < best.length ? result : best));
      else add('must match exactly one schema alternative (use answer OR answers, not both)');
    }
  }
  for (const branch of schema.allOf || []) errors.push(...schemaErrors(value, branch, at));
  if ('const' in schema && value !== schema.const) add(`must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) add(`must be one of ${schema.enum.join(', ')}`);
  if (schema.type) {
    const matches = schema.type === 'object' ? object(value) : schema.type === 'array' ? Array.isArray(value)
      : schema.type === 'integer' ? Number.isInteger(value) : schema.type === 'number' ? Number.isFinite(value) : typeof value === schema.type;
    if (!matches) { add(`must be ${schema.type}`); return errors; }
  }
  if (schema.required && object(value)) for (const key of schema.required) if (!Object.hasOwn(value, key)) errors.push({ path: `${at}.${key}`, message: 'is required' });
  if (typeof value === 'string') {
    if (schema.minLength && value.trim().length < schema.minLength) add(`must contain at least ${schema.minLength} non-blank character(s)`);
    if (schema.maxLength && value.length > schema.maxLength) add(`must contain at most ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) add(`must match ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) add(`must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) add(`must be <= ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add(`must have at least ${schema.minItems} entries`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) add(`must have at most ${schema.maxItems} entries`);
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) add('must not contain duplicate entries');
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, `${at}[${index}]`)));
  }
  if (object(value) && schema.properties) for (const [key, item] of Object.entries(value)) {
    if (schema.properties[key]) errors.push(...schemaErrors(item, schema.properties[key], `${at}.${key}`));
    else if (schema.additionalProperties === false) errors.push({ path: `${at}.${key}`, message: 'unknown property' });
  }
  return errors;
}

/** Previous lessons are explicit input; no later file is silently treated as taught. */
export function validateLessons(document, { previousLessons = [], lang: requestedLang } = {}) {
  const lessons = Array.isArray(document?.lessons) ? document.lessons : [document];
  const lessonIdAt = at => {
    const match = at.match(/^\$\.lessons\[(\d+)\]/);
    return (match ? lessons[Number(match[1])]?.id : document?.id) || '<unit>';
  };
  const issues = schemaErrors(document, LESSON_SCHEMA).map(issue => ({ lessonId: lessonIdAt(issue.path), ...issue }));
  if (issues.length) return issues;
  const lang = document.lang || requestedLang || 'en';
  const whitelist = LANGUAGE_WHITELISTS[lang];
  if (!whitelist) return [{ lessonId: '<unit>', path: '$.lang', message: `no lexical whitelist configured for language ${lang}` }];
  const earlier = new Map();
  const seenLessons = new Set();
  const allow = new Set([...whitelist.names, ...whitelist.numbers].flatMap(text => tokens(text, lang)));
  const addEarlier = lesson => { for (const item of lesson.items || []) earlier.set(item.id, item); seenLessons.add(lesson.id); };
  const isEarlier = (a, b) => sectionRank(a.section) < sectionRank(b.section) || (a.section === b.section && (a.unit < b.unit || (a.unit === b.unit && a.lesson < b.lesson)));
  const previousSorted = [...previousLessons].sort((a, b) => sectionRank(a.section) - sectionRank(b.section) || a.unit - b.unit || a.lesson - b.lesson);
  let prior;
  for (const [index, lesson] of lessons.entries()) {
    const base = Array.isArray(document.lessons) ? `$.lessons[${index}]` : '$';
    const issue = (suffix, message) => issues.push({ lessonId: lesson.id, path: `${base}${suffix}`, message });
    // Advice, not a rule: printed, but the unit still passes.
    const warn = (suffix, message) => issues.push({ lessonId: lesson.id, path: `${base}${suffix}`, message, warn: true });
    for (const old of previousSorted) if (isEarlier(old, lesson) && (!old.lang || old.lang === lang)) addEarlier(old);
    if (seenLessons.has(lesson.id)) issue('.id', 'lesson id duplicates an earlier lesson');
    if (prior && (lesson.unit !== prior.unit || lesson.section !== prior.section || lesson.lesson !== prior.lesson + 1)) issue('.lesson', 'lessons must be in contiguous teaching order');
    if (document.lessons && (lesson.section !== document.section || lesson.unit !== document.unit || lesson.lesson !== index + 1)) issue('.lesson', 'lesson section/unit/order must match the unit envelope (lessons 1…N in order)');
    if (lesson.lang && lesson.lang !== lang) issue('.lang', 'must match the unit language');
    const current = new Map();
    const oldTexts = new Set([...earlier.values()].map(item => normalizeTarget(item.text, lang)));
    const texts = new Set();
    for (const [i, item] of lesson.items.entries()) {
      const normalized = normalizeTarget(item.text, lang);
      if (earlier.has(item.id) || current.has(item.id)) issue(`.items[${i}].id`, `item id ${item.id} is not new/unique; reference it through recycle instead`);
      if (!normalized) issue(`.items[${i}].text`, 'must contain a target-language token');
      if (oldTexts.has(normalized) || texts.has(normalized)) issue(`.items[${i}].text`, 'duplicates an already taught item; recycle it instead');
      current.set(item.id, item); texts.add(normalized);
    }
    for (const [i, id] of lesson.recycle.entries()) if (!earlier.has(id)) issue(`.recycle[${i}]`, `${id} must exist in an earlier lesson of this level`);
    const known = new Set(allow);
    for (const item of [...earlier.values(), ...current.values()]) for (const text of [item.text, ...(item.forms || [])]) tokens(text, lang).forEach(token => known.add(token));
    const limit = LIMITS[lesson.section];
    // No fixed sizes: a lesson teaches what its topic needs. Only the meaning of the type is a rule.
    const type = lesson.type || 'lesson';
    if (type === 'review' && lesson.items.length) issue('.items', 'review lessons teach no new items; move them to a lesson or recycle them');
    if (type === 'lesson' && !lesson.items.length) issue('.items', 'a lesson teaches at least one new item; use type "review" for practice-only lessons');
    const [lo, hi] = limit.items;
    if (type === 'lesson' && (lesson.items.length < lo || lesson.items.length > hi)) warn('.items', `${lesson.items.length} new items; ${lo}–${hi} is typical for ${lesson.section}. Fine if the topic needs it; split the lesson if learners would be overloaded`);
    if (lesson.exposure?.length && !EXPOSURE_SECTIONS.has(lesson.section)) issue('.exposure', 'exposure words are for B1 and above; A1–A2 scenes use only taught words');
    const exposed = new Set((lesson.exposure || []).flatMap(e => tokens(e.text, lang)));
    // input = text the learner reads or hears (scenes, Smarty's lines, examples): a few untaught words are
    // glossed by the app, so they are warnings. Everything the learner answers, picks or builds must be taught.
    const target = (text, at, extra, input = false) => {
      const status = token => (/^\d+$/u.test(token) || extra?.has(token) ? 'yes' : tokenStatus(token, known, lang));
      const all = [...new Set(tokens(text, lang))];
      const unknown = all.filter(token => status(token) === 'no');
      const inflected = all.filter(token => status(token) === 'inflected');
      if (unknown.length && input) warn(at, `not taught yet (the app will gloss them): ${unknown.join(', ')}`);
      else if (unknown.length) issue(at, `untaught token(s): ${unknown.join(', ')}; teach the item/form before using it`);
      if (inflected.length) warn(at, `check these are forms of taught words, and list them in that item's forms: ${inflected.join(', ')}`);
      for (const sentence of text.split(/[.!?\n]+/u).filter(Boolean)) if (tokens(sentence, lang).length > limit.sentence) warn(at, `sentence exceeds ${limit.sentence} target tokens for ${lesson.section}`);
    };
    const references = (ids, at) => ids.forEach((id, i) => {
      if (!current.has(id) && !earlier.has(id)) issue(`${at}[${i}]`, `unknown item id ${id}`);
      else if (earlier.has(id) && !lesson.recycle.includes(id)) issue(`${at}[${i}]`, `${id} is earlier material and must be declared in recycle`);
    });
    const taskIds = new Set();
    const checkTask = (task, at) => {
      if (taskIds.has(task.id)) issue(`${at}.id`, 'task id must be unique within the lesson');
      taskIds.add(task.id);
      references(task.itemIds, `${at}.itemIds`);
      const expected = answers(task);
      expected.forEach((text, i) => target(text, `${at}.${task.answers ? `answers[${i}]` : 'answer'}`));
      for (const field of ['audio', 'text']) if (task[field]) target(task[field], `${at}.${field}`, undefined, task.kind === 'fill' && field === 'text');
      if (task.kind === 'fill') {
        if ((task.text.match(/_{2,}/gu) || []).length !== 1) issue(`${at}.text`, 'fill text must contain exactly one blank such as ___');
        expected.forEach((answer, i) => target(task.text.replace(/_{2,}/u, answer), `${at}.${task.answers ? `answers[${i}]` : 'answer'}`, undefined, true));
      }
      if (task.options) {
        const options = task.options.map(text => normalizeTarget(text, lang));
        if (new Set(options).size !== options.length) issue(`${at}.options`, 'options must remain distinct after case, punctuation and contraction normalization');
        task.options.forEach((text, i) => target(text, `${at}.options[${i}]`));
        const correct = new Set(expected.map(text => normalizeTarget(text, lang)));
        for (const answer of correct) if (!options.includes(answer)) issue(`${at}.options`, `correct answer ${JSON.stringify(answer)} is absent`);
        { const wrong = options.filter(option => !correct.has(option)).length; if (wrong < 1) issue(`${at}.options`, 'needs at least one wrong option'); else if (wrong < 2) warn(`${at}.options`, 'only one wrong option; at least two distinct distractors make guessing harder'); }
      }
      if (task.tiles) {
        task.tiles.forEach((text, i) => target(text, `${at}.tiles[${i}]`));
        for (const answer of expected) if (!canBuildTarget(answer, task.tiles, lang)) issue(`${at}.tiles`, `cannot build accepted answer ${JSON.stringify(answer)} from the whole tiles`);
      }
      if (task.pairs) {
        const left = new Set(), right = new Set();
        task.pairs.forEach((pair, i) => {
          target(pair.left, `${at}.pairs[${i}].left`); target(pair.right, `${at}.pairs[${i}].right`);
          const l = normalizeTarget(pair.left, lang), r = normalizeTarget(pair.right, lang);
          if (left.has(l) || right.has(r)) issue(`${at}.pairs[${i}]`, 'matching sides must be distinct to avoid ambiguous matches');
          left.add(l); right.add(r);
        });
      }
      if (task.kind === 'speak' && !expected.some(answer => normalizeTarget(answer, lang) === normalizeTarget(task.text, lang))) issue(`${at}.answer`, 'speaking target must be included among accepted answers');
    };
    lesson.items.forEach((item, i) => target(item.example, `.items[${i}].example`, undefined, true));
    lesson.grammar?.examples.forEach((example, i) => target(example, `.grammar.examples[${i}]`, undefined, true));
    lesson.practice.forEach((task, i) => checkTask(task, `.practice[${i}]`));
    const practised = new Set(lesson.practice.flatMap(task => task.itemIds));
    for (const [i, item] of lesson.items.entries()) if (!practised.has(item.id)) issue(`.items[${i}].id`, 'new item must be referenced by at least one practice task');
    if (lesson.lesson >= 3) {
      const count = lesson.practice.filter(task => task.itemIds.some(id => earlier.has(id) && lesson.recycle.includes(id))).length;
      const required = Math.ceil(lesson.practice.length * 0.3);
      if (count < required) warn('.practice', `${count}/${lesson.practice.length} tasks reference recycled items; need at least ${required} (30%) from lesson 3 onward`);
    }
    lesson.story.lines.forEach((line, i) => {
      // Scenes may also use this lesson's glossed exposure words.
      target(line.text, `.story.lines[${i}].text`, exposed, true);
      if (!whitelist.names.includes(line.speaker) && !tokens(line.speaker, lang).every(t => known.has(t))) issue(`.story.lines[${i}].speaker`, `speaker ${line.speaker} is not in the ${lang} proper-name whitelist`);
    });
    if (lesson.story.lines.reduce((sum, line) => sum + tokens(line.text, lang).length, 0) > limit.story) warn('.story.lines', `story exceeds ${limit.story} target tokens for ${lesson.section}`);
    lesson.story.questions.forEach((task, i) => checkTask(task, `.story.questions[${i}]`));
    lesson.mission.turns.forEach((turn, i) => {
      const at = `.mission.turns[${i}]`;
      target(turn.smarty, `${at}.smarty`, undefined, true); target(turn.example, `${at}.example`);
      references(turn.itemIds, `${at}.itemIds`);
      const patterns = [];
      for (const [n, pattern] of turn.accept.entries()) {
        // Replies are short (the app caps them at 200 characters), so repetition is safe.
        // Lookarounds and backreferences are refused; patterns must be anchored.
        if (!pattern.startsWith('^') || !pattern.endsWith('$') || /\\[1-9]|\(\?[=!<]/u.test(pattern)) {
          issue(`${at}.accept[${n}]`, 'use anchored patterns (^…$) without lookarounds or backreferences'); continue;
        }
        try { patterns.push(new RegExp(pattern, 'iu')); } catch (error) { issue(`${at}.accept[${n}]`, `invalid regular expression: ${error.message}`); }
      }
      if (patterns.length && !replyVariants(turn.example, lang).some(text => patterns.some(pattern => pattern.test(text)))) issue(`${at}.example`, 'does not match any accept pattern after normalization');
    });
    addEarlier(lesson); prior = lesson;
  }
  // The unit's Episode may use every word taught up to the end of the unit, plus its exposure words.
  if (document.episode && Array.isArray(document.lessons)) {
    const known = new Set(allow);
    for (const item of earlier.values()) for (const text of [item.text, ...(item.forms || [])]) tokens(text, lang).forEach(t => known.add(t));
    for (const l of document.lessons) for (const e of l.exposure || []) tokens(e.text, lang).forEach(t => known.add(t));
    document.episode.panels.forEach((panel, i) => {
      const unknown = [...new Set(tokens(panel.text, lang))].filter(t => !/^\d+$/u.test(t) && tokenStatus(t, known, lang) === 'no');
      if (unknown.length) issues.push({ lessonId: '<episode>', path: `$.episode.panels[${i}].text`, message: `not taught yet (the app will gloss them): ${unknown.join(', ')}`, warn: true });
      if (panel.speaker && !whitelist.names.includes(panel.speaker) && !tokens(panel.speaker, lang).every(t => known.has(t))) issues.push({ lessonId: '<episode>', path: `$.episode.panels[${i}].speaker`, message: `speaker ${panel.speaker} is not in the ${lang} proper-name whitelist` });
    });
  }
  return issues;
}

export function formatIssue(issue) { return `${issue.warn ? 'warning: ' : ''}${issue.lessonId} ${issue.path}: ${issue.message}`; }
/**
 * A scope-and-sequence plan (content/<lang>/<section>/plan.json) stands in for
 * units that are not written yet: its items count as taught in earlier units,
 * so several units can be written at the same time.
 */
export function planLessons(plan, beforeUnit, section = plan.section) {
  // Everything in an earlier level; earlier units of the same level.
  const keep = u => sectionRank(plan.section) < sectionRank(section) || (plan.section === section && u.unit < beforeUnit);
  return (plan.units || []).filter(keep).flatMap(u => u.lessons.map(l => ({
    id: `${plan.lang}.${plan.section}.u${String(u.unit).padStart(2, '0')}.l${String(l.lesson).padStart(2, '0')}.plan`,
    section: plan.section, unit: u.unit, lesson: l.lesson, lang: plan.lang,
    items: l.items.map(({ id, text, kind, forms }) => ({ id, text, kind, ...(forms ? { forms } : {}) })),
  })));
}

export function runCli(args) {
  // --plan may repeat: earlier levels' plans make their words known too.
  const plans = [];
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') plans.push(JSON.parse(fs.readFileSync(args[++i], 'utf8').replace(/^\uFEFF/u, '')));
    else files.push(args[i]);
  }
  const plan = plans[0] ?? null;
  if (!files.length) { console.error('Usage: node scripts/content/validate-lessons.mjs [--plan plan.json ...] <unit.json> [earlier-to-later unit.json ...]'); return 1; }
  const previousLessons = [];
  let failed = false;
  for (const file of files) {
    let document;
    try { document = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/u, '')); }
    catch (error) { console.error(`<unit> $: cannot read JSON ${file}: ${error.message}`); failed = true; continue; }
    // With a plan, earlier units that aren't in this run come from the plan.
    const written = new Set(previousLessons.map(l => `${l.section}:${l.unit}`));
    const fromPlan = plans.flatMap(p => planLessons(p, document.unit ?? 0, document.section)).filter(l => !written.has(`${l.section}:${l.unit}`));
    const issues = validateLessons(document, { previousLessons: [...previousLessons, ...fromPlan] });
    // Every planned picture must have an image; ids must be reused, not duplicated with different meanings.
    const ownPlan = plans.find(p => p.section === document.section && p.lang === document.lang);
    if (ownPlan && !issues.some(issue => !issue.warn)) {
      const planned = new Map(ownPlan.units.flatMap(u => u.lessons.flatMap(l => l.items)).map(i => [i.id, i]));
      const planUnit = ownPlan.units.find(u => u.unit === document.unit);
      if (!planUnit) issues.push({ lessonId: '<unit>', path: '$.unit', message: `unit ${document.unit} is not in the plan` });
      else if (planUnit.lessons.length !== (document.lessons || []).length) issues.push({ lessonId: '<unit>', path: '$.lessons', message: `plan has ${planUnit.lessons.length} lessons for this unit, file has ${(document.lessons || []).length}` });
      for (const lesson of document.lessons || [document]) {
        const pl = planUnit?.lessons.find(l => l.lesson === lesson.lesson);
        if (pl) {
          if ((pl.type || 'lesson') !== (lesson.type || 'lesson')) issues.push({ lessonId: lesson.id, path: '$.type', message: `plan says type "${pl.type}"` });
          const want = pl.items.map(i => `${i.id}=${i.text}`).join('|'), got = lesson.items.map(i => `${i.id}=${i.text}`).join('|');
          if (want !== got) issues.push({ lessonId: lesson.id, path: '$.items', message: `items must be exactly the plan's (ids and text, in order): ${pl.items.map(i => i.text).join(', ') || 'none'}` });
        }
        for (const item of lesson.items) if (planned.get(item.id)?.image && !item.image) issues.push({ lessonId: lesson.id, path: `items.${item.id}`, message: 'plan marks this item for a picture: add image { id, describe }' });
        if (!lesson.story?.image) issues.push({ lessonId: lesson.id, path: '$.story.image', message: 'every scene needs a picture: add story.image { id, describe }' });
      }
    }
    issues.filter(issue => issue.warn).forEach(issue => console.warn(formatIssue(issue)));
    if (issues.some(issue => !issue.warn)) { issues.filter(issue => !issue.warn).forEach(issue => console.error(formatIssue(issue))); failed = true; }
    else {
      const lessons = document.lessons || [document];
      console.log(`PASS ${file}: ${lessons.length} lesson(s), four-bite content and vocabulary coverage validated.`);
      previousLessons.push(...lessons.map(lesson => ({ ...lesson, lang: document.lang || lesson.lang || 'en' })));
    }
  }
  return failed ? 1 : 0;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) process.exitCode = runCli(process.argv.slice(2));

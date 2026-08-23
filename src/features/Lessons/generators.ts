/**
 * Deterministic, no-AI generators for lesson exercises from a passage + vocabulary.
 */

import type { VocabularyItem } from '../../lib/reading-logic';
import { normalizeForMatch } from '../../lib/pronunciationProfile';
import type { ContentLang } from '../../lib/contentLang';
import { passageTextForExercises } from '../../lib/dialogueText';

export function splitSentences(text: string, format?: string): string[] {
  const body = passageTextForExercises(text, format);
  return body
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?؟。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find vocabulary words that appear in a sentence (case-insensitive, word-boundary-ish). */
export function vocabInSentence(sentence: string, vocabulary: VocabularyItem[], lang: ContentLang): VocabularyItem[] {
  const found: VocabularyItem[] = [];
  for (const v of vocabulary) {
    const word = v.word.trim();
    if (!word) continue;
    // Multi-word phrases: simple includes check on normalized forms
    if (word.includes(' ')) {
      if (normalizeForMatch(sentence, lang).includes(normalizeForMatch(word, lang))) {
        found.push(v);
      }
      continue;
    }
    try {
      const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(word)}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
      if (re.test(sentence)) found.push(v);
    } catch {
      if (sentence.toLowerCase().includes(word.toLowerCase())) found.push(v);
    }
  }
  return found;
}

export interface ClozeItem {
  sentence: string;
  blanked: string;
  answer: string;
  word: string;
}

/** Blank one vocabulary occurrence per sentence (up to maxItems). */
export function generateClozeItems(
  text: string,
  vocabulary: VocabularyItem[],
  lang: ContentLang,
  maxItems = 14,
  format?: string,
): ClozeItem[] {
  const sentences = splitSentences(text, format);
  const items: ClozeItem[] = [];
  const usedAnswers = new Set<string>();

  for (const sentence of sentences) {
    if (items.length >= maxItems) break;
    const hits = vocabInSentence(sentence, vocabulary, lang);
    for (const hit of hits) {
      if (items.length >= maxItems) break;
      const key = hit.word.toLowerCase();
      if (usedAnswers.has(key)) continue;
      const answer = hit.word;
      let blanked: string;
      try {
        const re = new RegExp(escapeRegExp(answer), 'i');
        blanked = sentence.replace(re, '______');
      } catch {
        blanked = sentence;
      }
      if (!blanked.includes('______')) continue;
      usedAnswers.add(key);
      items.push({ sentence, blanked, answer, word: hit.word });
    }
  }

  // Fallback: blank content words until we reach maxItems
  if (items.length < maxItems) {
    for (const sentence of sentences) {
      if (items.length >= maxItems) break;
      const tokens = sentence.split(/\s+/).filter((w) => w.replace(/[^\p{L}\p{N}'’-]/gu, '').length > 3);
      for (let ti = 0; ti < tokens.length && items.length < maxItems; ti++) {
        const pick = tokens[ti];
        if (!pick) continue;
        const answer = pick.replace(/[^\p{L}\p{N}'’-]/gu, '');
        if (!answer || usedAnswers.has(answer.toLowerCase())) continue;
        const blanked = sentence.replace(pick, '______');
        if (!blanked.includes('______')) continue;
        usedAnswers.add(answer.toLowerCase());
        items.push({ sentence, blanked, answer, word: answer });
      }
    }
  }

  return items;
}

export interface ComprehensionQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Optional word tied to the question for SRS. */
  focusWord?: string;
}

function shuffleInPlace<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic MCQs from passage sentences + vocabulary (no AI). */
export function generateComprehensionQuestions(
  text: string,
  vocabulary: VocabularyItem[],
  lang: ContentLang,
  passageId: string,
  maxQuestions = 8,
  format?: string,
): ComprehensionQuestion[] {
  const sentences = splitSentences(text, format).filter((s) => s.split(/\s+/).length >= 4);
  const questions: ComprehensionQuestion[] = [];
  const seedBase = passageId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  // Type A: "Which word completes the sentence?" (cloze MCQ)
  const cloze = generateClozeItems(text, vocabulary, lang, maxQuestions + 2, format);
  for (let i = 0; i < cloze.length && questions.length < maxQuestions; i++) {
    const item = cloze[i];
    const distractors = vocabulary
      .map((v) => v.word)
      .filter((w) => w.toLowerCase() !== item.answer.toLowerCase())
      .slice(0, 6);
    const pool = shuffleInPlace(
      [item.answer, ...distractors].slice(0, 4),
      seedBase + i * 17,
    );
    // Ensure correct answer is present
    if (!pool.some((p) => p.toLowerCase() === item.answer.toLowerCase())) {
      pool[0] = item.answer;
    }
    const options = shuffleInPlace(pool, seedBase + i * 31 + 3).slice(0, 4);
    while (options.length < 4) options.push(options[options.length - 1] || item.answer);
    const correctIndex = options.findIndex(
      (o) => o.toLowerCase() === item.answer.toLowerCase(),
    );
    questions.push({
      id: `cq-${questions.length}`,
      prompt: `Choose the word that fits: “${item.blanked}”`,
      options,
      correctIndex: correctIndex < 0 ? 0 : correctIndex,
      focusWord: item.word,
    });
  }

  // Type B: "According to the passage, which sentence is true?" (multiple)
  for (let bi = 0; bi < sentences.length && questions.length < maxQuestions; bi++) {
    if (sentences.length < 2) break;
    const trueSentence = sentences[(seedBase + bi * 3) % sentences.length];
    const falseCandidates = sentences.filter((s) => s !== trueSentence);
    if (!falseCandidates.length) continue;
    const falseOne = falseCandidates[(seedBase + bi * 7) % falseCandidates.length];
    let falseOption = falseOne;
    const hits = vocabInSentence(falseOne, vocabulary, lang);
    if (hits.length && vocabulary.length > 1) {
      const other = vocabulary.find((v) => v.word.toLowerCase() !== hits[0].word.toLowerCase());
      if (other) {
        try {
          falseOption = falseOne.replace(new RegExp(escapeRegExp(hits[0].word), 'i'), other.word);
        } catch {
          /* keep */
        }
      }
    }
    const options = shuffleInPlace([trueSentence, falseOption], seedBase + 99 + bi);
    if (options[0] === options[1] && sentences.length > 2) {
      options[1] = sentences.find((s) => s !== trueSentence) || options[1];
    }
    if (options[0] === options[1]) continue;
    questions.push({
      id: `cq-${questions.length}`,
      prompt: 'According to the passage, which sentence is correct?',
      options: options.slice(0, 2),
      correctIndex: options.findIndex((o) => o === trueSentence),
    });
  }

  // Type C: definition match
  for (let i = 0; i < vocabulary.length && questions.length < maxQuestions; i++) {
    const v = vocabulary[(seedBase + i) % vocabulary.length];
    if (!v.definition) continue;
    if (questions.some((q) => q.focusWord?.toLowerCase() === v.word.toLowerCase())) continue;
    const distractorDefs = vocabulary
      .filter((x) => x.word.toLowerCase() !== v.word.toLowerCase() && x.definition)
      .map((x) => x.definition)
      .slice(0, 3);
    if (distractorDefs.length < 1) continue;
    const options = shuffleInPlace([v.definition, ...distractorDefs].slice(0, 4), seedBase + i * 13);
    const correctIndex = options.findIndex((o) => o === v.definition);
    questions.push({
      id: `cq-${questions.length}`,
      prompt: `What does “${v.word}” mean in this lesson?`,
      options,
      correctIndex: correctIndex < 0 ? 0 : correctIndex,
      focusWord: v.word,
    });
  }

  return questions.slice(0, maxQuestions);
}

import type { ContentLang } from './contentLang';
import { tokenizeForLang } from './pronunciationProfile';

/**
 * Speaker labels like "Anna:", "Ms Green:", "Info desk:".
 * Rejects long sentence fragments that merely contain a colon.
 */
const SPEAKER_LINE_RE = /^([A-Za-z][A-Za-z0-9'’.\-]*(?:\s+[A-Za-z][A-Za-z0-9'’.\-]*){0,2})\s*:\s*(.+)$/u;

const SPEAKER_BAN = new Set([
  'a', 'an', 'the', 'their', 'this', 'that', 'these', 'those', 'when', 'where',
  'what', 'why', 'how', 'if', 'for', 'and', 'but', 'or', 'so', 'because',
  'human', 'build', 'street', 'transparent', 'responsible', 'traditional',
  'archives', 'species', 'smarter', 'metaphors', 'prognosis', 'wages',
]);

export interface DialogueTurn {
  speaker: string;
  line: string;
}

export interface ParsedDialogue {
  isDialogue: boolean;
  turns: DialogueTurn[];
  /** Passage body only — no speaker labels. Used for TTS + recording scoring. */
  speakableText: string;
}

export function isPlausibleSpeaker(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 28) return false;
  if (/[,;]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length === 0 || words.length > 3) return false;
  if (!/[A-Z]/.test(trimmed)) return false;
  if (words.some((w) => SPEAKER_BAN.has(w.toLowerCase()))) return false;
  // Mostly title-like tokens (allow short lowercase like "desk" in "Info desk")
  const titleLike = words.filter((w) => /^[A-Z]/.test(w)).length;
  if (titleLike === 0) return false;
  if (words.length >= 2 && titleLike === 1 && words[0].length <= 2) return false;
  return true;
}

export function looksLikeDialogue(text: string, format?: string): boolean {
  const parsed = parseDialogue(text);
  if (parsed.isDialogue) return true;
  // format hint alone is not enough — some essays were mis-tagged
  if (format === 'dialogue') return parsed.isDialogue;
  return false;
}

export function parseDialogue(text: string): ParsedDialogue {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const turns: DialogueTurn[] = [];
  for (const raw of lines) {
    const m = raw.match(SPEAKER_LINE_RE);
    if (m && isPlausibleSpeaker(m[1])) {
      turns.push({ speaker: m[1], line: (m[2] || '').trim() });
      continue;
    }
    if (turns.length > 0 && turns[turns.length - 1].speaker && !m) {
      // Continuation / closing prose under the dialogue block
      turns.push({ speaker: '', line: raw });
      continue;
    }
    if (turns.length > 0 && !turns[turns.length - 1].speaker) {
      const prev = turns[turns.length - 1];
      prev.line = prev.line ? `${prev.line} ${raw}` : raw;
      continue;
    }
    turns.push({ speaker: '', line: raw });
  }

  const labeled = turns.filter((t) => t.speaker).length;
  const speakableText = turns
    .map((t) => t.line)
    .filter(Boolean)
    .join(' ');

  return {
    isDialogue: labeled >= 2,
    turns,
    speakableText: speakableText || text.trim(),
  };
}

/** Text students hear and are scored on (speaker names removed for dialogues). */
export function getSpeakablePassageText(text: string, format?: string): string {
  if (!text?.trim()) return '';
  if (!looksLikeDialogue(text, format)) return text;
  return parseDialogue(text).speakableText;
}

/** Tokenize only the speakable body of a passage. */
export function tokenizePassageForSpeech(
  text: string,
  lang: ContentLang,
  format?: string,
): string[] {
  return tokenizeForLang(getSpeakablePassageText(text, format), lang);
}

/** For exercises that split sentences — drop dialogue labels first. */
export function passageTextForExercises(text: string, format?: string): string {
  return getSpeakablePassageText(text, format);
}

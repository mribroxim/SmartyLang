/**
 * Dialogue speaker gender + Azure Dragon HD Omni pairing (English-first).
 * Used so Listen alternates distinct voices and matches name gender.
 */

export type SpeakerGender = 'female' | 'male';

/** Primary + alternate voices so two same-gender speakers still sound different. */
export const EN_DIALOGUE_VOICES: Record<SpeakerGender, string[]> = {
  female: [
    'en-US-Ava:DragonHDOmniLatestNeural',
    'en-US-Dana:DragonHDOmniLatestNeural',
  ],
  male: [
    'en-US-Andrew:DragonHDOmniLatestNeural',
    'en-US-Caleb:DragonHDOmniLatestNeural',
  ],
};

const FEMALE_NAMES = new Set([
  'aisha', 'alexa', 'amy', 'ana', 'anna', 'aria', 'ava', 'dana', 'emma', 'eva',
  'gwen', 'isabella', 'jane', 'jenny', 'julia', 'kate', 'lara', 'leah', 'leila',
  'lia', 'lina', 'lisa', 'lucy', 'luna', 'maya', 'mia', 'mum', 'mom', 'mother',
  'nia', 'nina', 'nora', 'olivia', 'priya', 'rina', 'rita', 'rose', 'sara',
  'sarah', 'sofia', 'sophie', 'tara', 'zoe', 'zara',
]);

const MALE_NAMES = new Set([
  'adam', 'alex', 'andrew', 'ben', 'brian', 'chris', 'dan', 'daniel', 'david',
  'dad', 'father', 'jack', 'james', 'jamal', 'joe', 'john', 'jon', 'jonah',
  'kai', 'leo', 'liam', 'lucas', 'mark', 'max', 'mike', 'noah', 'omar',
  'paul', 'peter', 'ravi', 'sam', 'tom', 'tommy', 'will',
]);

const FEMALE_ROLES = new Set([
  'mum', 'mom', 'mother', 'nurse', 'sister', 'aunt', 'grandma', 'grandmother',
  'girl', 'woman', 'lady', 'waitress', 'hostess',
]);

const MALE_ROLES = new Set([
  'dad', 'father', 'brother', 'uncle', 'grandpa', 'grandfather', 'boy', 'man',
  'guy', 'waiter', 'policeman', 'fireman',
]);

function normalizeSpeakerToken(speaker: string): string {
  return speaker
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .replace(/\s+/g, ' ');
}

/** Infer gender from a dialogue label like "Anna", "Ms Green", "Dad". */
export function inferSpeakerGender(speaker: string): SpeakerGender | 'unknown' {
  const full = normalizeSpeakerToken(speaker);
  if (!full) return 'unknown';

  if (/^(ms|mrs|miss)\b/.test(full)) return 'female';
  if (/^mr\b/.test(full)) return 'male';

  const words = full.split(' ');
  for (const w of words) {
    if (FEMALE_NAMES.has(w) || FEMALE_ROLES.has(w)) return 'female';
    if (MALE_NAMES.has(w) || MALE_ROLES.has(w)) return 'male';
  }

  // Common feminine name endings (weak heuristic)
  const first = words[0];
  if (/^(.*a|elle|ette|ine|lyn)$/.test(first) && first.length >= 4) return 'female';

  return 'unknown';
}

/**
 * Map each unique speaker to an Azure voice name.
 * Same-gender pairs get alternate voices from the gender pool.
 * Unknown genders alternate female/male so turns still contrast.
 */
export function assignDialogueVoices(
  speakers: string[],
  langBase = 'en',
): Map<string, string> {
  const map = new Map<string, string>();
  const unique = [...new Set(speakers.map((s) => s.trim()).filter(Boolean))];
  if (!unique.length) return map;

  // Non-English: fall back to default cloud voice (no override)
  if (langBase !== 'en') return map;

  let femaleIdx = 0;
  let maleIdx = 0;
  let nextUnknown: SpeakerGender = 'female';

  for (const speaker of unique) {
    let gender = inferSpeakerGender(speaker);
    if (gender === 'unknown') {
      gender = nextUnknown;
      nextUnknown = nextUnknown === 'female' ? 'male' : 'female';
    }
    const pool = EN_DIALOGUE_VOICES[gender];
    const idx = gender === 'female' ? femaleIdx++ : maleIdx++;
    map.set(speaker, pool[idx % pool.length]);
  }
  return map;
}

/** Allowlist used by the TTS API to reject arbitrary voice injection. */
export const ALLOWED_AZURE_VOICES = new Set([
  ...EN_DIALOGUE_VOICES.female,
  ...EN_DIALOGUE_VOICES.male,
]);

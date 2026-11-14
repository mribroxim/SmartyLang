/**
 * Dialogue speaker gender + Azure voice pairing for every content language.
 * Used so Listen alternates distinct voices and matches name gender.
 */

export type SpeakerGender = 'female' | 'male';

/** English primary + alternate voices so same-gender speakers still differ. */
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

/** Native male/female pairs used for dialogue playback in every content language. */
export const DIALOGUE_VOICES: Record<string, Record<SpeakerGender, string[]>> = {
  en: EN_DIALOGUE_VOICES,
  ru: { female: ['ru-RU-SvetlanaNeural'], male: ['ru-RU-DmitryNeural'] },
  tl: { female: ['fil-PH-BlessicaNeural'], male: ['fil-PH-AngeloNeural'] },
  es: { female: ['es-ES-ElviraNeural'], male: ['es-ES-AlvaroNeural'] },
  uz: { female: ['uz-UZ-MadinaNeural'], male: ['uz-UZ-SardorNeural'] },
  de: { female: ['de-DE-KatjaNeural'], male: ['de-DE-ConradNeural'] },
  fr: { female: ['fr-FR-DeniseNeural'], male: ['fr-FR-HenriNeural'] },
  it: { female: ['it-IT-ElsaNeural'], male: ['it-IT-DiegoNeural'] },
  pt: { female: ['pt-BR-FranciscaNeural'], male: ['pt-BR-AntonioNeural'] },
  ja: { female: ['ja-JP-NanamiNeural'], male: ['ja-JP-KeitaNeural'] },
  ko: { female: ['ko-KR-SunHiNeural'], male: ['ko-KR-InJoonNeural'] },
  zh: { female: ['zh-CN-XiaoxiaoNeural'], male: ['zh-CN-YunxiNeural'] },
  ar: { female: ['ar-SA-ZariyahNeural'], male: ['ar-SA-HamedNeural'] },
  tr: { female: ['tr-TR-EmelNeural'], male: ['tr-TR-AhmetNeural'] },
  nl: { female: ['nl-NL-ColetteNeural'], male: ['nl-NL-MaartenNeural'] },
  hi: { female: ['hi-IN-SwaraNeural'], male: ['hi-IN-MadhurNeural'] },
  pl: { female: ['pl-PL-ZofiaNeural'], male: ['pl-PL-MarekNeural'] },
  sv: { female: ['sv-SE-SofieNeural'], male: ['sv-SE-MattiasNeural'] },
  id: { female: ['id-ID-GadisNeural'], male: ['id-ID-ArdiNeural'] },
  ms: { female: ['ms-MY-YasminNeural'], male: ['ms-MY-OsmanNeural'] },
  vi: { female: ['vi-VN-HoaiMyNeural'], male: ['vi-VN-NamMinhNeural'] },
  th: { female: ['th-TH-PremwadeeNeural'], male: ['th-TH-NiwatNeural'] },
  uk: { female: ['uk-UA-PolinaNeural'], male: ['uk-UA-OstapNeural'] },
  el: { female: ['el-GR-AthinaNeural'], male: ['el-GR-NestorasNeural'] },
  cs: { female: ['cs-CZ-VlastaNeural'], male: ['cs-CZ-AntoninNeural'] },
  ro: { female: ['ro-RO-AlinaNeural'], male: ['ro-RO-EmilNeural'] },
  fa: { female: ['fa-IR-DilaraNeural'], male: ['fa-IR-FaridNeural'] },
  ur: { female: ['ur-PK-UzmaNeural'], male: ['ur-PK-AsadNeural'] },
  sw: { female: ['sw-KE-ZuriNeural'], male: ['sw-KE-RafikiNeural'] },
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
  'paul', 'peter', 'ravi', 'sam', 'tom', 'tommy', 'will', 'jonas',
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

  const pools = DIALOGUE_VOICES[langBase] ?? DIALOGUE_VOICES.en;

  let femaleIdx = 0;
  let maleIdx = 0;
  let nextUnknown: SpeakerGender = 'female';

  for (const speaker of unique) {
    let gender = inferSpeakerGender(speaker);
    if (gender === 'unknown') {
      gender = nextUnknown;
      nextUnknown = nextUnknown === 'female' ? 'male' : 'female';
    }
    const pool = pools[gender];
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

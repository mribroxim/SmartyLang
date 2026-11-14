/**
 * Azure TTS voice map for SmartyLang content languages.
 * Prefer Dragon HD Omni (en-US) → Dragon HD → MAI expressive → standard neural.
 * Omni preview voices (eastus / westeurope / swedencentral / southeastasia):
 *   Ava, Andrew, Dana, Caleb, Phoebe, Lewis (+ zh-CN Xiaoyue/Yunqi).
 */
const AZURE_VOICES = {
  en: { locale: "en-US", voice: "en-US-Ava:DragonHDOmniLatestNeural" },
  ru: { locale: "ru-RU", voice: "ru-RU-Masha:MAI-Voice-2-Flash" },
  tl: { locale: "fil-PH", voice: "fil-PH-Blessica:DragonHDLatestNeural" },
  fil: { locale: "fil-PH", voice: "fil-PH-Blessica:DragonHDLatestNeural" },
  es: { locale: "es-ES", voice: "es-ES-Ximena:DragonHDLatestNeural" },
  uz: { locale: "uz-UZ", voice: "uz-UZ-MadinaNeural" },
  de: { locale: "de-DE", voice: "de-DE-Seraphina:DragonHDLatestNeural" },
  fr: { locale: "fr-FR", voice: "fr-FR-Vivienne:DragonHDLatestNeural" },
  it: { locale: "it-IT", voice: "it-IT-Isabella:DragonHDLatestNeural" },
  pt: { locale: "pt-BR", voice: "pt-BR-Thalita:DragonHDLatestNeural" },
  ja: { locale: "ja-JP", voice: "ja-JP-Nanami:DragonHDLatestNeural" },
  ko: { locale: "ko-KR", voice: "ko-KR-SunHi:DragonHDLatestNeural" },
  zh: { locale: "zh-CN", voice: "zh-CN-Xiaochen:DragonHDLatestNeural" },
  cmn: { locale: "zh-CN", voice: "zh-CN-Xiaochen:DragonHDLatestNeural" },
  ar: { locale: "ar-SA", voice: "ar-SA-ZariyahNeural" },
  tr: { locale: "tr-TR", voice: "tr-TR-Elif:MAI-Voice-2-Flash" },
  nl: { locale: "nl-NL", voice: "nl-NL-Fleur:MAI-Voice-2-Flash" },
  hi: { locale: "hi-IN", voice: "hi-IN-Kavya:MAI-Voice-2-Flash" },
  pl: { locale: "pl-PL", voice: "pl-PL-ZofiaNeural" },
  sv: { locale: "sv-SE", voice: "sv-SE-SofieNeural" },
  id: { locale: "id-ID", voice: "id-ID-Gadis:DragonHDLatestNeural" },
  ms: { locale: "ms-MY", voice: "ms-MY-Yasmin:DragonHDLatestNeural" },
  vi: { locale: "vi-VN", voice: "vi-VN-Linh:MAI-Voice-2-Flash" },
  th: { locale: "th-TH", voice: "th-TH-PremwadeeNeural" },
  uk: { locale: "uk-UA", voice: "uk-UA-PolinaNeural" },
  el: { locale: "el-GR", voice: "el-GR-AthinaNeural" },
  cs: { locale: "cs-CZ", voice: "cs-CZ-VlastaNeural" },
  ro: { locale: "ro-RO", voice: "ro-RO-Elena:MAI-Voice-2-Flash" },
  ur: { locale: "ur-PK", voice: "ur-PK-UzmaNeural" },
  sw: { locale: "sw-KE", voice: "sw-KE-ZuriNeural" },
  fa: { locale: "fa-IR", voice: "fa-IR-DilaraNeural" },
};

/** Native male/female pairs for dialogue turns. */
const DIALOGUE_VOICES = {
  en: {
    female: ["en-US-Ava:DragonHDOmniLatestNeural", "en-US-Dana:DragonHDOmniLatestNeural"],
    male: ["en-US-Andrew:DragonHDOmniLatestNeural", "en-US-Caleb:DragonHDOmniLatestNeural"],
  },
  ru: { female: ["ru-RU-SvetlanaNeural"], male: ["ru-RU-DmitryNeural"] },
  tl: { female: ["fil-PH-BlessicaNeural"], male: ["fil-PH-AngeloNeural"] },
  es: { female: ["es-ES-ElviraNeural"], male: ["es-ES-AlvaroNeural"] },
  uz: { female: ["uz-UZ-MadinaNeural"], male: ["uz-UZ-SardorNeural"] },
  de: { female: ["de-DE-KatjaNeural"], male: ["de-DE-ConradNeural"] },
  fr: { female: ["fr-FR-DeniseNeural"], male: ["fr-FR-HenriNeural"] },
  it: { female: ["it-IT-ElsaNeural"], male: ["it-IT-DiegoNeural"] },
  pt: { female: ["pt-BR-FranciscaNeural"], male: ["pt-BR-AntonioNeural"] },
  ja: { female: ["ja-JP-NanamiNeural"], male: ["ja-JP-KeitaNeural"] },
  ko: { female: ["ko-KR-SunHiNeural"], male: ["ko-KR-InJoonNeural"] },
  zh: { female: ["zh-CN-XiaoxiaoNeural"], male: ["zh-CN-YunxiNeural"] },
  ar: { female: ["ar-SA-ZariyahNeural"], male: ["ar-SA-HamedNeural"] },
  tr: { female: ["tr-TR-EmelNeural"], male: ["tr-TR-AhmetNeural"] },
  nl: { female: ["nl-NL-ColetteNeural"], male: ["nl-NL-MaartenNeural"] },
  hi: { female: ["hi-IN-SwaraNeural"], male: ["hi-IN-MadhurNeural"] },
  pl: { female: ["pl-PL-ZofiaNeural"], male: ["pl-PL-MarekNeural"] },
  sv: { female: ["sv-SE-SofieNeural"], male: ["sv-SE-MattiasNeural"] },
  id: { female: ["id-ID-GadisNeural"], male: ["id-ID-ArdiNeural"] },
  ms: { female: ["ms-MY-YasminNeural"], male: ["ms-MY-OsmanNeural"] },
  vi: { female: ["vi-VN-HoaiMyNeural"], male: ["vi-VN-NamMinhNeural"] },
  th: { female: ["th-TH-PremwadeeNeural"], male: ["th-TH-NiwatNeural"] },
  uk: { female: ["uk-UA-PolinaNeural"], male: ["uk-UA-OstapNeural"] },
  el: { female: ["el-GR-AthinaNeural"], male: ["el-GR-NestorasNeural"] },
  cs: { female: ["cs-CZ-VlastaNeural"], male: ["cs-CZ-AntoninNeural"] },
  ro: { female: ["ro-RO-AlinaNeural"], male: ["ro-RO-EmilNeural"] },
  ur: { female: ["ur-PK-UzmaNeural"], male: ["ur-PK-AsadNeural"] },
  sw: { female: ["sw-KE-ZuriNeural"], male: ["sw-KE-RafikiNeural"] },
  fa: { female: ["fa-IR-DilaraNeural"], male: ["fa-IR-FaridNeural"] },
};

/** English dialogue alternates (gender-matched, Dragon HD Omni). */
const EN_DIALOGUE_VOICES = DIALOGUE_VOICES.en;

const ALLOWED_VOICE_OVERRIDES = new Set([
  ...Object.values(DIALOGUE_VOICES).flatMap((pair) => [
    ...pair.female,
    ...pair.male,
  ]),
]);

function resolveVoiceCfg(lang, voiceOverride) {
  const base = AZURE_VOICES[lang] || AZURE_VOICES.en;
  if (voiceOverride && ALLOWED_VOICE_OVERRIDES.has(String(voiceOverride))) {
    return { locale: base.locale, voice: String(voiceOverride) };
  }
  return base;
}

module.exports = {
  AZURE_VOICES,
  DIALOGUE_VOICES,
  EN_DIALOGUE_VOICES,
  ALLOWED_VOICE_OVERRIDES,
  resolveVoiceCfg,
};

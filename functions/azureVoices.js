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

/** English dialogue alternates (gender-matched, Dragon HD Omni). */
const EN_DIALOGUE_VOICES = {
  female: ["en-US-Ava:DragonHDOmniLatestNeural", "en-US-Dana:DragonHDOmniLatestNeural"],
  male: ["en-US-Andrew:DragonHDOmniLatestNeural", "en-US-Caleb:DragonHDOmniLatestNeural"],
};

const ALLOWED_VOICE_OVERRIDES = new Set([
  ...EN_DIALOGUE_VOICES.female,
  ...EN_DIALOGUE_VOICES.male,
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
  EN_DIALOGUE_VOICES,
  ALLOWED_VOICE_OVERRIDES,
  resolveVoiceCfg,
};

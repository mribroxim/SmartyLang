// Comprehensive language list for translation features.
// Codes are ISO 639-1 (2-letter) compatible with MyMemory + Google Translate APIs.
// MyMemory supports ~100 languages — keep the list broad.

export interface LanguageOption {
  name: string;
  code: string;
  native?: string; // Display in the language's native script
}

export const LANGUAGES: LanguageOption[] = [
  { name: 'English',         code: 'en', native: 'English' },
  { name: 'Russian',         code: 'ru', native: 'Русский' },
  { name: 'Filipino',        code: 'tl', native: 'Filipino' },
  { name: 'Uzbek',           code: 'uz', native: 'Oʻzbekcha' },
  { name: 'Spanish',         code: 'es', native: 'Español' },
  { name: 'Afrikaans',       code: 'af', native: 'Afrikaans' },
  { name: 'Albanian',        code: 'sq', native: 'Shqip' },
  { name: 'Amharic',         code: 'am', native: 'አማርኛ' },
  { name: 'Arabic',          code: 'ar', native: 'العربية' },
  { name: 'Armenian',        code: 'hy', native: 'Հայերեն' },
  { name: 'Azerbaijani',     code: 'az', native: 'Azərbaycan' },
  { name: 'Basque',          code: 'eu', native: 'Euskara' },
  { name: 'Belarusian',      code: 'be', native: 'Беларуская' },
  { name: 'Bengali',         code: 'bn', native: 'বাংলা' },
  { name: 'Bosnian',         code: 'bs', native: 'Bosanski' },
  { name: 'Bulgarian',       code: 'bg', native: 'Български' },
  { name: 'Catalan',         code: 'ca', native: 'Català' },
  { name: 'Cebuano',         code: 'ceb', native: 'Cebuano' },
  { name: 'Chinese (Simplified)',  code: 'zh-CN', native: '简体中文' },
  { name: 'Chinese (Traditional)', code: 'zh-TW', native: '繁體中文' },
  { name: 'Corsican',        code: 'co', native: 'Corsu' },
  { name: 'Croatian',        code: 'hr', native: 'Hrvatski' },
  { name: 'Czech',           code: 'cs', native: 'Čeština' },
  { name: 'Danish',          code: 'da', native: 'Dansk' },
  { name: 'Dutch',           code: 'nl', native: 'Nederlands' },
  { name: 'Esperanto',       code: 'eo', native: 'Esperanto' },
  { name: 'Estonian',        code: 'et', native: 'Eesti' },
  { name: 'Finnish',         code: 'fi', native: 'Suomi' },
  { name: 'French',          code: 'fr', native: 'Français' },
  { name: 'Frisian',         code: 'fy', native: 'Frysk' },
  { name: 'Galician',        code: 'gl', native: 'Galego' },
  { name: 'Georgian',        code: 'ka', native: 'ქართული' },
  { name: 'German',          code: 'de', native: 'Deutsch' },
  { name: 'Greek',           code: 'el', native: 'Ελληνικά' },
  { name: 'Gujarati',        code: 'gu', native: 'ગુજરાતી' },
  { name: 'Haitian Creole',  code: 'ht', native: 'Kreyòl Ayisyen' },
  { name: 'Hausa',           code: 'ha', native: 'Hausa' },
  { name: 'Hawaiian',        code: 'haw', native: 'ʻŌlelo Hawaiʻi' },
  { name: 'Hebrew',          code: 'he', native: 'עברית' },
  { name: 'Hindi',           code: 'hi', native: 'हिन्दी' },
  { name: 'Hmong',           code: 'hmn', native: 'Hmong' },
  { name: 'Hungarian',       code: 'hu', native: 'Magyar' },
  { name: 'Icelandic',       code: 'is', native: 'Íslenska' },
  { name: 'Igbo',            code: 'ig', native: 'Igbo' },
  { name: 'Indonesian',      code: 'id', native: 'Bahasa Indonesia' },
  { name: 'Irish',           code: 'ga', native: 'Gaeilge' },
  { name: 'Italian',         code: 'it', native: 'Italiano' },
  { name: 'Japanese',        code: 'ja', native: '日本語' },
  { name: 'Javanese',        code: 'jv', native: 'Basa Jawa' },
  { name: 'Kannada',         code: 'kn', native: 'ಕನ್ನಡ' },
  { name: 'Kazakh',          code: 'kk', native: 'Қазақ тілі' },
  { name: 'Khmer',           code: 'km', native: 'ខ្មែរ' },
  { name: 'Kinyarwanda',     code: 'rw', native: 'Kinyarwanda' },
  { name: 'Korean',          code: 'ko', native: '한국어' },
  { name: 'Kurdish',         code: 'ku', native: 'Kurdî' },
  { name: 'Kyrgyz',          code: 'ky', native: 'Кыргызча' },
  { name: 'Lao',             code: 'lo', native: 'ລາວ' },
  { name: 'Latin',           code: 'la', native: 'Latina' },
  { name: 'Latvian',         code: 'lv', native: 'Latviešu' },
  { name: 'Lithuanian',      code: 'lt', native: 'Lietuvių' },
  { name: 'Luxembourgish',   code: 'lb', native: 'Lëtzebuergesch' },
  { name: 'Macedonian',      code: 'mk', native: 'Македонски' },
  { name: 'Malagasy',        code: 'mg', native: 'Malagasy' },
  { name: 'Malay',           code: 'ms', native: 'Bahasa Melayu' },
  { name: 'Malayalam',       code: 'ml', native: 'മലയാളം' },
  { name: 'Maltese',         code: 'mt', native: 'Malti' },
  { name: 'Maori',           code: 'mi', native: 'Māori' },
  { name: 'Marathi',         code: 'mr', native: 'मराठी' },
  { name: 'Mongolian',       code: 'mn', native: 'Монгол' },
  { name: 'Myanmar (Burmese)', code: 'my', native: 'မြန်မာ' },
  { name: 'Nepali',          code: 'ne', native: 'नेपाली' },
  { name: 'Norwegian',       code: 'no', native: 'Norsk' },
  { name: 'Odia',            code: 'or', native: 'ଓଡ଼ିଆ' },
  { name: 'Pashto',          code: 'ps', native: 'پښتو' },
  { name: 'Persian',         code: 'fa', native: 'فارسی' },
  { name: 'Polish',          code: 'pl', native: 'Polski' },
  { name: 'Portuguese',      code: 'pt', native: 'Português' },
  { name: 'Punjabi',         code: 'pa', native: 'ਪੰਜਾਬੀ' },
  { name: 'Romanian',        code: 'ro', native: 'Română' },
  { name: 'Samoan',          code: 'sm', native: 'Gagana Sāmoa' },
  { name: 'Scots Gaelic',    code: 'gd', native: 'Gàidhlig' },
  { name: 'Serbian',         code: 'sr', native: 'Српски' },
  { name: 'Sesotho',         code: 'st', native: 'Sesotho' },
  { name: 'Shona',           code: 'sn', native: 'Shona' },
  { name: 'Sindhi',          code: 'sd', native: 'سنڌي' },
  { name: 'Sinhala',         code: 'si', native: 'සිංහල' },
  { name: 'Slovak',          code: 'sk', native: 'Slovenčina' },
  { name: 'Slovenian',       code: 'sl', native: 'Slovenščina' },
  { name: 'Somali',          code: 'so', native: 'Soomaali' },
  { name: 'Sundanese',       code: 'su', native: 'Basa Sunda' },
  { name: 'Swahili',         code: 'sw', native: 'Kiswahili' },
  { name: 'Swedish',         code: 'sv', native: 'Svenska' },
  { name: 'Tajik',           code: 'tg', native: 'Тоҷикӣ' },
  { name: 'Tamil',           code: 'ta', native: 'தமிழ்' },
  { name: 'Tatar',           code: 'tt', native: 'Татар' },
  { name: 'Telugu',          code: 'te', native: 'తెలుగు' },
  { name: 'Thai',            code: 'th', native: 'ไทย' },
  { name: 'Turkish',         code: 'tr', native: 'Türkçe' },
  { name: 'Turkmen',         code: 'tk', native: 'Türkmen' },
  { name: 'Ukrainian',       code: 'uk', native: 'Українська' },
  { name: 'Urdu',            code: 'ur', native: 'اردو' },
  { name: 'Uyghur',          code: 'ug', native: 'ئۇيغۇرچە' },
  { name: 'Vietnamese',      code: 'vi', native: 'Tiếng Việt' },
  { name: 'Welsh',           code: 'cy', native: 'Cymraeg' },
  { name: 'Xhosa',           code: 'xh', native: 'isiXhosa' },
  { name: 'Yiddish',         code: 'yi', native: 'ייִדיש' },
  { name: 'Yoruba',          code: 'yo', native: 'Yorùbá' },
  { name: 'Zulu',            code: 'zu', native: 'isiZulu' },
];

export function languageByName(name: string): LanguageOption | undefined {
  return LANGUAGES.find(l => l.name.toLowerCase() === name.toLowerCase());
}

export function languageByCode(code: string): LanguageOption | undefined {
  return LANGUAGES.find(l => l.code === code);
}

/**
 * Decode HTML entities that translation APIs (MyMemory, etc.) sometimes return.
 * e.g. "ko&#39;tarildi" → "ko'tarildi", "&amp;" → "&"
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

import crypto from 'node:crypto';

export const LANGS = ['ru', 'tl', 'es', 'uz', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'tr', 'nl', 'hi', 'pl', 'sv', 'id', 'ms', 'vi', 'th', 'uk', 'el', 'cs', 'ro', 'fa', 'ur', 'sw'];
export const placeholders = value => (String(value).match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) ?? []).sort();
export const sourceHash = source => crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex');
export const numberRanges = value => {
  const normalized = String(value).replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, '').replace(/[٠-٩۰-۹０-９]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '０１２３４５６７８９'.indexOf(digit)));
  return (normalized.match(/\d+\s*[–—-]\s*\d+/g) ?? []).map(range => range.replace(/\s*[–—-]\s*/g, '-')).sort();
};

// Whole sentences are never exempt merely because they contain a brand.
const COMMON = /^(?:Smarty(?:Lang)?(?: Max)?|Max|IELTS(?: Academic)?|CEFR|SRS|XP|OK|Google|Microsoft|YouTube|Telegram|API:?|PDF|WPM|KB|MB|Q\)?|N\/A|n\/a|\(n\/a\)|x|s|A[12]|B[12]|C[12]|[0-9.,%+×/:–—\s-]+|https?:\/\/\S+|[^\s@]+@[^\s@]+\.[^\s@]+)$/u;
export function canStayEnglish(value, lang, approved = {}) {
  const text = value.trim();
  return COMMON.test(text) || !/[A-Za-z]/.test(text.replace(/\{[^}]+\}|\b(?:SmartyLang(?: Max)?|Smarty|IELTS|XP|SRS|CEFR|Google|Microsoft|YouTube)\b/g, '')) || (approved[lang] ?? []).some(value => value.trim().toLowerCase() === text.toLowerCase());
}

export function translationIssues(source, translated, lang, approved = {}) {
  if (typeof translated !== 'string' || !translated.trim()) return ['missing'];
  const issues = [];
  if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(translated))) issues.push('placeholder');
  if (JSON.stringify(numberRanges(source)) !== JSON.stringify(numberRanges(translated))) issues.push('number-range');
  if (/<<<SEP>>>|\uFFFD|&#\d+;|&(?:quot|amp|lt|gt);|\n\s*</u.test(translated)) issues.push('artifact');
  if (/[{}]/.test(translated.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, ''))) issues.push('malformed-placeholder');
  if (translated.trim() === source.trim() && !canStayEnglish(source, lang, approved)) issues.push('english-copy');
  for (const brand of ['SmartyLang Max', 'Smarty Max', 'SmartyLang', 'Smarty', 'IELTS', 'XP', 'SRS', 'CEFR']) {
    const expression = new RegExp(`\\b${brand}\\b`, 'g');
    if ((source.match(expression) ?? []).length > (translated.match(expression) ?? []).length) issues.push(`brand:${brand}`);
  }
  if (source.length > 80 && translated.length < source.length * 0.12) issues.push('too-short');
  return issues;
}

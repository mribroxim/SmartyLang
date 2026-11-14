import { translateUi } from '../../lib/uiStrings';
import type { UiLang } from '../../lib/uiLang';

// Interface captions in the artwork. Alphabet blocks, language examples and
// cat sounds are intentionally kept as part of the illustration.
export const STICKER_CAPTIONS = {
  'Hi!': 'sticker.hi', 'purrfect!': 'sticker.perfect', 'clap clap': 'sticker.applause',
  'nailed it!': 'sticker.nailedIt', 'sooo close': 'sticker.close', 'oops!': 'sticker.oops',
  'almost!': 'sticker.almost', 'one more go': 'sticker.retry', 'phew!': 'sticker.phew',
  'THE END': 'sticker.theEnd', 'your turn!': 'sticker.yourTurn', 'gotcha': 'sticker.gotIt',
  'grow!': 'sticker.grow', 'eureka': 'sticker.eureka', 'ready!': 'sticker.ready',
  'last one!': 'sticker.lastOne', '30 DAYS': 'sticker.thirtyDays', 'saved!': 'sticker.saved',
  'I’m back': 'sticker.back', 'TODAY': 'sticker.today', 'GO!': 'sticker.go',
  'go!': 'sticker.go', 'BONUS': 'sticker.bonus', 'offline': 'sticker.offline',
  'NEW': 'sticker.new', 'WIP': 'sticker.inProgress', '7 days': 'sticker.sevenDays',
  '12 words': 'sticker.twelveWords', '13 words': 'sticker.thirteenWords',
  '+1 word!': 'sticker.oneWord', 'MILESTONE!': 'sticker.milestone',
} as const;

const xml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function localizeStickerSvg(svg: string, lang: UiLang): string {
  if (lang === 'en') return svg;
  return svg.replace(/<text\b([^>]*)>([^<>]+)<\/text>/g, (original, attrs: string, text: string) => {
    const key = STICKER_CAPTIONS[text as keyof typeof STICKER_CAPTIONS];
    if (!key) return original;
    const translated = translateUi(lang, key);
    const size = Number(attrs.match(/font-size="([\d.]+)"/)?.[1] || 18);
    const width = Math.max(24, text.length * size * 0.62);
    // Preserve the illustration's caption box when a translation is longer.
    const fitted = translated.length > text.length ? ` textLength="${width.toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : '';
    return `<text${attrs}${fitted}>${xml(translated)}</text>`;
  });
}

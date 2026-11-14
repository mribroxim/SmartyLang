/**
 * Shared SVG filters + clip paths for every Smarty sticker. Mounted once at the
 * app root (src/main.tsx). Copied from design/sticker-board with `se-` ids.
 * ink  = wobbly hand-inked edge + white sticker ring + soft shadow
 * fuzz = same, extra shaggy (grumpy, spooked, sneeze)
 * shade = flat grey silhouette (shadow-boxing shadow)
 */
const INK_TAIL = `
  <feMorphology in="ink" operator="erode" radius="1.4" result="core0"/>
  <feComponentTransfer in="core0" result="core"><feFuncA type="linear" slope="4" intercept="-2.4"/></feComponentTransfer>
  <feMorphology in="core" operator="dilate" radius="5.9" result="grow"/>
  <feGaussianBlur in="grow" stdDeviation="2.2" result="b"/>
  <feOffset in="b" dy="2.5" result="o"/>
  <feFlood flood-color="#000" flood-opacity=".16"/>
  <feComposite in2="o" operator="in" result="sh"/>
  <feFlood flood-color="#fff"/>
  <feComposite in2="grow" operator="in" result="ring"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="ring"/><feMergeNode in="ink"/></feMerge>`;

const DEFS = `
<filter id="se-ink" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="ink"/>${INK_TAIL}
</filter>
<filter id="se-fuzz" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="ink"/>${INK_TAIL}
</filter>
<filter id="se-shade" x="-20%" y="-20%" width="140%" height="140%">
  <feFlood flood-color="#8a8f99" flood-opacity=".38"/><feComposite in2="SourceAlpha" operator="in"/>
</filter>
<clipPath id="se-clipDive"><rect x="-20" y="-60" width="240" height="214"/></clipPath>
<clipPath id="se-clipGlobe"><circle cx="152" cy="100" r="30"/></clipPath>
<clipPath id="se-clipSign"><rect x="118" y="150" width="74" height="36"/></clipPath>`;

export function StickerDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: `<defs>${DEFS}</defs>` }}
    />
  );
}

/* ═════════ Kit 2 — extra motion, props and poses for stickers #56+ ═════════ */
const KF2 = `
@keyframes judge { 0%,12%,100% { transform: rotate(0) } 30%,82% { transform: rotate(-11deg) } }
@keyframes browUp { 0%,30%,100% { transform: translateY(0) } 40%,82% { transform: translateY(-7px) } }
@keyframes purr { 0%,100% { transform: translate(0,0) } 25% { transform: translate(.9px,-.6px) } 50% { transform: translate(-.7px,.5px) } 75% { transform: translate(.6px,.7px) } }
@keyframes shy { 0%,38%,100% { transform: translateY(0) } 52%,76% { transform: translateY(17px) } }
@keyframes rub { 0%,100% { transform: translateX(-3px) rotate(-6deg) } 50% { transform: translateX(3px) rotate(6deg) } }
@keyframes faint { 0%,18%,100% { transform: rotate(0) } 38%,80% { transform: rotate(var(--r,-20deg)) } }
@keyframes tiltLR { 0%,8%,100% { transform: rotate(0) } 18%,40% { transform: rotate(-13deg) } 55%,78% { transform: rotate(13deg) } }
@keyframes glance { 0%,25%,100% { transform: translateX(0) } 38%,85% { transform: translateX(var(--px,7px)) } }
@keyframes appear { 0% { opacity: 0; transform: scale(.4) } 14%,76% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.08) } }
@keyframes smoke { 0% { opacity: 0; transform: scale(.3) } 15% { opacity: 1 } 100% { opacity: 0; transform: scale(1.6) } }
@keyframes emerge { 0%,8% { transform: translateY(var(--py,46px)) scale(.5); opacity: 0 } 30%,88% { transform: translateY(0) scale(1); opacity: 1 } 100% { transform: translateY(0) scale(1); opacity: 0 } }
@keyframes stamp { 0%,8% { transform: translateY(-46px) scale(1.25); opacity: 0 } 22% { transform: translateY(0) scale(1); opacity: 1 } 27% { transform: scale(1.12,.88) } 33%,86% { transform: scale(1); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes slam { 0%,30%,100% { transform: translateY(-26px) } 46% { transform: translateY(0) scale(1,1) } 52% { transform: translateY(0) scale(1.06,.9) } 62% { transform: translateY(0) scale(1,1) } 80% { transform: translateY(-26px) } }
@keyframes imprint { 0%,47% { opacity: 0 } 48%,94% { opacity: 1 } 100% { opacity: 0 } }
@keyframes slideX { 0% { transform: translateX(var(--sx,-60px)); opacity: 0 } 15%,82% { opacity: 1 } 100% { transform: translateX(var(--ex,60px)); opacity: 0 } }
@keyframes fall { 0% { transform: translateY(var(--fy,-70px)); opacity: 0 } 10% { opacity: 1 } 42%,86% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes rise { 0% { transform: translateY(var(--py,18px)); opacity: 0 } 25%,80% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-8px); opacity: 0 } }
@keyframes grow { 0%,8% { transform: scale(0) } 45%,86% { transform: scale(1) } 100% { transform: scale(0) } }
@keyframes growY { 0%,8% { transform: scaleY(0) } 45%,86% { transform: scaleY(1) } 100% { transform: scaleY(0) } }
@keyframes growX { 0%,8% { transform: scaleX(0) } 45%,86% { transform: scaleX(1) } 100% { transform: scaleX(0) } }
@keyframes growBig { 0% { transform: scale(.35) } 85% { transform: scale(1.15) } 92% { transform: scale(1.15) } 100% { transform: scale(.35) } }
@keyframes fly { 0%,18% { transform: translateY(0) } 58% { transform: translateY(-200px) } 58.1% { transform: translateY(140px) } 100% { transform: translateY(0) } }
@keyframes glowp { 0%,100% { opacity: .25; transform: scale(.94) } 50% { opacity: 1; transform: scale(1.06) } }
@keyframes cross { 0% { transform: translateX(var(--sx,-120px)) } 100% { transform: translateX(var(--ex,120px)) } }
@keyframes chase { 0%,100% { transform: translate(0,0) rotate(0) } 25% { transform: translate(26px,-18px) rotate(14deg) } 50% { transform: translate(-6px,-30px) rotate(-8deg) } 75% { transform: translate(-26px,-8px) rotate(10deg) } }
@keyframes sneeze { 0%,52%,100% { transform: scale(1) translateY(0) } 60% { transform: scale(1.03,.93) translateY(2px) } 68% { transform: scale(1.07) translateY(-8px) } 80% { transform: scale(1) translateY(0) } }
@keyframes swapIn { 0%,58%,92%,100% { opacity: 0 } 63%,86% { opacity: 1 } }
@keyframes swapOut { 0%,58%,92%,100% { opacity: 1 } 63%,86% { opacity: 0 } }
@keyframes fadeA { 0%,42%,100% { opacity: 1 } 50%,92% { opacity: 0 } }
@keyframes fadeB { 0%,42%,100% { opacity: 0 } 50%,92% { opacity: 1 } }
@keyframes third { 0%,31% { opacity: 1 } 33.4%,100% { opacity: 0 } }
@keyframes quarter { 0%,23% { opacity: 1 } 25%,100% { opacity: 0 } }
@keyframes toss { 0%,100% { transform: translateY(0) } 50% { transform: translateY(var(--py,-40px)) } }
@keyframes push { 0%,100% { transform: translate(0,0) } 50% { transform: translate(var(--px,10px),var(--py,0px)) } }
@keyframes erase { 0%,100% { transform: translateX(-12px) rotate(-8deg) } 50% { transform: translateX(12px) rotate(8deg) } }
@keyframes fadeOut { 0%,15% { opacity: 1 } 55%,80% { opacity: 0 } 100% { opacity: 1 } }
@keyframes drop { 0% { transform: translate(0,0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(var(--dx,-8px),38px); opacity: 0 } }
@keyframes landOn { 0%,10% { transform: translateY(var(--py,-40px)) rotate(-12deg); opacity: 0 } 36%,88% { transform: translateY(0) rotate(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes explode { 0%,25%,100% { transform: translate(0,0) rotate(0) } 50%,80% { transform: translate(var(--dx),var(--dy)) rotate(var(--r,0deg)) } }
@keyframes arc { 0% { transform: translate(-70px,8px) rotate(-20deg); opacity: 0 } 12% { opacity: 1 } 50% { transform: translate(0,var(--py,-34px)) rotate(0) } 88% { opacity: 1 } 100% { transform: translate(70px,8px) rotate(20deg); opacity: 0 } }
@keyframes into { 0% { transform: translate(var(--dx),var(--dy)) scale(1); opacity: 0 } 20% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(0,0) scale(.35); opacity: 0 } }
@keyframes fw { 0% { transform: scale(.1); opacity: 0 } 10% { opacity: 1 } 70% { transform: scale(1); opacity: 1 } 100% { transform: scale(1.15); opacity: 0 } }
@keyframes rain { 0% { transform: translateY(-50px) rotate(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(var(--py,130px)) rotate(180deg); opacity: 0 } }
@keyframes climb { 0%,8% { transform: translate(0,0) } 40%,86% { transform: translate(var(--px,40px),var(--py,-40px)) } 100% { transform: translate(0,0) } }
@keyframes hinge { 0%,15%,100% { transform: rotate(0) } 35%,80% { transform: rotate(var(--r,-35deg)) } }
@keyframes shrinkX { 0%,12%,100% { transform: scaleX(1) } 40%,82% { transform: scaleX(var(--s,.18)) } }
@keyframes radar { 0%,100% { transform: rotate(-22deg) } 50% { transform: rotate(22deg) } }
@keyframes snapUp { 0%,30%,100% { transform: rotate(var(--r,-26deg)) } 36%,80% { transform: rotate(0) } }
@keyframes lean { 0%,100% { transform: rotate(0) translateX(0) } 40%,80% { transform: rotate(var(--r,8deg)) translateX(var(--px,4px)) } }
@keyframes hover { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-8px) rotate(3deg) } }
@keyframes zoomIn { 0%,10% { transform: scale(.2); opacity: 0 } 30% { transform: scale(1.12); opacity: 1 } 40%,86% { transform: scale(1); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes hammer { 0%,100% { transform: rotate(-34deg) } 40% { transform: rotate(16deg) } 50% { transform: rotate(10deg) } }
@keyframes trail { 0%,100% { opacity: 0 } 8%,60% { opacity: 1 } }
@keyframes sway { 0%,100% { transform: translateX(var(--sx,-6px)) } 50% { transform: translateX(var(--ex,6px)) } }
@keyframes portal { 0%,10% { transform: translateY(0) scale(1) rotate(0); opacity: 1 } 42% { transform: translateY(14px) scale(.08) rotate(300deg); opacity: 0 } 58% { transform: translateY(14px) scale(.08) rotate(-300deg); opacity: 0 } 90%,100% { transform: translateY(0) scale(1) rotate(0); opacity: 1 } }
@keyframes rubber { 0%,100% { transform: scale(1,1) } 30% { transform: scale(1.16,.86) } 45% { transform: scale(.92,1.08) } 60% { transform: scale(1.04,.96) } }
@keyframes jab { 0%,100% { transform: translate(0,0) } 20% { transform: translate(calc(var(--px,14px) * -.3),0) } 55% { transform: translate(var(--px,14px),var(--py,0px)) } }
@keyframes combo { 0% { transform: scaleX(1) } 18% { transform: scaleX(-1) } 33% { transform: scaleX(1) } 45% { transform: scaleX(-1) } 55% { transform: scaleX(1) } 63% { transform: scaleX(-1) } 70% { transform: scaleX(1) } 75% { transform: scaleX(-1) } 79% { transform: scaleX(1) } 82% { transform: scaleX(-1) } 85%,100% { transform: scaleX(1) } }
@keyframes dance { 0%,100% { transform: translate(-8px,0) rotate(-6deg) } 16% { transform: translate(0,-10px) rotate(0) } 33% { transform: translate(8px,0) rotate(6deg) } 50% { transform: translate(0,-10px) rotate(0) } 66% { transform: translate(-8px,0) rotate(-6deg) } 83% { transform: translate(0,-16px) rotate(0) scale(1.04) } }
@keyframes droopL { 0%,15%,100% { transform: rotate(0) } 30%,62% { transform: rotate(-34deg) } }
@keyframes droopR { 0%,15%,100% { transform: rotate(0) } 30%,62% { transform: rotate(34deg) } }
@keyframes wipe { 0%,20%,100% { transform: translateX(0) rotate(0) } 45% { transform: translateX(-30px) rotate(-14deg) } 60% { transform: translateX(-30px) rotate(-14deg) } }
@keyframes rollacross { 0% { transform: translateX(-46px) rotate(0); opacity: 0 } 15%,85% { opacity: 1 } 100% { transform: translateX(64px) rotate(360deg); opacity: 0 } }
@keyframes cardflip { 0%,20% { transform: scaleX(1) } 25% { transform: scaleX(0) } 30%,70% { transform: scaleX(1) } 75% { transform: scaleX(0) } 80%,100% { transform: scaleX(1) } }
@keyframes faceA { 0%,24.9% { opacity: 1 } 25%,74.9% { opacity: 0 } 75%,100% { opacity: 1 } }
@keyframes faceB { 0%,24.9% { opacity: 0 } 25%,74.9% { opacity: 1 } 75%,100% { opacity: 0 } }
@keyframes hgflip { 0%,78% { transform: rotate(0) } 92%,100% { transform: rotate(180deg) } }
@keyframes sandTop { 0% { transform: scaleY(1) } 78%,100% { transform: scaleY(.04) } }
@keyframes sandBot { 0% { transform: scaleY(.04) } 78%,100% { transform: scaleY(1) } }
@keyframes blowout { 0%,48% { transform: scale(1) } 54%,92% { transform: scale(0) } 100% { transform: scale(1) } }
@keyframes puffout { 0%,50% { opacity: 0; transform: translateY(0) scale(.5) } 58% { opacity: 1 } 90% { opacity: 0; transform: translateY(-22px) scale(1.2) } 100% { opacity: 0 } }
@keyframes slowblink { 0%,28%,100% { transform: scaleY(1) } 42%,66% { transform: scaleY(.1) } 80% { transform: scaleY(1) } }
@keyframes tossHigh { 0%,10%,100% { transform: translateY(0) rotate(0) } 45% { transform: translateY(-74px) rotate(200deg) } 80% { transform: translateY(0) rotate(360deg) } }
@keyframes press { 0%,40%,100% { transform: scaleY(1) } 50%,60% { transform: scaleY(.8) } }
@keyframes tapTail { 0%,40%,100% { transform: rotate(0) } 50%,60% { transform: rotate(9deg) } }
@keyframes dive { 0%,10% { transform: translateY(-64px) rotate(0); opacity: 0 } 18% { opacity: 1 } 60% { transform: translateY(28px) } 70%,100% { transform: translateY(46px); opacity: 1 } }
@keyframes boss { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-4px) scale(1.04) } }
@keyframes seal { 0%,100% { transform: scale(1) rotate(0) } 50% { transform: scale(1.12) rotate(-6deg) } }
@keyframes march { to { stroke-dashoffset: -24 } }
@keyframes spinRev { to { transform: rotate(-360deg) } }
@keyframes surf { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-3px) rotate(2deg) } }
@keyframes snapR { 0%,30%,100% { transform: rotate(26deg) } 36%,80% { transform: rotate(0) } }
@keyframes wing { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(.2) } }
@keyframes settle { 0% { transform: translate(var(--dx),var(--dy)); opacity: 0 } 15% { opacity: 1 } 40%,88% { transform: translate(0,0); opacity: 1 } 100% { transform: translate(0,0); opacity: 0 } }
`;
const CL2 = {
  judge: ['4s', 'ease-in-out'], browUp: ['4s', 'ease-in-out'], purr: ['.11s', 'linear'], shy: ['3.6s', 'ease-in-out'], rub: ['.5s', 'ease-in-out'],
  faint: ['3.4s', 'ease-in-out'], tiltLR: ['3.2s', 'ease-in-out'], glance: ['3.4s', 'ease-in-out'], appear: ['3.4s', 'ease-out'], smoke: ['1.8s', 'ease-out'],
  emerge: ['3.4s', 'ease-out'], stamp: ['2.6s', 'ease-out'], slam: ['2s', 'ease-in-out'], imprint: ['2s', 'linear'], slideX: ['2.4s', 'linear'],
  fall: ['2.6s', 'ease-in'], rise: ['2.8s', 'ease-out'], grow: ['3.2s', 'ease-out'], growY: ['3.2s', 'ease-out'], growX: ['3.2s', 'ease-out'],
  growBig: ['4s', 'ease-in-out'], fly: ['3.2s', 'ease-in'], glowp: ['1.6s', 'ease-in-out'], cross: ['4s', 'linear'], chase: ['3s', 'ease-in-out'],
  sneeze: ['3s', 'ease-out'], swapIn: ['3s', 'linear'], swapOut: ['3s', 'linear'], fadeA: ['3.2s', 'linear'], fadeB: ['3.2s', 'linear'],
  third: ['3s', 'linear'], quarter: ['4s', 'linear'], toss: ['.8s', 'ease-in-out'], push: ['1.6s', 'ease-in-out'], erase: ['.7s', 'ease-in-out'],
  fadeOut: ['3s', 'ease-in-out'], drop: ['1.2s', 'ease-in'], landOn: ['3s', 'ease-out'], explode: ['2.6s', 'cubic-bezier(.3,1.4,.5,1)'], arc: ['2.4s', 'ease-in-out'],
  into: ['2.2s', 'ease-in'], fw: ['1.6s', 'ease-out'], rain: ['2.6s', 'linear'], climb: ['3s', 'ease-in-out'], hinge: ['3s', 'ease-in-out'],
  shrinkX: ['3.6s', 'ease-in-out'], radar: ['1.6s', 'ease-in-out'], snapUp: ['2.6s', 'ease-out'], lean: ['3s', 'ease-in-out'], hover: ['2.4s', 'ease-in-out'],
  zoomIn: ['3s', 'ease-out'], hammer: ['.6s', 'ease-in'], trail: ['3s', 'linear'], sway: ['2s', 'ease-in-out'], portal: ['3.6s', 'ease-in-out'],
  rubber: ['1.6s', 'ease-out'], jab: ['1.2s', 'ease-out'], combo: ['3s', 'linear'], dance: ['1.6s', 'ease-in-out'], droopL: ['3s', 'ease-in-out'],
  droopR: ['3s', 'ease-in-out'], wipe: ['2.4s', 'ease-in-out'], rollacross: ['2.4s', 'linear'], cardflip: ['2.4s', 'ease-in-out'], faceA: ['2.4s', 'linear'],
  faceB: ['2.4s', 'linear'], hgflip: ['4s', 'ease-in-out'], sandTop: ['4s', 'linear'], sandBot: ['4s', 'linear'], blowout: ['3.4s', 'ease-in'],
  puffout: ['3.4s', 'ease-out'], slowblink: ['4.4s', 'ease-in-out'], tossHigh: ['2.4s', 'ease-in-out'], press: ['2s', 'ease-in-out'], tapTail: ['2s', 'ease-in-out'],
  dive: ['2.6s', 'ease-in'], boss: ['1.4s', 'ease-in-out'], seal: ['1.4s', 'ease-in-out'], spinRev: ['3s', 'linear'], surf: ['1.8s', 'ease-in-out'],
  snapR: ['2.6s', 'ease-out'], wing: ['.3s', 'ease-in-out'], settle: ['3.4s', 'ease-out']
};
(() => {
  const el = document.createElement('style');
  el.textContent = KF2 + Object.entries(CL2).map(([n, [d, e]]) => `.a-${n}{animation:${n} var(--d,${d}) var(--e,${e}) var(--dl,0s) infinite backwards}`).join('\n') +
    '\n.a-march{animation:march var(--d,1s) linear infinite}';
  document.head.appendChild(el);
})();

/* Shared defs for new stickers (clip paths, extra filters) live in one hidden SVG. */
document.body.insertAdjacentHTML('afterbegin', `<svg id="defs2" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><filter id="shade" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="#8a8f99" flood-opacity=".38"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs></svg>`);
const defOnce = m => { const id = (m.match(/id="([^"]+)"/) || [])[1]; if (id && !document.getElementById(id)) document.querySelector('#defs2 defs').insertAdjacentHTML('beforeend', m); return ''; };

/* Primitives */
const add2 = (cat, name, tag, svg) => S.push({ name, tag, cat, svg });
const FONT = 'font-family="Bricolage Grotesque, system-ui" font-weight="800"';
const G = (cls, ox, oy, inner, vars = '') => `<g ${A(cls, ox, oy, vars)}>${inner}</g>`;
const at = (x, y, s, inner, r = 0) => `<g ${T(x, y, s, r)}>${inner}</g>`;
const mir = inner => `<g transform="matrix(-1 0 0 1 200 0)">${inner}</g>`;
const txt = (x, y, s, size = 20, fill = I, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" ${FONT} font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
const say = (x, y, s, size = 15, dl = 0, d = '2.4s') => G('a-pop', x, y, txt(x, y, s, size, 'currentColor', 'stroke="var(--paper)" stroke-width="5" stroke-linejoin="round" paint-order="stroke"'), `--d:${d};--dl:${dl}s`);
const P = (d, sw = 3.5, extra = '') => `<path d="${d}" fill="${W}" stroke="${I}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const Pk = (d, extra = '') => `<path d="${d}" fill="${I}" ${extra}/>`;
const C = (x, y, r, sw = 3.5, fill = W) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${I}" stroke-width="${sw}"/>`;
const R = (x, y, w, h, rx = 4, sw = 3.5, fill = W) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${I}" stroke-width="${sw}"/>`;
const E = (x, y, rx, ry, fill = I) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const fxs = (d, w = 2.6, extra = '') => `<path d="${d}" stroke="currentColor" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const n1 = v => +v.toFixed(1);

/* Limbs */
const pawO = (x, y, rx = 10, ry = 9) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${I}" stroke="${W}" stroke-width="3"/>`;
function arm(x0, y0, cx, cy, x1, y1, o = {}) {
  const d = `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, w = o.w || 13, rx = o.rx || 9.5, ry = o.ry || 8.5;
  let g = '';
  if (o.out) g += `<path d="${d}" stroke="${W}" stroke-width="${w + 6}" fill="none" stroke-linecap="butt"/>` + E(x1, y1, rx + 3, ry + 3, W);
  g += stroke(d, w) + E(x1, y1, rx, ry);
  if (o.toes) g += stroke(`M${x1 - 3.5} ${y1 - 2} l0 4 M${x1 + 3.5} ${y1 - 2} l0 4`, 1.8, W);
  return o.cls ? G(o.cls, o.ox ?? x0, o.oy ?? y0, g, o.vars || '') : g;
}
const UPL = (cls = '', vars = '') => arm(70, 152, 50, 128, 40, 100, { cls, ox: 70, oy: 152, vars });
const UPR = (cls = '', vars = '') => arm(132, 152, 152, 128, 162, 100, { cls, ox: 132, oy: 152, vars });
const beans = (x, y, s = 1) => at(x, y, s, `<circle r="24" fill="${I}" stroke="${W}" stroke-width="3.5"/>` + E(0, 6, 9.5, 7.5, W) + [[-12, -7], [-4.5, -13], [4.5, -13], [12, -7]].map(([a, b]) => E(a, b, 4, 4.6, W)).join(''));
const pawPrint = (x, y, s = 1, fill = 'currentColor', r = 0) => at(x, y, s, `<ellipse cx="0" cy="4" rx="7" ry="6" fill="${fill}"/>` + [[-8, -4], [-3, -9], [3, -9], [8, -4]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2.6" ry="3.2" fill="${fill}"/>`).join(''), r);

/* Face bits (head-local coordinates, eyes at ±20,7) */
const BLUSH = stroke('M-41 24 l5 -5 M-34 24 l5 -5 M29 24 l5 -5 M36 24 l5 -5', 2, W);
const sweat = (x = 42, y = -18, cls = '') => G(cls, x, y, `<path d="M${x} ${y - 9} C${x - 5} ${y - 1} ${x - 6} ${y + 3} ${x - 3} ${y + 6} C${x} ${y + 8} ${x + 4} ${y + 6} ${x + 4} ${y + 2} C${x + 4} ${y - 1} ${x + 2} ${y - 5} ${x} ${y - 9} Z" fill="${W}"/>`);
const lidEye = (x, y, c = -1, dx = 0, dy = 4) => ringC(x, y) + dotC(x + dx, y + dy, 3.4) + Pk(`M${x - 18} ${y - 19} L${x + 18} ${y - 19} L${x + 18} ${y + c} L${x - 18} ${y + c} Z`) + stroke(`M${x - 14} ${y + c} L${x + 14} ${y + c}`, 3.2, W);
const slitEye = (x, y, cls = 'a-dart') => `<path d="M${x - 13} ${y + 3} Q${x} ${y - 6} ${x + 13} ${y + 3} Q${x} ${y + 9} ${x - 13} ${y + 3} Z" fill="${I}" stroke="${W}" stroke-width="3.2" stroke-linejoin="round"/>` + G(cls, x, y, dotC(x, y + 2.5, 2.8));
const look = (dx, dy, cls = '', vars = '') => [-20, 20].map(x => blinkG(x, 7, ringC(x, 7) + (cls ? G(cls, x, 7, dotC(x + dx, 7 + dy, 3.6), vars) : dotC(x + dx, 7 + dy, 3.6)))).join('');
const brow = (x, y, tilt = -4, cls = 'a-browUp') => G(cls, x, y, stroke(`M${x - 11} ${y - tilt} L${x + 11} ${y + tilt}`, 3.4, W));
const diamondEye = (x, y) => G('a-pulse', x, y, `<path d="M${x} ${y - 15} L${x + 12} ${y} L${x} ${y + 15} L${x - 12} ${y} Z" fill="${I}" stroke="${W}" stroke-width="3" stroke-linejoin="round"/>` + stroke(`M${x - 4} ${y - 4} L${x} ${y - 9}`, 2.4, W), '--d:.8s');
const MO = {
  grin: stroke('M-15 21 Q0 37 15 21', 2.6, W) + stroke('M-8 27 L-6.5 31.5 M8 27 L6.5 31.5', 2, W),
  wobble: stroke('M-11 28 Q-7 24 -3 28 Q1 32 5 28 Q8 25 11 27', 2.4, W),
  whistle: `<circle cx="10" cy="29" r="3.6" fill="${I}" stroke="${W}" stroke-width="2.2"/>`,
  big: `<path d="M-12 23 Q0 44 12 23 Z" fill="${I}" stroke="${W}" stroke-width="2.4" stroke-linejoin="round"/>`,
  tongue: `<path d="M-8 25 Q0 36 8 25 Z" fill="${I}" stroke="${W}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-3.5 29 Q0 37 3.5 29" fill="${W}"/>`
};

/* Head accessories (head-local) */
const SHADES = `<path d="M-43 -3 L-3 -3 L-5 11 C-7 22 -35 23 -39 11 Z" fill="${I}" stroke="${W}" stroke-width="3" stroke-linejoin="round"/><path d="M43 -3 L3 -3 L5 11 C7 22 35 23 39 11 Z" fill="${I}" stroke="${W}" stroke-width="3" stroke-linejoin="round"/>` + stroke('M-3 1 L3 1', 3, W) + stroke('M-43 -1 L-53 -6 M43 -1 L53 -6', 3, W);
const glint = (x = -26, y = 3, dl = 0) => `<path d="${sparkD(x, y, .55)}" fill="${W}" ${A('a-twinkle', x, y, `--dl:${dl}s;--d:2s`)}/>`;
const PARTY = P('M-14 -38 L6 -92 L22 -34 Z', 3) + stroke('M-6 -50 L14 -46 M-1 -64 L13 -61 M3 -78 L10 -76', 2.4) + C(6, -94, 6, 3);
const HARDHAT = P('M-42 -30 C-42 -68 42 -68 42 -30 Z') + R(-52, -36, 104, 10, 5) + stroke('M0 -64 L0 -38', 3) + stroke('M-24 -58 L-26 -38 M24 -58 L26 -38', 2.4);
const HEADBAND = (cls = 'a-flap') => P('M-52 -14 Q0 -34 52 -14 L50 -4 Q0 -22 -50 -4 Z', 2.6) + G(cls, -50, -10, P('M-50 -10 L-74 -20 L-70 -8 Z M-50 -8 L-72 2 L-62 6 Z', 2.4), '--d:.35s');
const WITCH = `<path d="M-60 -30 C-60 -40 60 -40 60 -30 C60 -22 -60 -22 -60 -30 Z" fill="${I}" stroke="${W}" stroke-width="3"/>` + `<path d="M-30 -34 L-8 -96 L36 -108 L12 -90 L30 -34 Z" fill="${I}" stroke="${W}" stroke-width="3" stroke-linejoin="round"/>` + stroke('M-27 -44 L28 -44', 6, W);
const ANTENNAE = stroke('M-16 -40 C-20 -62 -30 -72 -38 -76 M16 -40 C20 -62 30 -72 38 -76', 3.4) + `<circle cx="-39" cy="-77" r="6" fill="${I}" stroke="${W}" stroke-width="2.4"/><circle cx="39" cy="-77" r="6" fill="${I}" stroke="${W}" stroke-width="2.4"/>`;
const GRADCAP = `<path d="M-26 -42 L-26 -30 C-10 -24 10 -24 26 -30 L26 -42 Z" fill="${I}" stroke="${W}" stroke-width="2"/><path d="M-52 -46 L0 -64 L52 -46 L0 -30 Z" fill="${I}" stroke="${W}" stroke-width="2.6" stroke-linejoin="round"/>` + stroke('M0 -47 L38 -44 L38 -22', 2, W) + `<rect x="34" y="-24" width="8" height="10" rx="2" fill="${W}"/>`;
const HEADPHONES = stroke('M-48 -4 C-50 -62 50 -62 48 -4', 10) + stroke('M-48 -4 C-50 -62 50 -62 48 -4', 2.4, W) + `<rect x="-64" y="-10" width="18" height="30" rx="9" fill="${I}" stroke="${W}" stroke-width="2.6"/><rect x="46" y="-10" width="18" height="30" rx="9" fill="${I}" stroke="${W}" stroke-width="2.6"/>`;
const BIGGLASSES = `<circle cx="-21" cy="7" r="19" fill="none" stroke="${W}" stroke-width="4"/><circle cx="21" cy="7" r="19" fill="none" stroke="${W}" stroke-width="4"/>` + stroke('M-3 4 Q0 0 3 4', 3, W) + stroke('M-40 4 L-54 -2 M40 4 L54 -2', 3, W);
const BOWTIE = (x = 101, y = 134) => P(`M${x} ${y} L${x - 20} ${y - 11} L${x - 20} ${y + 11} Z M${x} ${y} L${x + 20} ${y - 11} L${x + 20} ${y + 11} Z`, 3) + C(x, y, 5, 3);
const SCARF = P('M64 128 Q101 146 138 128 L140 140 Q101 160 62 140 Z', 3) + P('M118 142 L124 178 L108 178 L106 146 Z', 3) + stroke('M80 134 L78 146 M96 138 L95 151 M112 138 L113 150', 2.4) + stroke('M110 160 L122 160', 2.4);

/* Props */
const check = (x, y, s = 1, col = I, w = 5) => at(x, y, s, stroke('M-10 0 L-3 8 L12 -10', w, col));
const checkBadge = (x, y, s = 1) => at(x, y, s, C(0, 0, 16) + stroke('M-8 0 L-2.5 6 L9 -7', 4.4));
const xBadge = (x, y, s = 1) => at(x, y, s, C(0, 0, 16) + stroke('M-6 -6 L6 6 M6 -6 L-6 6', 4.4));
const bulb = (x, y, s = 1) => at(x, y, s, P('M0 -20 C-13 -20 -19 -10 -19 -1 C-19 8 -11 12 -9 18 L9 18 C11 12 19 8 19 -1 C19 -10 13 -20 0 -20 Z') + R(-8, 18, 16, 9, 2.5) + stroke('M-6 8 L-3 -2 L0 6 L3 -2 L6 8', 2.2));
const rays = (x, y, r = 30, n = 8, dl = 0, len = 10) => G('a-flash', x, y, Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return fxs(`M${n1(x + Math.cos(a) * r)} ${n1(y + Math.sin(a) * r)} L${n1(x + Math.cos(a) * (r + len))} ${n1(y + Math.sin(a) * (r + len))}`, 3); }).join(''), `--d:1.1s;--dl:${dl}s`);
const mic = (x, y, s = 1, r = 0) => at(x, y, s, Pk('M-6 2 L6 2 L4 32 L-4 32 Z') + C(0, -8, 12) + stroke('M-8 -12 L8 -12 M-9 -6 L9 -6 M-6 -1 L6 -1', 1.6), r);
const book = (x, y, s = 1) => at(x, y, s, P('M-44 -8 L0 0 L44 -8 L44 32 L0 40 L-44 32 Z') + stroke('M0 0 L0 40', 2.5) + stroke('M-36 6 L-8 11 M-36 14 L-8 19 M-36 22 L-14 26 M8 11 L36 6 M8 19 L36 14 M8 26 L30 22', 2));
const cbook = (x, y, s = 1, r = 0, label = '') => at(x, y, s, R(-26, -32, 52, 64, 4) + Pk('M-26 -32 L-15 -32 L-15 32 L-26 32 Z') + (label ? txt(6, 6, label, 14) : stroke('M-5 -14 L17 -14 M-5 -6 L13 -6', 2.4)), r);
const card = (x, y, w, h, label = '', size = 18, r = 0) => at(x, y, 1, R(-w / 2, -h / 2, w, h, 6) + (label ? txt(0, size * .36, label, size) : ''), r);
const crown = (x, y, s = 1) => at(x, y, s, P('M-28 0 L-33 -28 L-16 -14 L0 -36 L16 -14 L33 -28 L28 0 Z', 3) + `<circle cx="0" cy="-10" r="3.5" fill="${I}"/>`);
const trophy = (x, y, s = 1) => at(x, y, s, stroke('M-19 -26 C-34 -26 -34 -6 -16 -6 M19 -26 C34 -26 34 -6 16 -6', 4.5) + P('M-21 -32 L21 -32 L19 -10 C17 2 9 8 0 8 C-9 8 -17 2 -19 -10 Z') + R(-4.5, 8, 9, 10, 1) + R(-15, 18, 30, 9, 2) + `<path d="${star5(0, -14, 8)}" fill="${I}"/>`);
const medal = (x, y, s = 1) => at(x, y, s, P('M-12 -34 L-4 -8 L4 -8 L12 -34 L4 -34 L0 -20 L-4 -34 Z', 2.6) + C(0, 4, 13, 3) + `<path d="${star5(0, 4, 7)}" fill="${I}"/>`);
const flame = (x, y, s = 1) => at(x, y, s, P('M0 0 C-24 0 -34 -20 -28 -40 C-24 -54 -12 -62 -12 -80 C0 -70 8 -58 6 -44 C12 -50 14 -58 12 -68 C26 -54 32 -30 24 -14 C20 -4 12 0 0 0 Z') + Pk('M0 -4 C-10 -4 -14 -14 -10 -24 C-7 -32 0 -36 0 -46 C8 -38 12 -24 8 -14 C6 -8 4 -4 0 -4 Z'));
const fire = (x, y, s = 1, d = '.9s') => G('a-flicker', x, y, flame(x, y, s), `--d:${d}`);
const clock = (x, y, r = 24, d = '2s') => C(x, y, r, 4) + [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2; return stroke(`M${n1(x + Math.cos(a) * (r - 4))} ${n1(y + Math.sin(a) * (r - 4))} L${n1(x + Math.cos(a) * (r - 8))} ${n1(y + Math.sin(a) * (r - 8))}`, 2.4); }).join('') + G('a-spin', x, y, stroke(`M${x} ${y} L${x} ${y - r + 8}`, 3), `--d:${d}`) + stroke(`M${x} ${y} L${x + r * .42} ${y}`, 3) + `<circle cx="${x}" cy="${y}" r="3" fill="${I}"/>`;
const hourglass = (x, y, s = 1) => at(x, y, s, R(-18, -30, 36, 7, 2) + R(-18, 23, 36, 7, 2) + P('M-13 -23 L13 -23 C13 -10 3 -4 3 0 C3 4 13 10 13 23 L-13 23 C-13 10 -3 4 -3 0 C-3 -4 -13 -10 -13 -23 Z', 3) + G('a-sandTop', 0, -3, Pk('M-8 -16 L8 -16 L1 -3 L-1 -3 Z')) + G('a-sandBot', 0, 20, Pk('M-9 20 L9 20 L0 8 Z')));
const bell = (x, y, s = 1) => at(x, y, s, `<circle cx="0" cy="-22" r="4" fill="${I}"/><circle cx="0" cy="20" r="5" fill="${I}"/>` + P('M0 -20 C-12 -20 -16 -10 -16 0 L-16 8 L-22 16 L22 16 L16 8 L16 0 C16 -10 12 -20 0 -20 Z'));
const lock = (x, y, s = 1, shCls = '', vars = '') => at(x, y, s, G(shCls, 0, -6, stroke('M-11 -4 L-11 -15 C-11 -31 11 -31 11 -15 L11 -4', 6), vars) + R(-17, -6, 34, 28, 5) + `<circle cx="0" cy="5" r="4.5" fill="${I}"/>` + Pk('M-2.5 6 L2.5 6 L3.5 15 L-3.5 15 Z'));
const env = (x, y, s = 1) => at(x, y, s, R(-30, -20, 60, 40, 4) + stroke('M-29 -18 L0 4 L29 -18', 3));
const pencil = (x, y, s = 1, r = 0) => at(x, y, s, R(-5, -46, 10, 36, 1, 3) + P('M-5 -10 L0 0 L5 -10 Z', 3) + Pk('M-1.8 -4 L0 0 L1.8 -4 Z') + R(-5, -53, 10, 8, 2, 3, I), r);
const magnifier = (x, y, s = 1, r = 0, inner = '') => at(x, y, s, stroke('M14 14 L36 36', 9) + `<circle r="22" fill="${W}" stroke="${I}" stroke-width="5"/>` + inner, r);
const speaker = (x, y, s = 1) => at(x, y, s, P('M-16 -8 L-6 -8 L8 -20 L8 20 L-6 8 L-16 8 Z'));
const arcs = (x, y, n = 3, dir = 1, gap = 9, d = '1.2s') => Array.from({ length: n }, (_, i) => { const r = 10 + i * gap; return fxs(`M${x} ${y - r} A${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${x} ${y + r}`, 3, A('a-flash', x, y, `--d:${d};--dl:${i * .2}s`)); }).join('');
const replay = (x, y, r = 16, sw = 4, col = I) => `<path d="M${x + r} ${y} A${r} ${r} 0 1 1 ${x} ${y - r}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round"/><path d="M${x - 2} ${y - r - 7} L${x + 8} ${y - r} L${x - 2} ${y - r + 7} Z" fill="${col}"/>`;
const replayBtn = (x, y, r = 22) => C(x, y, r, 4) + replay(x, y, r * .5, 3.4);
const wifi = (x, y, s = 1, col = I) => at(x, y, s, [0, 1, 2].map(i => stroke(`M${-10 - i * 9} ${-4 - i * 8} Q0 ${-16 - i * 13} ${10 + i * 9} ${-4 - i * 8}`, 4, col)).join('') + `<circle cx="0" cy="4" r="4.5" fill="${col}"/>`);
const blob = (pts, sw = 3.5) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${I}" stroke="${I}" stroke-width="${sw * 2}"/>`).join('') + pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${W}"/>`).join('');
const thought = (x, y, s = 1, inner = '') => at(x, y, s, blob([[-22, 2, 15], [-6, -10, 18], [14, -8, 17], [24, 6, 14], [4, 10, 16], [-14, 12, 13]]) + inner);
const puffC = (x, y, s = 1) => at(x, y, s, blob([[-12, 4, 12], [0, -6, 14], [13, 3, 12], [2, 8, 11]]));
function speech(x, y, w, h, label = '', size = 18, tx = -1) {
  const x0 = x - w / 2, y0 = y - h / 2, tb = tx < 0 ? x0 + w * .28 : x0 + w * .72;
  return `<path d="M${x0 + 8} ${y0} L${x0 + w - 8} ${y0} Q${x0 + w} ${y0} ${x0 + w} ${y0 + 8} L${x0 + w} ${y0 + h - 8} Q${x0 + w} ${y0 + h} ${x0 + w - 8} ${y0 + h} L${tb + 7} ${y0 + h} L${tb + tx * 12} ${y0 + h + 13} L${tb - 7} ${y0 + h} L${x0 + 8} ${y0 + h} Q${x0} ${y0 + h} ${x0} ${y0 + h - 8} L${x0} ${y0 + 8} Q${x0} ${y0} ${x0 + 8} ${y0} Z" fill="${W}" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>` + (label ? txt(x, y + size * .36, label, size) : '');
}
const block = (x, y, ch, sz = 32, size = 20) => R(x - sz / 2, y - sz / 2, sz, sz, 4) + txt(x, y + size * .36, ch, size);
const chip = (x, y, label, size = 14, w = 0) => { w = w || label.length * size * .62 + 16; return R(x - w / 2, y - size * .85, w, size * 1.7, size * .85) + txt(x, y + size * .36, label, size); };
const fish = (x, y, s = 1, r = 0) => at(x, y, s, P('M-20 0 C-12 -10 10 -10 20 0 C10 10 -12 10 -20 0 Z', 2.6) + P('M20 0 L34 -10 L32 10 Z', 2.6) + `<circle cx="-11" cy="-2" r="2" fill="${I}"/>` + stroke('M-3 -6 C0 -2 0 2 -3 6', 1.8), r);
const gift = (x, y, s = 1, lidCls = '') => at(x, y, s, R(-28, -10, 56, 50, 3) + `<rect x="-5" y="-10" width="10" height="50" fill="${I}"/>` + G(lidCls, 0, -18, R(-34, -24, 68, 16, 3) + `<rect x="-5" y="-24" width="10" height="16" fill="${I}"/>` + stroke('M0 -24 C-12 -40 -22 -32 -12 -26 M0 -24 C12 -40 22 -32 12 -26', 4)));
const chest = (x, y, s = 1, lidCls = '', vars = '--py:-12px;--d:1.6s') => at(x, y, s, R(-36, -6, 72, 40, 4) + stroke('M-36 8 L36 8', 3) + R(-6, 2, 12, 12, 2, 3) + G(lidCls, 0, -6, P('M-36 -6 C-36 -28 36 -28 36 -6 Z') + stroke('M-20 -6 L-20 -20 M20 -6 L20 -20', 3), vars));
const stampTool = (x, y) => C(x, y - 34, 9, 3, I) + `<rect x="${x - 4}" y="${y - 28}" width="8" height="14" fill="${I}"/>` + R(x - 20, y - 16, 40, 12, 3) + R(x - 24, y - 6, 48, 8, 2, 3, I);
const thumb = (x, y) => `<rect x="${x - 4}" y="${y - 21}" width="9" height="18" rx="4.5" fill="${I}"/>` + E(x, y, 10, 9);
const miniStrut = (x, y, s, o = {}) => at(x, y, s, `<g transform="scale(-1 1) translate(-116 -186)">${strut(o)}</g>`);
const miniZoom = (x, y, s, o = {}) => at(x, y, s, `<g transform="scale(-1 1) translate(-110 -130)">${zoom(o)}</g>`);
const star = (x, y, r = 12, sw = 3) => `<path d="${star5(x, y, r)}" fill="${W}" stroke="${I}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const heartP = (x, y, s = 1.6) => `<path d="${heartD(x, y, s)}" fill="${W}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>`;
const calendar = (x, y, s = 1, body = '') => at(x, y, s, R(-34, -30, 68, 62, 5) + `<path d="M-34 -14 L-34 -25 Q-34 -30 -29 -30 L29 -30 Q34 -30 34 -25 L34 -14 Z" fill="${I}"/>` + stroke('M-18 -36 L-18 -24 M18 -36 L18 -24', 4) + body);
const firework = (x, y, r = 22, n = 10, dl = 0, col = 'currentColor') => G('a-fw', x, y, Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return `<path d="M${n1(x + Math.cos(a) * r * .45)} ${n1(y + Math.sin(a) * r * .45)} L${n1(x + Math.cos(a) * r)} ${n1(y + Math.sin(a) * r)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="3" fill="${col}"/>`, `--dl:${dl}s`);
const confetti = (x, y, n = 10, spread = 1) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.4 * spread, dist = 46 + (i % 3) * 14, dx = n1(Math.cos(a) * dist), dy = n1(Math.sin(a) * dist + 30); const d = i % 3 === 0 ? `M${x - 3} ${y - 2} h7 v4 h-7 Z` : i % 3 === 1 ? sparkD(x, y, .6) : `M${x} ${y} q4 -6 8 0`; return `<path d="${d}" fill="${i % 3 === 2 ? 'none' : (i % 2 ? 'currentColor' : SOFT)}" stroke="${i % 3 === 2 ? 'currentColor' : 'none'}" stroke-width="2.4" ${A('a-burst', x, y, `--dx:${dx}px;--dy:${dy}px;--dl:${(i % 5) * .1}s`)}/>`; }).join('');
const dashLine = (d, w = 2.6) => `<path d="${d}" stroke="currentColor" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-dasharray="2 10" class="a-march" style="--d:.8s"/>`;
const progress = (x, y, w, frac, cls = 'a-growX', vars = '') => R(x, y - 8, w, 16, 8) + G(cls, x, y, `<rect x="${x + 3}" y="${y - 5}" width="${(w - 6) * frac}" height="10" rx="5" fill="${I}"/>`, vars);
const sun = (x, y, r = 14) => G('a-spin', x, y, Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return stroke(`M${n1(x + Math.cos(a) * (r + 5))} ${n1(y + Math.sin(a) * (r + 5))} L${n1(x + Math.cos(a) * (r + 13))} ${n1(y + Math.sin(a) * (r + 13))}`, 3.4); }).join(''), '--d:9s') + C(x, y, r, 3.5);
const motion = (path, dur, inner, extra = '') => `<g>${inner}<animateMotion dur="${dur}" repeatCount="indefinite" path="${path}" ${extra}/></g>`;

/* Mini full-body cats */
function strut(o = {}) {
  const d = o.d || '.55s', leg = (x, cls) => G(cls, x, 132, stroke(`M${x} 132 L${x} 184`, 12), `--d:${d}`);
  return G(o.bob ?? 'a-bob', 110, 186, G('a-wag', 166, 112, stroke('M166 112 C186 104 190 76 180 58 C176 50 180 42 188 42', 9)) + leg(92, 'a-legB') + leg(154, 'a-legA') +
    `<path d="M62 116 C62 96 86 88 120 90 C152 92 170 102 170 120 C170 138 152 146 118 146 C84 146 62 136 62 116 Z" fill="${I}"/>` + leg(78, 'a-legA') + leg(140, 'a-legB') + (o.front || '') +
    at(66, 86, .8, head(o.head || { eyes: 'ring', mouth: 'w' })), `--d:${d}`);
}
function zoom(o = {}) {
  const leg = (dd, ox, oy, cls) => G(cls, ox, oy, stroke(dd, 11), '--d:.28s');
  return G('a-bob', 110, 140, G('a-wag', 158, 110, stroke('M158 110 C174 104 186 108 196 100', 9), '--d:.4s') +
    leg('M82 130 L58 158', 82, 130, 'a-legB') + leg('M152 124 L184 136', 152, 124, 'a-legA') +
    `<path d="M54 112 C54 98 76 92 110 94 C142 96 160 104 160 116 C160 128 142 134 110 134 C78 134 54 126 54 112 Z" fill="${I}"/>` +
    leg('M70 126 L42 146', 70, 126, 'a-legA') + leg('M142 126 L172 146', 142, 126, 'a-legB') + at(56, 98, .78, head(o.head || { eyes: 'focus', droop: 16, earCls: '' })), '--d:.28s');
}
/* Cat on the left (prop space on the right, x ≥ 118) and centred-small layouts */
const catL = o => shift(-30, 12, .86, sit(o));
const catS = (x, y, s, o) => shift(x, y, s, sit(o));

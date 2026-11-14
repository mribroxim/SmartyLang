/* ═════════ Signature animations (#226–229): long multi-act loops, extra celebration ═════════ */
const _kst = document.createElement('style'); document.head.appendChild(_kst);
const _kseen = new Set();
/* kf(name, frames): registers a keyframe + class that runs on the sticker's --D cycle */
const kf = (name, body, ease = 'ease-in-out') => {
  if (!_kseen.has(name)) { _kseen.add(name); _kst.textContent += `@keyframes ${name}{${body}}\n.${name}{animation:${name} var(--D,6.4s) ${ease} var(--dl,0s) infinite backwards}\n`; }
  return name;
};
const kn = (p, ...v) => p + v.join('_').replace(/\./g, 'p');
const visIn = (a, b) => kf(kn('vi', a, b), a <= 0 ? `0%,${b}%{opacity:1}${Math.min(b + 1, 100)}%,100%{opacity:0}` : `0%,${a - 1}%{opacity:0}${a}%,${b}%{opacity:1}${Math.min(b + 1, 100)}%,100%{opacity:0}`, 'linear');
const visOut = (a, b) => kf(kn('vo', a, b), `0%,${a - 1}%{opacity:1}${a}%,${b}%{opacity:0}${Math.min(b + 1, 100)}%,100%{opacity:1}`, 'linear');
const popAt = (a, b) => kf(kn('pp', a, b), `0%,${a}%{opacity:0;transform:scale(0)}${a + 3}%{opacity:1;transform:scale(1.28)}${a + 6}%,${b}%{opacity:1;transform:scale(1)}${b + 3}%,100%{opacity:0;transform:scale(1)}`, 'ease-out');
/* Timed confetti burst that fires at a% of the cycle */
const tburst = (cx, cy, a, n = 16, r = 70) => {
  const k = kf(kn('tb', a), `0%,${a}%{opacity:0;transform:translate(0,0) scale(.3) rotate(0)}${a + 1.5}%{opacity:1}${Math.min(a + 24, 99)}%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1) rotate(260deg)}100%{opacity:0}`, 'ease-out');
  return Array.from({ length: n }, (_, i) => {
    const ang = i / n * Math.PI * 2 + .3, dist = r * (.6 + (i % 3) * .22), dx = n1(Math.cos(ang) * dist), dy = n1(Math.sin(ang) * dist);
    const t = i % 4, d = t === 0 ? star5(cx, cy, 7) : t === 1 ? sparkD(cx, cy, .8) : t === 2 ? `M${cx - 3.5} ${cy - 3.5} h7 v7 h-7 Z` : `M${cx - 6} ${cy} q3 -6 6 0 q3 6 6 0`;
    const paint = t === 3 ? `fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"` : i % 2 ? `fill="${W}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"` : `fill="currentColor"`;
    return `<path d="${d}" ${paint} ${A(k, cx, cy, `--dx:${dx}px;--dy:${dy}px`)}/>`;
  }).join('');
};
/* Slow rotating sunburst drawn behind everything */
const glory = (cx, cy, r = 100) => G('a-spin', cx, cy, Array.from({ length: 16 }, (_, i) => {
  const a = i / 16 * Math.PI * 2;
  return `<path d="M${cx} ${cy} L${n1(cx + Math.cos(a - .1) * r)} ${n1(cy + Math.sin(a - .1) * r)} L${n1(cx + Math.cos(a + .1) * r)} ${n1(cy + Math.sin(a + .1) * r)} Z" fill="${SOFT}" opacity=".3"/>`;
}).join(''), '--d:16s');
/* layers: string, or [fadeClass, content] for a layer that fades as a whole */
const sigSvg = (D, bg, layers, fx = '') => `<svg viewBox="0 0 200 200" role="img" aria-hidden="true" style="--D:${D}">${bg}` +
  layers.map(l => Array.isArray(l) ? `<g class="${l[0]}"><g filter="url(#ink)">${l[1]}</g></g>` : `<g filter="url(#ink)">${l}</g>`).join('') + `<g>${fx}</g></svg>`;

/* — 226 · The Magic Paw: wind-up, draws a glowing loop in the air, it bursts into a word, victory hops — */
add2('sig', 'The Magic Paw', 'Signature · paw draws words in the air', () => {
  const armK = kf('mpArm', '0%{transform:rotate(25deg)}12%{transform:rotate(38deg)}22%{transform:rotate(4deg)}32%{transform:rotate(-22deg)}42%{transform:rotate(10deg)}52%{transform:rotate(-18deg)}57%{transform:rotate(-28deg)}62%{transform:rotate(-8deg)}68%{transform:rotate(-30deg)}74%{transform:rotate(-8deg)}80%{transform:rotate(-30deg)}88%{transform:rotate(-14deg)}100%{transform:rotate(25deg)}');
  const bodyK = kf('mpBody', '0%,100%{transform:none}10%{transform:scale(1.04,.95)}16%,56%{transform:none}60%{transform:scale(1.07,.9)}66%{transform:translateY(-22px) scale(.95,1.06)}72%{transform:translateY(0) scale(1.05,.95)}77%{transform:translateY(-10px)}82%{transform:none}');
  const trailK = kf('mpTrail', '0%,14%{stroke-dashoffset:250;opacity:1}54%{stroke-dashoffset:0;opacity:1}58%{opacity:1}63%,100%{stroke-dashoffset:0;opacity:0}', 'linear');
  const trail = 'M122 90 C130 54 168 40 178 62 C188 86 150 96 152 70 C154 44 186 30 192 16';
  const wand = G(armK, 130, 150, arm(130, 150, 176, 136, 184, 94, {}) + `<path d="${sparkD(186, 78, 1.15)}" fill="${W}" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>`);
  const faceA = G(visOut(57, 96), 0, 0, look(5, -4) + mouth('smile'));
  const faceB = G(visIn(57, 96), 0, 0, eyes('star') + mouth('open') + BLUSH);
  const cat = catL({ bodyCls: bodyK, tailCls: 'a-lash', tailVars: '--d:.6s', head: { eyes: 'none', earCls: '', acc: faceA + faceB }, front: wand });
  const banner = G(popAt(58, 90), 152, 60, R(106, 41, 92, 38, 19, 4) + txt(152, 68, 'hello!', 24));
  const sparks = [[132, 62, 18], [170, 46, 26], [176, 82, 34], [156, 72, 42], [188, 26, 50]].map(([x, y, a]) => G(visIn(a, 60), x, y, `<path d="${sparkD(x, y, .75)}" fill="currentColor" ${A('a-twinkle', x, y, '--d:.7s')}/>`)).join('');
  const after = [[110, 30, 0], [196, 52, .3], [114, 100, .6], [192, 98, .9], [152, 18, 1.2]].map(([x, y, dl]) => G(visIn(62, 92), x, y, st5(x, y, 6, dl, 'currentColor', '1s'))).join('');
  return sigSvg('6.4s', G(visIn(58, 92), 152, 60, glory(152, 60, 96)), [cat + banner],
    `<path d="${trail}" stroke="${SOFT}" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="250" opacity=".45" ${A(trailK, 150, 60)}/>` +
    `<path d="${trail}" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-dasharray="250" ${A(trailK, 150, 60)}/>` +
    sparks + after + tburst(152, 60, 58, 18, 76) + G(visIn(16, 54), 160, 150, txt(162, 154, 'swish~', 15, 'currentColor')));
});

/* — 227 · The Vocabulary Fish: a word turns into a glowing fish, cat stalks, wiggles, leaps, catches, +1 in the bowl — */
add2('sig', 'The Vocabulary Fish', 'Signature · every mastered word becomes a fish', () => {
  const leapK = kf('vfLeap', '0%,40%{transform:none}43%{transform:translateX(-3px)}46%{transform:translateX(3px)}49%{transform:translateX(-3px)}52%{transform:translateX(3px)}55%{transform:translateX(-3px)}58%{transform:none}61%{transform:scale(1.07,.9)}67%{transform:translateY(-34px) scale(.95,1.06)}75%{transform:translateY(0) scale(1.06,.93)}79%,100%{transform:none}');
  const chipK = kf('vfChip', '0%{opacity:0;transform:translateX(34px)}6%{opacity:1;transform:translateX(0)}19%{opacity:1;transform:scale(1)}23%{opacity:1;transform:scale(1.18)}26%,100%{opacity:0;transform:scale(.2)}');
  const swimK = kf('vfSwim', '0%,24%{opacity:0;transform:translate(0,0) scale(0)}30%{opacity:1;transform:translate(0,0) scale(1)}38%{transform:translate(-18px,14px) rotate(-10deg)}46%{transform:translate(8px,24px) rotate(8deg)}54%{transform:translate(-14px,8px) rotate(-6deg)}62%{transform:translate(-50px,-10px) rotate(-26deg)}67%{transform:translate(-79px,-14px) rotate(-16deg)}75%,90%{opacity:1;transform:translate(-79px,6px) rotate(-10deg)}94%,100%{opacity:0;transform:translate(-79px,6px)}');
  const fishBody = `<path d="M126 36 C134 23 160 23 170 36 C160 49 134 49 126 36 Z M170 36 L184 25 L182 47 Z" fill="${W}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><circle cx="134" cy="34" r="2.3" fill="${I}"/>` + txt(151, 39, 'bonjour', 8.5);
  const faceA = G(visOut(59, 95), 0, 0, look(6, -5, 'a-dart') + mouth('o'));
  const faceB = G(visIn(59, 95), 0, 0, eyes('star') + mouth('open') + BLUSH);
  const armsUp = G(visIn(60, 92), 101, 100, arm(70, 152, 14, 84, 84, 32, {}) + arm(132, 152, 188, 84, 118, 32, {}));
  const cat = catS(-8, 26, .8, { bodyCls: leapK, tailCls: 'a-lash', tailVars: '--d:.35s', head: { eyes: 'none', earCls: '', acc: faceA + faceB }, front: armsUp });
  const smallFish = (x, y, r = 0) => at(x, y, 1, `<path d="M-8 0 C-4 -5 4 -5 8 0 C4 5 -4 5 -8 0 Z M8 0 L14 -4 L13 4 Z" fill="${I}"/>`, r);
  const bowl = P('M134 146 C118 164 126 192 156 192 C186 192 194 164 178 146 Z') + R(130, 140, 52, 9, 4) + stroke('M130 160 Q156 154 182 160', 2) +
    G('a-sway', 148, 176, smallFish(146, 176), '--d:2.2s;--sx:-4px;--ex:6px') + G('a-sway', 164, 168, smallFish(166, 168, 180), '--d:2.6s;--sx:5px;--ex:-5px') + G(visIn(78, 95), 156, 182, smallFish(158, 183, -10));
  const counter = G(visOut(78, 96), 156, 124, chip(156, 124, '12 words', 11)) + G(visIn(78, 96), 156, 124, chip(156, 124, '13 words', 11));
  return sigSvg('7s', G(visIn(74, 92), 73, 56, glory(73, 56, 90)),
    [cat + G(chipK, 152, 36, chip(152, 36, 'bonjour', 14)) + G(swimK, 152, 36, G('a-rock', 152, 36, fishBody, '--d:.5s')) + bowl + counter],
    G(swimK, 152, 36, `<circle cx="152" cy="36" r="30" fill="none" stroke="${SOFT}" stroke-width="2.4" stroke-dasharray="3 7" stroke-linecap="round"/>` + sp(122, 18, .5, 0, 'currentColor', '.8s') + sp(184, 54, .45, .4, 'currentColor', '.8s')) +
    tburst(152, 36, 25, 10, 40) + tburst(73, 40, 75, 18, 72) + G(popAt(76, 92), 158, 92, txt(158, 98, '+1 word!', 18, 'currentColor', 'stroke="var(--paper)" stroke-width="5" paint-order="stroke"')));
});

/* — 228 · The Language Portal: “Hello!”, dive into the swirl, the world changes, pops out in a new place: “¡Hola!” — */
add2('sig', 'The Language Portal', 'Signature · switching languages', () => {
  const portK = kf('lpPort', '0%{transform:scale(0)}8%,90%{transform:scale(1)}97%,100%{transform:scale(0)}');
  const inK = kf('lpIn', '0%{opacity:0;transform:none}3%{opacity:1}6%{transform:translateY(-10px)}10%{transform:none}13%{transform:scale(1.06,.9)}21%{transform:translate(38px,-62px) rotate(30deg)}29%{opacity:1;transform:translate(72px,14px) rotate(250deg) scale(.45)}33%,100%{opacity:0;transform:translate(74px,26px) rotate(330deg) scale(0)}');
  const outK = kf('lpOut', '0%,42%{opacity:0;transform:translateY(16px) scale(0) rotate(-320deg)}50%{opacity:1;transform:translateY(-50px) scale(1.08) rotate(0)}58%{transform:translateY(0) scale(1.1,.88)}62%{transform:scale(.95,1.06)}66%,91%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}');
  const beamK = kf('lpBeam', '0%,24%{opacity:0;transform:scaleY(.2)}30%{opacity:1;transform:scaleY(1)}38%{opacity:0;transform:scaleY(1.2)}44%{opacity:0;transform:scaleY(.2)}50%{opacity:1;transform:scaleY(1)}58%,100%{opacity:0;transform:scaleY(1)}');
  const catA = G(inK, 27, 150, catS(-30, 70, .56, { tailCls: 'a-lash', head: { eyes: 'big', mouth: 'open', earCls: '' } }));
  const catB = G(outK, 100, 176, catS(44, 56, .56, { noPawL: true, bodyCls: 'a-bob', bodyVars: '--d:.5s', head: { eyes: 'star', mouth: 'open', acc: BLUSH }, front: UPL('a-wave', '--d:.6s') + UPR('a-wave', '--d:.6s;--dl:.3s') }));
  const portal = G(portK, 100, 176, `<ellipse cx="100" cy="176" rx="60" ry="14" fill="${I}" stroke="${W}" stroke-width="3"/>` +
    `<g transform="translate(100 176) scale(1 .24)">${G('a-spin', 0, 0, `<g transform="scale(1.7)">${stroke(spiralD(0, 0), 3.2, W)}</g>`, '--d:.9s')}</g>`);
  const sceneA = R(156, 52, 26, 104, 2) + P('M156 52 L169 26 L182 52 Z', 3) + C(169, 76, 9, 3) + stroke('M169 76 L169 70 M169 76 L174 78', 2.2) + stroke('M160 100 L178 100 M160 120 L178 120 M160 140 L178 140', 2) +
    puffC(42, 34, .8) + puffC(84, 22, .55) + chip(118, 18, 'EN', 13);
  const sceneB = sun(40, 40, 13) + stroke('M172 162 C174 130 168 100 162 76', 7) +
    P('M162 76 C148 62 130 64 122 74 C136 70 148 72 162 76 Z M162 76 C172 58 190 56 198 64 C186 64 174 68 162 76 Z M162 76 C154 56 158 42 168 34 C166 48 166 62 162 76 Z M162 76 C176 68 194 76 196 88 C184 80 174 78 162 76 Z', 3) +
    `<circle cx="158" cy="83" r="4.5" fill="${I}"/><circle cx="167" cy="84" r="4.5" fill="${I}"/>` + chip(118, 18, 'ES', 13);
  const hello = G(visIn(1, 16), 66, 62, speech(66, 62, 62, 30, 'Hello!', 14, -1));
  const hola = G(popAt(62, 92), 146, 58, speech(146, 58, 72, 34, '¡Hola!', 17, -1));
  return sigSvg('7s', G(visIn(52, 90), 100, 110, glory(100, 110, 104)),
    [[visOut(39, 96), sceneA], [visIn(40, 95), sceneB], portal + catA + catB + hello + hola],
    G(beamK, 100, 176, fxs('M66 168 L50 54 M100 166 L100 34 M134 168 L150 54', 3) + `<path d="M76 168 L70 70 L130 70 L124 168 Z" fill="${SOFT}" opacity=".25"/>`) +
    tburst(100, 120, 52, 18, 78) + [[30, 120, .2], [176, 170, .7], [100, 30, 1.1]].map(([x, y, dl]) => G(visIn(54, 92), x, y, sp(x, y, .7, dl, 'currentColor', '.9s'))).join(''));
});

/* — 229 · The Constellation Cat: stars appear one by one, lines join into a giant cat, flash, shooting star, MILESTONE — */
add2('sig', 'The Constellation Cat', 'Signature · milestone constellation', () => {
  const pts = [[46, 98], [52, 30], [82, 56], [118, 56], [148, 30], [154, 98], [100, 124]];
  const lineK = kf('ccLine', '0%,16%{stroke-dashoffset:380;opacity:1}52%{stroke-dashoffset:0;opacity:1}92%{stroke-dashoffset:0;opacity:1}97%,100%{stroke-dashoffset:0;opacity:0}', 'linear');
  const flashK = kf('ccFlash', '0%,54%{transform:scale(1)}58%{transform:scale(1.08)}63%,100%{transform:scale(1)}');
  const shootK = kf('ccShoot', '0%,60%{opacity:0;transform:translate(0,0)}62%{opacity:1}74%{opacity:0;transform:translate(118px,46px)}100%{opacity:0;transform:translate(118px,46px)}', 'ease-in');
  const jumpK = kf('ccJump', '0%,58%{transform:none}61%{transform:scale(1.07,.9)}67%{transform:translateY(-26px) scale(.95,1.06)}74%{transform:translateY(0) scale(1.05,.95)}78%{transform:translateY(-10px)}83%,100%{transform:none}');
  let dots = '';
  for (let i = 0; i < 40 && dots.split('<circle').length < 24; i++) {
    const x = 24 + (i * 53) % 152, y = 12 + (i * 37) % 150;
    if ((x - 100) ** 2 + (y - 86) ** 2 < 74 ** 2) dots += `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.9}" fill="${W}" ${A('a-flash', x, y, `--d:${1.2 + (i % 5) * .3}s;--dl:${(i % 7) * .2}s`)}/>`;
  }
  const stars = pts.map(([x, y], i) => G(popAt(4 + i * 5, 94), x, y, `<path d="${star5(x, y, 7.5)}" fill="${W}"/>`)).join('') +
    [[82, 86, 48], [118, 86, 50], [100, 102, 53]].map(([x, y, a]) => G(popAt(a, 94), x, y, `<path d="${star5(x, y, 5.5)}" fill="${W}"/>`)).join('');
  const cons = G(flashK, 100, 80, `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" stroke="${W}" stroke-width="2.2" fill="none" stroke-dasharray="380" stroke-linejoin="round" opacity=".9" ${A(lineK, 100, 80)}/>` + stars);
  const shooting = G(shootK, 40, 30, stroke('M18 22 L40 31', 3, W) + `<path d="${star5(42, 32, 5)}" fill="${W}"/>`);
  const sky = `<circle cx="100" cy="86" r="82" fill="${I}"/>` + dots + cons + shooting;
  const faceA = G(visOut(58, 95), 0, 0, look(0, -6) + mouth('o'));
  const faceB = G(visIn(58, 95), 0, 0, eyes('star') + mouth('open') + BLUSH);
  const cat = catS(48, 96, .5, { noPawL: true, bodyCls: jumpK, tailCls: 'a-wag', head: { eyes: 'none', earCls: '', acc: faceA + faceB }, front: G(visIn(59, 92), 101, 120, UPL('a-wave', '--d:.6s') + UPR('a-wave', '--d:.6s;--dl:.3s')) });
  const banner = G(popAt(62, 92), 100, 18, R(42, 3, 116, 28, 14, 3.5) + txt(100, 23, 'MILESTONE!', 15));
  return sigSvg('7s', G(visIn(56, 92), 100, 86, glory(100, 86, 104)), [sky, cat + banner],
    tburst(100, 70, 58, 18, 84));
});

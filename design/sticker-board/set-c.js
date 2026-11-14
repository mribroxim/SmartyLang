/* ═════════ New stickers, part C: games, social, app states, premium, seasonal, easter eggs, signature ═════════ */

/* — 8. Minigames & challenges — */
add2('game', 'Quiz show host', 'Quiz mode intro', () => wrapSvg(
  card(156, 62, 40, 50, '?', 26, -6) + card(180, 132, 32, 40, 'A', 20, 8) + card(150, 168, 32, 40, 'B', 20, -4) +
  catL({ head: { eyes: 'happy', mouth: 'open', earCls: '' }, front: BOWTIE(101, 136) + arm(132, 152, 160, 146, 162, 128, { w: 12 }) + mic(164, 112, .9, 20) }),
  rays(156, 62, 32, 8, 0, 8)));

add2('game', 'Time attack', 'Timed challenge', () => wrapSvg(
  R(142, 12, 16, 10, 3, 3) + clock(150, 52, 30, '.8s') + at(0, 40, .8, zoom()),
  speed(4, 140, 3) + say(56, 40, 'GO!', 22)));

add2('game', 'Memory match', 'Matching game', () => wrapSvg(
  catS(34, 64, .66, { head: { eyes: 'big', mouth: 'open', earCls: '' } }) +
  [40, 160].map((x, i) => G('a-cardflip', x, 70, R(x - 26, 38, 52, 64, 6) + G('a-faceA', x, 70, txt(x, 82, '?', 30)) + G('a-faceB', x, 70, fish(x - 4, 70, .8)), `--dl:${i * .15}s`)).join(''),
  G('a-faceB', 100, 36, sp(100, 30, .9), '--d:2.4s')));

add2('game', 'Word race', 'Speed vocabulary', () => wrapSvg(
  at(-10, 62, .84, zoom()) + [['run', 34, 0], ['fast', 74, .8], ['go!', 114, 1.6]].map(([w, y, dl]) => G('a-slideX', 100, y, chip(100, y, w, 13), `--sx:110px;--ex:-120px;--d:2.4s;--dl:${dl}s`)).join(''),
  speed(172, 152, 3)));

add2('game', 'Boss battle', 'Hard grammar test', () => wrapSvg(
  G('a-boss', 148, 110, `<text x="148" y="176" text-anchor="middle" ${FONT} font-size="168" fill="${W}" stroke="${I}" stroke-width="6" paint-order="stroke">?</text>` +
    `<path d="M126 66 L144 74 M170 66 L152 74" stroke="${I}" stroke-width="5" stroke-linecap="round"/><circle cx="138" cy="82" r="4.5" fill="${I}"/><circle cx="158" cy="82" r="4.5" fill="${I}"/>`, '--d:1.2s') +
  shift(-14, 86, .54, sit({ bodyCls: 'a-shake', bodyVars: '--d:.3s', tailCls: 'a-lash', head: { eyes: 'angry', mouth: 'fang', earCls: '' }, front: arm(132, 150, 160, 122, 168, 98, {}) + pencil(174, 90, 1.2, 40) })),
  bang(184, 128)));

add2('game', 'Puzzle solver', 'Last question solved', () => wrapSvg(
  catL({ head: { eyes: 'focus', mouth: 'w', earCls: '' } }) +
  R(118, 100, 72, 72, 4) + stroke('M154 100 L154 172 M118 136 L190 136', 3) + `<rect x="156" y="138" width="32" height="32" fill="${I}"/>` +
  G('a-climb', 172, 80, R(156, 62, 32, 32, 3) + pawO(172, 66, 9, 8), '--px:0px;--py:76px;--d:2.6s'),
  G('a-imprint', 172, 154, sp(194, 120, .8) + sp(146, 88, .6, .3), '--d:2.6s')));

add2('game', 'Lucky spin', 'Daily spin · rewards wheel', () => {
  let seg = ''; for (let k = 0; k < 8; k++) { const a0 = k * Math.PI / 4, a1 = a0 + Math.PI / 4; seg += `<path d="M150 112 L${n1(150 + 40 * Math.cos(a0))} ${n1(112 + 40 * Math.sin(a0))} A40 40 0 0 1 ${n1(150 + 40 * Math.cos(a1))} ${n1(112 + 40 * Math.sin(a1))} Z" fill="${k % 2 ? I : W}"/>`; }
  return wrapSvg(catL({ head: { eyes: 'star', mouth: 'open', earCls: '' }, front: arm(132, 150, 150, 142, 166, 150, { w: 12 }) }) +
    stroke('M150 152 L150 190 M130 190 L170 190', 5) + G('a-spin', 150, 112, seg + `<circle cx="150" cy="112" r="40" fill="none" stroke="${I}" stroke-width="4"/>`, '--d:3s;--e:cubic-bezier(.15,.8,.3,1)') + C(150, 112, 6, 3) +
    `<path d="M150 80 L142 64 L158 64 Z" fill="${W}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>`, sp(186, 60, .6, .3));
});

add2('game', 'Challenge accepted', 'Start a challenge', () => wrapSvg(
  sit({ bodyCls: 'a-puff', noPawL: true, tailCls: 'a-lash', head: { eyes: 'angry', mouth: 'smile', earCls: '', acc: HEADBAND() }, front: G('a-pulse', 46, 96, stroke('M70 152 C56 136 48 118 46 98', 15) + E(45, 90, 12, 11), '--d:1.4s') }),
  speed(152, 40, 3) + sp(24, 50, .7, .4)));

add2('game', 'Bonus round', 'Bonus question', () => wrapSvg(
  stroke('M20 40 L20 192 M180 40 L180 192', 5) +
  `<path d="M20 40 L180 40 L180 154 L20 154 Z M68 72 L86 60 L100 72 L118 58 L134 76 L130 98 L138 114 L118 128 L100 118 L82 130 L64 112 L70 92 Z" fill="${W}" fill-rule="evenodd" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>` +
  txt(100, 146, 'BONUS', 14) +
  G('a-zoomIn', 101, 96, at(101, 98, .56, head({ eyes: 'big', mouth: 'open', earCls: '' })) + pawO(70, 114, 10, 9) + pawO(132, 114, 10, 9), '--d:2.6s'),
  [[-46, -40], [46, -44], [-40, 36], [50, 30]].map(([dx, dy], i) => `<path d="M101 96 l9 -4 l2 9 z" fill="currentColor" ${A('a-burst', 101, 96, `--dx:${dx}px;--dy:${dy}px;--dl:${i * .1}s;--d:2.6s`)}/>`).join('')));

add2('game', 'Mystery box', 'Surprise reward', () => wrapSvg(
  sit({ head: { eyes: 'none', mouth: 'o', earCls: '', acc: look(0, 6, 'a-dart') }, front: G('a-shake', 101, 160, R(64, 136, 74, 52, 4) + txt(101, 174, '?', 30) + stroke('M64 150 L138 150', 3) + pawO(62, 162, 10, 9) + pawO(140, 162, 10, 9), '--d:.12s') }),
  say(176, 60, '?', 24) + say(28, 64, '?', 16, .7)));

/* — 9. Friends & social learning — */
add2('social', 'Friend request', 'Add a friend', () => wrapSvg(
  sit({ head: { eyes: 'happy', mouth: 'w', earCls: '', acc: BLUSH }, front: G('a-push', 101, 156, env(101, 156, 1.1) + pawPrint(101, 162, .9, I) + pawO(64, 162, 10, 9) + pawO(138, 162, 10, 9), '--px:0px;--py:-6px;--d:1.4s') }),
  heartsUp(150, 66)));

add2('social', 'Teamwork', 'Group goal · class challenge', () => {
  const pusher = (x, y, s, dl) => `<g transform="translate(${x} ${y}) scale(${-s} ${s}) translate(-116 -186)">${strut({ d: '.6s', bob: 'a-bob' })}</g>`;
  return wrapSvg(G('a-push', 150, 150, R(118, 96, 72, 92, 6) + txt(154, 150, 'WORD', 17), '--px:6px;--d:1.2s') + pusher(38, 188, .42) + pusher(92, 188, .42),
    say(56, 60, 'heave!', 15) + speed(4, 120, 2));
});

add2('social', 'Friendly rivalry', 'League duel · head-to-head', () => {
  const rival = { eyes: 'none', mouth: 'flat', earCls: '', acc: slitEye(-20, 7) + slitEye(20, 7) + brow(-20, -12, 4, '') + brow(20, -12, -4, '') };
  return wrapSvg(shift(-24, 72, .6, sit({ tailCls: 'a-lash', head: rival })) + `<g transform="translate(224 72) scale(-.6 .6)">${sit({ tailCls: 'a-lash', head: rival })}</g>`,
    G('a-flash', 100, 100, `<path d="M106 70 L92 100 L106 100 L94 132" stroke="currentColor" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`, '--d:.5s'));
});

add2('social', 'Leaderboard climb', 'Rank up in league', () => wrapSvg(
  stroke('M70 192 L70 24 M130 192 L130 24', 6) + [0, 1, 2, 3].map(k => stroke(`M70 ${170 - k * 42} L130 ${170 - k * 42}`, 5) + txt(152, 176 - k * 42, ['4', '3', '2', '1'][k], 18)).join('') +
  G('a-climb', 100, 160, shift(58, 88, .42, sit({ bodyCls: '', noPawL: true, head: { eyes: 'up', mouth: 'w', earCls: '' }, front: UPL() + UPR() })), '--px:0px;--py:-92px;--d:3.4s'),
  st5(100, 12, 8, 0)));

add2('social', 'Study group', 'Classes · group study', () => wrapSvg(
  shift(-26, 64, .54, sit({ head: { eyes: 'read', earCls: '' } })) + shift(46, 40, .54, sit({ head: { eyes: 'read', earCls: '', mouth: 'o' }, bodyVars: '--dl:.4s' })) +
  `<g transform="translate(226 64) scale(-.54 .54)">${sit({ head: { eyes: 'read', earCls: '' }, bodyVars: '--dl:.8s' })}</g>` + book(100, 158, .9),
  dots(134, 24)));

add2('social', 'Friend celebration', 'Friend hit a milestone', () => wrapSvg(
  catL({ head: { eyes: 'happy', mouth: 'open' }, front: arm(132, 150, 146, 124, 160, 112, { w: 12 }) + P('M160 108 L192 88 L196 106 Z', 3) }) +
  C(164, 160, 24, 3.5) + at(164, 166, .3, head({ eyes: 'happy', mouth: 'w', noWhisk: true, earCls: '' })) + trophy(184, 124, .45),
  confetti(150, 84, 10, .7)));

add2('social', 'High-five duo', 'Friend streak', () => {
  const side = sit({ noPawL: true, head: { eyes: 'happy', mouth: 'open', earCls: '' }, front: G('a-swat', 132, 150, arm(132, 150, 196, 112, 206, 70, {}), '--d:1.2s') });
  return wrapSvg(shift(-28, 64, .6, side) + `<g transform="translate(228 64) scale(-.6 .6)">${side}</g>`,
    G('a-flash', 100, 100, fxs('M100 86 l0 -12 M88 90 l-8 -8 M112 90 l8 -8', 3), '--d:1.2s'));
});

add2('social', 'Sharing success', 'Share your win', () => wrapSvg(
  shift(-30, 64, .62, sit({ head: { eyes: 'happy', mouth: 'w', earCls: '' } })) + `<g transform="translate(230 64) scale(-.62 .62)">${sit({ head: { eyes: 'big', mouth: 'open', earCls: '' } })}</g>` +
  G('a-sway', 100, 136, trophy(100, 136, .7), '--sx:-14px;--ex:14px;--d:2.4s'),
  heartsUp(94, 84)));

/* — 10. App states & navigation — */
add2('state2', 'Empty library', 'No saved books yet', () => wrapSvg(
  R(96, 30, 96, 160, 4) + stroke('M96 82 L192 82 M96 136 L192 136', 4) + cbook(112, 160, .5, 12) +
  catS(-34, 40, .76, { head: { eyes: 'none', mouth: 'flat', earCls: '', acc: look(6, 2, 'a-dart') } }),
  fxs('M178 34 L190 46 M170 34 L190 56 M186 34 Q180 44 190 40', 1.6) + G('a-rollacross', 150, 182, `<circle cx="150" cy="182" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M144 180 q6 -4 12 2 M146 186 q4 -6 9 -2" stroke="currentColor" stroke-width="1.6" fill="none"/>`, '--d:3s')));

add2('state2', 'No results', 'Search found nothing', () => wrapSvg(
  sit({ head: { eyes: 'none', mouth: 'flat', earCls: '', cls: 'a-tilt', vars: '--d:3s', acc: ringC(-20, 7) + dotC(-20, 9) },
    front: magnifier(124, 98, 1.05, 0, ringC(0, 0, 13, 3.6) + G('a-dart', 0, 0, dotC(0, 1, 4))) + pawO(162, 136, 10, 9) }),
  say(172, 40, '?', 26) + say(28, 70, '…', 22, .6)));

add2('state2', 'Offline kitty', 'No internet', () => wrapSvg(
  sit({ head: { eyes: 'sad', mouth: 'frown', earCls: '', droop: 18 }, front: R(66, 130, 70, 50, 8) + G('a-flash', 101, 162, wifi(101, 168, .7), '--d:1.6s') + stroke('M78 138 L124 174', 4) + pawO(66, 160, 10, 9) + pawO(136, 160, 10, 9) }),
  say(101, 22, 'offline', 13)));

add2('state2', 'Back online', 'Connection restored', () => wrapSvg(
  sit({ head: { eyes: 'happy', mouth: 'open', earCls: '' } }),
  [[56, 22], [148, 24]].map(([x, y], i) => [0, 1, 2].map(k => G('a-fw', x, y, fxs(`M${x - 7 - k * 6} ${y - 3 - k * 4} Q${x} ${y - 10 - k * 7} ${x + 7 + k * 6} ${y - 3 - k * 4}`, 2.6), `--dl:${k * .25 + i * .1}s;--d:1.4s`)).join('')).join('') + sp(40, 70, .6, 0) + sp(166, 70, .6, .3)));

add2('state2', 'Something went wrong', 'Error · crash screen', () => wrapSvg(
  sit({ bodyCls: 'a-wiggle', bodyVars: '--d:.5s', head: { eyes: 'spiral', mouth: 'o', earCls: '' },
    front: stroke('M40 130 C70 110 130 170 160 140 C178 124 150 100 120 124 C96 142 60 170 50 150 C44 136 70 120 90 150', 4.5, W) + stroke('M160 140 C176 160 184 168 186 178', 4.5) + R(178, 176, 16, 14, 3, 3) }),
  G('a-flash', 186, 172, fxs('M174 164 l-6 -6 M186 160 l0 -8 M198 164 l6 -6', 2.6), '--d:.3s')));

add2('state2', 'Update available', 'New version ready', () => wrapSvg(
  catS(10, 40, .82, { noPawL: true, head: { eyes: 'big', mouth: 'open', earCls: '' }, front: G('a-bob', 101, 10, P('M101 -38 L140 4 L116 4 L116 38 L86 38 L86 4 L62 4 Z') + arm(70, 152, 46, 90, 80, 32, {}) + arm(132, 152, 156, 90, 122, 32, {}), '--d:1.4s') }),
  G('a-pop', 170, 30, R(146, 18, 46, 22, 11, 3) + txt(169, 34, 'NEW', 13), '--d:2s')));

add2('state2', 'Download complete', 'Offline lesson saved', () => wrapSvg(
  sit({ head: { eyes: 'up', mouth: 'open', earCls: '' }, front: G('a-fall', 101, 152, C(101, 152, 22, 4) + stroke('M101 140 L101 162 M92 154 L101 163 L110 154', 4), '--fy:-120px;--d:2.4s') + arm(58, 146, 62, 176, 80, 170, { out: true }) + arm(144, 146, 140, 176, 122, 170, { out: true }) }),
  G('a-imprint', 162, 46, checkBadge(162, 46, .9), '--d:2.4s')));

add2('state2', 'Notifications', 'New notification', () => wrapSvg(
  catL({ bodyCls: 'a-jolt', bodyVars: '--d:1.6s', head: { eyes: 'big', mouth: 'o', earCls: '', droop: -6 } }) + G('a-ring', 156, 84, bell(156, 112, 1.5), '--d:1s'),
  ringLines(156, 112) + `<g ${A('a-pop', 178, 82, '--d:1s')}><circle cx="178" cy="82" r="10" fill="currentColor"/><text x="178" y="87" text-anchor="middle" ${FONT} font-size="14" fill="var(--paper)">1</text></g>`));

add2('state2', 'Search mode', 'Searching…', () => wrapSvg(
  R(30, 18, 140, 96, 8) + `<rect x="40" y="28" width="120" height="76" rx="3" fill="${W}" stroke="${I}" stroke-width="2"/>` + stroke('M52 44 L130 44 M52 58 L146 58 M52 72 L120 72 M52 86 L138 86', 3) +
  G('a-sway', 100, 66, magnifier(80, 64, .8), '--sx:-24px;--ex:40px;--d:2.4s') +
  shift(18, 100, .5, sit({ head: { eyes: 'glasses', earCls: '', mouth: 'flat' } })), ''));

add2('state2', 'Under construction', 'Coming soon · beta feature', () => {
  let stripes = ''; for (let k = -2; k < 8; k++) stripes += `M${120 + k * 14} 186 L${134 + k * 14} 150 L${141 + k * 14} 150 L${127 + k * 14} 186 Z `;
  return wrapSvg(defOnce('<clipPath id="clipSign"><rect x="118" y="150" width="74" height="36"/></clipPath>') +
    catL({ head: { eyes: 'focus', mouth: 'w', earCls: '', acc: HARDHAT }, front: G('a-hammer', 132, 150, arm(132, 150, 156, 130, 170, 112, { w: 12 }) + stroke('M170 112 L180 90', 4) + R(168, 78, 24, 12, 2, 3), '--d:.6s') }) +
    R(118, 150, 74, 36, 3) + `<g clip-path="url(#clipSign)"><path d="${stripes}" fill="${I}"/></g>` + stroke('M126 186 L126 194 M184 186 L184 194', 4),
    say(162, 40, 'WIP', 18));
});

add2('state2', 'Locked feature', 'Premium-only feature', () => wrapSvg(
  catL({ head: { eyes: 'none', mouth: 'o', earCls: '', acc: look(6, 3) }, front: G('a-tapA', 150, 150, arm(132, 150, 156, 146, 178, 148, { w: 12 }), '--d:.9s') }) +
  G('a-wiggle', 158, 150, lock(158, 150, 1.6), '--d:.9s'),
  rays(158, 146, 40, 8, 0, 9)));

add2('state2', 'Saved', 'Progress saved', () => wrapSvg(
  catL({ head: { eyes: 'happy', mouth: 'w', earCls: '' } }) +
  R(118, 98, 72, 90, 5) + `<rect x="124" y="104" width="60" height="78" rx="3" fill="${I}"/>` +
  G('a-slideX', 154, 140, `<path d="M140 128 L164 128 L170 134 L170 158 L140 158 Z" fill="${W}" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>`, '--sx:-50px;--ex:0px;--d:3s') +
  G('a-shrinkX', 184, 140, R(124, 104, 60, 78, 3) + C(146, 142, 11, 3) + stroke('M146 142 L146 134', 2.6) + stroke('M176 132 L176 150', 4), '--s:.12;--d:3s'),
  G('a-imprint', 162, 60, checkBadge(162, 60, .9), '--d:3s')));

/* — 11. SmartyLang Premium — */
add2('premium', 'VIP cat', 'Smarty Max member', () => wrapSvg(
  sit({ bodyCls: 'a-puff', head: { eyes: 'none', mouth: 'smile', earCls: '', cls: 'a-nod', vars: '--d:1.4s', acc: SHADES + glint(-26, 2) + glint(22, 2, 1) }, front: BOWTIE(101, 136) }),
  sp(30, 50, .8) + sp(172, 40, .7, .6) + st5(178, 120, 6, 1, SOFT)));

add2('premium', 'Royal treatment', 'Upgrade welcome', () => wrapSvg(
  `<path d="M74 96 L126 96 L178 194 L22 194 Z" fill="${W}" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>` + stroke('M82 104 L40 186 M118 104 L160 186 M78 120 L122 120 M66 146 L134 146 M50 172 L150 172', 2) +
  [30, 170].map(x => stroke(`M${x} 130 L${x} 190`, 5) + C(x, 126, 6, 3)).join('') + stroke('M30 136 Q52 152 64 142 M170 136 Q148 152 136 142', 3) +
  miniStrut(100, 168, .44, { head: { eyes: 'closed', mouth: 'smile', earCls: '', acc: crown(0, -40, .7) } }),
  firework(30, 40, 16, 8, 0) + firework(170, 50, 14, 8, .7)));

add2('premium', 'Unlimited learning', 'Unlimited lessons', () => {
  const inf = 'M100 110 C128 72 178 72 178 110 C178 148 128 148 100 110 C72 72 22 72 22 110 C22 148 72 148 100 110 Z';
  return wrapSvg(`<path d="${inf}" fill="none" stroke="${I}" stroke-width="22" stroke-linejoin="round"/><path d="${inf}" fill="none" stroke="${W}" stroke-width="13" stroke-linejoin="round"/>` +
    motion(inf, '4s', `<g transform="scale(-.26 .26) translate(-110 -130)">${zoom()}</g>`, 'rotate="auto"'),
    sp(100, 40, .8, 0) + sp(100, 176, .6, .6, SOFT));
});

add2('premium', 'Premium unlocked', 'Smarty Max activated', () => wrapSvg(
  `<path d="M50 190 L50 70 C50 30 150 30 150 70 L150 190 Z" fill="${W}" stroke="${I}" stroke-width="5"/>` + `<path d="${sparkD(100, 116, 1.6)}" fill="${I}"/>` +
  G('a-shrinkX', 54, 120, `<path d="M54 188 L54 72 C54 52 70 40 100 38 L100 188 Z" fill="${I}" stroke="${W}" stroke-width="2"/>` + C(90, 120, 4, 2, W), '--s:.12;--d:3.4s') +
  G('a-shrinkX', 146, 120, `<path d="M146 188 L146 72 C146 52 130 40 100 38 L100 188 Z" fill="${I}" stroke="${W}" stroke-width="2"/>` + C(110, 120, 4, 2, W), '--s:.12;--d:3.4s') +
  crown(100, 26, .7) + shift(50, 98, .5, sit({ noPaws: true, tail: ['M100 188 C124 194 146 178 140 154 C136 140 146 132 156 136', 100, 188], head: { eyes: 'none', earCls: '', cls: 'a-tilt', vars: '--d:3s' } })),
  G('a-imprint', 100, 120, rays(100, 116, 44, 10, 0, 14), '--d:3.4s')));

add2('premium', 'Upgrade magic', 'Upgrade to premium content', () => wrapSvg(
  catL({ head: { eyes: 'happy', mouth: 'w', earCls: '' }, front: G('a-swing', 130, 150, arm(130, 150, 150, 136, 160, 116, { w: 12 }) + stroke('M160 116 L184 80', 4) + star(186, 76, 9), '--d:1.4s') }) +
  G('a-fadeA', 156, 154, cbook(156, 154, .9, 0), '--d:3.2s') + G('a-fadeB', 156, 154, cbook(156, 154, .9, 0, ' ') + `<path d="${star5(161, 156, 11)}" fill="${I}"/>` + crown(161, 140, .36), '--d:3.2s'),
  G('a-fadeB', 156, 154, rays(156, 150, 36, 10, 0, 10), '--d:3.2s') + sp(126, 120, .6, .2)));

add2('premium', 'Trial activated', 'Free trial started', () => wrapSvg(
  sit({ head: { eyes: 'focus', mouth: 'w', earCls: '' }, front: G('a-hgflip', 101, 152, hourglass(101, 152, 1.1) + pawO(78, 152, 10, 9) + pawO(124, 152, 10, 9)) }),
  say(101, 22, '7 days', 14)));

/* — 12. Seasonal & special events — */
add2('season', 'Birthday cat', 'Learner’s birthday', () => wrapSvg(sit({
  head: { eyes: 'closed', earCls: '', acc: PARTY + `<circle cx="0" cy="29" r="4.4" fill="${I}" stroke="${W}" stroke-width="2.2"/><circle cx="-31" cy="22" r="7" fill="none" stroke="${W}" stroke-width="2"/><circle cx="31" cy="22" r="7" fill="none" stroke="${W}" stroke-width="2"/>` },
  front: P('M58 170 L144 170 L144 192 L58 192 Z') + P('M68 154 L134 154 L134 170 L68 170 Z') + stroke('M68 160 Q76 166 84 160 Q92 166 100 160 Q108 166 116 160 Q124 166 134 160', 2.4) +
    [84, 101, 118].map((x, i) => R(x - 2.5, 140, 5, 14, 1, 2) + G('a-blowout', x, 140, G('a-flicker', x, 140, `<path d="M${x} 126 C${x - 5} 132 ${x - 4} 139 ${x} 139 C${x + 4} 139 ${x + 5} 132 ${x} 126 Z" fill="${W}" stroke="${I}" stroke-width="2"/>`, '--d:.4s'), `--dl:${i * .05}s`)).join('') }),
  [84, 101, 118].map(x => `<path d="M${x} 124 q-4 -6 0 -12 q4 -6 0 -12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" ${A('a-puffout', x, 124)}/>`).join('') + confetti(101, 40, 8)));

add2('season', 'Halloween kitty', 'Halloween event', () => wrapSvg(
  `<path d="M150 18 C120 22 104 48 108 74 C112 98 134 110 156 106 C138 96 128 76 132 56 C136 38 146 26 150 18 Z" fill="${W}" stroke="${I}" stroke-width="3.5"/>` +
  G('a-hover', 100, 150, stroke('M16 172 L172 142', 6) + P('M170 142 L196 128 L198 152 L176 152 Z', 3) + stroke('M176 142 L196 134 M178 148 L196 146', 2) +
    shift(10, 40, .62, sit({ noPaws: true, head: { eyes: 'happy', mouth: 'fang', earCls: '', acc: WITCH } })), '--d:2.6s'),
  st5(36, 40, 6, 0) + st5(184, 84, 5, .6) + sp(60, 112, .6, 1)));

add2('season', 'Winter wonderland', 'Winter event', () => wrapSvg(
  sit({ head: { eyes: 'none', mouth: 'o', earCls: '', acc: [-20, 20].map(x => ringC(x, 7) + dotC(x + (x < 0 ? 6 : -6), 12, 3.6)).join('') + G('a-pop', 0, 18, `<path d="${star5(0, 17, 5)}" fill="${W}"/>`, '--d:2.4s') }, front: SCARF }),
  [[30, 0], [64, 1.1], [150, .5], [178, 1.6], [116, 2]].map(([x, dl]) => `<path d="M${x} 6 l0 12 M${x - 6} 9 l12 6 M${x + 6} 9 l-12 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ${A('a-rain', x, 12, `--dl:${dl}s;--d:3.4s;--py:150px`)}/>`).join('')));

add2('season', 'Holiday gift', 'Holiday event · gift', () => wrapSvg(
  G('a-peek', 100, 120, at(100, 106, .78, head({ eyes: 'happy', mouth: 'w', earCls: '', acc: P('M0 -44 C-16 -64 -30 -54 -14 -44 Z M0 -44 C16 -64 30 -54 14 -44 Z', 3) })) + pawT(76, 122) + pawT(124, 122), '--d:3.6s') +
  R(40, 126, 120, 66, 4) + `<rect x="94" y="126" width="12" height="66" fill="${I}"/>` + R(32, 118, 136, 16, 4) + `<rect x="94" y="118" width="12" height="16" fill="${I}"/>`,
  sp(28, 70, .7, 0) + sp(174, 60, .8, .6)));

add2('season', 'New Year countdown', 'New Year event', () => wrapSvg(
  catS(-26, 30, .84, { head: { eyes: 'big', mouth: 'open', earCls: '', acc: PARTY } }) +
  C(152, 76, 34, 4) + ['3', '2', '1'].map((s, i) => G('a-third', 152, 76, txt(152, 90, s, 40), `--d:3s;--dl:${[0, -2, -1][i]}s`)).join(''),
  confetti(152, 50, 10)));

add2('season', 'Spring butterfly', 'Spring event', () => wrapSvg(
  catS(-20, 14, .86, { noPawL: true, head: { eyes: 'none', mouth: 'o', earCls: '', acc: look(5, -4) }, front: arm(132, 150, 162, 120, 170, 90, { cls: 'a-reach', ox: 132, oy: 150 }) }) +
  stroke('M150 190 L150 170 M178 190 L178 176', 3) + C(150, 166, 6, 3) + C(178, 172, 5, 3),
  motion('M150 60 C176 40 192 80 172 92 C152 104 130 70 150 60 Z', '3.4s',
    G('a-wing', 0, 0, `<path d="M0 0 C-6 -16 -24 -18 -22 -4 C-20 6 -8 6 0 0 Z M0 0 C-4 10 -18 16 -18 8 C-18 2 -8 0 0 0 Z M0 0 C6 -16 24 -18 22 -4 C20 6 8 6 0 0 Z M0 0 C4 10 18 16 18 8 C18 2 8 0 0 0 Z" fill="${W}" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>`, '--d:.25s') +
    `<path d="M0 -6 L0 8" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`)));

add2('season', 'Summer vacation', 'Summer event · break', () => wrapSvg(
  sun(34, 34, 12) + stroke('M150 190 L132 50', 4) +
  `<path d="M70 76 C86 30 168 14 194 54 Z" fill="${W}" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/><path d="M100 62 C112 34 136 26 132 52 Z M156 46 C164 30 182 36 180 52 Z" fill="${I}"/>` +
  shift(-6, 56, .74, loaf({ head: { eyes: 'none', mouth: 'smile', earCls: '', acc: SHADES + glint(-26, 2) } })),
  fxs('M6 196 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0', 2.4)));

add2('season', 'Graduation day', 'Course graduation', () => wrapSvg(
  catS(10, 40, .82, { noPawL: true, bodyCls: 'a-hop', bodyVars: '--d:1.2s', head: { eyes: 'happy', mouth: 'open' }, front: UPL('a-wave', '--d:1.2s') + UPR('a-wave', '--d:1.2s;--dl:.3s') }) +
  G('a-tossHigh', 101, 40, at(101, 40, .8, `<path d="M-26 4 L-26 14 C-10 20 10 20 26 14 L26 4 Z" fill="${I}" stroke="${W}" stroke-width="2"/><path d="M-52 0 L0 -18 L52 0 L0 16 Z" fill="${I}" stroke="${W}" stroke-width="2.6" stroke-linejoin="round"/>` + stroke('M0 -1 L38 2 L38 24', 2, W))),
  confetti(100, 64, 10)));

/* — 13. Micro-interactions & easter eggs — */
add2('egg', 'Cursor hunter', 'Idle on any page', () => wrapSvg(`
  <g ${A('a-wiggle', 160, 190)}><circle cx="152" cy="160" r="30" fill="${I}"/><g ${A('a-flick', 178, 152, '--d:1.2s')}>${stroke('M178 152 C192 146 198 158 194 172', 9)}</g></g>
  <path d="M44 178 C44 162 64 154 96 154 C124 154 140 142 156 142 C172 142 176 160 174 176 C172 186 168 190 150 190 L58 190 C48 190 44 186 44 178 Z" fill="${I}"/>` +
  G('a-swat', 64, 162, arm(64, 166, 50, 140, 40, 124, {}), '--d:1.4s') +
  at(62, 152, .72, head({ eyes: 'none', earCls: '', acc: [-20, 20].map(x => ringC(x, 7) + G('a-dart', x, 7, dotC(x - 2, 3, 3.8), '--d:1.4s')).join('') })),
  motion('M40 60 C70 20 124 36 104 70 C84 100 30 92 40 60 Z', '2.8s', `<path d="M0 0 L0 22 L6 16 L11 26 L15 24 L10 14 L18 14 Z" fill="${W}" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>`)));

add2('egg', 'Tail typing', 'Accidental tap · easter egg', () => wrapSvg(
  G('a-press', 170, 184, `<ellipse cx="170" cy="184" rx="22" ry="7" fill="${I}"/><path d="M150 182 L150 170 C150 160 190 160 190 170 L190 182 Z" fill="${W}" stroke="${I}" stroke-width="3.5"/>` + txt(170, 177, 'OK', 12)) +
  catS(-30, 12, .86, { tail: ['M0 0', 0, 0], tailCls: '', head: { eyes: 'none', earCls: '', cls: 'a-tilt', acc: look(-6, -5) + MO.whistle } }) +
  G('a-tapTail', 100, 176, stroke('M96 178 C124 186 148 168 162 158 C168 154 172 154 174 158', 9)),
  notes(40, 50)));

add2('egg', 'Screen tap', 'Inactive screen · hello?', () => wrapSvg(
  at(100, 150, 1.25, head({ eyes: 'big', mouth: 'o' })) + G('a-pulse', 148, 88, beans(148, 88, 1.1), '--d:1s'),
  [0, .5].map(dl => G('a-fw', 148, 88, `<circle cx="148" cy="88" r="36" fill="none" stroke="currentColor" stroke-width="2.6"/>`, `--dl:${dl}s;--d:1s`)).join('')));

add2('egg', 'Slow blink', 'Affection · “I trust you”', () => wrapSvg(
  sit({ tailVars: '--d:4s', head: { eyes: 'none', mouth: 'w', earCls: '', acc: G('a-slowblink', 0, 7, ringC(-20, 7) + dotC(-20, 9) + ringC(20, 7) + dotC(20, 9)) + BLUSH } }),
  G('a-imprint', 162, 48, `<path d="${heartD(162, 48, 1.6)}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>`, '--d:4.4s')));

add2('egg', 'Paw prints', 'Page transition · easter egg', () => wrapSvg(
  G('a-cross', 100, 130, miniStrut(100, 134, .42, { d: '.35s' }), '--sx:-120px;--ex:110px;--d:4s'),
  Array.from({ length: 8 }, (_, i) => G('a-trail', 18 + i * 24, 156, pawPrint(18 + i * 24, 152 + (i % 2) * 16, .8, 'currentColor', 90), `--d:4s;--dl:${i * .4}s`)).join('')));

add2('egg', 'Fish dream', 'Idle · sleeping cat', () => wrapSvg(
  shift(-6, 24, .9, loaf({ head: { eyes: 'closed', mouth: 'w' } })) + G('a-reach', 118, 140, arm(116, 142, 126, 112, 134, 88, {}), '--d:1.6s') +
  thought(152, 46, .9, G('a-sway', 0, 0, fish(0, 0, .8), '--d:1.8s;--sx:-8px;--ex:8px')),
  zzz(54, 64)));

add2('egg', 'Invisible wall', 'Edge of the page · easter egg', () => wrapSvg(
  G('a-lean', 101, 190, catS(-18, 10, .86, { head: { eyes: 'focus', mouth: 'flat', earCls: '' }, front: arm(132, 150, 170, 140, 192, 112, { cls: 'a-rubber', ox: 192, oy: 112 }) + arm(132, 160, 170, 160, 192, 150, {}) }), '--r:5deg;--px:4px;--d:2.4s'),
  `<path d="M162 14 L162 194" stroke="currentColor" stroke-width="2.6" stroke-dasharray="6 8"/>` + say(182, 40, '?!', 16)));

add2('egg', 'Tiny sneeze', 'Easter egg · dusty page', () => {
  const cat = sit({ bodyCls: '', head: { eyes: 'closed', mouth: 'o', earCls: '' } });
  return `<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><g ${A('a-sneeze', 101, 190)}><g ${A('a-swapOut', 101, 120)} filter="url(#ink)">${cat}</g><g ${A('a-swapIn', 101, 120)} filter="url(#fuzz)">${cat}</g></g>` +
    `<g>${G('a-swapIn', 156, 60, txt(156, 60, 'achoo!', 18, 'currentColor'), '--d:3s') + G('a-swapIn', 40, 110, puffC(36, 112, .6), '--d:3s')}</g></svg>`;
});

add2('egg', 'Shadow boxing', 'Practice mode · warm-up', () => {
  const boxer = dl => sit({ noPawL: true, tailCls: 'a-lash', head: { eyes: 'angry', mouth: 'fang', earCls: '' },
    front: G('a-jab', 70, 150, arm(70, 152, 52, 130, 40, 112, {}), `--px:-12px;--py:-6px;--d:.9s;--dl:${dl}s`) + G('a-jab', 132, 150, arm(132, 152, 150, 136, 158, 122, {}), `--px:12px;--py:-6px;--d:.9s;--dl:${dl + .45}s`) });
  return `<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><g filter="url(#shade)"><g transform="translate(232 30) scale(-.72 .72)">${boxer(.45)}</g></g>` +
    `<g filter="url(#ink)"><g transform="translate(-24 38) scale(.8)">${boxer(0)}</g></g><g>${G('a-flash', 112, 80, fxs('M112 74 l8 -8 M118 86 l10 0', 2.6), '--d:.45s')}</g></svg>`;
});

add2('egg', 'Secret meow', 'Hidden: tap the cat 5×', () => wrapSvg(
  sit({ bodyCls: 'a-jolt', bodyVars: '--d:3s;--dl:1.74s', head: { eyes: 'closed', earCls: '', acc: G('a-swapOut', 0, 28, mouth('w'), '--d:3s') + G('a-swapIn', 0, 28, MO.big, '--d:3s') } }),
  G('a-swapIn', 162, 50, txt(162, 54, 'meow', 14, 'currentColor'), '--d:3s')));

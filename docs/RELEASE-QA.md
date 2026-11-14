# Release QA checklist

Record device/model, OS/browser version, build commit, date, result and evidence
for every row. Desktop emulation is supplemental and cannot pass a real-device
row. Blank boxes are pending, not passed. Run against HTTPS and a free and Max
test account; complete the age/consent setup first.

## Phones and desktop

- [ ] Physical iPhone Safari: Talk to Smarty permission allow/deny, first reply,
  microphone stop/restart, background/resume, wired/Bluetooth playback, quiet
  mode, and no competing MediaRecorder/SpeechRecognition capture.
- [ ] Physical Android Chrome: repeat the same microphone and audio checks.
- [ ] Read-aloud bites, pronunciation, speaking Practice and saved recordings:
  correct locale, permission refusal, unsupported recognition, no empty upload,
  stop/cancel releases mic, and safe recovery after losing network.
- [ ] Audio starts only after a gesture where required; no overlapping speech;
  long passages, pause/restart and navigation stop playback.
- [ ] Room at 320×568, 360×640, 390×844, 412×915 and desktop 1440×900: no cropped
  essential controls, furniture fits the drawn slots, shop/keyboard sheets scroll,
  safe areas clear bottom navigation, feeding and coin counts update correctly.
- [ ] Light/dark: room and landing remain in their light zone; readable secondary
  text, correct right/wrong colors, focus outlines and native date input.
- [ ] Offline/slow network: resumable progress, queued synchronization, no lost
  words/coins/room purchases; AI/TTS failures have a useful safe state.
- [ ] Low-end physical Android: record cold/warm load, LCP, INP, memory and a
  30-second room/sticker trace; inspect dropped frames and long tasks. Test reduced
  motion and background-tab animation suspension. Do not infer these from a PC.

## Payments (live, bounded charge)

- [ ] Operator confirms live product prices, tax behavior, API environment and
  webhook endpoint. Use a real test customer authorized for the charge.
- [ ] Max purchase grants only the paid account, correct product/language and
  provider billing period. Cancel actually stops renewal in Dodo. Resume removes
  scheduled cancellation in Dodo. Past expiry denies paid API access.
- [ ] Business purchase enforces paid seat quota under concurrent invitations.
  Adding seats collects the provider's prorated payment and updates recurring
  billing. A failed payment grants no additional seats.
- [ ] Invalid signature, modified raw body, timestamp >5 minutes old/future,
  duplicate and reordered events do not grant access. Another account cannot
  confirm a payment; client price/plan/seats/role patches cannot promote it.
- [ ] Refund/dispute state is reflected by policy; verify provider notifications
  and perform any authorized test-charge refund. Record receipt IDs securely.

## Privacy and child safety

- [ ] All age values, including under 13 and ages 13–15, are accepted by the
  neutral onboarding age form; children cannot reach learning or paid APIs
  before verified consent. Sign-in leads to onboarding; no birth date is retained.
- [ ] Staff verification procedure and notice are approved; a single-use code
  cannot be replayed, expired codes fail, withdrawal invalidates sessions.
- [ ] Existing accounts with unknown age are gated. New registration cannot
  choose privileged role or paid/consent profile fields.
- [ ] Policy/terms show the actual operator/contact and reviewed retention,
  provider and jurisdiction details in every offered UI language.
- [ ] Export is complete and private. Delete with wrong credentials fails;
  confirmed deletion removes learning records, invitations, owned classes,
  local caches and account-linked recordings. Reapply deletion after restore.
- [ ] Harmful model replies, correction tips, malformed classifier responses,
  unsupported languages and moderation outages never show/speak raw output.
  Verify the same replacement is shown and spoken.

## Accessibility

- [ ] Keyboard only: navigation order follows visible content; bottom nav names
  are announced, current tab is conveyed, icon buttons have names.
- [ ] Open every popup (room stats/shop, level-up, lesson quit, plans/cancel,
  account deletion, word details, language picker, histories, class/teacher
  dialogs, editor drawer, celebrations). Tab/Shift+Tab stay inside the topmost
  popup, Escape closes only it, and focus returns to its trigger.
- [ ] Screen reader: dialog name, headings, progress, errors, date/consent
  inputs and live updates. Verify VoiceOver on iOS and TalkBack on Android.
- [ ] Contrast at normal text 4.5:1, large text/UI components 3:1; check computed
  colors on their actual backgrounds, including disabled and dark-mode states.
- [ ] 200% text zoom, landscape, reduced motion and visible keyboard focus.

## Operations

- [ ] TLS, production demo-login guard, CORS/CSRF, cookie flags and secret scan.
- [ ] Encrypted offsite backup, isolated restore and deletion reapplication.
- [ ] Uptime failure, 5xx, backup freshness and AI budget alerts reach the operator.
- [ ] Dependency vulnerability review, native translation review and model
  commercial-use license decision are recorded.

## Signup regression verification — 2026-11-14

- Automated OAuth HTTP regression: a cross-site Google callback reaches state
  validation; invalid state is rejected before token exchange. Foreign API
  writes and unrelated cross-site API reads remain blocked.
- All 139 generated mascot message/title keys resolve to copy in every one of
  the 29 interface languages. Restored 114 pruned message keys and protected
  the numbered message families from future pruning.
- Isolated database: 17 HTTP checks passed for pending signup, profile access,
  blocked learning, invalid dates, adult age completion, under-16 consent,
  invalid parent codes, OAuth redirects and foreign origins. No live users or
  payment/provider calls were used.
- Browser at 390 × 844: login shows the welcome before the age question;
  submitting a synthetic adult date proceeds to the name question without
  restarting onboarding. This is viewport QA, not a physical-phone OAuth test.

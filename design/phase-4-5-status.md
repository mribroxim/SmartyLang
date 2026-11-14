# Phase 4 and 5 handoff — 2026-11-13

Original plan read successfully: `C:\Users\user\.claude\plans\proud-dazzling-sphinx.md`. That file remains unchanged. This note continues `design/phase-3-wiring-status.md`.

## Phase 4 implemented

- Five hearts, one regenerated every four hours, with three grace mistakes for learners starting without XP or reading history. `src/lib/hearts/hearts.ts` is pure and accepts an explicit clock.
- Account-scoped `smarty_hearts_v1` external store, included in progress sync as `hearts`. The newer action timestamp wins in browser restores and server writes. Passive regeneration does not manufacture a newer action timestamp.
- Path exercises emit explicit graded-answer events with stable question identifiers. Only a wrong first attempt costs a heart. Repeated attempts, retry queues, Today, heart practice and practice tabs do not cost hearts. Microphone/transport failures are not graded as wrong answers.
- Empty hearts pause the bite and prevent pending exercise finish timers from awarding/advancing behind the sheet. The learner can practise, use Today, buy a refill, return to the path, or open Smarty Max plans.
- Heart practice has exactly six no-stakes questions, prioritizes language-scoped missed words, and awards one heart on completion. It uses beginner-appropriate fallback words from the selected level when there are too few missed words.
- Full refill costs 120 game coins. The store checks the live balance of hearts to prevent a duplicate charge once full. Max/admin show unlimited hearts; preview roles hide hearts and save no practice rewards.
- Free signed-in learners can use `lessons/path`, `lessons/bite`, `lessons/today` and `lessons/hearts`. Other feature tabs and the old lesson library remain gated. Free onboarding can now enter the path.
- Existing bite snapshots migrate into a small map under the same `bite_session_v1` key, preserving a paused path bite while Today or heart practice runs. First-attempt identifiers and mistakes survive resume.
- `server/progressMerge.ts` and the transaction in `progress.set` preserve newer heart actions and accumulate daily completion claims during writes from multiple devices. No database migration was added.
- Store/reward changes sync after a short debounce. A small keepalive payload flushes pending critical progress on page hide and retries when the browser comes online.

## Phase 5 implemented

- The home dashboard greeting is replaced with TodayHero: named time-of-day/season/return greeting, streak/hearts/XP goal, daily bite CTA, continue-path card, three-node path preview, a tip and streak-risk banner. Existing dashboard widgets remain below it.
- Daily sessions are seeded by local date and learning language and cached in account-scoped `today_session_v1`. The usual selection is three new words, five due reviews and three missed words, with saved-word backfill. New learners revisit their three new words in both directions to fill eleven questions.
- Today has a vocabulary introduction, short review questions, normal bite feedback, resume, completion and SRS scheduling. It is accessible at zero hearts.
- Daily completion grants 15 XP once per local day/language. A score of at least 80% grants one heart once; a later successful replay can earn the heart after an earlier lower-scoring completion. Replays do not grant the XP again.
- Daily completion claims sync as `todayBites`; deterministic union merging retains already-claimed rewards and the best accuracy.
- In-app reminder entries appear in NotificationBell at the selected reminder time and for a streak at risk after 18:00. Entries deduplicate, can be marked read and open Today.
- Desktop notifications require an existing grant or an explicit permission-button click. They run while the app is open. No background web push or Codex automation was created.
- Added English UI strings; generated translations remain deferred to Phase 7. The mobile top bar was adjusted to fit the new heart chip at phone width.

## Validation

- `node --import tsx --test --test-reporter=dot tests/bites.test.ts tests/hearts-today.test.ts`: **32 tests passed**.
- `node scripts/verify-stickers.mjs`: **229 checked, 0 problems**.
- `npm run build`: **passed**. Existing large-chunk and mixed static/dynamic-import warnings remain.
- Native `node --experimental-strip-types` import of the server progress helper: **passed**.
- `npm run lint`: the same **7 pre-existing errors** in `ComprehensiveListening.tsx`, `ComprehensiveReading.tsx` and `PaymentPlans.tsx`; no additional errors. Those files were not changed in this session.
- Locale audit: **686 English keys**, 28 generated language packs. The newly missing translations remain English fallback; full regeneration is Phase 7.
- Local browser tests used real lesson content with an isolated mocked API/account and namespaced storage. No real account progress was changed.
- Verified a wrong first attempt consuming the last heart; a repeated mistake after resume consuming no extra heart; a different wrong first attempt consuming the earned heart; six-item practice restoring a heart; and returning to the paused path step.
- Verified immediate missed-word persistence: subsequent heart practice started with the newly missed word `name`.
- Verified Today starting at zero hearts, eleven questions, **+15 XP / +1 heart** on a perfect completion, and **+0 XP / no second heart** on replay. Mock progress went **100 → 105 → 120 → 120 XP** including heart practice. Three saved words received future SRS dates.
- Verified the coin balance **251 → 131** after one refill, five full hearts, and those values surviving an immediate reload. The refill button was disabled while full.
- Verified free-user path/Today access and the Practice paywall; Max's `∞` even with an underlying zero balance; and no heart chip for a preview account.
- Verified 390px dark layouts, a mocked 19:00 seven-day streak-risk banner, two reminder entries, reminder navigation into Today, and the unread badge changing from two to one.
- Verified a mocked microphone failure leaving the one-heart balance intact. Real microphone grading was not tested.

## Preview and evidence

Start `npx vite --host 127.0.0.1 --port 4173` and open `tests/preview/phase45.html` through that server. This is a development-only entry outside the production Vite entry graph.

- `?account=free&case=sample&hearts=1`: free account, one heart, 240 starting coins.
- `&scenario=resume`: seed the final step of the first path bite once in that test case's storage.
- `&width=390&dark`: phone-width dark preview.
- `&hour=19&reminders=1`: isolated clock/reminder fixture with a seven-day streak.
- `&micError=1`: mock speech/microphone failures without requesting microphone access.
- `?account=max` or `?account=preview`: entitlement/preview checks.

Screenshots: `design/qa/phase45-today-phone.jpg` and `design/qa/phase45-today-reward.jpg`.

## Remaining work

- Real signed-in/PostgreSQL integration, simultaneous-device verification, real-phone performance, actual microphone grading and OS notification delivery remain unverified. The browser QA uses mocks; server merge logic has focused tests.
- Phase 6 is now implemented; see `design/phase-6-status.md` for onboarding, the first-bite landing flow and validation.
- Phase 7: remaining sticker placement, all generated translations, broader accessibility and polish.
- The older Phase 3 checkpoint/Boss battle and viewport-virtualization work remains pending; this session did not implement it.

No deployment, commit or reset was performed. The checkout already contains extensive unrelated changes, which were preserved.

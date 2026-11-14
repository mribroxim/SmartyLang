# Phase 3 wiring handoff — 2026-11-13

Update: Phases 4 and 5 have since been implemented. See `design/phase-4-5-status.md` for current status and remaining verification; the notes below describe the earlier Phase 3 handoff.

Read the original plan successfully at `C:\Users\user\.claude\plans\proud-dazzling-sphinx.md`. That file was not changed.

## Completed in this session

- Learn now defaults to `#/lessons/path`; level changes use `#/lessons/path/<level>`.
- Path nodes open `#/lessons/bite/<lang>/<passageId>/<index>`. Deep links select the correct passage across levels and learning languages. Bite routes hide the app navigation.
- Existing lesson library and certificate screens remain available through **All lessons**, with a return to the path.
- Wired the existing BiteRunner/BiteExercise/BiteComplete screens through LessonsView and a new ProgressContext. App retains ownership of XP and habit state.
- Finished bites award 10 XP, +5 at 90% accuracy, +5 for a perfect result; coins use the existing bite reward helper. The normal profile/habit sync updates total XP, coins, weekly XP and streaks. One `lesson-bite` completion is recorded per finished session.
- Read-aloud inside a bite uses the shared reading screen and its score; its standalone XP reward and old results modal are suppressed.
- Completed steps update legacy lesson scores; completed bites store best accuracy, attempt count and completion time. Old passed lessons map to completed bites. Certificate checks accept fully mastered bite paths.
- Added saved-step resume in the account-scoped `bite_session_v1` cache. Reload/quit preserves completed steps; the current unfinished step starts again. A completed bite clears its snapshot.
- Added shared SRS application so each saved word is reviewed once per session; first-attempt mistakes retain review priority after a successful retry.
- Daily XP targets now follow the Smarty minutes preference in the habit engine, mobile top bar, desktop sidebar and reading reward display.
- Cloud restore merges local and cloud lesson scores/bites rather than discarding newer local progress. The path refreshes after restore.
- Fixed query parameters being appended inside the hash route, incorrect raw-count scoring in bite exercises, the small-lesson vocabulary split, fallback feedback name interpolation, and horizontal path/popover positioning on narrow screens.

## Validation

- `node --import tsx --test --test-reporter=dot tests/bites.test.ts`: **14 passed**.
- `node scripts/verify-stickers.mjs`: **229 checked, 0 problems**.
- `npm run build`: **passed**. Vite continues to warn about large chunks and mixed static/dynamic imports.
- `npm run lint`: the same **7 pre-existing errors** in `ComprehensiveListening.tsx`, `ComprehensiveReading.tsx`, and `PaymentPlans.tsx`; no additional errors. Those files were not edited in this session.
- `node scripts/audit-ui-locales.mjs`: confirms the deferred translation work; the 28 generated packs each lack 265 current keys. English fallback remains in use. No locale regeneration was run.
- Isolated browser preview with the actual lesson data and mocked API/account: desktop light path, library, vocabulary cards, resumed Word Match, missed-word retry quiz, completion reward, Continue, quit, and return to path; 390px dark path/popover and read-aloud screen. Observed **+10 XP**, **80% accuracy**, **1-day streak**, **one completion**, the mock sync payload reaching **10 XP**, and **1/6 bites** on the path.
- Preview fixture: `tests/preview/phase3.html` with `tests/preview/phase3.mjs`. It namespaces local storage and mocks all API calls. It is a development-only entry and is excluded from the normal Vite production entry graph. Start `npx vite --host 127.0.0.1 --port 4173` to use it; `?width=390&dark` opens a phone-width frame. `?scenario=resume` seeds the final step of the first bite once in its QA storage.
- Screenshot: `design/qa/phase3-phone-path.jpg`.

## Still pending

- Real signed-in account/cloud validation and microphone grading; real-phone performance and Beginner/Advanced bite timing.
- The broader original Phase 3 checkpoint/Boss battle and viewport virtualization work is not implemented by this wiring pass. The existing path shows unit chest artwork.
- Phase 4: hearts, regeneration/refills, heart practice and free access rules. Free-user access gates remain as before.
- Phase 5: Today screen, daily session and reminders.
- Phase 6: Smarty onboarding and landing directly in the first bite.
- Phase 7: remaining sticker placements, full translation regeneration, accessibility and polish.

The checkout already contained extensive tracked and untracked work before this session. No reset, commit, deployment or unrelated-file cleanup was performed.

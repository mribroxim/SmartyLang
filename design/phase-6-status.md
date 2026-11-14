# Phase 6 — Smarty onboarding

Implemented from `C:\Users\user\.claude\plans\proud-dazzling-sphinx.md` on 2026-11-13. The original plan was read successfully and has not been modified.

## Behavior

- Onboarding starts with **Meet Smarty**, Welcome aboard and Hello stickers, and an optional name/nickname (40 characters). The name is saved as `preferredName` in the existing account-scoped, synced Smarty preferences.
- Language selection uses Choose your language and Language Portal stickers. Native/UI language and learning language remain separate; existing Arabic display options and placement content are preserved.
- The goal screen adds radio choices for 5/10/15/20 minutes, corresponding to 15/30/45/60 XP. The default is the existing preference (10 minutes for a fresh account). Each choice changes Smarty's sticker and reaction.
- Placement uses Level check, Hmm and Confident stickers. Step/question transitions reset the app scroller and focus the heading. Skipping setup goes to the result screen, with Beginner as the fallback when no questions were answered.
- The result screen uses Magic Paw, shows the daily goal, and offers **Start my first bite**. App loads content for the selected language, finds the first unfinished bite at the suggested level and navigates to `#/lessons/bite/{lang}/{passageId}/{biteIndex}`. If that level has no available content, it falls back to the path. Go to Home remains available.
- `saveOnboarding` persists `dailyMinutes` alongside starting level, learning goal and completion timestamp. The server profile-update allowlist accepts dailyMinutes and restricts it to 5/10/15/20. No database migration is needed.
- A failed save keeps onboarding open with a retry message. Both finish actions are disabled while saving, with an immediate duplicate-submit guard. Preferences and local completion are applied after the profile save succeeds.
- Added English keys. Regenerating the other 28 UI languages remains Phase 7; new keys use the existing English fallback.

## Validation

- Production build passes (existing bundle-size and mixed-import warnings remain).
- Type check reports only the same seven pre-existing errors in ComprehensiveListening, ComprehensiveReading and PaymentPlans.
- Existing bite/hearts/Today suite: 32 tests passed.
- Sticker verifier: 229 checked, zero problems.
- Isolated browser QA, free account: entered Aziza, chose 15 minutes, answered a placement question, simulated one profile-save failure, retried successfully and entered `#/lessons/bite/en/b1/0`. Reload preserved completion; Home displayed Aziza and the 45 XP goal.
- 390px dark browser QA: blank optional name accepted; minute choices responded; no horizontal overflow. Selected Spanish, completed its eight scored placement questions, received Advanced, and launched an Advanced Spanish bite (Opacidad). Reload preserved Spanish, Advanced, the 20-minute / 60 XP goal, and completed onboarding.
- Real account/PostgreSQL writes, another device and a physical phone have not been tested. Browser QA mocks all API requests and uses isolated localStorage.

## Try it locally

Run `npx vite --host 127.0.0.1 --port 4173 --strictPort`, then open:

`http://127.0.0.1:4173/tests/preview/phase6.html?account=free&case=phase6-user-tryout&onboarding=1#/dashboard`

Use a new `case` value for a fresh onboarding run. Optional `saveError=1` fails the first profile save only. `width=390&dark=1` wraps the preview in a phone-sized dark iframe. The shared fixture persists mock profile updates so completion can be checked after reload; it is outside the production entry graph.

Phase 7 is next. The earlier checkpoint/Boss battle and path virtualization gaps listed in the Phase 3 handoff remain separate follow-up work.

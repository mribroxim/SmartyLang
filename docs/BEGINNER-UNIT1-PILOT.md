# Beginner Unit 1 trial

This opt-in, English-only trial replaces the first Beginner unit entry with ten
short, goal-led sessions. It keeps the original content, lesson IDs, scores and
rewards intact. The original Unit 1 is available through the comparison link.
No other language or unit uses the new session runner.

The sessions cover greetings, introductions, listening for names, a short be
explanation, mixed review, origin questions, a tiny story, guided conversation,
personal review, and an independent typed mission. Every exercise and distractor
is authored; no runtime model call generates or grades content. Free replies
check the limited taught patterns and accept contractions, case/punctuation,
Unicode names and places. They do not certify arbitrary grammar or real identity.

The session runner gives an explanation after answers, requires correction to
continue, and offers optional speaking and listening transcripts. Skipped
speaking is explicitly reported. First-try scores exclude teaching cards and
skipped speaking. Review prioritizes missed activities from completed sessions.

Pilot completion uses a separate UID-scoped `beginner_unit_one_pilot_v1` store,
merged across devices using the existing progress API. In-progress position is
kept locally; typed names and places are not persisted. The pilot awards no
production XP or coins, changes no existing unlocks, and costs no hearts.

## Local preview

Build with `VITE_UNIT_ONE_PILOT=1`, then run the existing Express app with
`NODE_ENV=development`, `SERVE_BUILT_APP=1`, a loopback HOST, isolated local
database and `DEMO_LOGIN=1`. Synthetic Max and Free demo accounts can open the
trial through `/api/dev/demo-login?as=free&next=unit-one`.

The curriculum and trial instructions are intentionally English. They live in
dedicated content/copy modules; production UI packs were not changed. Native
speaker review, translated instructions, real microphone testing and learner
retention testing are needed before proposing a wider rollout.

## Revert

The default build flag is off. Build without `VITE_UNIT_ONE_PILOT=1` to restore
the original path entry. The original-unit comparison link is also available
within the trial. For complete source rollback, revert the pilot commit on its
isolated branch. No database migration or original progress restoration is needed.

Nothing from this trial is deployed to production. The current delivery is a
local preview; remote private-demo deployment was deferred at the user's request.

## Verification

Type checking and the opt-in production build pass. The complete test suite
passes 75 Vitest cases plus 5 locale-tool cases. Existing 29-language packs
and the static source audit pass; the built-client secret scan reports zero
exposures. Trial teaching/instruction copy remains intentionally English-only.

Browser QA completed the greeting session with a wrong-answer retry, listening
transcript and speaking skip, then completed the independent typed mission with
natural contraction/full-form alternatives. The local database retained the
75% and 100% first-try scores under the separate pilot key. The original course
remained at its previous progress. A Free demo account opened the same unit
with its own empty progress. Overview and grammar screens were inspected at
390 × 844. Microphone recognition and audible playback were not certified.

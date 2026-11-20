# Generating the courses with Gemini

Everything needed is in place. You generate content one unit at a time; the scripts build the prompts and check what comes back.

## What's ready

| Piece | Where |
|---|---|
| Design and level outline (A1 → C1) | `docs/curriculum/OUTLINE.md` |
| Full English curriculum: every unit, lesson and item | `docs/CURRICULUM.md` (per level: `docs/curriculum/*.md`) |
| Plans with exact item ids (used by prompts and the checker) | `content/en/<level>/plan.json` |
| **Ready-to-paste prompt for every English unit** | `content/en/<level>/prompts/unit-NN.txt` (56 files) |
| Prompt to design another language's level | built by `scripts/content/curriculum-prompt.mjs` |
| Prompt to fix checker errors | `docs/prompts/fix-prompt.md` |
| Lesson format | `content/schema/lesson-v2.schema.json`, `docs/CONTENT-HANDOFF.md` |
| Checker | `scripts/content/validate-lessons.mjs` |
| Rooms (one per unit, all 58) | `src/lib/house/rooms.json` |
| Art style, sizes and prompts | `scripts/content/art-prompts.mjs` (writes `content/<lang>/<level>/ART-PROMPTS.md`) |

## A. English, one level at a time

For each unit, in order (Unit 0, 1, 2…):

1. Open `content/en/beginner/prompts/unit-00.txt`, copy all of it into Gemini (2.5 Pro or newer works best; use a fresh chat per unit).
2. Save Gemini's answer as `content/en/beginner/unit-00.json`. Delete any text before `{` or after `}`.
3. Check it:
   ```bash
   node scripts/content/validate-lessons.mjs --plan content/en/beginner/plan.json content/en/beginner/unit-00.json
   ```
   For Elementary and up, add the earlier levels' plans so their words count as known:
   ```bash
   node scripts/content/validate-lessons.mjs --plan content/en/beginner/plan.json --plan content/en/elementary/plan.json content/en/elementary/unit-03.json
   ```
4. If it prints errors, send Gemini `docs/prompts/fix-prompt.md` with the errors pasted in, save the new JSON, check again. Lines starting with `warning:` are advice and don't block.
5. When it prints `PASS`, go to the next unit.

When the whole level passes:
```bash
node scripts/content/validate-lessons.mjs content/en/beginner/unit-00.json content/en/beginner/unit-01.json …   # all units in order, as a chain
node scripts/content/build-course.mjs en beginner      # bundles it; the app picks it up automatically
node scripts/content/art-prompts.mjs en beginner        # list of pictures to make for this level
```
Then send the files to me (or just tell me they're in place) and I'll play-test the level in the app.

## B. Another language (Spanish, Russian, Uzbek, Tagalog, French, German, Chinese, Arabic)

The units, topics, rooms and situations stay the same as English. The words and grammar order are re-designed for that language (no word-by-word translation).

1. Build the curriculum prompt for one level, e.g. Spanish Beginner:
   ```bash
   node scripts/content/curriculum-prompt.mjs es beginner
   ```
2. Paste `content/es/prompts/curriculum-beginner.txt` into Gemini. Save the answer as `docs/curriculum/es/a1-beginner.md` (file names: `a1-beginner`, `a2-elementary`, `b1-pre-intermediate`, `b2-intermediate`, `c1-advanced`).
3. Read it once (or have a native speaker read it). This list decides everything that follows.
4. Turn it into a plan and the unit prompts:
   ```bash
   node scripts/content/plan-from-curriculum.mjs --all es
   node scripts/content/unit-prompt.mjs es beginner --all
   ```
5. Generate and check units exactly as in A (with `es` in the paths).

Language codes: `es` Spanish, `ru` Russian, `uz` Uzbek, `tl` Tagalog, `fr` French, `de` German, `zh` Chinese, `ar` Arabic. Each has character names and numbers the checker accepts, and handles its spelling:
- Chinese: per character.
- Arabic: vowel marks and attached particles.
- French: elisions.
- Uzbek: oʻ and gʻ.

Beginner courses for Russian, Arabic and Chinese start with a script/sounds unit (Unit 0).

## C. Pictures and rooms

- `content/<lang>/<level>/ART-PROMPTS.md` lists every picture with its exact file name, size and prompt (style block first). Pictures are language-neutral: once `apple.png` exists, every language uses it.
- Room backgrounds and furniture for each level's rooms are in the same file.
- Drop finished files into `public/img/words/`, `public/img/scenes/` and `public/room/<room>/…` with the listed names.

## Tips for good results with Gemini

- One unit per chat. Long late-level prompts (up to ~200 KB) are fine for Gemini.
- If Gemini cuts off a long unit, ask "continue exactly where you stopped", then join the two parts.
- If a unit keeps failing on the same word, either let Gemini add it to an item's `forms`, or change the plan. Edit the level's curriculum file, re-run `plan-from-curriculum.mjs` and `unit-prompt.mjs`, and regenerate only the units after the change.
- Keep `plan.json` stable once units are written; changing item ids later breaks the check for units already written.

## Still to do in the app (my side, not blocking generation)

- Show each unit's **Episode** (the reward story) after the unit test. The format and checker already support it.
- Translate Smarty's teach-card notes and task instructions into each learner's own language, so they read and speak in it. Notes and instructions are English in the files, by design.
- Rooms beyond the bedroom need their art before learners can visit them; until then they show as "being built".

You are writing one unit of lessons for **SmartyLang**, a language-learning app for children and adults. The mascot is **Smarty**, a friendly black cat who teaches. You must output **one JSON object only** (no Markdown fences, no comments, no text before or after), exactly in the format described below. A program will check it automatically.

# What you are writing
- Language being learned (target language): **{{LANG_NAME}}** (code `{{LANG}}`)
- Level: **{{LEVEL_NAME}}** (section `{{SECTION}}`)
- Unit {{UNIT}}: **{{UNIT_TITLE}}**. Smarty's room for this unit: **{{ROOM}}** (scenes may happen there)
- Can do by the end of the unit: {{UNIT_CANDO}}
- Grammar and patterns of the unit: {{UNIT_GRAMMAR}}

# Languages inside the JSON
- **Target-language text** goes in: `items[].text`, `items[].forms`, `items[].example`, `grammar.examples`, task `answer`/`answers`/`options`/`audio`/`text`/`tiles`/`pairs`, `story.lines[].text`, `mission.turns[].smarty`, `mission.turns[].example`, `exposure[].text`, `episode.panels[].text`. Write natural, correct {{LANG_NAME}} as a native speaker would say it today. {{LANG_NOTES}}
- **Everything else is in simple English** (the app translates it into the learner's own language): `title`, `canDo`, `scenario`, `prompt`, `explanation`, `note`, `hint`, `setup`, `hook`, `grammar.title`, `grammar.explanation`, `image.describe`, `exposure[].gloss`.

# The teaching method (what makes a great lesson)
1. **One small goal per lesson** (its `canDo`). Teach exactly the lesson's planned items, in the plan's order, nothing more.
2. **Teach, then guided practice, then free use.** Each item gets:
   - an `example` sentence (only taught words);
   - a `note`: ONE friendly sentence Smarty says out loud explaining *when/how* to use it, e.g. "Say 'Can I have…?' to ask for something politely." Never write a dictionary definition.
3. **Practice until it sticks.** Write as many `practice` tasks as the items need: easy items need few, tricky contrasts need many and in several formats.
   - Start with recognising (`choice`, `listen`, `match`), then producing (`build`, `fill`, `speak`).
   - Every task has a short `explanation` saying *why* the answer is right (shown when the learner is wrong).
   - Mix in earlier items often (about a third of tasks); list every earlier item you reuse in `recycle`.
4. **Scene** (`story`): a short, natural dialogue in a real situation (in or near {{ROOM}} when it fits), using the lesson's items. It has:
   - a `hook` (a curiosity question);
   - comprehension `questions`;
   - an `image` describing the scene for an illustrator.
5. **Mission**: Smarty talks, the learner answers in their own words.
   - Give one or more `accept` patterns (regular expressions, anchored `^…$`, lowercase, no punctuation, no `.*`, no `+`, no lookarounds; use `(?:a|b)` and `?`).
   - Give an `example` that matches one pattern after lowercasing, removing punctuation and expanding English contractions (I'm → i am).
6. **Review lessons** (`"type": "review"`): `items` is `[]`. Practice, scene and mission use only earlier items (all listed in `recycle`).
7. **Unit test** (`"type": "test"`, the last lesson): mixes the whole unit; may teach the few items the plan lists.
8. **Only taught words.** Every target-language word in answers, options, audio, tiles, pairs, examples, scene lines, mission lines and episode panels must be either:
   - taught (this unit's items so far, or the "Taught before this unit" list below);
   - listed in some taught item's `forms` (plurals, verb forms, cases, contractions: add them to the item where it is taught in THIS unit);
   - a whitelisted name or number;
   - from B1 on, one of the lesson's `exposure` words, in scene lines only.

   If you need a word that isn't allowed, rephrase.
9. **Pictures**: items marked `"picture": true` in the plan get `"image": { "id": "<english-kebab-slug-of-the-meaning>", "describe": "<one concrete scene to draw>" }`.
   - Items without `picture` get no `image` field at all.
   - Characters are cats (Smarty or friends).
   - No written words in pictures.
   - Every scene gets an image too, id `{{LANG}}-{{SECTION_SHORT}}-u{{UNIT_PAD}}-lNN-scene`.
   - Reuse the same image id for the same meaning across lessons and languages (e.g. `apple`, `brush-teeth`).
10. **Episode** (optional, recommended): `episode` on the unit = the next chapter of Smarty's story, shown as a reward after the unit.
    - 6–12 short `panels` (each one or two sentences, optional `speaker`, optional `image`) plus 2–3 `questions`.
    - Only words taught by the end of the unit (plus this unit's exposure words from B1).
    - End on a small cliffhanger that makes the learner want the next unit.
11. **Tone**: warm, playful, kid-safe, inclusive, culturally neutral. No violence, romance, politics, religion, brands or real people.
12. **Names**: speakers and names in target text must come from this list only: {{NAMES}}. Numbers always allowed: {{NUMBERS}}.

# Exact JSON format
Top level:
```
{ "$schema": "../../schema/lesson-v2.schema.json", "schemaVersion": 2, "lang": "{{LANG}}", "section": "{{SECTION}}",
  "unit": {{UNIT}}, "title": "{{UNIT_TITLE}}", "room": "{{ROOM}}", "lessons": [ … one per planned lesson, in order … ], "episode": { … } }
```
Each lesson:
```
{ "id": "{{LANG}}.{{SECTION}}.u{{UNIT_PAD}}.l01", "section": "{{SECTION}}", "unit": {{UNIT}}, "lesson": 1, "type": "lesson" | "review" | "test",
  "title": "<plan title>", "canDo": "<plan canDo>", "scenario": "<one line: where this happens>",
  "items": [ { "id": "<plan id>", "text": "<plan text>", "kind": "word" | "phrase" | "pattern", "forms": [ … optional … ], "example": "…", "note": "…", "image": { "id": "…", "describe": "…" } } ],
  "grammar": { "title": "…", "explanation": "…", "examples": [ "…" ] },            ← optional, only when a pattern needs a tip
  "practice": [ tasks … ],
  "story": { "hook": "…", "lines": [ { "speaker": "<name>", "text": "…" } ], "questions": [ tasks … ], "image": { "id": "…", "describe": "…" } },
  "mission": { "setup": "…", "turns": [ { "smarty": "…", "accept": [ "^…$" ], "example": "…", "hint": "…", "itemIds": [ "<item ids>" ] } ] },
  "exposure": [ { "text": "…", "gloss": "English meaning" } ],                      ← B1+ only, words used in the scene that aren't taught
  "recycle": [ "<ids of earlier items used anywhere in this lesson>" ] }
```
Tasks: every task has `id` (unique in the lesson, e.g. `{{LANG}}.{{SECTION}}.u{{UNIT_PAD}}.l01.task.pick-hello`), `kind`, `prompt` (English instruction), `explanation`, `itemIds` (the items it practises; earlier ones must be in `recycle`), and `answer` (or `answers` when several are correct), plus:

| kind | extra fields | rules |
|---|---|---|
| `choice` | `options` | the answer + at least 2 distinct wrong options |
| `listen` | `audio`, `options` | `audio` is spoken; options include it |
| `build` | `tiles` | all words of the answer + 1–2 extra tiles; must be buildable from whole tiles |
| `fill` | `text` (exactly one `___`), optional `options` | answer fills the blank |
| `match` | `pairs`: `[{ "left", "right" }]` | sides distinct; no answer field needed |
| `speak` | `text` | `answer` equals `text` |

Rules the checker enforces:
- Item `id` and `text` exactly as in the plan, in order.
- Lesson `type` exactly as in the plan.
- Every new item is used in at least one practice task.
- No item is taught twice.

# Plan for this unit (copy ids, texts and types exactly; add an image to every item marked picture)
{{UNIT_PLAN}}

# Taught before this unit (you may use these words freely; list an item's id in `recycle` when a task, question or mission turn targets it)
{{TAUGHT_BEFORE}}

# A complete example lesson in the right format (from an English Beginner course; match its structure and quality, not its content)
{{EXAMPLE}}

Now write Unit {{UNIT}}. Output the JSON object only.

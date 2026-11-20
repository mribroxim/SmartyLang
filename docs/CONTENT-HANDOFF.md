# What to send for a course: lessons, pictures, audio

You make the content; this is the exact shape the app reads. Follow it and a course goes in with one validation command and one build command, with no code changes.

## 1. Folders and file names

```
content/<lang>/<section>/unit-01.json, unit-02.json …  ← lessons (one file per unit; as many units as the level needs)
public/img/words/<image-id>.png                        ← word pictures (shared by all languages)
public/img/scenes/<image-id>.png                       ← scene pictures
public/room/<room-id>/background.png                   ← room background
public/room/<room-id>/<slot>/<design>.png              ← furniture
public/anim/<id>.webp                                  ← Smarty animations
```
- `<lang>`: `en`, `ru`, `uz`, `es`, `tl`, `fr`, `de`, `zh` or `ar` (the language being **learned**).
- `<section>`: `beginner`, `elementary`, `pre-intermediate`, `intermediate` or `advanced`.
- Image ids: lowercase letters, digits and hyphens only (`brush-teeth`, `u03-l04-scene`). The same picture id can be used by every language.

## 2. One unit file

Exact shape: `content/schema/lesson-v2.schema.json`. A finished example: `content/en/beginner/unit-02.json`. In short:

```jsonc
{
  "schemaVersion": 2, "lang": "en", "section": "beginner", "unit": 3,
  "title": "Food & Drink", "room": "kitchen",
  "lessons": [ /* 3–20 lessons, numbered 1…N */ {
    "id": "en.beginner.u03.l01", "section": "beginner", "unit": 3, "lesson": 1,
    "title": "I'm hungry", "canDo": "Say you are hungry or thirsty",
    "scenario": "One line: where this happens.",
    "type": "lesson",                             // lesson (default) | review (no new items) | test (unit test, 0–3 new items)
    "items": [ /* NEW items: as many as this lesson's goal needs */ {
      "id": "en.beginner.u03.l01.water", "text": "water", "kind": "word",   // word | phrase | pattern
      "forms": ["waters"],                       // optional: plurals, -s/-ing forms, contractions you will use
      "example": "Can I have water, please?",    // only taught words
      "note": "Say 'water' for the clear drink.", // what Smarty says on the teach card (one sentence)
      "image": { "id": "water", "describe": "a glass of water with a cat paw reaching for it" } // optional
    } ],
    "grammar": { "title": "…", "explanation": "…", "examples": ["…"] },       // optional
    "practice": [ /* as many tasks as it takes to master the items, see below */ ],
    "story": {                                    // the Scene
      "hook": "Who is hungry?",
      "lines": [ { "speaker": "Mia", "text": "I'm hungry!" } ],               // as long as the scene needs
      "questions": [ /* comprehension tasks, any number */ ],
      "image": { "id": "u03-l01-scene", "describe": "Mia and Smarty in the kitchen…" }
    },
    "mission": {
      "setup": "One line.",
      "turns": [ { "smarty": "Are you hungry?", "accept": ["^yes i am(?: hungry)?$", "^no i am not$"],
                   "example": "Yes, I am.", "hint": "Answer yes or no.", "itemIds": ["…"] } ]  // any number of turns
    },
    "exposure": [ { "text": "umbrella", "gloss": "optional" } ],   // B1+ only: words glossed in the scene, not tested
    "recycle": ["en.beginner.u02.l04.cake"]       // every EARLIER item this lesson uses
  } ]
}
```

### Practice task kinds
Every task has `id`, `kind`, `prompt` (instruction in plain English), `explanation` (why the answer is right), `itemIds`, and `answer` (or `answers` when several are right).

| kind | extra fields | the learner… |
|---|---|---|
| `choice` | `options` (answer + at least 1 wrong) | picks the right option |
| `listen` | `audio`, `options` | hears `audio`, picks it |
| `build` | `tiles` (all words of the answer + 1–2 extra) | builds the sentence |
| `fill` | `text` with one `___`, optional `options` | fills the gap (types it if no options) |
| `match` | `pairs`: `[{ "left", "right" }]` (2 or more) | matches pairs |
| `speak` | `text` | says it aloud |

### Rules the validator checks
- Every word in answers, options, audio, scene lines, examples and mission examples must already be taught (in this lesson, earlier lessons, or earlier units), or be listed in some item's `forms`. Numbers zero–ten and the names Smarty, Mia, Sam, Ben, Leo, Ana, Lily, Omar, Zara and Tom are always allowed.
- No item may be taught twice; reuse it through `recycle`.
- **No size limits anywhere:** items, tasks, scene length, mission turns, lessons per unit and units per level are all sized by need. The validator only *warns* when a lesson looks unusually heavy or light, or when little older material is recycled; it never blocks.
- `review` lessons teach no new items; a normal `lesson` teaches at least one; `test` lessons may teach a few.
- From B1, scene lines may also use the lesson's `exposure` words (glossed for the learner, not tested). A1–A2 scenes use only taught words.
- Recycling: aim for about a third of practice reusing earlier items (a warning, not a rule).
- Scene speakers must come from the name list. Each scene has an `image`.
- Mission `accept` patterns are anchored (`^…$`), with no `.*`, `+` or lookarounds. They're matched after lowercasing, removing punctuation and expanding contractions (`I'm` → `i am`). The `example` must match one pattern. Replies that use the turn's target item also count.
- Only `prompt`, `explanation`, `note`, `hint`, `setup` and `describe` may use untaught words; they're instructions.

## 3. Pictures and animations

Sizes, file types and the shared style text are in `docs/ART-PROMPTS.md`. In short:

| What | Size | File |
|---|---|---|
| Word picture | 1024×1024 | PNG, transparent background |
| Scene | 1600×1000 | PNG |
| Room background | 1920×1080 (floor line at 63% from the top) | PNG |
| Furniture | 1024×1024, 3/4 view, standing on the bottom edge | PNG, transparent |
| Smarty animation | 512×512, 1.5–3 s loop | animated WebP/APNG or Lottie JSON |

- Name each file exactly as its `image.id` (or as listed in `content/<lang>/<section>/art-list.csv`).
- Missing pictures just don't show; nothing breaks.
- I convert PNGs to WebP when they go in.

## 4. Rooms (one per unit)

Rooms and their furniture slots: `src/lib/house/rooms.json`. Each room needs:
- 1 empty background;
- 6 slots × 6 designs: `simple` (free), `paw-print`, `cloud`, `moon-and-stars`, `fish-bone`, `cat-ears`.

To change a room or its slots, edit that file or tell me.

## 5. Audio (optional)

- Without audio files, the app speaks with the voice it already uses.
- For recorded or pre-generated audio, send `public/audio/<lang>/<item-id>.mp3` (item text) and `public/audio/<lang>/<lesson-id>-line-<n>.mp3` (scene lines, from 1), and I'll make the app prefer them.

## 6. Translations of Smarty's notes (for narration in the learner's language)

- Optional per UI language: `content/<lang>/<section>/notes.<uiLang>.json`, a map `{ "<item-id>": "translated note" }`.
- Without it, notes show in English.

## 7. Checking your files, and what I do when they arrive

```bash
node scripts/content/validate-lessons.mjs content/en/beginner/unit-01.json content/en/beginner/unit-02.json …   # all units, in order
node scripts/content/art-prompts.mjs      # refreshes the art list from your files
node scripts/content/build-course.mjs en beginner   # bundles the course for the app
```
1. Run the validator, then fix or return anything that fails.
2. Bundle the course and turn on that language/section in the app (one line in `src/data/levelTexts.ts`).
3. Convert the images and check them in the app: teach cards, picture questions, scenes, rooms.
4. Play a few lessons end to end on a phone-size screen.

Which units and lessons each level has, and what each teaches: `docs/curriculum/OUTLINE.md` plus `docs/CURRICULUM.md`.

Easiest way to send: put the files in the folders above, or zip them in that structure.

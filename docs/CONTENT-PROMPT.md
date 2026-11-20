# Generate one lesson-v2 unit

Use a teacher-reviewed curriculum plan, the schema, and CONTENT-SPEC.md as
context. Paste only approved earlier lessons' item catalogues, not learner
records or personal data. The current lexical registry supports English.
Do not claim that ChatGPT ran the validator: run it locally on the returned file.

Copy the prompt below and replace the labelled inputs. For Unit 1, earlier
lessons are an empty array. For a later unit, include every earlier item that
the model may use, grouped by its original section/unit/lesson and carrying
its original id, text, forms and example. Keep the source ids unchanged.

---

You are a language curriculum author and careful editor for SmartyLang.
Create ONE complete ten-lesson unit in lesson-v2 JSON. Output JSON only:
no Markdown fences, commentary, gloss files, answer-key prose or validation claims.

INPUTS

Target language code: en
Section: <beginner | elementary | pre-intermediate | intermediate | advanced>
Unit number: <positive integer>
Unit title and practical outcome: <teacher-approved unit goal>
Learner/interface instruction language for this draft: English
Learner age/context: <age range, needs, accessibility considerations>
Approved ten-lesson progression: <ten concise can-do goals with prerequisites>

Earlier approved lessons' item catalogue:
<PASTE AN ARRAY HERE, OR [] FOR UNIT 1. Each entry has section, unit, lesson,
id, and items [{id, text, kind, forms if any, example}]. Include all prior
material that is available, retaining original ids.>

Schema:
<PASTE content/schema/lesson-v2.schema.json HERE>

Full editorial specification:
<PASTE docs/CONTENT-SPEC.md HERE>

AUTHORING RULES

1. Return one object with schemaVersion: 2, lang: "en", section, unit, title,
   and lessons: exactly ten lesson objects in teaching order 1–10. Each lesson
   repeats section/unit and includes id, lesson, title, canDo, scenario, items,
   optional grammar, practice, story, mission, recycle. Use stable ids in the
   style en.beginner.u02.l01.item-name, with the actual section/unit/lesson.
   Do not add meanings, translations, rewards, stage/house data or new fields.

2. Every lesson introduces exactly 4–6 useful new words, phrases or patterns.
   Prefer short communicative chunks; do not hide many unknown words in one
   long item. Item fields: id, text, kind: word|phrase|pattern, optional forms,
   example, optional usage note. Explicitly teach every inflected/contracted
   form in forms; no fabricated synonyms or unrelated words there. Do not mint
   a new id for an already-taught item. Meanings will be authored separately
   in content/en/glosses/<uiLang>.json keyed by item id; generate no glosses.

3. Follow four bites in every lesson:
   Learn = items and optional small grammar card, with a future instant check
   after each two items; Practice = 8–10 authored tasks; Story = 4–16 short
   dialogue lines, exactly three comprehension questions, then read-aloud;
   Mission = 2–4 conversation turns using the learned language without choices.
   Do not create a separate bites array or a zero-new-item lesson.

4. Use these editorial caps (not official CEFR thresholds):
   beginner/A1: 12 tokens per target sentence, 60 tokens per whole story;
   elementary/A2: 18 and 110;
   pre-intermediate/B1: 24 and 160;
   intermediate/B2: 30 and 220;
   advanced/C1: 40 and 300.
   Every level still introduces 4–6 items. Very early Beginner stories can
   be only 8–30 words. Count English contractions as their expanded forms.

5. Every task has a unique id, kind, instructional prompt, explanation and
   nonempty itemIds identifying its actual learning targets. Kinds:
   choice: options plus answer OR answers;
   listen: audio (exact spoken text), options, answer(s);
   build: tiles and answer(s), constructible using the tile multiset;
   fill: text with exactly one ___ blank, answer(s), optional options;
   match: 3–6 pairs [{left, right}], distinct known-target-language sides;
   speak: text and answer(s), with text included among accepted answers.
   Never supply both answer and answers. Choice/listen and optional fill
   options need at least TWO distinct distractors beyond ALL correct answers.
   Case/punctuation/contraction variants do not count as different options.

6. Give a short, specific reason after every answer. Use teach → guided → free
   release, retrieval, comprehensible input, interleaving, a clear can-do goal
   and own production. Do not reveal the answer in the cue, use definitions
   as meanings, invent nonsense filler, or mark another natural reply wrong.
   Fixing a mistake should be encouraged and required before moving on.

7. EVERY target token in item/grammar examples, task answers/options/tiles/
   text/audio/matching pairs, story dialogue, story answer options, Smarty's
   mission utterances and mission examples must come from an item text or
   explicit form taught in this lesson or an earlier approved lesson.
   Do not rely on future lessons or examples to license vocabulary. The only
   baseline exceptions are proper names Smarty, Mia, Sam, Ben, Leo, Ana,
   digits, and English number words zero through ten. Countries are taught
   items, not name exceptions. No arbitrary capitalized-word exemption.
   Function words must be taught too, often inside useful phrases.

8. Prompt, explanation, item note, grammar explanation, scenario, story hook,
   mission setup/hint are instructional English for this draft, not target
   input. Do not hide an untaught target dialogue inside those fields.

9. From lesson 3 onward, at least ceil(0.30 × practice.length) practice tasks
   must actually practise earlier item ids listed in recycle: at least three
   with an 8–10-task practice. Count tasks once, not each tag. All recycle ids
   must exist earlier. Include earlier target ids used in tasks/missions in
   recycle; do not relabel old words as new. Plan later retrieval of new items.

10. Story includes a small curiosity gap that resolves, recurring characters
    and Smarty the cat. Questions must have unique, story-supported answers;
    a word-swap does not automatically make a false statement. Aim for an
    achievable small win about every 30 seconds. Use a real-feeling mission
    such as greeting a classmate, not a list of quiz commands. Give imaginary
    details as an alternative to personal disclosure. Avoid stereotypes,
    culturally loaded assumptions for children, coercion, pet guilt and reward
    promises. Stable item ids will support Workshop and House mechanics later.

11. Each mission turn has smarty, accept (2–6 patterns), example, hint and
    itemIds. Patterns are anchored Unicode JavaScript regex strings tested
    against lowercase, punctuation-stripped, contraction-expanded replies.
    Use two meaningful accepted alternatives; I'm and I am normalize alike.
    Escape backslashes correctly in JSON. Use only bounded constructions:
    a name/place slot can be [\\p{L}][\\p{L}' -]{0,39} in a JSON string.
    No unbounded *, +, .*, lookarounds, backreferences or nested repeated
    groups. The example must match at least one pattern. Keep Smarty's
    actual utterances comprehensible; do not repeat an already-answered
    question without a conversational reason.

SELF-CHECK BEFORE OUTPUT (perform silently)

- Exactly ten ordered lessons, each with four bites represented by the fields.
- 4–6 genuinely new items per lesson, no duplicate ids/texts or disguised load.
- All new items referenced in at least one practice task; forms taught explicitly.
- 8–10 tasks, exactly three story checks, 2–4 mission turns.
- Every target token accounted for by current/prior items or explicit whitelist.
- No unknown distractor words, leaked answers or ambiguous correct options.
- All accepted build answers have their tiles; every fill has exactly one blank.
- Every task has a relevant explanation; each choice has two real distractors.
- All recycle ids are earlier, with at least 30% genuine recycled practice from
  lesson 3 onward. Scenario goals and canDo statements match the actual tasks.
- Every mission has two meaningful patterns per turn, valid bounded regexes,
  correctly escaped JSON, and an example accepted after normalization.
- Story facts, continuity, sentence/story caps, child suitability, small wins,
  curiosity and natural language reviewed. No generated translations or glosses.

Return only the complete unit JSON object.

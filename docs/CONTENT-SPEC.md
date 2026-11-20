# SmartyLang lesson v2: content authoring specification

This is the Phase 2 authoring contract. It supplies validated data, not a new
lesson runner, translation pipeline, Workshop, reward system or House UI.
The English Beginner Unit 1 port is in `content/en/beginner/unit-01.json`.
Its schema is `content/schema/lesson-v2.schema.json`.

## Write for an ability

Begin with one observable **can-do goal**: “Introduce yourself and ask a name,”
not “Finish ten questions.” Give that ability a familiar, child-safe scenario.
Use a fictional name or place when personal details are unnecessary.

- **Small load:** introduce 4–6 genuinely new words, phrases or patterns. Prefer
  useful chunks. A long sentence is not a way to hide many new words in one item.
- **Teach → guided → free:** show the item with a comprehensible meaning, audio
  and example; support the first attempts; then remove choices in the mission.
- **Retrieval:** learners must remember something, not only copy a visible
  answer. Give a one-line explanation of why the answer fits. A wrong answer
  should lead to correction and another attempt, with no trick or shame.
- **Interleaving and recycling:** mix older targets with new ones and bring them
  back in a new context. Repeated exposure is useful; a fresh item id for the
  same item is not new learning.
- **Comprehensible input:** the story and every learner-facing option contain
  only taught language. Understanding the audio/story must be possible before
  asking learners to reproduce it.
- **Own production:** every lesson ends with a short conversation. Typed or
  spoken replies allow natural alternatives and optional imaginary details.
- **Evidence:** recognition, recall and use are different. A multiple-choice
  success alone should not be described as mastery or spontaneous speaking.

## Four bites, represented by four parts of the data

| Bite | Content | Authoring requirement |
| --- | --- | --- |
| Learn | `items`, optional `grammar` | 4–6 cards, each with gloss lookup, audio text and one example. The runner should insert an instant check after each two items. |
| Practice | `practice` | 8–10 authored tasks, with explanations and a mix of useful response modes. Correct mistakes before continuing. |
| Story | `story` | A short dialogue, exactly 3 comprehension checks, then a read-aloud opportunity. A line can be tapped for translation in a future runner. |
| Mission | `mission` | 2–4 conversational turns with typed/spoken production, hints and multiple accepted patterns. |

These are four bites per lesson, not four independent new-word lists. Timing of
about 3–4 minutes per bite is a design aim; pilot it rather than padding content.
There is no `bites` array: the four fields determine the four-bite shape.

## Level limits

These are **SmartyLang editorial budgets**, not official CEFR vocabulary or
sentence-length thresholds. Section names are approximate authoring bands;
finishing a section does not certify a CEFR level. A teacher should confirm
each goal and the learner prerequisites before publication.

| Section / working CEFR band | New items per lesson | Maximum tokens per target sentence | Maximum story tokens |
| --- | --- | --- | --- |
| Beginner / A1 | 4–6 | 12 | 60 |
| Elementary / A2 | 4–6 | 18 | 110 |
| Pre-Intermediate / B1 | 4–6 | 24 | 160 |
| Intermediate / B2 | 4–6 | 30 | 220 |
| Advanced / C1 | 4–6 | 40 | 300 |

Keep early Beginner stories very short (roughly 8–30 words is often enough).
Later sections can use the larger budget for reasons, nuances and inference,
while maintaining known vocabulary. Stories have 4–16 lines. Item examples,
grammar examples, task targets, story lines and mission examples obey the
sentence cap. The validator counts normalized tokens, expanding known English
contractions; `I'm` counts like `I am`. Punctuation ends sentences.

## Unit envelope and stable identifiers

A unit is an object with `$schema` (optional), `schemaVersion: 2`, `lang`,
`section`, `unit`, `title`, and exactly ten `lessons` in teaching order 1–10.
Each lesson repeats `section` and `unit` and has `id`, `lesson`, `title`,
`canDo`, `scenario`, `items`, `practice`, `story`, `mission`, and `recycle`.
`grammar` and a lesson-level `lang` are optional; the latter must match the unit.
The schema also accepts a single complete lesson for isolated authoring/tests.

Use permanent ids such as `en.beginner.u01.l02.my-name`. Item ids belong to the
first lesson that teaches them. Later lessons reference those ids; do not mint
another id for the same item. Distinguish a new communicative pattern from a
new spelling of an old word. All task ids are unique within a lesson, including
story questions. Do not renumber published ids to reorder the curriculum.

## Items, meanings and forms

Each item has `id`, `text`, `kind` (`word`, `phrase`, or `pattern`), and
`example`. Optional `forms` explicitly lists taught inflections/contractions;
optional `note` gives a usage or grammar tip. Teach every listed form on the
Learn card. Examples must use language taught in this or earlier lessons.
Item notes are not a replacement for a comprehensible meaning.

**Meanings and translations do not belong in these lesson files.** They live in
`content/<targetLang>/glosses/<uiLang>.json`, keyed by the stable item id. For
example, the future `content/en/glosses/uz.json` will map
`en.beginner.u01.l01.hello` to an approved Uzbek greeting. This phase does not
generate gloss files. A missing gloss must be reported by a future loader;
never silently replace it with an English dictionary definition.

`text` and `forms` build the known-token inventory. An item's example, an
instruction, an explanation, and a future lesson **do not teach vocabulary**
for that inventory. `cat` does not license `cats`; add `cats` in `forms` when
teaching it. Listed equivalents such as `I am` / `I'm` and `what is` / `what's`
are normalized. Do not add unrelated synonyms to `forms` to evade item counts.

The English proper-name whitelist is Smarty, Mia, Sam, Ben, Leo and Ana.
Digits and the English number words zero through ten are an explicitly assumed
baseline; do not infer that more complicated number language has been taught.
Countries, foods and arbitrary capitalized words are **not** whitelisted.
Teach them. Other languages need an explicit entry in
`LANGUAGE_WHITELISTS` and language-appropriate normalization before validation.

## Task contracts

Every task needs `id`, `kind`, an instructional `prompt`, a useful one-line
`explanation`, and nonempty `itemIds` naming the targets actually practised.
Use `answer` for one accepted string, or `answers` for alternatives, never both.
Normalize case/punctuation/contractions when checking for equivalent answers.

| Kind | Additional fields | Rules |
| --- | --- | --- |
| `choice` | `options`, `answer` or `answers` | Every correct answer appears in options. At least two distinct wrong options remain. |
| `listen` | `audio`, `options`, answer(s) | `audio` is the exact spoken target text, not a URL or instructions. At least two distractors. |
| `build` | `tiles`, answer(s) | Every accepted answer must be constructible from 2–24 whole tiles; repeated tiles are allowed when needed. Words inside a chunk tile cannot be rearranged. Include natural alternatives where applicable. |
| `fill` | `text`, answer(s), optional `options` | Exactly one `___` blank. Accepted completions must fit the cue and sentence. Options, when supplied, need two wrong choices. |
| `match` | `pairs: [{left, right}]` | 3–6 pairs with distinct sides. Both sides are known target language; use full/short forms or clearly related sentence fragments. Other pairs supply the alternatives. |
| `speak` | `text`, answer(s) | The spoken target is included in accepted answers. A future runner must handle recognition failure and skipped speaking honestly. |

Options, tiles, audio, targets, answers and both matching sides are learner-
facing target language and undergo lexical checks. Distractors may be wrong
for the specific context but must be plausible and already taught. Prefer a
natural alternative with a different meaning over nonsense such as “My Ben.”
Avoid clues from capitalization or punctuation. Do not reveal the correct
answer in the prompt or use a memorized definition as a beginner meaning.

`prompt`, `explanation`, item `note`, grammar explanation, `scenario`, story
`hook`, mission `setup` and mission `hint` are instructional copy, to be shown
in the learner's interface language. This English authoring sample stores
English instructions. They are not included in target-token coverage and
must not be used to hide an untaught dialogue or audio line. Put all actual
target input in the typed target fields. Instruction localization is a later
pipeline; the gloss files above contain item meanings, not all UI copy.

## Stories and missions

`story.lines` contains `{speaker, text}` objects. Use recurring, whitelisted
characters; the cat is **Smarty**. Provide exactly three authored choice
questions about actual events, identities or meanings in the story. Each needs
an explanation and two distractors. Check the answer against the actual lines;
changing one word in a sentence does not prove that it is false.
An optional `hook` poses a small curiosity gap in instructional language.
Resolve the curiosity in the story; never require extra untaught words to do so.

The mission's `setup` gives the real-feeling goal and roles. Each turn has
`smarty` (the character's actual target-language utterance), `accept` (2–6
distinct patterns), `example` (one successful learner reply), `hint`, and
`itemIds`. Keep both sides of the conversation comprehensible. Never ask the
same question again after it has already been answered without a reason.
Allow imaginary personal details; no surname, address, contact or school details.

Patterns are anchored JavaScript Unicode regular-expression strings, tested
against `normalizeTarget(reply, lang)` using flags `iu`. For example, a stored
`I'm` reply becomes `i am`. The patterns should accept at least two meaningful
alternatives, not two spellings that normalize to the same reply. The example
must match. Use bounded name/place slots, e.g. a Unicode letter followed by
at most 39 letters/apostrophes/spaces/hyphens; JSON must escape backslashes.
Do not use unbounded `*`/`+`, `.*`, lookarounds, backreferences or nested repeated
groups. A future runtime must also cap input length before regex matching.
Patterns check limited taught forms, not arbitrary grammatical or semantic truth.

## Recycling and continuity

`recycle` lists earlier item ids intentionally targeted again. Every id must
exist earlier in the same section/level, either earlier in this unit or in an
explicitly supplied earlier-unit catalogue. Recycled task/mission references
must also be declared in this list. `itemIds` name real learning targets, not
tags added merely to pass a percentage check.

From lesson 3 of a unit onward, at least **30% of practice tasks** must reference
one or more recycled targets. Round up: 8–10 tasks require at least 3. Count
tasks, not tags; a task with three old ids counts once. Revisit every new item
in at least one practice task, then plan its later retrieval. New items may
reuse known words in a genuinely new pattern, but an identical item text must
be recycled rather than reintroduced under another id.

Earlier vocabulary is available as background language whether or not it is
a formal target in the current `recycle` list. Later lessons never count.
Do not invent a universal “basic English” whitelist for function words.

## Psychological hooks, without pressure

- A short story asks a small question (who joins, which name was missed) and
  answers it. Curiosity should help comprehension, not conceal instructions.
- Smarty and recurring friends remember the shared situation. Use the same
  items in fresh exchanges so earlier learning continues to be useful.
- Aim for a meaningful small win about every 30 seconds: recognize a phrase,
  repair a mistake, complete an exchange. This is pacing guidance, not a timer.
- The mission feels like meeting a classmate or helping a friend, not filling
  a database. State the resulting ability again at completion.
- Stable item ids and can-do goals supply evidence for later Word Workshop
  stages (Found → Recognised → Recalled → Used → Mastered) and House projects.
  Content does not assign stages, grant rewards, set quotas or deduct progress.
  A review can invite a learner to refine a useful phrase; no guilt, threat of
  a hungry/dead pet, lost furniture, countdown coercion or false scarcity.

## Banned shortcuts

Do not ship English definitions as a beginner's meaning; untaught input in
options/audio/stories; trick or ambiguous distractors; answer giveaways;
grammatically nonsensical filler; four-choice questions with only one wrong
option after normalization; arbitrary AI-generated “false facts”; culturally
loaded assumptions about children, nationality, religion, wealth, gender roles
or family; demands for real personal information; or invented reward promises.

The validator checks structure, lexical coverage, references and answer
mechanics. It cannot certify naturalness, cultural suitability, translation
quality, whether a distractor is semantically wrong, or whether tagging really
reflects learning. Teacher/native-speaker review and learner testing remain
necessary. A perfect validation result is not proof that a lesson teaches well.

## Porting notes

The ten pilot themes and applicable explanatory feedback are preserved. Each
theme is now a complete four-bite lesson, rather than one stand-alone session.
To satisfy 4–6 new items in every lesson, the reunion adds time-of-day greetings,
the personal review adds repair phrases, and the final mission adds a student
question. These are planned additions, not duplicate items labelled as new.
Zero-new-item daily review belongs outside this lesson contract.

## Validate before review

```sh
node scripts/content/validate-lessons.mjs content/en/beginner/unit-01.json
npx vitest run tests/content-validator.test.ts
```

The CLI is read-only and exits 1 on failure. Diagnostics contain a lesson id,
a JSON path and a reason. To validate later units with their earlier material,
pass approved unit files in teaching order. For programmatic use, call
`validateLessons(unit, { previousLessons })` with earlier approved lesson
objects; it returns issue objects. No network or new dependency is required.

## Fully worked lesson

The complete first lesson below is copied from the ported unit. Learn uses its
four items (with external glosses); Practice uses its nine tasks; Story uses
the dialogue, three checks and a subsequent read-aloud; Mission uses two free
reply turns. Every learner-facing word is taught here or explicitly whitelisted.
The separate Learn renderer is responsible for the after-two-items check.

```json
{
  "id": "en.beginner.u01.l01",
  "section": "beginner",
  "unit": 1,
  "lesson": 1,
  "title": "Say hello",
  "canDo": "Start and end a friendly conversation.",
  "scenario": "You and Smarty meet Mia and Sam at the classroom door. Practise starting and ending a conversation; no personal details are needed.",
  "items": [
    {
      "id": "en.beginner.u01.l01.hello",
      "text": "Hello",
      "kind": "word",
      "example": "Hello, Smarty!",
      "note": "Hello and Hi start a conversation. Goodbye ends it. Hi is more informal."
    },
    {
      "id": "en.beginner.u01.l01.hi",
      "text": "Hi",
      "kind": "word",
      "example": "Hi, Mia!"
    },
    {
      "id": "en.beginner.u01.l01.goodbye",
      "text": "Goodbye",
      "kind": "word",
      "example": "Goodbye, Sam!"
    },
    {
      "id": "en.beginner.u01.l01.bye",
      "text": "Bye",
      "kind": "word",
      "example": "Bye, Ben!"
    }
  ],
  "practice": [
    {
      "id": "en.beginner.u01.l01.task.choose",
      "kind": "choice",
      "prompt": "Start the conversation with a greeting, rather than ending it.",
      "answer": "Hello, Smarty!",
      "options": [
        "Hello, Smarty!",
        "Goodbye, Smarty!",
        "Bye, Smarty!"
      ],
      "explanation": "Hello is a complete greeting. Use it when you meet someone.",
      "itemIds": [
        "en.beginner.u01.l01.hello"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.listen",
      "kind": "listen",
      "prompt": "Listen, then choose the phrase you heard.",
      "audio": "Hi, Mia!",
      "answer": "Hi, Mia!",
      "options": [
        "Hi, Mia!",
        "Hello, Smarty!",
        "Goodbye, Sam!"
      ],
      "explanation": "Hi is a short, friendly way to say hello.",
      "itemIds": [
        "en.beginner.u01.l01.hi"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.build",
      "kind": "build",
      "prompt": "Build the taught phrase in its natural word order.",
      "answer": "Goodbye, Sam!",
      "tiles": [
        "Sam!",
        "Goodbye,",
        "Bye"
      ],
      "explanation": "Goodbye ends the conversation.",
      "itemIds": [
        "en.beginner.u01.l01.goodbye"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.fill",
      "kind": "fill",
      "prompt": "Say a short goodbye to Smarty. Complete the phrase.",
      "text": "___, Smarty!",
      "explanation": "Bye and Goodbye both end a conversation. Bye is the shorter form.",
      "itemIds": [
        "en.beginner.u01.l01.bye",
        "en.beginner.u01.l01.goodbye"
      ],
      "answers": [
        "Bye",
        "Goodbye"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.use-again",
      "kind": "choice",
      "prompt": "You are speaking to Smarty for the first time. Choose the greeting addressed to Smarty.",
      "answer": "Hello, Smarty!",
      "options": [
        "Hello, Smarty!",
        "Hi, Mia!",
        "Goodbye, Sam!"
      ],
      "explanation": "Address Smarty by name. Hi, Mia addresses a different person; Goodbye ends the conversation.",
      "itemIds": [
        "en.beginner.u01.l01.hello"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.speak",
      "kind": "speak",
      "prompt": "Say the phrase aloud. You can retry if recognition mishears you.",
      "text": "Hello, Smarty!",
      "answer": "Hello, Smarty!",
      "explanation": "You have greeted someone in English. You can also say Hi, Smarty!",
      "itemIds": [
        "en.beginner.u01.l01.hello"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.return",
      "kind": "choice",
      "prompt": "Mia greets you with Hi. Choose a greeting back, not a goodbye.",
      "answer": "Hi, Mia!",
      "options": [
        "Hi, Mia!",
        "Goodbye, Mia!",
        "Bye, Mia!"
      ],
      "explanation": "You can reply to a greeting with another greeting.",
      "itemIds": [
        "en.beginner.u01.l01.hi"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.recall",
      "kind": "build",
      "prompt": "Build the longer goodbye to Sam.",
      "answer": "Goodbye, Sam!",
      "tiles": [
        "Sam!",
        "Goodbye,",
        "Bye"
      ],
      "explanation": "Goodbye ends the conversation.",
      "itemIds": [
        "en.beginner.u01.l01.goodbye"
      ]
    },
    {
      "id": "en.beginner.u01.l01.task.catch",
      "kind": "listen",
      "prompt": "Listen, then choose the phrase you heard.",
      "audio": "Bye, Ben!",
      "answer": "Bye, Ben!",
      "options": [
        "Hello, Ben!",
        "Hi, Ben!",
        "Bye, Ben!"
      ],
      "explanation": "Bye is a short goodbye. Listen to the first word.",
      "itemIds": [
        "en.beginner.u01.l01.bye"
      ]
    }
  ],
  "story": {
    "hook": "Who gives Smarty a short goodbye?",
    "lines": [
      {
        "speaker": "Smarty",
        "text": "Hello, Mia!"
      },
      {
        "speaker": "Mia",
        "text": "Hi, Smarty!"
      },
      {
        "speaker": "Sam",
        "text": "Hello, Ben!"
      },
      {
        "speaker": "Ben",
        "text": "Hi, Sam!"
      },
      {
        "speaker": "Mia",
        "text": "Goodbye, Smarty!"
      },
      {
        "speaker": "Smarty",
        "text": "Bye, Mia!"
      },
      {
        "speaker": "Sam",
        "text": "Goodbye, Ben!"
      },
      {
        "speaker": "Ben",
        "text": "Bye, Sam!"
      }
    ],
    "questions": [
      {
        "id": "en.beginner.u01.l01.task.story-one",
        "kind": "choice",
        "prompt": "Who says Hi to Smarty?",
        "answer": "Mia",
        "options": [
          "Mia",
          "Sam",
          "Smarty"
        ],
        "explanation": "Find the line with the name or phrase in the question.",
        "itemIds": [
          "en.beginner.u01.l01.hello"
        ]
      },
      {
        "id": "en.beginner.u01.l01.task.story-two",
        "kind": "choice",
        "prompt": "Who says Bye to Mia?",
        "answer": "Smarty",
        "options": [
          "Smarty",
          "Mia",
          "Sam"
        ],
        "explanation": "Use the speaker labels and the actual words in the dialogue.",
        "itemIds": [
          "en.beginner.u01.l01.hi"
        ]
      },
      {
        "id": "en.beginner.u01.l01.task.story-three",
        "kind": "choice",
        "prompt": "Who says Goodbye to Ben?",
        "answer": "Sam",
        "options": [
          "Sam",
          "Mia",
          "Ben"
        ],
        "explanation": "Find the matching line in the dialogue; use what the story actually says.",
        "itemIds": [
          "en.beginner.u01.l01.goodbye"
        ]
      }
    ],
    "image": {
      "id": "u01-l01-scene",
      "describe": "A bright classroom door where Smarty the black cat waves hello while Mia and Sam stand smiling beside him."
    }
  },
  "mission": {
    "setup": "You and Smarty meet Mia and Sam at the classroom door. Practise starting and ending a conversation; no personal details are needed.",
    "turns": [
      {
        "smarty": "Hello!",
        "accept": [
          "^hello(?: smarty)?$",
          "^hi(?: smarty)?$"
        ],
        "example": "Hello, Smarty!",
        "hint": "Greet Smarty. Hello and Hi both work.",
        "itemIds": [
          "en.beginner.u01.l01.hello",
          "en.beginner.u01.l01.hi"
        ]
      },
      {
        "smarty": "Goodbye!",
        "accept": [
          "^goodbye(?: smarty)?$",
          "^bye(?: smarty)?$"
        ],
        "example": "Bye, Smarty!",
        "hint": "End with Goodbye or Bye.",
        "itemIds": [
          "en.beginner.u01.l01.goodbye",
          "en.beginner.u01.l01.bye"
        ]
      }
    ]
  },
  "recycle": []
}
```


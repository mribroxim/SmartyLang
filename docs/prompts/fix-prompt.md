The checker found problems in the unit JSON you wrote. Fix **only** these problems and output the **complete corrected JSON object** (nothing else: no Markdown fences, no comments).

How to fix the common ones:
- `untaught token(s): X`: rephrase with words that are already taught, or, if X is a form of a word taught in THIS unit (plural, verb form, case, contraction), add X to that item's `forms`. Never add new items.
- `check these are forms of taught words…` (a warning): if it really is a form, add it to the right item's `forms`; if it's a different word, rephrase.
- `X is earlier material and must be declared in recycle`: add the id X to that lesson's `recycle`.
- `items must be exactly the plan's`: copy the plan's item ids and texts, in order.
- `does not match any accept pattern`: change the mission example or add a pattern so the example (lowercased, punctuation removed, contractions expanded) matches.
- `cannot build accepted answer … from the whole tiles`: tiles must contain every word of the answer (punctuation may stay attached).
- `options must remain distinct` / `correct answer … is absent`: fix the options list.
- Lines starting with `warning:` are advice; fix them if it's easy, otherwise you may leave them.

Problems:
<paste the checker output here>

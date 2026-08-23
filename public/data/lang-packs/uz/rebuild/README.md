# UZ rebuild drop folder

Sibling agents write one file each (100 lessons, Latin Oʻzbekcha):

- `Beginner.json`
- `Elementary.json`
- `Pre-Intermediate.json`
- `Intermediate.json`
- `Advanced.json`

Format: JSON array of `{ id, title, text, vocabulary, targetSeconds }` aligned to EN ids (`b1`–`a100`).

Coordinator merges with `node scripts/localize/merge-rebuild.mjs --wait`.
**Do not** pad with kernel filler bridges.

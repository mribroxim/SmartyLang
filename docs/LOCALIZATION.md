# Localization pipeline (Learn level-texts)

Native CEFR-aligned rewrites of English Learn lessons into other content languages. **Not** GTX / raw MT, and **not** kernel-filler padding.

## Uzbek (`uz`) — Latin Oʻzbekcha

Scope: `public/data/lang-packs/uz/level-texts.json` (500 lessons). Speaking / writing / dictation packs are unchanged.

### Status (shipped)

| Level | Done |
|-------|------|
| Beginner | 100/100 |
| Elementary | 100/100 |
| Pre-Intermediate | 100/100 |
| Intermediate | 100/100 |
| Advanced | 100/100 |

**500/500** — `validate-localized` + `validate-sense` green. Parallel rebuild via `rebuild/{Level}.json` → `merge-rebuild.mjs`.

Cache bust: `LANG_PACK_CACHE_BUST` in `src/lib/langPacks.ts` (`v20260821b`).

Spot-check: `e1` = first day at language school (not summer vacation; no “jasorat jim”). Advanced is full essays without kernel philosophy bridges.

### Meaning-first rules (non-negotiable)

1. Extract **5–8 beats** from EN (who / what / why / feeling / example / next) — `extractBeats()` in `scripts/localize/shared.mjs`.
2. Rewrite as natural CEFR Latin Uzbek covering every beat — **not** word-for-word translation.
3. Sense QA must fail on nonsense, calques, and **old kernel philosophy bridges**. Length alone is **not** enough.
4. **Forbidden:** `build-from-kernel.mjs` fillers, flash-lite-only mass translate, GTX/`seed-lang-packs`.

### Parallel rebuild path

Sibling authors write one file each (100 lessons):

| File | IDs |
|------|-----|
| `rebuild/Beginner.json` | b1–b100 |
| `rebuild/Elementary.json` | e1–e100 |
| `rebuild/Pre-Intermediate.json` | p1–p100 |
| `rebuild/Intermediate.json` | i1–i100 |
| `rebuild/Advanced.json` | a1–a100 |

```bash
npm run localize:uz:merge:wait   # poll until 5×100, merge, schema+sense
npm run localize:uz:validate
npm run localize:uz:sense
```

Do **not** invent kernel filler if IDs are missing — report exact missing IDs and re-author.

### Files

| Path | Role |
|------|------|
| `scripts/localize/glossary-uz.json` | Locked classroom/domain terms |
| `scripts/localize/shared.mjs` | Beats, anti-calque prompts, sense denylist |
| `scripts/localize/merge-rebuild.mjs` | Merge sibling level JSON → pack |
| `scripts/localize/validate-localized.mjs` | Latin, length, dialogue, leakage, vocab |
| `scripts/localize/validate-sense.mjs` | Kernel/calque denylist |
| `scripts/localize/localize-uz-level-texts.mjs` | Optional OpenRouter (**strong** models; Beginner batch only) |
| `scripts/localize/critic-pass.mjs` | Optional API meaning critic (beats) |
| `scripts/localize/uz-chunks/build-from-kernel.mjs` | **DEPRECATED** — throws |
| `public/data/lang-packs/uz/rebuild/` | Sibling drop folder |
| `…/level-texts.pre-sense-rebuild-backup.json` | Pre-rebuild backup |

### Deprecated (do not use for quality)

- `build-from-kernel.mjs` / `padParagraphs` / `agent-write-uz-remaining.mjs`
- OpenRouter **flash-lite-only** as the quality path (esp. Intermediate/Advanced)
- GTX / `seed-lang-packs` MT

### Clone for the next language

1. Copy `scripts/localize/` → new glossary + endonym/script rules.
2. Point `OUT_DIR` at `public/data/lang-packs/{lang}/`.
3. Keep EN ids `b1`–`a100`; recompute `targetSeconds`.
4. Parallel drop: `rebuild/{Level}.json` × 5 → `merge-rebuild.mjs`.
5. Language-specific calque/filler denylist + both validators ≤ 2% fail.
6. Do **not** blast all remaining languages until Uzbek sense QA stays green in production.

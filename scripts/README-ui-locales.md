# Bundled interface translations

`src/locales/ui.en.json` is the English source. The app loads only the selected language from `src/locales/ui/{lang}.json`; `ui.generated.json` is the aggregate used for audits and maintenance. English and the 28 translated packs cover the same UI keys. Learning content uses its separate content-language packs.

## Update translations

1. Add or update the English key and use it at the display boundary. Keep stored IDs, editor JSON schemas, code samples, and educational examples out of the UI catalog.
2. Run `node scripts/gen-ui-locales.mjs`. Optional: `--langs=ru,uz` for a subset, `--device=cpu` when CUDA is unavailable, or `--force` for a deliberate full refresh.
3. Review the changed wording. Put authored corrections in `scripts/ui-locale-overrides-{lang}.json`. Those values win over machine output; identical English source values can also be curated in `ui-locale-source-overrides.json`.
4. Run generation again, then `node scripts/audit-ui-locales.mjs` and `node --test tests/ui-locales.test.mjs`.

Generation uses the repository's pre-existing local-MT Python environment, cached NLLB 1.3B tokenizer and CTranslate2 model. It runs offline and requires no paid service. Set `UI_LOCALE_PYTHON` if the environment is at another path. The ordinary app build uses the committed JSON packs and needs neither Python nor a GPU.

The root `.tmp-ui-locale-cache.json` stores exact source text, normalized translation input and validated machine output. The generator preserves existing valid translations, invalidates changed English sources using per-key metadata, applies reviewed overrides, and publishes only a complete validated language. `.tmp-ui-locale-unresolved.json` lists rejected candidates; it never silently fills failures with English.

Before translation, opaque markers protect placeholder names, brands, CEFR labels, literal numbers and ranges. Each sentence is translated independently so later sentences are not dropped. Markers are restored exactly, including repeated placeholders. Product “bites” are translated as short lessons rather than literal bites of food.

## Validation and review

The audit exits nonzero for missing/extra keys or languages, placeholder changes, malformed braces, entity/transport artifacts, lost brands, changed numeric ranges, unapproved whole English copies, stale source metadata, and split/aggregate mismatches. `--json` prints all issues. Legitimate cognates, abbreviations and loanwords are recorded narrowly in `ui-locale-identical.json`.

These checks verify completeness and structural safety. They do not establish that every sentence has been reviewed by a native speaker. Reviewed overrides improve the most visible navigation, onboarding, Today, hearts, lesson and feedback flows; machine-translated long-tail screens should continue to receive language-specific editorial review.

## Commercial release gate

The cached model is `facebook/nllb-200-distilled-1.3B`, licensed CC-BY-NC-4.0.
Do not distribute model weights or assume commercial use is licensed. Have the
operator review rights to the model/translation workflow, or replace the engine
with an appropriately licensed model/provider before a commercial release.
Legal and child-safety translations also require qualified human review.

`node scripts/prune-ui-locales.mjs` previews unused keys; `--write` applies the
conservative pruning pass. It retains literal references, English values used
through `tText`, and dynamic key prefixes. The generator retries temporary
Windows file locks and runs `translationIssues` through the final Node audit.

#!/usr/bin/env python3
"""Re-apply existing MT caches onto packs (fixes strip-key mismatch). Leaves uz alone."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from seed_lang_packs import (  # noqa: E402
    ALL_LANGS,
    LEVELS,
    apply_cache,
    load_cache,
    validate_pack,
    write_json,
    log,
)

EN = json.loads((ROOT / "public" / "level-texts.json").read_text(encoding="utf-8"))
PACKS = ROOT / "public" / "data" / "lang-packs"
SKIP = {"uz"}


def main() -> int:
    only = [x.strip() for x in (sys.argv[1:] or []) if x.strip()]
    langs = only or [l for l in ALL_LANGS if l not in SKIP]
    for lang in langs:
        path = PACKS / lang / "level-texts.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        cache = load_cache(lang)
        fixed = 0
        for level in LEVELS:
            for i, en_lesson in enumerate(EN.get(level) or []):
                before = str((pack[level][i].get("text") or ""))
                rebuilt = apply_cache(en_lesson, cache)
                after = str(rebuilt.get("text") or "")
                if before != after:
                    fixed += 1
                pack[level][i] = rebuilt
        err = validate_pack(EN, pack)
        if err:
            raise RuntimeError(f"{lang}: {err}")
        write_json(path, pack, pretty=True)
        # count leftover identical texts
        ident = sum(
            1
            for level in LEVELS
            for a, b in zip(EN[level], pack[level])
            if a.get("text") == b.get("text")
        )
        log(f"{lang}: reapplied texts_changed={fixed} still_identical_en={ident}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Align Uzbek lesson vocabulary slot counts to English.

Keeps native uz title/text/grammar. Rebuilds vocabulary[] to match EN length:
- reuse existing uz entries by index when present and non-empty
- fill gaps by translating the EN word + definition with NLLB
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from seed_lang_packs import (  # noqa: E402
    LEVELS,
    apply_cache,
    cache_get,
    fill_missing,
    load_cache,
    load_translator,
    pick_device,
    save_cache,
    validate_pack,
    write_json,
    log,
)

EN = json.loads((ROOT / "public" / "level-texts.json").read_text(encoding="utf-8"))
UZ_PATH = ROOT / "public" / "data" / "lang-packs" / "uz" / "level-texts.json"
LANG = "uz"


def main() -> int:
    uz = json.loads(UZ_PATH.read_text(encoding="utf-8"))
    need_strings: list[str] = []
    for level in LEVELS:
        for en_lesson in EN[level]:
            for v in en_lesson.get("vocabulary") or []:
                w = str(v.get("word") or "").strip()
                d = str(v.get("definition") or "").strip()
                if w:
                    need_strings.append(w)
                if d:
                    need_strings.append(d)

    seen = set()
    uniq = []
    for s in need_strings:
        if s not in seen:
            seen.add(s)
            uniq.append(s)

    log(f"uz vocab align: {len(uniq)} unique EN strings")
    cache = load_cache(LANG)
    pending = [s for s in uniq if s not in cache and s.strip() not in cache]
    if pending:
        device = pick_device()
        translator = load_translator(device)
        short = [s for s in pending if "\n" not in s and len(s) <= 180]
        long = [s for s in pending if s not in short]
        if short:
            fill_missing(translator, LANG, short, cache, "short")
        if long:
            fill_missing(translator, LANG, long, cache, "long")
        save_cache(LANG, cache)
    else:
        log("uz vocab align: all strings cached")

    fixed = 0
    for level in LEVELS:
        for i, en_lesson in enumerate(EN[level]):
            en_vocab = en_lesson.get("vocabulary") or []
            old = list(uz[level][i].get("vocabulary") or [])
            new = []
            for ev in en_vocab:
                ew = str(ev.get("word") or "")
                ed = str(ev.get("definition") or "")
                new.append({
                    "word": cache_get(cache, ew) if ew else "",
                    "definition": cache_get(cache, ed) if ed else "",
                })
            if new != old:
                fixed += 1
            uz[level][i]["vocabulary"] = new
            # keep id/unit/format aligned
            uz[level][i]["id"] = en_lesson.get("id")
            if "unit" in en_lesson:
                uz[level][i]["unit"] = en_lesson.get("unit")

    err = validate_pack(EN, uz)
    if err:
        raise RuntimeError(err)
    write_json(UZ_PATH, uz, pretty=True)

    # report
    mism = 0
    totals = []
    for level in LEVELS:
        tot = sum(len(x.get("vocabulary") or []) for x in uz[level])
        et = sum(len(x.get("vocabulary") or []) for x in EN[level])
        totals.append(tot)
        for a, b in zip(EN[level], uz[level]):
            if len(a.get("vocabulary") or []) != len(b.get("vocabulary") or []):
                mism += 1
        assert tot == et, f"{level} {tot}!={et}"
    log(f"uz wrote lessons_touched={fixed} totals={totals} mism={mism}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

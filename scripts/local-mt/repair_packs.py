#!/usr/bin/env python3
"""
Repair broken first-pass lang packs:
- retranslate lessons still identical to English
- retranslate Advanced a100 when NLLB degeneration is detected
- leave uz alone (restored from native backup)
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from seed_lang_packs import (  # noqa: E402
    ALL_LANGS,
    LEVELS,
    NLLB_LANG,
    TRANSLATABLE_SCALARS,
    apply_cache,
    chunk_plain_text,
    fill_missing,
    join_chunks,
    load_cache,
    load_translator,
    pick_device,
    save_cache,
    split_speaker,
    validate_pack,
    write_json,
    log,
)

EN_PATH = ROOT / "public" / "level-texts.json"
PACKS_DIR = ROOT / "public" / "data" / "lang-packs"
EN = json.loads(EN_PATH.read_text(encoding="utf-8"))
SKIP_LANGS = {"uz"}  # restored native pack


def is_degenerated(text: str) -> bool:
    t = text or ""
    if not t.strip():
        return True
    # long runs of same char / emoji
    if re.search(r"(.)\1{20,}", t):
        return True
    letters = re.findall(r"[^\W\d_]", t.lower(), flags=re.UNICODE)
    if len(letters) > 80 and letters.count("a") > 80 and len(set(letters)) < 8:
        return True
    words = re.findall(r"\S+", t)
    if len(words) >= 40:
        for n in (8, 10, 12):
            grams = [" ".join(words[i : i + n]) for i in range(len(words) - n + 1)]
            top = Counter(grams).most_common(1)[0][1]
            # Theme phrases can repeat ~3–5× in a good essay; loops hit 10+.
            if top >= 8:
                return True
        # Tight local stutter: same 4-gram many times in a row is handled elsewhere;
        # catch dense global spam of short filler.
        grams4 = [" ".join(words[i : i + 4]) for i in range(len(words) - 3)]
        if grams4 and Counter(grams4).most_common(1)[0][1] >= 15:
            return True
    # paragraph clone
    paras = [p.strip() for p in re.split(r"\n\s*\n", t) if len(p.strip()) > 40]
    if paras:
        top = Counter(paras).most_common(1)[0][1]
        if top >= 3:
            return True
    return False


def lessons_needing_repair(lang: str, pack: dict) -> list[tuple[str, dict]]:
    need = []
    for level in LEVELS:
        for en_lesson, lesson in zip(EN.get(level) or [], pack.get(level) or []):
            text = str(lesson.get("text") or "")
            en_text = str(en_lesson.get("text") or "")
            if not text.strip():
                need.append((level, en_lesson))
                continue
            if text == en_text:
                need.append((level, en_lesson))
                continue
            if en_lesson.get("id") == "a100" and is_degenerated(text):
                need.append((level, en_lesson))
                continue
            if is_degenerated(text) and en_lesson.get("id") == "a100":
                need.append((level, en_lesson))
    # unique by id
    seen = set()
    out = []
    for level, lesson in need:
        key = lesson["id"]
        if key in seen:
            continue
        seen.add(key)
        out.append((level, lesson))
    return out


def force_translate_strings(translator, lang: str, strings: list[str], cache: dict[str, str]) -> None:
    """Overwrite cache entries for these strings."""
    short, long = [], []
    for s in strings:
        s = str(s or "").strip()
        if not s:
            continue
        if "\n" in s or len(s) > 180:
            long.append(s)
        else:
            short.append(s)
    # drop from cache so fill_missing redoes them
    for s in short + long:
        cache.pop(s, None)
    if short:
        fill_missing(translator, lang, short, cache, "short")
    if long:
        fill_missing(translator, lang, long, cache, "long")


def repair_lang(translator, lang: str) -> int:
    path = PACKS_DIR / lang / "level-texts.json"
    pack = json.loads(path.read_text(encoding="utf-8"))
    need = lessons_needing_repair(lang, pack)
    # Always refresh Advanced a100 — NLLB often loops on long essays.
    a100_en = EN["Advanced"][-1]
    if a100_en["id"] not in {x["id"] for _, x in need}:
        need.append(("Advanced", a100_en))
        cache_drop = True
    else:
        cache_drop = False

    if not need:
        log(f"{lang}: nothing to repair")
        return 0

    log(f"{lang}: repairing {len(need)} lessons: {[x['id'] for _, x in need]}")
    cache = load_cache(lang)
    # force a100 text out of cache so it is freshly generated
    if cache_drop or True:
        cache.pop(str(a100_en.get("text") or ""), None)
    strings = []
    for _, en_lesson in need:
        for key in TRANSLATABLE_SCALARS:
            val = str(en_lesson.get(key) or "").strip()
            if val:
                strings.append(val)
        for g in en_lesson.get("grammarFocus") or []:
            if str(g).strip():
                strings.append(str(g))
        for v in en_lesson.get("vocabulary") or []:
            if str(v.get("word") or "").strip():
                strings.append(str(v["word"]))
            if str(v.get("definition") or "").strip():
                strings.append(str(v["definition"]))
    # unique preserve order
    seen = set()
    uniq = []
    for s in strings:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    force_translate_strings(translator, lang, uniq, cache)
    save_cache(lang, cache)

    by_id = {lesson["id"]: (level, i) for level in LEVELS for i, lesson in enumerate(pack.get(level) or [])}
    for _, en_lesson in need:
        level, idx = by_id[en_lesson["id"]]
        pack[level][idx] = apply_cache(en_lesson, cache)

    err = validate_pack(EN, pack)
    if err:
        raise RuntimeError(f"{lang} validate failed: {err}")
    write_json(path, pack, pretty=True)
    log(f"{lang}: wrote repairs")
    return len(need)


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    only = [x.strip() for x in (sys.argv[1:] or []) if x.strip()]
    langs = only or [l for l in ALL_LANGS if l not in SKIP_LANGS]
    log(f"repair langs={langs}")
    device = pick_device()
    translator = load_translator(device)
    total = 0
    for lang in langs:
        total += repair_lang(translator, lang)
    log(f"DONE repaired_lessons={total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

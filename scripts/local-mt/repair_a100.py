#!/usr/bin/env python3
"""Force-refresh Advanced a100 with small chunks + degeneration retries."""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from repair_packs import is_degenerated  # noqa: E402
from seed_lang_packs import (  # noqa: E402
    ALL_LANGS,
    NLLB_LANG,
    apply_cache,
    join_chunks,
    load_cache,
    load_translator,
    pick_device,
    save_cache,
    split_speaker,
    validate_pack,
    write_json,
    log,
    chunk_plain_text,
)
import json

EN = json.loads((ROOT / "public" / "level-texts.json").read_text(encoding="utf-8"))
PACKS = ROOT / "public" / "data" / "lang-packs"
SKIP = {"uz"}
A100 = EN["Advanced"][-1]


def translate_long(translator, lang: str, text: str, max_chars: int) -> str:
    tgt = NLLB_LANG[lang]
    chunks = chunk_plain_text(text, max_chars=max_chars)
    payloads: list[str] = []
    speakers: list[str | None] = []
    for chunk in chunks:
        if chunk == "":
            continue
        speaker, body = split_speaker(chunk)
        payloads.append(body or chunk)
        speakers.append(speaker)
    translated = translator.translate_batch(payloads, tgt)
    rebuilt: list[str] = []
    idx = 0
    for chunk in chunks:
        if chunk == "":
            rebuilt.append("")
            continue
        speaker = speakers[idx]
        out = translated[idx] if idx < len(translated) else chunk
        # Hard-cut obvious local loops inside a chunk
        out = collapse_loop(out)
        rebuilt.append(f"{speaker}: {out}" if speaker else out)
        idx += 1
    return join_chunks(rebuilt)


def collapse_loop(text: str) -> str:
    words = re.findall(r"\S+|\s+", text)
    tokens = [w for w in words if w.strip()]
    if len(tokens) < 24:
        return text
    for n in (8, 6, 4):
        for i in range(len(tokens) - n * 3):
            gram = tokens[i : i + n]
            reps = 1
            j = i + n
            while j + n <= len(tokens) and tokens[j : j + n] == gram:
                reps += 1
                j += n
            if reps >= 3:
                # keep one copy, drop the rest of the loop run
                kept = tokens[: i + n] + tokens[j:]
                return " ".join(kept)
    return text


def best_a100(translator, lang: str) -> str:
    src = str(A100["text"])
    for max_chars in (240, 160, 110):
        out = translate_long(translator, lang, src, max_chars=max_chars)
        if not is_degenerated(out) and out.strip() and out != src:
            log(f"  {lang} a100 ok at chunk={max_chars} len={len(out)}")
            return out
        log(f"  {lang} a100 still bad at chunk={max_chars} (deg={is_degenerated(out)})")
    # last resort: collapse whatever we have
    return collapse_loop(out)


def needs_refresh(lang: str) -> bool:
    pack = json.loads((PACKS / lang / "level-texts.json").read_text(encoding="utf-8"))
    text = str(pack["Advanced"][-1].get("text") or "")
    return is_degenerated(text) or text == A100["text"] or not text.strip()


def main() -> int:
    only = [x.strip() for x in (sys.argv[1:] or []) if x.strip()]
    langs = only or [l for l in ALL_LANGS if l not in SKIP and needs_refresh(l)]
    if not langs:
        log("no a100 refreshes needed")
        return 0
    log(f"a100 refresh langs={langs}")
    translator = load_translator(pick_device())
    for lang in langs:
        log(f"{lang}: translating a100…")
        text = best_a100(translator, lang)
        cache = load_cache(lang)
        cache[str(A100["text"])] = text
        cache[str(A100["text"]).strip()] = text
        save_cache(lang, cache)
        path = PACKS / lang / "level-texts.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        # rebuild full a100 lesson from EN + cache (keeps vocab/title synced)
        pack["Advanced"][-1] = apply_cache(A100, cache)
        pack["Advanced"][-1]["text"] = text  # ensure forced text wins
        err = validate_pack(EN, pack)
        if err:
            raise RuntimeError(f"{lang}: {err}")
        write_json(path, pack, pretty=True)
        log(f"{lang}: wrote a100 deg={is_degenerated(text)} len={len(text)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

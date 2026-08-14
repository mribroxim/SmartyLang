#!/usr/bin/env python3
"""Offline literary polish helpers for ja/ko lang packs (no API)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / "public" / "data" / "lang-packs"

# --- Japanese option/passage MT junk (context-free safe replacements) ---
JA_OPTION_MAP = {
    "ラウンド": "丸い",
    "フラット": "平たい",
    "脂肪": "太い",
    "文字列": "ひも",
    "カットする": "切る",
    "カットするには": "切るため",
    "いいね": "涼しい",
    "ミュージカル": "音楽的な",
    "漠然として": "上へ",
    "長さ": "長い",  # only when used as option alone - careful
}

# Only replace when the whole option equals the key (safer)
JA_OPTION_EXACT = {
    "ラウンド": "丸い",
    "フラット": "平たい",
    "脂肪": "太い",
    "文字列": "ひも",
    "いいね": "涼しい",
    "ミュージカル": "音楽的な",
    "漠然として": "上へ",
    "長さ": "長い",
    "カットするには": "切るため",
    "描くには": "描くため",
    "書くには": "書くため",
    "色を付ける": "色を塗るため",
}

# Title fixes
JA_TITLE_MAP = {
    "ザ・ベル": "鐘",
}


def polish_ja_cr(data: list) -> int:
    n = 0
    for item in data:
        t = item.get("title") or ""
        if t in JA_TITLE_MAP:
            item["title"] = JA_TITLE_MAP[t]
            n += 1
        for q in item.get("questions") or []:
            opts = q.get("options") or []
            new_opts = []
            changed = False
            for o in opts:
                if o in JA_OPTION_EXACT:
                    new_opts.append(JA_OPTION_EXACT[o])
                    changed = True
                else:
                    new_opts.append(o)
            if changed:
                q["options"] = new_opts
                n += 1
    return n


# Korean possession calques in short beginner passages
KO_CALQUE_PASSAGE = [
    (
        re.compile(r"^나는 (.+?)が 있다\.$"),  # wrong - japanese mix unlikely
        None,
    ),
]

# Common KO awkward patterns → natural
KO_REPLACEMENTS = [
    (r"나는 그릇에 물고기 한 마리가 있다\.", "나는 어항에 금붕어 한 마리를 키운다."),
    (r"나는 컵케이크가 있다\.", "나에게는 컵케이크가 있다."),
    (r"나는 자전거가 있다\.", "나에게는 자전거가 있다."),
    (r"공원에는 푸른\.\.\.가 있다\.", "공원에는 푸른…이 있다."),
    (r"주요 기능을 선택하고 보고하여", "주요 특징을 골라 제시하며"),
    (r"관련 있는 경우 비교합니다\.", "必要时 비교하십시오."),  # BAD - don't use chinese
]

# Fix the bad one - rewrite properly
KO_REPLACEMENTS = [
    ("나는 그릇에 물고기 한 마리가 있다.", "나는 어항에 금붕어 한 마리를 키운다."),
    ("나는 컵케이크가 있다.", "나에게는 컵케이크가 있다."),
    ("나는 자전거가 있다.", "나에게는 자전거가 있다."),
    ("주요 기능을 선택하고 보고하여", "주요 특징을 골라 제시하며"),
    ("관련 있는 경우 비교합니다.", "관련이 있으면 비교하십시오."),
    ("최소 150단어를 작성하세요.", "최소 150단어를 쓰십시오."),
    ("최소 250단어를 작성하세요.", "최소 250단어를 쓰십시오."),
]


def apply_repls(text: str, pairs: list[tuple[str, str]]) -> tuple[str, int]:
    n = 0
    for a, b in pairs:
        if a in text:
            text = text.replace(a, b)
            n += 1
    return text, n


def walk_strings(obj, fn):
    """Apply fn(str)->str to every string leaf; return change count."""
    changes = 0
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                nv, c = fn(v)
                if c:
                    obj[k] = nv
                    changes += c
            else:
                changes += walk_strings(v, fn)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                nv, c = fn(v)
                if c:
                    obj[i] = nv
                    changes += c
            else:
                changes += walk_strings(v, fn)
    return changes


def polish_ko_strings(text: str) -> tuple[str, int]:
    return apply_repls(text, KO_REPLACEMENTS)


JA_REPLACEMENTS = [
    ("少なくとも 250 単語書いてください。", "少なくとも250語書いてください。"),
    ("少なくとも 150 語を書いてください。", "少なくとも150語書いてください。"),
    ("大​​学", "大学"),  # zero-width / double chars
]


def polish_ja_strings(text: str) -> tuple[str, int]:
    return apply_repls(text, JA_REPLACEMENTS)


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def save(p: Path, data):
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    stats = {}

    # JA CR option junk
    ja_cr_p = PACKS / "ja" / "comprehensive-reading.json"
    ja_cr = load(ja_cr_p)
    stats["ja_cr_opts"] = polish_ja_cr(ja_cr)
    save(ja_cr_p, ja_cr)

    # KO CR calques + string fixes
    ko_cr_p = PACKS / "ko" / "comprehensive-reading.json"
    ko_cr = load(ko_cr_p)
    stats["ko_cr_str"] = walk_strings(ko_cr, polish_ko_strings)
    # extra targeted passage polish
    for item in ko_cr:
        pass_ = item.get("passage") or ""
        # "X를/을 가지고 있습니다" for body parts / attributes → 있다 where natural for animals
        # keep most; only fix clear beginner possession calques already listed
        item["passage"] = pass_
    save(ko_cr_p, ko_cr)

    # task1 instructional polish (instructions/titles only; leave chartData)
    for lang, fn in [("ko", polish_ko_strings), ("ja", polish_ja_strings)]:
        p = PACKS / lang / "task1.json"
        data = load(p)
        c = 0
        for section in ("byType", "types"):
            block = data.get(section)
            if not block:
                continue
            items = block.values() if isinstance(block, dict) else block
            for group in items:
                # byType: list of prompts; types: list of {prompts:[...]}
                prompts = group if isinstance(group, list) else group.get("prompts") or []
                if isinstance(group, dict) and "instruction" in group:
                    prompts = [group]
                for pr in prompts:
                    if not isinstance(pr, dict):
                        continue
                    for field in ("title", "instruction", "description", "overview", "prompt"):
                        if field in pr and isinstance(pr[field], str):
                            nv, n = fn(pr[field])
                            if n:
                                pr[field] = nv
                                c += n
                    # nested prompts
                    for nested in pr.get("prompts") or []:
                        if not isinstance(nested, dict):
                            continue
                        for field in ("title", "instruction", "description", "overview", "prompt"):
                            if field in nested and isinstance(nested[field], str):
                                nv, n = fn(nested[field])
                                if n:
                                    nested[field] = nv
                                    c += n
        stats[f"{lang}_task1"] = c
        save(p, data)

    # task2 string polish
    for lang, fn in [("ko", polish_ko_strings), ("ja", polish_ja_strings)]:
        p = PACKS / lang / "task2.json"
        data = load(p)
        stats[f"{lang}_task2"] = walk_strings(data, fn)
        save(p, data)

    # dictation
    for lang, pairs in [
        ("ko", KO_REPLACEMENTS),
        ("ja", JA_REPLACEMENTS),
    ]:
        c = 0
        d = PACKS / lang / "dictation"
        for f in d.glob("*.txt"):
            t = f.read_text(encoding="utf-8")
            nt, n = apply_repls(t, pairs)
            if n:
                f.write_text(nt, encoding="utf-8")
                c += n
        stats[f"{lang}_dict"] = c

    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

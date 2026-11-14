#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EN = json.loads((ROOT / "public/level-texts.json").read_text(encoding="utf-8"))
LANGS = [
    "ja", "uz", "cs", "ru", "de", "fr", "zh", "ko", "ar", "hi",
    "ro", "fa", "ur", "sw", "tl", "es", "it", "pt", "tr", "nl",
    "pl", "sv", "id", "ms", "vi", "th", "uk", "el",
]


def script_stats(text: str) -> dict:
    t = text or ""
    return {
        "len": len(t),
        "cjk": len(re.findall(r"[\u3040-\u30ff\u4e00-\u9fff]", t)),
        "cyr": len(re.findall(r"[\u0400-\u04ff]", t)),
        "latin": len(re.findall(r"[A-Za-z]", t)),
        "arabic": len(re.findall(r"[\u0600-\u06ff]", t)),
    }


def repeat_ratio(text: str) -> float:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    if len(lines) < 4:
        return 0.0
    from collections import Counter
    counts = Counter(lines)
    top = counts.most_common(1)[0][1]
    return top / len(lines)


def main() -> None:
    print("EN advanced last id:", EN["Advanced"][-1]["id"], "words", len(EN["Advanced"][-1]["text"].split()))
    for lang in LANGS:
        p = ROOT / f"public/data/lang-packs/{lang}/level-texts.json"
        if not p.exists():
            print(f"{lang}: MISSING FILE")
            continue
        try:
            pack = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"{lang}: JSON CORRUPT {e}")
            continue

        issues = []
        for level, el in EN.items():
            pl = pack.get(level) or []
            if len(pl) != len(el):
                issues.append(f"{level} count {len(pl)}/{len(el)}")
            for a, b in zip(el, pl):
                if a["id"] != b.get("id"):
                    issues.append(f"id mismatch {a['id']}")
                    break
                if not str(b.get("text") or "").strip():
                    issues.append(f"empty text {a['id']}")
                if not str(b.get("title") or "").strip():
                    issues.append(f"empty title {a['id']}")

        b1 = (pack.get("Beginner") or [{}])[0]
        a100 = (pack.get("Advanced") or [{}])[-1]
        rr = repeat_ratio(a100.get("text") or "")
        identical_text = sum(
            1
            for level in EN
            for a, b in zip(EN[level], pack.get(level) or [])
            if a.get("text") == b.get("text")
        )
        print(
            f"{lang}: size={p.stat().st_size} issues={len(issues)} identical_en_text={identical_text} "
            f"a_last_repeat={rr:.2f} b1={script_stats(b1.get('text') or '')} "
            f"a_last={script_stats(a100.get('text') or '')}"
        )
        if issues[:5]:
            print("  first issues:", issues[:5])
        if rr >= 0.25 or lang in ("ja", "uz", "cs"):
            print("  b1 title:", (b1.get("title") or "")[:80])
            print("  b1 text:", (b1.get("text") or "")[:140].replace("\n", " | "))
            print("  a_last id:", a100.get("id"))
            print("  a_last text head:", (a100.get("text") or "")[:220].replace("\n", " | "))
            print("  a_last text tail:", (a100.get("text") or "")[-220:].replace("\n", " | "))


if __name__ == "__main__":
    main()

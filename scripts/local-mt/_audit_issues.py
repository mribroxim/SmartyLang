#!/usr/bin/env python3
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EN = json.loads((ROOT / "public/level-texts.json").read_text(encoding="utf-8"))


def find_identical(lang: str):
    pack = json.loads((ROOT / f"public/data/lang-packs/{lang}/level-texts.json").read_text(encoding="utf-8"))
    hits = []
    for level, lessons in EN.items():
        for a, b in zip(lessons, pack.get(level) or []):
            if a.get("text") == b.get("text"):
                hits.append(f"{level}/{a['id']}")
            elif not str(b.get("text") or "").strip():
                hits.append(f"{level}/{a['id']}:EMPTY")
    return hits


def sentence_repeat(text: str):
    sents = [s.strip() for s in re.split(r"(?<=[.!?。．？！])\s+", text or "") if len(s.strip()) > 20]
    if not sents:
        return 0, None, 0
    c = Counter(sents)
    top_s, top_n = c.most_common(1)[0]
    return top_n / len(sents), top_s[:120], top_n


def uz_garbage_score(text: str) -> float:
    t = text or ""
    if not t:
        return 1.0
    a_ratio = t.lower().count("a") / max(1, len(re.findall(r"[A-Za-zа-яА-ЯёЁʻʼʼ']", t)))
    return a_ratio


def main():
    for lang in ["ja", "uz", "cs", "ru"]:
        hits = find_identical(lang)
        print(f"=== {lang} identical/empty count={len(hits)}")
        print(" ", hits[:40])

    print("\n=== Advanced a100 sentence repeats")
    for lang in sorted((ROOT / "public/data/lang-packs").iterdir()):
        if not lang.is_dir():
            continue
        p = lang / "level-texts.json"
        if not p.exists():
            continue
        pack = json.loads(p.read_text(encoding="utf-8"))
        a100 = pack["Advanced"][-1]
        ratio, sample, n = sentence_repeat(a100.get("text") or "")
        if ratio >= 0.12 or n >= 3:
            print(f"{lang.name}: ratio={ratio:.2f} n={n} sample={sample!r}")

    print("\n=== Uzbek garbage scan")
    pack = json.loads((ROOT / "public/data/lang-packs/uz/level-texts.json").read_text(encoding="utf-8"))
    bad = 0
    for level, lessons in pack.items():
        for lesson in lessons:
            score = uz_garbage_score(lesson.get("text") or "")
            title = lesson.get("title") or ""
            if score > 0.45 or re.fullmatch(r"a+", title.strip().lower()) or " a a a " in (lesson.get("text") or ""):
                bad += 1
                if bad <= 8:
                    print(f"  BAD {lesson.get('id')} score={score:.2f} title={title[:40]!r}")
    print("bad lessons", bad)

    backup = ROOT / "public/data/lang-packs/uz/level-texts.pre-bulk-mt-backup.json"
    print("uz backup exists", backup.exists(), "size", backup.stat().st_size if backup.exists() else 0)
    ja_backup = ROOT / "public/data/lang-packs/ja/level-texts.pre-bulk-mt-backup.json"
    print("ja backup exists", ja_backup.exists(), "size", ja_backup.stat().st_size if ja_backup.exists() else 0)


if __name__ == "__main__":
    main()

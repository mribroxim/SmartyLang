# -*- coding: utf-8 -*-
"""Analyze French lang-pack for MT polish targets."""
import json
import os
import re
from collections import Counter

BASE = r"public/data/lang-packs/fr"
EN_WORDS = set(
    "the and for with that this from are was were been have has had will would "
    "can could should may might must about into over under after before between "
    "during without within which who whom whose what when where why how your you "
    "our their them they these those some any more most other such only also just "
    "than then there here each both few many much used paper is collected".split()
)


def looks_english(s: str) -> bool:
    if not isinstance(s, str) or len(s) < 35:
        return False
    if re.search(r"[àâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ]", s):
        return False
    words = re.findall(r"[A-Za-z']+", s)
    if len(words) < 6:
        return False
    hits = sum(1 for w in words if w.lower() in EN_WORDS)
    return hits >= 3 and hits / len(words) > 0.12


def walk(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


def count_volume():
    with open(os.path.join(BASE, "level-texts.json"), encoding="utf-8") as f:
        lt = json.load(f)
    for k, v in lt.items():
        print(f"level-texts {k}: {len(v)}")
    with open(os.path.join(BASE, "speaking-topics.json"), encoding="utf-8") as f:
        sp = json.load(f)
    for k, v in sp.items():
        print(f"speaking {k}: {len(v)}")
    with open(os.path.join(BASE, "writing-topics.json"), encoding="utf-8") as f:
        wr = json.load(f)
    for k, v in wr.items():
        print(f"writing {k}: {len(v)}")
    with open(os.path.join(BASE, "task2.json"), encoding="utf-8") as f:
        t2 = json.load(f)
    np = sum(len(c.get("prompts", [])) for t in t2 for c in t.get("categories", []))
    print(f"task2 prompts: {np}")
    with open(os.path.join(BASE, "comprehensive-reading.json"), encoding="utf-8") as f:
        cr = json.load(f)
    print(f"CR: {len(cr)} passages, {sum(len(x.get('questions',[])) for x in cr)} Qs")
    for fn in sorted(os.listdir(os.path.join(BASE, "dictation"))):
        with open(os.path.join(BASE, "dictation", fn), encoding="utf-8") as f:
            lines = [l for l in f if l.strip()]
        print(f"dictation {fn}: {len(lines)}")


def find_english():
    for fname in [
        "level-texts.json",
        "comprehensive-reading.json",
        "speaking-topics.json",
        "writing-topics.json",
        "task2.json",
        "task1.json",
    ]:
        with open(os.path.join(BASE, fname), encoding="utf-8") as f:
            data = json.load(f)
        hits = [(p, s) for p, s in walk(data) if looks_english(s)]
        print(f"\n=== {fname}: {len(hits)} likely-English ===")
        for p, s in hits[:15]:
            print(f"  {p[-90:]} | {s[:110].replace(chr(10), ' ')}")


def find_patterns():
    patterns = {
        "tu_forms": r"\b(tu |ton |ta |tes |toi\b|Parle-moi|Décris |Aimes-tu|Que fais-tu|Préfères-tu|Regardes-tu)",
        "vous_forms": r"\b(vous |votre |vos |Parlez-moi|Décrivez |Aimez-vous)",
        "no_nbsp_punct": r"[^\s\u00a0][?!;:]",
        "anglais_self": r"(apprendre|étudier|parler|cours|professeur|classe|salle).{0,20}anglais|anglais.{0,20}(apprendre|étudier)",
        "english_word": r"\bEnglish\b",
        "calque_make": r"\bfaire une différence\b",
        "calque_take": r"\bprendre (une )?décision\b",
        "double_space": r"  +",
        "straight_quotes": r"(?<![A-Za-z])\"[^\"]+\"",
    }
    totals = Counter()
    samples = {k: [] for k in patterns}
    for fname in [
        "level-texts.json",
        "comprehensive-reading.json",
        "speaking-topics.json",
        "writing-topics.json",
        "task2.json",
        "task1.json",
    ]:
        with open(os.path.join(BASE, fname), encoding="utf-8") as f:
            text = f.read()
        for name, pat in patterns.items():
            ms = list(re.finditer(pat, text, re.I))
            totals[f"{fname}:{name}"] = len(ms)
            for m in ms[:3]:
                samples[name].append((fname, text[max(0, m.start() - 20) : m.end() + 40]))
    print("\n=== PATTERN COUNTS ===")
    for k, v in sorted(totals.items()):
        if v:
            print(f"  {k}: {v}")
    print("\n=== SAMPLES ===")
    for name, items in samples.items():
        if items:
            print(f"\n-- {name} --")
            for fname, s in items[:4]:
                print(f"  [{fname}] ...{s.replace(chr(10),' ')}...")


if __name__ == "__main__":
    print("=== VOLUME ===")
    count_volume()
    find_english()
    find_patterns()

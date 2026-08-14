# -*- coding: utf-8 -*-
"""Find concrete French MT issues (write UTF-8 report)."""
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
BASE = r"public/data/lang-packs/fr"
OUT = r"scripts/_fr_issues_report.txt"


def walk_strings(obj):
    if isinstance(obj, dict):
        for v in obj.values():
            yield from walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_strings(v)
    elif isinstance(obj, str):
        yield obj


checks = [
    ("calque_meet", r"\bRencontrez\b"),
    ("calque_share", r"\bPartagez\b"),
    ("calque_list", r"\bÉnumérez\b"),
    ("calque_name", r"\bNommez\b"),
    ("calque_make_diff", r"faire une différence"),
    ("calque_take_place", r"avoir lieu"),  # actually OK in FR
    ("petit_dejeuner_split", r"petit déjeuner"),  # should be petit-déjeuner
    ("courses_transit", r"payer vos courses"),
    ("tu_imperative", r"\b(Parle-moi|Décris |Raconte |Écris |Choisis |Réponds |Liste |Nomme |Imagine |Pose |Partage |Aimes-tu|Que fais-tu|Préfères-tu)"),
    ("vocab_conjugated", r"\"word\": \"(Étire|Lave|Ouvre|Prépare|Sourit)\""),
    ("english_leftover", r"\b(Used paper is|Adult salmon|Sunlight strikes|Paper is sorted|The pulp|Fertilised eggs|Eggs hatch|Once the yolk|Over 1|Salmon spend|Mature adults|AC electricity|Any remaining|The smart meter)\b"),
    ("journal_entry", r"entrée de journal"),
    ("SMS_calque", r"\bSMS\b"),
    ("lavash", r"lavash|chawarma|tandir"),
    ("freres_tautology", r"Frères et sœurs\.\"\s*\},\s*\{[^}]*\"definition\": \"\(Nom\) Frères et sœurs"),
]

lines = []
for fname in [
    "level-texts.json",
    "comprehensive-reading.json",
    "speaking-topics.json",
    "writing-topics.json",
    "task2.json",
    "task1.json",
]:
    path = os.path.join(BASE, fname)
    with open(path, encoding="utf-8") as f:
        text = f.read()
    lines.append(f"\n######## {fname} ########")
    for name, pat in checks:
        ms = list(re.finditer(pat, text, re.I))
        if ms:
            lines.append(f"{name}: {len(ms)}")
            for m in ms[:5]:
                snip = text[max(0, m.start() - 30) : m.end() + 50].replace("\n", " ")
                lines.append(f"  ...{snip}...")

# punctuation without space before ?!;: in French prose strings
with open(os.path.join(BASE, "speaking-topics.json"), encoding="utf-8") as f:
    sp = json.load(f)
bad_punct = 0
tu_count = vous_count = 0
for level, prompts in sp.items():
    for p in prompts:
        if re.search(r"[^\s\u00a0\?][?!;]", p):  # letter immediately before ?!
            bad_punct += 1
        if re.search(r"\b(tu |ton |ta |tes |toi\b|Parle-moi|Décris |Aimes-tu)", p):
            tu_count += 1
        if re.search(r"\b(vous |votre |vos |Parlez-moi|Décrivez |Aimez-vous)", p):
            vous_count += 1
lines.append(f"\nspeaking bad_punct_lines~: {bad_punct}, tu_prompts: {tu_count}, vous_prompts: {vous_count}")

# sample level-text vocab issues
with open(os.path.join(BASE, "level-texts.json"), encoding="utf-8") as f:
    lt = json.load(f)
conj_words = []
for level, texts in lt.items():
    for t in texts:
        for v in t.get("vocabulary", []):
            w = v.get("word", "")
            if re.match(r"^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+$", w) and w.endswith(("e", "s")) is False:
                # conjugated-looking short verbs ending without -er/-ir/-re
                if not w.lower().endswith(("er", "ir", "re", "oir")) and len(w) < 12:
                    if w.lower() in {"étire", "lave", "ouvre", "prépare", "sourit", "court", "voit", "boit", "écrit", "nagent", "chante", "mange", "parle", "travaille"}:
                        conj_words.append((level, t["id"], w, v.get("definition", "")[:60]))
lines.append(f"\nconjugated vocab lemmas: {len(conj_words)}")
for item in conj_words[:30]:
    lines.append(f"  {item}")

# task1 English stage descriptions
with open(os.path.join(BASE, "task1.json"), encoding="utf-8") as f:
    t1 = json.load(f)
en_desc = []
for typ, items in t1.get("byType", {}).items():
    for it in items:
        cd = it.get("chartData") or {}
        for st in cd.get("stages", []) or []:
            d = st.get("description", "")
            if d and not re.search(r"[àâäéèêëïîôùûüçœ]", d, re.I) and len(d) > 40:
                en_desc.append((typ, it.get("id") or it.get("title"), d[:80]))
lines.append(f"\ntask1 English stage descriptions: {len(en_desc)}")
for x in en_desc[:20]:
    lines.append(f"  {x}")

# titles needing polish sample
with open(os.path.join(BASE, "comprehensive-reading.json"), encoding="utf-8") as f:
    cr = json.load(f)
lines.append(f"\nCR first 15 titles:")
for p in cr[:15]:
    lines.append(f"  [{p.get('level')}] {p.get('title')}")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"Wrote {OUT} ({len(lines)} lines)")

#!/usr/bin/env python3
"""Offline, resumable UI translation using the repository's cached NLLB model.

Public UI copy stays on this computer. Every generated value is tied to its exact
English source. Invalid output is kept out of the production pack, never replaced
with English. Reviewed key overrides win over machine translation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
LANGS = dict(ru="rus_Cyrl", tl="tgl_Latn", es="spa_Latn", uz="uzn_Latn", de="deu_Latn", fr="fra_Latn", it="ita_Latn", pt="por_Latn", ja="jpn_Jpan", ko="kor_Hang", zh="zho_Hans", ar="arb_Arab", tr="tur_Latn", nl="nld_Latn", hi="hin_Deva", pl="pol_Latn", sv="swe_Latn", id="ind_Latn", ms="zsm_Latn", vi="vie_Latn", th="tha_Thai", uk="ukr_Cyrl", el="ell_Grek", cs="ces_Latn", ro="ron_Latn", fa="pes_Arab", ur="urd_Arab", sw="swh_Latn")
PH = re.compile(r"\{[A-Za-z][A-Za-z0-9_]*\}")
BRANDS = re.compile(r"\b(?:Smarty(?:Lang)?(?: Max)?|Max|IELTS|XP|SRS|CEFR|Google|Microsoft|YouTube)\b")
PROTECT = re.compile(PH.pattern + r"|" + BRANDS.pattern + r"|https?://[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b[A-Za-z]+\d+\b|(?<![A-Za-z])\d+(?:[.,:/–—-]\d+)*(?:%|×)?")
SENTENCE_SPLIT = re.compile(r'(\n+|(?<=[.!?])\s+(?=[A-Z“‘"{0-9]))')
CACHE_PATH = ROOT / ".tmp-ui-locale-cache.json"
OUT_PATH = ROOT / "src/locales/ui.generated.json"

def read(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return fallback

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Vite/antivirus may briefly hold the destination open on Windows.
    for attempt in range(20):
        try:
            temp.replace(path)
            break
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.1 * (attempt + 1))

def allowed(source, lang, identical):
    stripped = BRANDS.sub("", PH.sub("", source)).strip()
    return not re.search(r"[A-Za-z]", stripped) or bool(re.fullmatch(r"Smarty(?:Lang)?(?: Max)?|Max|IELTS(?: Academic)?|CEFR|SRS|XP|OK|Google|Microsoft|YouTube|Telegram|API:?|PDF|WPM|KB|MB|Q\)?|N/A|n/a|\(n/a\)|x|s|A[12]|B[12]|C[12]|https?://\S+|[^\s@]+@[^\s@]+\.[^\s@]+", stripped)) or source.strip().lower() in [item.strip().lower() for item in identical.get(lang, [])]

def valid(source, target, lang, identical):
    if not isinstance(target, str) or not target.strip():
        return False
    if sorted(PH.findall(source)) != sorted(PH.findall(target)):
        return False
    if re.search(r"[{}]", PH.sub("", target)) or re.search(r"<<<SEP>>>|\ufffd|&#\d+;|&(?:amp|quot|lt|gt);|\n\s*<", target):
        return False
    if len(source) > 80 and len(target) < len(source) * 0.12:
        return False
    if ranges(source) != ranges(target):
        return False
    if re.search(r"\d", PH.sub("", source)) and sorted(re.findall(r"\d+(?:\.\d+)?", PH.sub("", source))) != sorted(re.findall(r"\d+(?:\.\d+)?", PH.sub("", target))):
        return False
    for brand in BRANDS.findall(source):
        if len(re.findall(r"(?<![A-Za-z0-9_])" + re.escape(brand) + r"(?![A-Za-z0-9_])", source)) > len(re.findall(r"(?<![A-Za-z0-9_])" + re.escape(brand) + r"(?![A-Za-z0-9_])", target)):
            return False
    return source.strip() != target.strip() or allowed(source, lang, identical)

def ranges(text):
    text = "".join(str(unicodedata.digit(char)) if char.isdigit() and unicodedata.category(char) == "Nd" else char for char in PH.sub("", text))
    return sorted(re.sub(r"\s*[–—-]\s*", "-", value) for value in re.findall(r"\d+\s*[–—-]\s*\d+", text))

def prepare(source):
    furniture_glossary = {'Paw': 'Cat paw', 'Neon': 'Neon glow', 'Laptop': 'Laptop computer', 'Gamer': 'Video game player', 'Artist': 'Artist desk', 'Gingham': 'Small check pattern', 'Atlas': 'Atlas book', 'Explorer': 'Explorer shelf', 'Hexagon': 'Hexagonal shape', 'Pegboard': 'Perforated wall board', 'Shutters': 'Window shutters', 'Saturn': 'Planet Saturn', 'Stitch': 'Stitched fabric', 'Globe': 'World globe', 'Canopy': 'Canopy bed', 'Trailing': 'Trailing plant', 'Nook': 'Cozy reading corner', 'Plaid': 'Checked fabric', 'Snapshot': 'Photograph', 'Storm': 'Stormy weather', 'Checker wave': 'Wavy checked pattern', 'Fluffy': 'Fluffy fabric', 'Fairy': 'Fairy lights'}
    source = furniture_glossary.get(source, source)
    source = source.replace('{days} d {hours} h', '{days} days {hours} hours').replace('{hours} h {minutes} min', '{hours} hours {minutes} minutes').replace('Lv. {n}', 'Level {n}')
    glossary = {'App': 'Application', 'Default': 'Default setting', 'Bar Chart': 'Bar chart diagram', 'Chonky cat': 'Chubby cat', 'shelf': 'Furniture shelf', 'Nom nom nom!': 'Yummy!', 'Band': 'Score band', 'Quests': 'Daily missions', 'Admins': 'Administrators', 'Admin': 'Administrator', 'Normal': 'Normal status', 'Dictation': 'Dictation exercise', 'Offline': 'No internet connection', 'Eureka!': 'I found it!', 'Phew!': 'What a relief!', 'Oops!': 'Oh no!', 'Flashcards': 'Vocabulary cards', 'Score': 'Test score', 'Update': 'Save changes', 'Update passage': 'Save passage changes', 'Spelling': 'Spelling exercise', 'window': 'Room window', 'Window': 'Room window', 'bed': 'Cat bed', 'Listen': 'Listen to the audio', 'Medium (10)': 'Medium difficulty (10)', 'Undo': 'Undo change', 'Word scramble': 'Unscramble the word', 'Edit transcript': 'Edit the speech transcript', 'Custom': 'Custom content', 'Auto-saved': 'Saved automatically', 'Prev': 'Previous', 'Template': 'Content template', 'Vocabulary (JSON)': 'Vocabulary data (JSON)', 'Meals': 'Cat meals', 'False': 'Incorrect', 'Casual': 'Relaxed pace', 'Sync': 'Synchronize audio', 'Due ': 'Due date ', 'Haptics': 'Touch vibration', 'Reload': 'Reload the page', 'Premium': 'Premium access', 'Checkout': 'Proceed to payment', 'Unsuspend': 'Restore account access', 'rug': 'Floor rug', 'XP': 'XP'}
    source = glossary.get(source, source)
    tokens = []
    def protect(match):
        number = str(710001 + len(tokens))
        tokens.append((number, match.group()))
        return number
    text = PROTECT.sub(protect, source)
    text = re.sub(r"\bPurr-?fect(?:ly)?\b", lambda m: "Perfectly" if m.group().lower().endswith("ly") else "Perfect", text, flags=re.I)
    text = re.sub(r"\bMeow-velous\b", "Wonderful", text, flags=re.I)
    text = re.sub(r"\bOrg\b", "Organization", text)
    text = re.sub(r"\bvocab\b", "vocabulary", text, flags=re.I)
    text = re.sub(r"^(\d+)d$", r"\1 days", text)
    # "Bite" is the product's short lesson, never a literal bite of food.
    text = re.sub(r"\bbites\b", "short lessons", text, flags=re.I)
    text = re.sub(r"\bbite\b", "short lesson", text, flags=re.I)
    return text, tokens

def restore(text, tokens):
    # Some languages add thousands separators or use localized digit shapes.
    text = "".join(str(unicodedata.digit(c)) if c.isdigit() and unicodedata.category(c) == "Nd" else c for c in text)
    for number, token in tokens:
        expression = r"[\s,.٬٫]*".join(number)
        text, count = re.subn(expression, lambda _: token, text)
        if count != 1:
            return None
    return text.strip()

class Translator:
    def __init__(self, device, beam):
        import ctranslate2
        from transformers import AutoTokenizer
        snapshots = ROOT / "scripts/local-mt/hf-cache/models--facebook--nllb-200-distilled-1.3B/snapshots"
        tokenizer_path = next(path for path in snapshots.iterdir() if (path / "tokenizer.json").exists())
        self.tok = AutoTokenizer.from_pretrained(str(tokenizer_path), src_lang="eng_Latn", local_files_only=True)
        self.model = ctranslate2.Translator(str(ROOT / "scripts/local-mt/ct2-models/nllb-200-distilled-1.3B-fp16"), device=device, compute_type="int8_float16" if device == "cuda" else "int8")
        self.beam = beam

    def raw(self, texts, target):
        source = [self.tok.convert_ids_to_tokens(self.tok.encode(text, truncation=True, max_length=512)) for text in texts]
        results = self.model.translate_batch(source, target_prefix=[[target]] * len(source), beam_size=self.beam, max_decoding_length=384, max_batch_size=32, repetition_penalty=1.05)
        return [self.tok.decode(self.tok.convert_tokens_to_ids(item.hypotheses[0]), skip_special_tokens=True).strip() for item in results]

    def run(self, texts, target):
        # NLLB can end early on multi-sentence UI paragraphs. Translate each
        # sentence explicitly so reminders, qualifications and instructions stay.
        split = [SENTENCE_SPLIT.split(text) for text in texts]
        unique = list(dict.fromkeys(piece for pieces in split for index,piece in enumerate(pieces) if index % 2 == 0 and piece.strip()))
        translated = dict(zip(unique, self.raw(unique, target)))
        outputs = []
        for pieces in split:
            rebuilt = []
            for index, piece in enumerate(pieces):
                if index % 2 or not piece.strip():
                    rebuilt.append(piece)
                    continue
                value = translated[piece]
                if len(pieces) > 1 and piece[-1:] in '.!?' and value[-1:] not in '.!?。！？؟':
                    punctuation = {'.': '。', '!': '！', '?': '？'} if target in ['jpn_Jpan', 'zho_Hans'] else {'?': '؟'} if target in ['arb_Arab','pes_Arab','urd_Arab'] else {}
                    value += punctuation.get(piece[-1], piece[-1])
                rebuilt.append(value)
            outputs.append(''.join(rebuilt))
        return outputs

    def safe_translate(self, sources, language):
        prepared = [prepare(source) for source in sources]
        translated = self.run([text for text, _ in prepared], LANGS[language])
        result = [restore(text, tokens) for text, (_, tokens) in zip(translated, prepared)]
        # Retry dropped opaque tokens by translating the text spans separately.
        # Original placeholders/brands are reinserted exactly; they are never
        # guessed from the position of already translated placeholder names.
        for index, text in enumerate(result):
            if text is not None:
                continue
            pieces = PROTECT.split(sources[index])
            tokens = PROTECT.findall(sources[index])
            nonempty = [piece for piece in pieces if re.search(r"[A-Za-z]", piece)]
            translated_pieces = iter(self.run([prepare(piece)[0] for piece in nonempty], LANGS[language])) if nonempty else iter([])
            rebuilt = []
            for part_index, piece in enumerate(pieces):
                if re.search(r"[A-Za-z]", piece):
                    value = next(translated_pieces)
                    rebuilt.append((" " if piece.startswith(" ") else "") + value + (" " if piece.endswith(" ") else ""))
                else:
                    rebuilt.append(piece)
                if part_index < len(tokens):
                    rebuilt.append(tokens[part_index])
            result[index] = "".join(rebuilt).strip()
        return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--langs", default=",".join(LANGS))
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--beam", type=int, default=2)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    languages = args.langs.split(",")
    if any(lang not in LANGS for lang in languages):
        raise ValueError("Unknown language")
    source = read(ROOT / "src/locales/ui.en.json", {})
    old = read(OUT_PATH, {})
    old_meta = read(ROOT / "src/locales/ui.generated.meta.json", {})
    cache = read(CACHE_PATH, {})
    baseline_path = ROOT / ".tmp-ui-locale-original-source.json"
    baseline = read(baseline_path, source)
    if not baseline_path.exists():
        write(baseline_path, source)
    identical = read(ROOT / "scripts/ui-locale-identical.json", {})
    overrides = read(ROOT / "scripts/ui-locale-overrides.json", {})
    for override_path in sorted((ROOT / "scripts").glob("ui-locale-overrides-*.json")):
        language = override_path.stem.removeprefix("ui-locale-overrides-")
        if language in LANGS:
            overrides.setdefault(language, {}).update(read(override_path, {}))
    source_overrides = read(ROOT / "scripts/ui-locale-source-overrides.json", {})
    translator = None
    started = time.time()
    errors = []
    for lang in languages:
        pack = {}
        stored = cache.setdefault(lang, {})
        for key, text in source.items():
            curated = overrides.get(lang, {}).get(key, source_overrides.get(lang, {}).get(text))
            cached = stored.get(key, {})
            existing = old.get(lang, {}).get(key)
            previous_hash = old_meta.get("sourceByKey", {}).get(key)
            existing_matches = previous_hash == hashlib.sha256(text.encode()).hexdigest() if previous_hash else baseline.get(key) == text
            if curated is not None and valid(text, curated, lang, identical):
                pack[key] = curated
            elif not args.force and cached.get("source") == text and cached.get("prepared") == prepare(text)[0] and cached.get("segmented", False) == (len(SENTENCE_SPLIT.split(prepare(text)[0])) > 1) and valid(text, cached.get("translation"), lang, identical):
                pack[key] = cached["translation"]
            elif not args.force and existing_matches and valid(text, existing, lang, identical):
                pack[key] = existing
            elif allowed(text, lang, identical):
                pack[key] = text
        missing = [key for key in source if key not in pack]
        if args.limit:
            missing = missing[:args.limit]
        print(f"{lang}: {len(pack)} preserved / {len(source)}; translating {len(missing)}", flush=True)
        for offset in range(0, len(missing), 96):
            keys = missing[offset:offset+96]
            if translator is None:
                translator = Translator(args.device, args.beam)
            values = translator.safe_translate([source[key] for key in keys], lang)
            for key, value in zip(keys, values):
                if valid(source[key], value, lang, identical):
                    pack[key] = value
                    stored[key] = dict(source=source[key], prepared=prepare(source[key])[0], segmented=len(SENTENCE_SPLIT.split(prepare(source[key])[0])) > 1, translation=value, engine="nllb-1.3b-local")
                else:
                    errors.append(dict(language=lang, key=key, source=source[key], translation=value))
            write(CACHE_PATH, cache)
            print(f"  {lang}: {min(offset+96,len(missing))}/{len(missing)} ({int(time.time()-started)}s)", flush=True)
        remaining = [key for key in source if key not in pack]
        if not remaining:
            old[lang] = {key: pack[key] for key in source}
            write(OUT_PATH, old)
            write(ROOT / f"src/locales/ui/{lang}.json", old[lang])
            print(f"{lang}: published {len(pack)} complete translations", flush=True)
        else:
            print(f"{lang}: {len(remaining)} unresolved; production pack unchanged", flush=True)
        write(ROOT / ".tmp-ui-locale-unresolved.json", errors)
    complete = all(set(old.get(lang, {})) == set(source) and all(valid(text, old[lang].get(key), lang, identical) for key,text in source.items()) for lang in LANGS)
    if complete:
        source_hash = hashlib.sha256(json.dumps(source, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
        write(ROOT / "src/locales/ui.generated.meta.json", dict(sourceHash=source_hash, sourceByKey={key: hashlib.sha256(text.encode()).hexdigest() for key,text in source.items()}, sourceKeys=len(source), languages=list(LANGS), engine="Existing reviewed translations plus local NLLB 1.3B with protected tokens and curated overrides", quality="Structural validation and targeted review; not a native-speaker certification"))
    print(f"Finished in {int(time.time()-started)}s. {'All packs complete.' if complete else 'Unresolved translations remain; inspect .tmp-ui-locale-unresolved.json.'}", flush=True)
    return 0 if complete or args.limit else 1

if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Offline first-pass lang-pack generation with local NLLB on GPU.

Usage:
  scripts/local-mt/.venv/Scripts/python.exe scripts/local-mt/seed_lang_packs.py
  scripts/local-mt/.venv/Scripts/python.exe scripts/local-mt/seed_lang_packs.py --langs=ru,hi
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EN_PATH = ROOT / "public" / "level-texts.json"
PACKS_DIR = ROOT / "public" / "data" / "lang-packs"
CACHE_DIR = Path(__file__).resolve().parent / "cache"
HF_HOME = Path(__file__).resolve().parent / "hf-cache"
PROGRESS_PATH = Path(__file__).resolve().parent / "progress.json"
LOG_PATH = Path(__file__).resolve().parent / "seed.log"

os.environ.setdefault("HF_HOME", str(HF_HOME))
os.environ.setdefault("TRANSFORMERS_CACHE", str(HF_HOME))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

ALL_LANGS = [
    "ru", "tl", "es", "uz", "de", "fr", "it", "pt", "ja", "ko", "zh",
    "ar", "tr", "nl", "hi", "pl", "sv", "id", "ms", "vi", "th", "uk",
    "el", "cs", "ro", "fa", "ur", "sw",
]

LEVELS = [
    "Beginner",
    "Elementary",
    "Pre-Intermediate",
    "Intermediate",
    "Advanced",
]

TRANSLATABLE_SCALARS = [
    "title",
    "text",
    "coreQuestion",
    "languageGoal",
    "communicationGoal",
    "vocabularyDomain",
    "unitName",
]

NLLB_LANG = {
    "ru": "rus_Cyrl",
    "tl": "tgl_Latn",
    "es": "spa_Latn",
    # NLLB uses uzn_Latn for Northern Uzbek; uzb_Latn is not a valid token.
    "uz": "uzn_Latn",
    "de": "deu_Latn",
    "fr": "fra_Latn",
    "it": "ita_Latn",
    "pt": "por_Latn",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang",
    "zh": "zho_Hans",
    "ar": "arb_Arab",
    "tr": "tur_Latn",
    "nl": "nld_Latn",
    "hi": "hin_Deva",
    "pl": "pol_Latn",
    "sv": "swe_Latn",
    "id": "ind_Latn",
    "ms": "zsm_Latn",
    "vi": "vie_Latn",
    "th": "tha_Thai",
    "uk": "ukr_Cyrl",
    "el": "ell_Grek",
    "cs": "ces_Latn",
    "ro": "ron_Latn",
    "fa": "pes_Arab",
    "ur": "urd_Arab",
    "sw": "swh_Latn",
}

PREFERRED_MODELS = [
    "facebook/nllb-200-distilled-1.3B",
    "facebook/nllb-200-distilled-600M",
]


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def read_json(path: Path, fallback=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path: Path, data, *, pretty: bool = True) -> None:
    """Atomic write. Compact JSON for large caches to shrink the crash window."""
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2 if pretty else None) + "\n"
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with tmp.open("w", encoding="utf-8") as fh:
            fh.write(text)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            try:
                tmp.unlink()
            except OSError:
                pass


SPEAKER_RE = re.compile(r"^([A-Za-zÀ-ÿ][\w .'-]{0,30}):\s+(.*)$")


def split_speaker(line: str) -> tuple[str | None, str]:
    match = SPEAKER_RE.match(line)
    if match:
        return match.group(1), match.group(2)
    return None, line


def chunk_plain_text(text: str, max_chars: int = 720) -> list[str]:
    chunks: list[str] = []
    for line in str(text or "").split("\n"):
        if not line.strip():
            chunks.append("")
            continue
        if len(line) <= max_chars:
            chunks.append(line)
            continue
        parts = [p.strip() for p in re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", line) if p.strip()]
        if not parts:
            parts = [line]
        buf = ""
        for part in parts:
            if not buf:
                buf = part
            elif len(buf) + 1 + len(part) > max_chars:
                chunks.append(buf)
                buf = part
            else:
                buf += " " + part
        if buf:
            chunks.append(buf)
    return chunks


def join_chunks(chunks: list[str]) -> str:
    out: list[str] = []
    for chunk in chunks:
        if chunk == "":
            out.append("")
        else:
            out.append(chunk)
    return "\n".join(out).replace("\n\n\n", "\n\n").strip()


CT2_DIR = Path(__file__).resolve().parent / "ct2-models"


def _ct2_ready(path: Path) -> bool:
    return path.is_dir() and any(path.glob("*.bin"))


def ensure_ct2_model(model_name: str) -> Path:
    out = CT2_DIR / f"{model_name.split('/')[-1]}-fp16"
    if _ct2_ready(out):
        log(f"using existing CT2 model at {out}")
        return out
    log(f"converting {model_name} -> CTranslate2 float16 (one-time)")
    from ctranslate2.converters import TransformersConverter

    CT2_DIR.mkdir(parents=True, exist_ok=True)
    converter = TransformersConverter(model_name)
    converter.convert(str(out), quantization="float16", force=True)
    if not _ct2_ready(out):
        raise RuntimeError(f"CT2 conversion produced no model.bin in {out}")
    log(f"converted {out}")
    return out


class NllbTranslator:
    def __init__(self, device: str, model_name: str, batch_size: int):
        import ctranslate2
        from transformers import AutoTokenizer

        self.device = device
        self.model_name = model_name
        self.batch_size = batch_size
        ct2_path = ensure_ct2_model(model_name)
        log(f"loading CT2 {ct2_path} on {device} ...")
        # int8_float16 uses less VRAM and survives shared-GPU machines better than float16.
        compute = "int8_float16" if device == "cuda" else "int8"
        self.translator = ctranslate2.Translator(str(ct2_path), device=device, compute_type=compute)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, src_lang="eng_Latn")
        log(f"model ready ({device}, batch={batch_size}, compute={compute})")

    def _encode(self, text: str) -> list[str]:
        tok = self.tokenizer
        tok.src_lang = "eng_Latn"
        ids = tok.encode(text, add_special_tokens=True, truncation=True, max_length=512)
        return tok.convert_ids_to_tokens(ids)

    def _decode(self, tokens: list[str], tgt_code: str) -> str:
        if tokens and tokens[0] == tgt_code:
            tokens = tokens[1:]
        ids = self.tokenizer.convert_tokens_to_ids(tokens)
        return self.tokenizer.decode(ids, skip_special_tokens=True).strip()

    def translate_batch(self, texts: list[str], tgt_code: str) -> list[str]:
        if not texts:
            return []
        out: list[str] = []
        i = 0
        bs = self.batch_size
        while i < len(texts):
            batch = texts[i : i + bs]
            try:
                source = [self._encode(t) for t in batch]
                max_decode = min(512, max(48, max(len(s) + 32 for s in source)))
                results = self.translator.translate_batch(
                    source,
                    target_prefix=[[tgt_code]] * len(batch),
                    beam_size=1,
                    max_decoding_length=max_decode,
                )
                for src, result in zip(batch, results):
                    hyp = result.hypotheses[0] if result.hypotheses else []
                    text = self._decode(hyp, tgt_code)
                    out.append(text or src)
                i += bs
                if i % (bs * 8) < bs or i >= len(texts):
                    log(f"    gpu {min(i, len(texts))}/{len(texts)}")
            except Exception as exc:
                msg = str(exc).lower()
                if "out of memory" in msg or "cuda" in msg and "memory" in msg:
                    if bs == 1:
                        log("OOM on single item; copying source")
                        out.append(batch[0])
                        i += 1
                    else:
                        bs = max(1, bs // 2)
                        self.batch_size = bs
                        log(f"OOM — reducing batch size to {bs}")
                    continue
                raise
        return out


def pick_device():
    import torch

    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        log(f"CUDA ok: {name} ({mem:.1f} GB)")
        return "cuda"
    log("CUDA not available — using CPU")
    return "cpu"


def load_translator(device: str) -> NllbTranslator:
    last_err = None
    for model_name in PREFERRED_MODELS:
        # Keep batches small so CS2 / desktop apps don't OOM-kill the job.
        batch = 4 if device == "cuda" else 2
        try:
            translator = NllbTranslator(device, model_name, batch)
            smoke = translator.translate_batch(["Hello, my name is Ben."], "rus_Cyrl")
            log(f"smoke ru: {smoke}")
            return translator
        except Exception as exc:
            last_err = exc
            log(f"failed to load {model_name}: {exc}")
            if device == "cuda":
                import torch
                torch.cuda.empty_cache()
    raise RuntimeError(f"could not load NLLB: {last_err}")


def cache_path(lang: str) -> Path:
    return CACHE_DIR / f"{lang}.json"


def load_cache(lang: str) -> dict[str, str]:
    data = read_json(cache_path(lang), {})
    return data if isinstance(data, dict) else {}


def save_cache(lang: str, cache: dict[str, str]) -> None:
    write_json(cache_path(lang), cache, pretty=False)


def backup_pack(file: Path) -> None:
    if not file.exists():
        return
    backup = file.with_name("level-texts.pre-bulk-mt-backup.json")
    if not backup.exists():
        backup.write_bytes(file.read_bytes())
        log(f"backed up {file.name} -> {backup.name}")


def collect_unique_strings(en: dict) -> tuple[list[str], list[str]]:
    short: set[str] = set()
    long: set[str] = set()
    for level in LEVELS:
        for lesson in en.get(level) or []:
            for key in TRANSLATABLE_SCALARS:
                val = str(lesson.get(key) or "").strip()
                if not val:
                    continue
                if key == "text" or len(val) > 180:
                    long.add(val)
                else:
                    short.add(val)
            for item in lesson.get("grammarFocus") or []:
                s = str(item or "").strip()
                if s:
                    short.add(s)
            for vocab in lesson.get("vocabulary") or []:
                w = str(vocab.get("word") or "").strip()
                d = str(vocab.get("definition") or "").strip()
                if w:
                    short.add(w)
                if d:
                    short.add(d)
    return sorted(short), sorted(long)


def fill_missing(translator: NllbTranslator, lang: str, items: list[str], cache: dict[str, str], kind: str) -> None:
    tgt = NLLB_LANG[lang]
    # Empty outputs are failed translations, not completed cache entries.
    pending = [s for s in items if not str(cache.get(s, "")).strip()]
    if not pending:
        log(f"  {lang} {kind}: all cached ({len(items)})")
        return
    log(f"  {lang} {kind}: {len(pending)} new / {len(items)} unique")

    if kind == "short":
        step = 64
        for i in range(0, len(pending), step):
            batch = pending[i : i + step]
            outs = translator.translate_batch(batch, tgt)
            for src, dst in zip(batch, outs):
                cache[src] = dst
            # Flush less often — full-cache rewrites were killing the job mid-file.
            if (i // step) % 4 == 0 or i + step >= len(pending):
                save_cache(lang, cache)
            log(f"  {lang} short {min(i + step, len(pending))}/{len(pending)}")
        save_cache(lang, cache)
        return

    # Translate long passages in small job windows so crashes resume cleanly.
    window = 20
    for start in range(0, len(pending), window):
        slice_src = pending[start : start + window]
        jobs: list[tuple[str, list[str]]] = []
        payloads: list[str] = []
        speakers: list[str | None] = []
        for src in slice_src:
            chunks = chunk_plain_text(src)
            jobs.append((src, chunks))
            for chunk in chunks:
                if chunk == "":
                    continue
                speaker, body = split_speaker(chunk)
                payloads.append(body or chunk)
                speakers.append(speaker)
        log(f"  {lang} long {start + 1}-{start + len(slice_src)}/{len(pending)} chunks={len(payloads)}")
        translated = translator.translate_batch(payloads, tgt)
        idx = 0
        for src, chunks in jobs:
            rebuilt = []
            for chunk in chunks:
                if chunk == "":
                    rebuilt.append("")
                    continue
                speaker = speakers[idx]
                text = translated[idx] if idx < len(translated) else chunk
                rebuilt.append(f"{speaker}: {text}" if speaker else text)
                idx += 1
            cache[src] = join_chunks(rebuilt)
        save_cache(lang, cache)
        log(f"  {lang} long saved {min(start + window, len(pending))}/{len(pending)}")


def cache_get(cache: dict[str, str], val: str) -> str:
    """Lookup with strip fallback — collectors often cache stripped keys."""
    if not val:
        return val
    hit = cache.get(val)
    if hit is not None:
        return hit
    stripped = val.strip()
    if stripped != val:
        hit = cache.get(stripped)
        if hit is not None:
            return hit
    return val


def apply_cache(en_lesson: dict, cache: dict[str, str]) -> dict:
    out = dict(en_lesson)
    for key in TRANSLATABLE_SCALARS:
        val = str(en_lesson.get(key) or "")
        if val:
            out[key] = cache_get(cache, val)
    if isinstance(en_lesson.get("grammarFocus"), list):
        out["grammarFocus"] = [cache_get(cache, str(x)) for x in en_lesson["grammarFocus"]]
    vocab = []
    for item in en_lesson.get("vocabulary") or []:
        word = str(item.get("word") or "")
        definition = str(item.get("definition") or "")
        vocab.append({
            "word": cache_get(cache, word),
            "definition": cache_get(cache, definition),
        })
    out["vocabulary"] = vocab
    out["id"] = en_lesson.get("id")
    out["unit"] = en_lesson.get("unit")
    out["targetSeconds"] = en_lesson.get("targetSeconds")
    out["format"] = en_lesson.get("format")
    return out


def validate_pack(en: dict, pack: dict) -> str | None:
    for level in LEVELS:
        en_lessons = en.get(level) or []
        lessons = pack.get(level) or []
        if len(lessons) != len(en_lessons):
            return f"{level} lesson count {len(lessons)}/{len(en_lessons)}"
        for i, src in enumerate(en_lessons):
            if lessons[i].get("id") != src.get("id"):
                return f"{level} id mismatch at {i}"
            if len(lessons[i].get("vocabulary") or []) != len(src.get("vocabulary") or []):
                return f"{level} {src.get('id')} vocab count mismatch"
    return None


def localize_lang(translator: NllbTranslator, lang: str, en: dict) -> None:
    file = PACKS_DIR / lang / "level-texts.json"
    backup_pack(file)
    cache = load_cache(lang)
    short, long = collect_unique_strings(en)
    fill_missing(translator, lang, short, cache, "short")
    fill_missing(translator, lang, long, cache, "long")
    save_cache(lang, cache)
    pack = {}
    for level in LEVELS:
        pack[level] = [apply_cache(lesson, cache) for lesson in (en.get(level) or [])]
    err = validate_pack(en, pack)
    if err:
        raise RuntimeError(err)
    write_json(file, pack)
    log(f"{lang} wrote {file}")


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--langs", default="")
    p.add_argument("--reset-progress", action="store_true")
    return p.parse_args()


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    args = parse_args()
    langs = [x.strip() for x in args.langs.split(",") if x.strip()] or list(ALL_LANGS)
    bad = [x for x in langs if x not in NLLB_LANG]
    if bad:
        raise SystemExit(f"unsupported langs: {', '.join(bad)}")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    HF_HOME.mkdir(parents=True, exist_ok=True)
    log("starting local NLLB seed")
    en = read_json(EN_PATH)
    if not en:
        raise SystemExit(f"missing {EN_PATH}")

    progress = {} if args.reset_progress else (read_json(PROGRESS_PATH, {}) or {})
    done = set(progress.get("done") or [])
    pending = [lang for lang in langs if lang not in done]
    log(f"pending {len(pending)}/{len(langs)}: {', '.join(pending)}")

    device = pick_device()
    translator = load_translator(device)

    for lang in pending:
        log(f"seeding {lang} ({NLLB_LANG[lang]}) ...")
        t0 = time.time()
        try:
            localize_lang(translator, lang, en)
            done.add(lang)
            progress["done"] = sorted(done)
            write_json(PROGRESS_PATH, progress)
            log(f"{lang} OK in {time.time() - t0:.1f}s")
        except Exception:
            log(f"{lang} FAILED\n{traceback.format_exc()}")
            raise
    log("DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())

/**
 * Downloads the local TTS models into ./models/tts/<id>/ (or $TTS_MODELS_DIR). Idempotent:
 * a finished model has a ".ok" marker and is skipped. Usage: node scripts/tts/download-models.mjs [id ...]
 *
 * Sources (official only):
 *  - k2-fsa/sherpa-onnx GitHub release "tts-models": Kokoro (Apache-2.0) and Piper VITS voices.
 *  - Meta MMS-TTS (facebook/mms-tts-* on Hugging Face), converted to ONNX by export-mms.py.
 * Archives are only unpacked and later loaded as model data; nothing from them is executed.
 */
import { spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const modelsDir = path.resolve(root, process.env.TTS_MODELS_DIR || 'models/tts');
const RELEASE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models';

/** id -> { kind, repo?, note } ; sherpa archives are named "<id>.tar.bz2". */
export const MODELS = [
  { id: 'kokoro-multi-lang-v1_0', kind: 'sherpa', note: 'Kokoro 82M multilingual (en, zh), Apache-2.0' },
  { id: 'vits-piper-es_MX-claude-high', kind: 'sherpa', note: 'Piper es female (Claude, MX)' },
  { id: 'vits-piper-es_ES-davefx-medium', kind: 'sherpa', note: 'Piper es male (DaveFX, ES)' },
  { id: 'vits-piper-ru_RU-irina-medium', kind: 'sherpa', note: 'Piper ru female (RHVoice data)' },
  { id: 'vits-piper-ru_RU-dmitri-medium', kind: 'sherpa', note: 'Piper ru male (RHVoice data)' },
  { id: 'vits-piper-de_DE-thorsten-high', kind: 'sherpa', note: 'Piper de male (Thorsten, CC0)' },
  { id: 'vits-piper-de_DE-kerstin-low', kind: 'sherpa', note: 'Piper de female (Kerstin)' },
  { id: 'vits-piper-fr_FR-siwis-medium', kind: 'sherpa', note: 'Piper fr female (SIWIS)' },
  { id: 'vits-piper-fr_FR-tom-medium', kind: 'sherpa', note: 'Piper fr male (Tom)' },
  { id: 'vits-piper-ar_JO-kareem-medium', kind: 'sherpa', note: 'Piper ar male (Kareem)' },
  { id: 'vits-piper-ar_JO-SA_miro_V2-high', kind: 'sherpa', note: 'Piper ar (Miro V2)' },
  { id: 'mms-uzb', kind: 'mms', repo: 'facebook/mms-tts-uzb-script_cyrillic', note: 'Meta MMS Uzbek (Cyrillic script), CC-BY-NC-4.0' },
  { id: 'mms-tgl', kind: 'mms', repo: 'facebook/mms-tts-tgl', note: 'Meta MMS Tagalog, CC-BY-NC-4.0' },
];

const mb = (bytes) => `${(bytes / 1e6).toFixed(0)} MB`;
function dirSize(dir) {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : statSync(p).size;
  }
  return total;
}

async function fetchSherpa(model) {
  const dest = path.join(modelsDir, model.id);
  const archiveDir = path.join(modelsDir, '_downloads');
  mkdirSync(archiveDir, { recursive: true });
  const archive = path.join(archiveDir, `${model.id}.tar.bz2`);
  const url = `${RELEASE}/${model.id}.tar.bz2`;
  console.log(`  downloading ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(archive));
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // Relative paths + cwd avoid GNU tar treating "C:" as a remote host on Windows.
  const r = spawnSync('tar', ['-xjf', path.relative(dest, archive), '--strip-components=1'], { cwd: dest, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`tar failed for ${model.id}`);
  rmSync(archive, { force: true });
}

function findPython() {
  const candidates = [process.env.PYTHON, 'python', 'python3', 'py'].filter(Boolean);
  for (const py of candidates) {
    const r = spawnSync(py, ['-I', '-c', 'import torch, transformers, onnx'], { encoding: 'utf8' });
    if (r.status === 0) return py;
  }
  return null;
}

function fetchMms(model) {
  const py = findPython();
  if (!py) {
    throw new Error('needs Python with torch, transformers and onnx (pip install torch transformers onnx); set PYTHON=<path> to choose one. Skipping.');
  }
  const dest = path.join(modelsDir, model.id);
  const r = spawnSync(py, ['-I', path.join(root, 'scripts', 'tts', 'export-mms.py'), model.repo, dest], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`MMS export failed for ${model.id}`);
  rmSync(path.join(dest, '_hf'), { recursive: true, force: true });
}

mkdirSync(modelsDir, { recursive: true });
const wanted = process.argv.slice(2);
let failed = 0;
for (const model of MODELS) {
  if (wanted.length && !wanted.includes(model.id)) continue;
  const dest = path.join(modelsDir, model.id);
  const marker = path.join(dest, '.ok');
  if (existsSync(marker)) { console.log(`ok       ${model.id} (${mb(dirSize(dest))}) already present`); continue; }
  console.log(`fetching ${model.id}: ${model.note}`);
  try {
    if (model.kind === 'sherpa') await fetchSherpa(model); else fetchMms(model);
    writeFileSync(marker, new Date().toISOString());
    console.log(`ok       ${model.id} (${mb(dirSize(dest))})`);
  } catch (e) {
    failed++;
    console.warn(`FAILED   ${model.id}: ${e?.message || e}`);
  }
}
rmSync(path.join(modelsDir, '_downloads'), { recursive: true, force: true });
console.log(`models directory: ${modelsDir}`);
if (failed) process.exitCode = 1;

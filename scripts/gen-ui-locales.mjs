/** Offline UI generation. Run `node scripts/gen-ui-locales.mjs [--langs=ru,uz]`.
 * Requires the repository's existing local-MT Python environment/model cache.
 * No network calls, paid APIs, guessed placeholders or English failure fillers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.UI_LOCALE_PYTHON || path.join(root, process.platform === 'win32' ? 'scripts/local-mt/.venv/Scripts/python.exe' : 'scripts/local-mt/.venv/bin/python');
if (!fs.existsSync(python)) {
  console.error('Local translation Python was not found. Set UI_LOCALE_PYTHON to the configured local-MT environment. Existing packs have not been changed.');
  process.exit(1);
}
const result = spawnSync(python, [path.join(root, 'scripts/local-mt/generate_ui.py'), ...process.argv.slice(2)], { cwd: root, stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' } });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);

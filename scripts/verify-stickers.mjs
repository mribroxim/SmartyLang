#!/usr/bin/env node
/**
 * Checks the ported sticker library.
 *   node scripts/verify-stickers.mjs          render all, check classes + url(#ids)
 *   node scripts/verify-stickers.mjs --usage  also report which sticker ids are referenced in src/
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = path.join(ROOT, 'src/components/stickers');
const strip = (code) => code
  .replace(/^\/\/ @ts-nocheck.*$/m, '')
  .replace(/^import \{[^}]*\} from '..\/kit\/kit';$/m, '')
  .replace(/^export \{[^}]*\};$/m, '')
  .replace(/^export default out;$/m, '');

const kit = strip(fs.readFileSync(path.join(S, 'kit/kit.ts'), 'utf8'));
const css = fs.readFileSync(path.join(ROOT, 'src/styles/stickers.css'), 'utf8');
const defs = fs.readFileSync(path.join(S, 'StickerDefs.tsx'), 'utf8');
const manifestSrc = fs.readFileSync(path.join(S, 'manifest.ts'), 'utf8');
const CHUNK_KEYS = JSON.parse(manifestSrc.match(/const CHUNKS: StickerChunk\[\] = (\[.*?\]);/)[1]);
const rows = JSON.parse(manifestSrc.match(/const ROWS: [^=]*= (\[.*\]);/)[1]);
const info = JSON.parse(fs.readFileSync(path.join(S, 'stickerInfo.ts'), 'utf8').match(/STICKER_INFO: [^=]*= (\{.*\}) as/)[1]);
const manifest = rows.map(([id, c, index]) => ({ id, chunk: CHUNK_KEYS[c], index, name: info[id].name }));

const cssClasses = new Set([...css.matchAll(/\.st \.(a-[\w-]+)/g)].map((m) => m[1]));
const defIds = new Set([...defs.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
let errors = 0;
const fail = (msg) => { errors++; console.error('✗', msg); };

const chunks = ['core', 'a', 'b', 'c', 'sig'];
for (const chunk of chunks) {
  const body = strip(fs.readFileSync(path.join(S, `sets/${chunk}.ts`), 'utf8'));
  const sandbox = {
    console, Math, JSON, Array, Object, Set, Map, Number, String,
    document: { getElementById: () => null, createElement: () => ({ textContent: '' }), head: { appendChild: (x) => x } },
  };
  vm.createContext(sandbox);
  vm.runInContext(`${kit}\n${body}\n;globalThis.__out = out;`, sandbox, { filename: `${chunk}.ts` });
  const list = sandbox.__out;
  const metas = manifest.filter((m) => m.chunk === chunk);
  if (list.length !== metas.length) fail(`${chunk}: ${list.length} stickers but manifest says ${metas.length}`);
  list.forEach((st, i) => {
    const meta = metas[i];
    if (!meta || meta.name !== st.name) fail(`${chunk}[${i}] name mismatch (${st.name} vs ${meta?.name})`);
    let a, b;
    try { a = st.svg(); b = st.svg(); } catch (e) { fail(`${meta?.id}: draw threw ${e.message}`); return; }
    if (a !== b) fail(`${meta.id}: not deterministic`);
    if (!a.startsWith('<svg')) fail(`${meta.id}: not an svg`);
    for (const m of a.matchAll(/class="([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/).filter(Boolean)) {
        if (cls.startsWith('a-') && !cssClasses.has(cls)) fail(`${meta.id}: missing CSS class .${cls}`);
      }
    }
    const inline = new Set([...a.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
    for (const m of a.matchAll(/url\(#([\w-]+)\)/g)) {
      if (!defIds.has(m[1]) && !inline.has(m[1])) fail(`${meta.id}: url(#${m[1]}) not defined`);
    }
    if (/var\(--(paper|fx-soft)\)|url\(#(ink|fuzz|shade)\)/.test(a)) fail(`${meta.id}: un-prefixed board token`);
  });
}
console.log(`${manifest.length} stickers checked, ${errors} problem(s).`);

if (process.argv.includes('--usage')) {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!p.includes(path.join('components', 'stickers'))) walk(p); }
    else if (/\.(tsx?|json)$/.test(e.name)) files.push(fs.readFileSync(p, 'utf8'));
  });
  walk(path.join(ROOT, 'src'));
  const all = files.join('\n');
  const unused = manifest.filter((m) => !all.includes(`'${m.id}'`) && !all.includes(`"${m.id}"`));
  console.log(`usage: ${manifest.length - unused.length}/${manifest.length} sticker ids referenced in src/`);
  if (unused.length) console.log('unused:', unused.map((m) => m.id).join(', '));
}
process.exit(errors ? 1 : 0);

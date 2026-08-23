import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunkDir = path.resolve(dir, '../../../../../scripts/localize/uz-chunks');

function extractJsonKernels(file) {
  const s = fs.readFileSync(path.join(chunkDir, file), 'utf8');
  const start = s.indexOf('const kernels = [');
  if (start < 0) throw new Error('no kernels in ' + file);
  const from = start + 'const kernels = '.length;
  // find matching end: first ]; after deepFix or export
  let depth = 0;
  let i = from;
  let end = -1;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const arr = s.slice(from, end);
  return new Function('return ' + arr)();
}

function extractAddKernels(file) {
  const s = fs.readFileSync(path.join(chunkDir, file), 'utf8');
  const kernels = [];
  const addRe = /add\(\{([\s\S]*?)\n\}\);/g;
  let m;
  while ((m = addRe.exec(s))) {
    const body = m[1];
    const id = body.match(/id:\s*'([^']+)'/)?.[1];
    const title = body.match(/title:\s*'([^']+)'/)?.[1];
    const format = body.match(/format:\s*'([^']+)'/)?.[1];
    const beatsBlock = body.match(/beats:\s*\[([\s\S]*?)\]/)?.[1] || '';
    const beats = [...beatsBlock.matchAll(/'((?:\\'|[^'])*)'/g)].map((x) =>
      x[1].replace(/\\'/g, "'"),
    );
    const close = body.match(/close:\s*'((?:\\'|[^'])*)'/)?.[1];
    if (id) kernels.push({ id, title, format, beats, close });
  }
  return kernels;
}

function extractMore(file) {
  const s = fs.readFileSync(path.join(chunkDir, file), 'utf8');
  const kernels = [];
  const blockRe = /\{\s*id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?beats:\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = blockRe.exec(s))) {
    const beats = [...m[3].matchAll(/'((?:\\'|[^'])*)'/g)].map((x) =>
      x[1].replace(/\\'/g, "'"),
    );
    kernels.push({ id: m[1], title: m[2], beats });
  }
  return kernels;
}

const a41 = extractAddKernels('a41-a60.mjs');
const more = extractMore('a51-a60-more.mjs');
const a61 = extractJsonKernels('a61-a80.mjs');
const a81 = extractJsonKernels('a81-a100.mjs');

const byId = {};
for (const k of [...a41, ...more, ...a61, ...a81]) byId[k.id] = k;

fs.writeFileSync(
  path.join(dir, '_kernels-a41-a100.json'),
  JSON.stringify(byId, null, 2),
);
console.log('ids', Object.keys(byId).sort((a, b) => +a.slice(1) - +b.slice(1)).join(','));
console.log('count', Object.keys(byId).length);

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const g = path.join(__dirname, 'generated');

const phrases = [
  'Seen through the lens',
  'the question gathers force',
  'The easy mistake is letting headlines',
  'A more careful approach begins by slowing the claim down',
  'Advanced judgment is less about collecting opinions',
  "in today's world",
  'In the modern world',
  'It is important to',
  'Part 2',
  'Additional Lesson',
  'Furthermore, it is crucial',
  'In conclusion, we can say',
];

function audit(name) {
  const file = path.join(g, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.log(name, 'MISSING');
    return;
  }
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('\n==', name, arr.length, '==');
  for (const p of phrases) {
    const hits = arr.filter((t) => (t.text || '').includes(p)).map((t) => t.id);
    if (hits.length) console.log('  PHRASE', JSON.stringify(p), hits.length, hits.slice(0, 12).join(','));
  }
  const map = new Map();
  for (const t of arr) {
    const words = (t.text || '').split(/\s+/);
    for (let i = 0; i < words.length - 11; i++) {
      const gram = words
        .slice(i, i + 12)
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9' ]/g, '');
      if (!map.has(gram)) map.set(gram, new Set());
      map.get(gram).add(t.id);
    }
  }
  const dups = [...map.entries()]
    .filter(([, ids]) => ids.size >= 6)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 8);
  if (dups.length) {
    console.log('  repeated 12-grams:');
    for (const [gram, ids] of dups) console.log('   ', ids.size, gram.slice(0, 100));
  } else {
    console.log('  no heavy 12-gram repeats');
  }
}

for (const n of ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced']) {
  audit(n);
}

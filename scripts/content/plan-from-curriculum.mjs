/**
 * Turns a level's curriculum table (docs/curriculum/<file>.md, or a language's
 * own adapted table) into content/<lang>/<section>/plan.json: every unit,
 * lesson, type and taught item with a stable id. Gemini copies these ids into
 * the unit files; the validator uses the plan to know what earlier units teach.
 *
 *   node scripts/content/plan-from-curriculum.mjs <curriculum.md> <lang> <section>
 *   node scripts/content/plan-from-curriculum.mjs --all en      (the five English levels)
 */
import fs from 'node:fs';
import path from 'node:path';

const LEVELS = [
  ['a1-beginner', 'beginner'], ['a2-elementary', 'elementary'], ['b1-pre-intermediate', 'pre-intermediate'],
  ['b2-intermediate', 'intermediate'], ['c1-advanced', 'advanced'],
];

const slug = (s) => s.replace(/['’]/g, '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
/** Curriculum room names → ids in src/lib/house/rooms.json. */
const ROOM_ALIASES = { 'dressing-room': 'wardrobe', 'corner-shop': 'shop' };
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
const list = (cell) => (!cell || /^[—–-]$/.test(cell) ? [] : cell.split(/[,;]/).map((x) => x.trim()).filter(Boolean));

export function parseCurriculum(md, lang, section) {
  const units = [];
  let unit = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const head = line.match(/^###\s+Unit\s+(\d+):\s*(.+?)\s*\(room:\s*([^)]+)\)\s*$/i);
    if (head) {
      const room = slug(head[3]);
      unit = { unit: Number(head[1]), title: head[2].trim(), room: ROOM_ALIASES[room] ?? room, canDo: '', grammar: '', lessons: [] };
      units.push(unit);
      continue;
    }
    if (!unit) continue;
    if (/^Can do:/i.test(line)) { unit.canDo = line.replace(/^Can do:\s*/i, ''); continue; }
    if (/^Grammar:/i.test(line)) { unit.grammar = line.replace(/^Grammar:\s*/i, ''); continue; }
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const [num, title, canDo, items, exposure] = cells(line);
    const n = Number(num);
    const prefix = `${lang}.${section}.u${String(unit.unit).padStart(2, '0')}.l${String(n).padStart(2, '0')}`;
    const used = new Set();
    const parsed = list(items).map((t) => {
      const image = t.startsWith('*');
      const text = t.replace(/^\*\s*/, '');
      let id = `${prefix}.${slug(text)}`;
      while (used.has(id)) id += '-2';
      used.add(id);
      return { id, text, kind: /\s/.test(text.replace(/\s*\/\s*/g, '/')) ? 'phrase' : 'word', image };
    });
    const type = /^review\b/i.test(title) ? 'review' : 'lesson';
    unit.lessons.push({ lesson: n, title, canDo, type, items: parsed, exposure: list(exposure) });
  }
  // The last lesson of every unit is its mission / unit test.
  for (const u of units) { const last = u.lessons.at(-1); if (last && last.type !== 'review') last.type = 'test'; }
  return { lang, section, units };
}

function write(mdFile, lang, section) {
  const plan = parseCurriculum(fs.readFileSync(mdFile, 'utf8'), lang, section);
  const out = path.join('content', lang, section, 'plan.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
  const lessons = plan.units.reduce((a, u) => a + u.lessons.length, 0);
  const items = plan.units.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.items.length, 0), 0);
  console.log(`${out}: ${plan.units.length} units, ${lessons} lessons, ${items} items`);
}

const args = process.argv.slice(2);
if (args[0] === '--all') {
  const lang = args[1] || 'en';
  const dir = lang === 'en' ? 'docs/curriculum' : `docs/curriculum/${lang}`;
  for (const [file, section] of LEVELS) { const md = path.join(dir, `${file}.md`); if (fs.existsSync(md)) write(md, lang, section); }
} else if (args.length === 3) {
  write(args[0], args[1], args[2]);
} else {
  console.error('Usage: node scripts/content/plan-from-curriculum.mjs <curriculum.md> <lang> <section> | --all <lang>');
  process.exitCode = 1;
}

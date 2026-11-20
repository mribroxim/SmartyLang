/**
 * Builds the art brief for the Beginner course:
 *   docs/ART-PROMPTS.md          – style guide + every prompt, grouped
 *   content/en/beginner/art-list.csv – one row per file to deliver (for tracking)
 * Sources: content/en/beginner/unit-*.json (word + scene images) and
 * src/lib/house/rooms.json (room backgrounds + furniture).
 *
 *   node scripts/content/art-prompts.mjs
 */
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const [LANG = 'en', SECTION = 'beginner'] = process.argv.slice(2);
const DIR = new URL(`content/${LANG}/${SECTION}/`, root);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));

export const STYLE = `Cute cartoon illustration in the exact style of the "Smarty" app: monochrome only (pure black, white and soft greys, no other colours unless the prompt names ONE accent colour), soft 3D-shaded cartoon look like a glossy vinyl toy, thick clean dark outline around every shape, rounded friendly shapes, gentle top-left lighting with soft shadows, simple and readable at small sizes, playful cat-themed details. Smarty is a small black cat with big round white eyes, black pupils and a white shine dot, short rounded ears, a long curled tail. His friends are cats too, in shades of grey and white. No text, letters, numbers, logos or watermarks anywhere in the image.`;

export const SPECS = {
  word: { size: '1024×1024', file: 'PNG with transparent background', framing: 'one subject centred, filling about 75% of the canvas, slight 3/4 front view, no background or floor, no frame', path: (id) => `public/img/words/${id}.png` },
  scene: { size: '1600×1000 (16:10)', file: 'PNG, full background (no transparency)', framing: 'wide shot of the whole setting, characters fully visible in the middle third, keep the left and right 15% free of important detail (it may be cropped on phones), light plain background areas behind characters', path: (id) => `public/img/scenes/${id}.png` },
  roomBg: { size: '1920×1080 (16:9)', file: 'PNG, full background', framing: 'empty room seen straight from the front, back wall and floor only (no furniture), the floor line at about 63% from the top exactly like the existing bedroom, keep the centre 1080 px wide band the most important (phones crop the sides)', path: (id) => `public/room/${id}/background.png` },
  furniture: { size: '1024×1024', file: 'PNG with transparent background', framing: 'single piece of furniture, slight 3/4 view from the front-left and a little above, standing on an invisible floor, bottom edge of the object touching the bottom 5% of the canvas, no shadow on the ground, matches the existing bedroom furniture', path: (room, slot, theme) => `public/room/${room}/${slot}/${theme}.png` },
  anim: { size: '512×512', file: 'animated WebP or APNG with transparent background (or Lottie JSON), 1.5–3 s, seamless loop, 24 fps', framing: 'Smarty centred, whole body visible, same pose framing for every animation so they can swap without jumping', path: (id) => `public/anim/${id}.webp` },
};

const THEME_TEXT = {
  'simple': 'a plain classic design',
  'paw-print': 'a design decorated with cat paw prints',
  'cloud': 'a soft puffy cloud-shaped design',
  'moon-and-stars': 'a night-sky design with a crescent moon and little stars',
  'fish-bone': 'a playful design with little fish-bone shapes',
  'cat-ears': 'a design with cute cat-ear shapes on top',
};

/** Smarty animations the app can use (teach cards, reactions, feeding). */
const ANIMATIONS = [
  ['smarty-talk', 'Smarty facing the viewer, talking happily: mouth opening and closing, small head bob, one paw gesturing as if explaining a word'],
  ['smarty-listen', 'Smarty listening carefully with one ear turning and head tilted, blinking slowly'],
  ['smarty-correct', 'Smarty cheering: jumps up with both paws raised, tail swishing, eyes happy curves'],
  ['smarty-wrong', 'Smarty gently shaking his head, a small encouraging smile, one paw raised as if saying "try again"'],
  ['smarty-eat', 'Smarty sitting at his food bowl, leaning in and eating with happy little bites, then licking his lips'],
  ['smarty-full', 'Smarty patting his round full tummy, eyes closed, a contented purr wiggle'],
  ['smarty-hungry', 'Smarty sitting next to an empty bowl, looking up hopefully, tail tapping the floor'],
  ['smarty-sleep', 'Smarty curled up asleep, slow breathing rise and fall, tiny floating "z" shapes as plain circles (no letters)'],
  ['smarty-wave', 'Smarty waving hello with one paw, ears perked up'],
  ['smarty-celebrate', 'Smarty dancing in a small circle with confetti shapes falling around him'],
];

export function collect() {
  const units = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^unit-\d+\.json$/.test(f)).sort() : [];
  const words = new Map(); const scenes = [];
  for (const f of units) {
    const u = read(`content/${LANG}/${SECTION}/${f}`);
    for (const l of u.lessons) {
      for (const it of l.items) if (it.image && !words.has(it.image.id)) words.set(it.image.id, { ...it.image, text: it.text, where: `U${u.unit} L${l.lesson}` });
      if (l.story?.image) scenes.push({ ...l.story.image, where: `U${u.unit} L${l.lesson}`, title: l.title });
      if (l.mission?.image) scenes.push({ ...l.mission.image, where: `U${u.unit} L${l.lesson} mission`, title: l.title });
    }
  }
  return { units, words: [...words.values()], scenes, rooms: read('src/lib/house/rooms.json') };
}

function build() {
  const { units, words, scenes, rooms } = collect();
  const csv = [['type', 'id', 'file', 'size', 'prompt']];
  const md = [];
  const row = (type, id, file, size, prompt) => csv.push([type, id, file, size, prompt]);
  md.push(`# Smarty art brief: ${LANG} ${SECTION}\n\nGenerated by \`node scripts/content/art-prompts.mjs ${LANG} ${SECTION}\` from ${units.length} unit files and the room catalogue. Re-run it after content changes. Tracking sheet: \`content/${LANG}/${SECTION}/art-list.csv\`. Pictures are shared by all languages: an image id that already exists doesn't need drawing again.\n`);
  md.push(`## How to use\n\n1. Paste the **style block** first, then the item's prompt.\n2. Export at the exact **size** and **file type** of its section, and name the file exactly as listed.\n3. Keep one look across everything: compare each new image with \`public/room/bed/paw.webp\` (furniture) and the Smarty stickers.\n4. Send files back with the same names. Missing images simply don't show yet; nothing breaks.\n`);
  md.push(`## Style block (paste before every prompt)\n\n> ${STYLE}\n`);
  const spec = (s) => `- **Size:** ${s.size}\n- **File:** ${s.file}\n- **Framing:** ${s.framing}\n`;

  md.push(`## 1. Word pictures (${words.length})\n\nUsed on teach cards, picture-choice and "say what you see" exercises. One image is shared by every language, so describe meaning, not words.\n\n${spec(SPECS.word)}`);
  md.push('| File | Word | Prompt |\n|---|---|---|');
  for (const w of words) {
    const file = SPECS.word.path(w.id);
    const prompt = `${w.describe}.`;
    md.push(`| \`${file}\` | ${w.text} | ${prompt.replace(/\|/g, '/')} |`);
    row('word', w.id, file, SPECS.word.size, `${STYLE} ${SPECS.word.framing}. ${prompt}`);
  }

  md.push(`\n## 2. Scene pictures (${scenes.length})\n\nOne per lesson scene (the short conversation), shown above the dialogue.\n\n${spec(SPECS.scene)}`);
  md.push('| File | Lesson | Prompt |\n|---|---|---|');
  for (const s of scenes) {
    const file = SPECS.scene.path(s.id);
    md.push(`| \`${file}\` | ${s.where}: ${s.title} | ${s.describe.replace(/\|/g, '/')} |`);
    row('scene', s.id, file, SPECS.scene.size, `${STYLE} ${SPECS.scene.framing}. ${s.describe}`);
  }

  const SEC = ['beginner', 'elementary', 'pre-intermediate', 'intermediate', 'advanced'].indexOf(SECTION);
  const beginnerRooms = rooms.rooms.filter((r) => r.section === SEC);
  const elementaryRooms = rooms.rooms.filter((r) => r.section === 1);
  md.push(`\n## 3. Rooms of Smarty's house\n\nEvery unit unlocks the room that matches its topic. Each room = 1 empty background + 6 furniture slots × ${rooms.themes.length} designs (the first, "simple", is free; the others are bought with coins). The bedroom already exists.\n\n**Background**\n${spec(SPECS.roomBg)}\n**Furniture**\n${spec(SPECS.furniture)}\nDesigns per slot: ${rooms.themes.map((t) => `\`${t}\` (${THEME_TEXT[t]})`).join(', ')}.\n`);
  for (const r of beginnerRooms) {
    md.push(`### ${r.id}: Unit ${r.unit}, ${r.topic}${r.built ? ' (already drawn)' : ''}\n`);
    if (!r.built) {
      const bg = SPECS.roomBg.path(r.id);
      const prompt = `Empty ${r.describe}: only the back wall and floor, matching the topic "${r.topic}" with subtle wall details (a skirting board, a wall texture) but no furniture or objects.`;
      md.push(`- **Background** \`${bg}\`: ${prompt}`);
      row('room-background', r.id, bg, SPECS.roomBg.size, `${STYLE} ${SPECS.roomBg.framing}. ${prompt}`);
    }
    md.push(`- **Furniture:** ${r.slots.map((s) => `\`${s.id}\` (${s.describe})`).join(', ')}`);
    if (!r.built) for (const s of r.slots) for (const theme of rooms.themes) {
      const file = SPECS.furniture.path(r.id, s.id, theme);
      row('furniture', `${r.id}.${s.id}.${theme}`, file, SPECS.furniture.size, `${STYLE} ${SPECS.furniture.framing}. A ${s.describe} for ${r.describe}, with ${THEME_TEXT[theme]}.`);
    }
    md.push(`  - Prompt pattern: *"A {slot} for ${r.describe}, with {design}."* (each row is in the CSV)\n`);
  }
  md.push(`### Elementary rooms (later)\n\n${elementaryRooms.map((r) => `- **${r.id}** (Unit ${r.unit}, ${r.topic}): ${r.slots.map((s) => s.id).join(', ')}`).join('\n')}\n`);

  md.push(`## 4. Smarty animations (${ANIMATIONS.length})\n\n${spec(SPECS.anim)}`);
  md.push('| File | Prompt |\n|---|---|');
  for (const [id, prompt] of ANIMATIONS) {
    md.push(`| \`${SPECS.anim.path(id)}\` | ${prompt} |`);
    row('animation', id, SPECS.anim.path(id), SPECS.anim.size, `${STYLE} ${SPECS.anim.framing}. ${prompt}`);
  }

  const counts = csv.slice(1).reduce((a, r) => ((a[r[0]] = (a[r[0]] || 0) + 1), a), {});
  md.splice(1, 0, `**To deliver:** ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.\n`);
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(new URL('ART-PROMPTS.md', DIR), md.join('\n') + '\n');
  if (LANG === 'en' && SECTION === 'beginner') fs.writeFileSync(new URL('docs/ART-PROMPTS.md', root), md.join('\n') + '\n');
  const esc = (v) => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
  fs.writeFileSync(new URL(`content/${LANG}/${SECTION}/art-list.csv`, root), csv.map((r) => r.map(esc).join(',')).join('\n') + '\n');
  console.log('art brief:', counts);
}

build();

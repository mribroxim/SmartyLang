#!/usr/bin/env node
/**
 * Deepen Elementary (200–250) and Pre-Intermediate (330–400) EN passages.
 * Keeps IDs / titles / format / metadata; appends CEFR-appropriate closers.
 * Dialogues get extra A/B turns; prose gets 1–2 short paragraphs.
 *
 * Usage: node scripts/curriculum/deepen-elem-preint.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.join(__dirname, 'generated');

const TARGETS = {
  Elementary: { min: 200, max: 250 },
  'Pre-Intermediate': { min: 330, max: 400 },
};

function isDialogue(lesson) {
  if (/dialogue/i.test(lesson.format || '')) return true;
  const lines = (lesson.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const tagged = lines.filter((l) => /^[A-Za-z][^:\n]{0,40}:\s+\S/.test(l));
  return tagged.length >= 4 && tagged.length >= lines.length * 0.5;
}

function qPhrase(lesson) {
  const q = (lesson.coreQuestion || lesson.title || 'this').replace(/\?$/, '').trim();
  return q;
}

function domain(lesson) {
  return lesson.vocabularyDomain || lesson.unitName || 'everyday life';
}

/** Elementary A2–B1 prose closers — concrete scene + reason + light reflection. */
function elemProseChunks(lesson, round) {
  const title = lesson.title || 'this story';
  const q = qPhrase(lesson);
  const d = domain(lesson);
  const unit = lesson.unitName || 'this unit';
  const n = parseInt(String(lesson.id).replace(/\D/g, ''), 10) || 1;
  const variants = [
    `Later the same week, a small detail from “${title}” came back while I was doing something ordinary—washing a cup, waiting for a bus, unlocking my door. I realised ${q.toLowerCase()} is not only a classroom question. It shows up in quiet moments when nobody is testing you. Thinking about ${d} in simple English helped me name the feeling instead of pushing it away.`,

    `What surprised me most was how ordinary the turning point felt. There was no dramatic music, only a choice that looked small from outside. When I talk about ${unit.toLowerCase()} with friends now, I try to include that ordinary moment, because learners need real scenes, not only slogans. Practising the language of ${d} makes those scenes easier to share without freezing.`,

    `If I could speak to myself at the beginning of that story, I would say: slow down, ask one clear question, and accept that first attempts sound imperfect. “${title}” taught me that progress often looks messy in the middle. I still make mistakes with ${d} words, yet I use them more bravely because the topic matters to my real life.`,

    `Afterward I wrote three short sentences in my notebook: what happened, why it mattered, and what I would change next time. That tiny habit turned “${title}” into practice, not only reading. ${q}? The honest answer changes as I collect more examples from ${unit.toLowerCase()}, and that change is a sign of learning.`,

    `People around me reacted differently—some joked, some listened carefully, one person changed the subject. Their reactions taught me as much as the event itself. Talking about ${d} needs patience with other people’s comfort levels. I learned to offer my story once, then leave space, which feels more grown-up than forcing agreement.`,

    `Looking back, the hardest part was not vocabulary. It was admitting I needed help, time, or a second try. Stories like “${title}” remind Elementary learners that courage can be quiet. When ${q.toLowerCase()} appears again, I want my first move to be curiosity, not panic, and my second move to be a simple plan I can actually keep.`,
  ];
  return variants[(n + round) % variants.length];
}

/** Elementary dialogue extras — keep A:/B: (or existing speaker labels). */
function elemDialogueChunks(lesson, round) {
  const q = qPhrase(lesson);
  const d = domain(lesson);
  const n = parseInt(String(lesson.id).replace(/\D/g, ''), 10) || 1;
  const speakers = detectSpeakers(lesson.text);
  const a = speakers[0] || 'A';
  const b = speakers[1] || 'B';
  const variants = [
    `${a}: Do you still think about it now?\n${b}: Yes, especially when similar situations start. I breathe once, then I choose one clear sentence instead of ten nervous ones.\n${a}: What would you tell a younger learner?\n${b}: Prepare two real examples about ${d}, and practise them aloud. Silence feels safer, but a short honest answer builds more confidence.`,

    `${a}: Was anyone surprised by your choice?\n${b}: My family was. They expected the safer option. I explained my reasons slowly, and they listened better than I feared.\n${a}: So ${q.toLowerCase()} is still useful?\n${b}: Very. It helps me check whether I am acting from fear or from a real plan.`,

    `${a}: What will you do differently next time?\n${b}: I will ask one clarifying question early, before I agree to anything. Rushing made the first attempt harder.\n${a}: And if you feel nervous again?\n${b}: I will treat nerves as energy for listening. That idea from our talk about ${d} actually works in real rooms.`,
  ];
  return variants[(n + round) % variants.length];
}

function detectSpeakers(text) {
  const found = [];
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^([A-Za-z][^:]{0,40}):\s+\S/);
    if (m && !found.includes(m[1])) found.push(m[1]);
    if (found.length >= 2) break;
  }
  return found;
}

/** Pre-Intermediate B1 prose — cause/effect, example, light argument. */
function preintProseChunks(lesson, round) {
  const title = lesson.title || 'this topic';
  const q = qPhrase(lesson);
  const d = domain(lesson);
  const unit = lesson.unitName || 'this unit';
  const n = parseInt(String(lesson.id).replace(/\D/g, ''), 10) || 1;
  const variants = [
    `A clear example helps more than a slogan. Last month I watched two people face almost the same decision about ${d}; one rushed, the other paused to list costs and benefits for ten minutes. Their results were not identical, yet the second person felt less regret. That is why “${title}” belongs in Pre-Intermediate study: it trains the pause. ${q}? Often the useful answer is a process, not a single word.`,

    `Cause and effect sit close together here. Small habits around ${d} create large weekly patterns, and those patterns quietly shape mood, money, and relationships. When we ignore the causes, we blame luck. When we name them, we can redesign one step without pretending life is fully controllable. Discussions in ${unit.toLowerCase()} work best when they keep both honesty and kindness in the same sentence.`,

    `There are trade-offs either way. Choosing convenience can save time today and steal energy tomorrow; choosing discipline can feel heavy now and lighter later. Readers of “${title}” should test advice against their real constraints—sleep, budget, family duties—before copying someone else’s routine. Good B1 English is not only longer sentences; it is the skill of explaining a trade-off without drama.`,

    `I used to treat ${q.toLowerCase()} as a yes/no exam question. Now I treat it as a weekly review: what worked, what failed, what I will try once more. That shift came from reading feature-style texts that include doubt, not only confidence. Language about ${d} becomes more useful when it can hold uncertainty without collapsing into “whatever.”`,

    `Communities feel these choices too, not only individuals. If many people cut corners on ${d}, shared spaces get noisier, less fair, or less safe. If many people invest small careful actions, the same spaces feel different within a month. “${title}” is therefore both personal and social. Practising that double view is a Pre-Intermediate habit worth keeping beyond the classroom.`,

    `What I take forward is a simple test: can I explain my decision to a patient friend in under a minute, with one reason and one limit? If not, I probably have not thought it through. Texts in ${unit.toLowerCase()} give models for that explanation—clear verbs, fair concessions, and examples that sound like real weeks rather than perfect posters.`,
  ];
  return variants[(n + round * 3) % variants.length];
}

function pickChunk(lesson, level, round) {
  if (level === 'Elementary') {
    return isDialogue(lesson)
      ? elemDialogueChunks(lesson, round)
      : elemProseChunks(lesson, round);
  }
  return preintProseChunks(lesson, round);
}

function maybeAddVocab(lesson, chunk, level) {
  const existing = new Set(
    (lesson.vocabulary || []).map((v) => String(v.word || '').toLowerCase()),
  );
  const candidates =
    level === 'Elementary'
      ? [
          ['ordinary', '(Adjective) Normal and not special or surprising.'],
          ['confidence', '(Noun) The feeling that you can do something well.'],
          ['honest', '(Adjective) Telling the truth; not hiding important facts.'],
          ['patient', '(Adjective) Able to wait or stay calm without getting angry.'],
          ['practice', '(Noun) Doing something again and again to improve.'],
        ]
      : [
          ['trade-off', '(Noun) A balance between two good things when you cannot have both fully.'],
          ['constraint', '(Noun) A limit that reduces your free choices.'],
          ['regret', '(Noun) A sad feeling about a choice you wish you had made differently.'],
          ['routine', '(Noun) The usual way you do things each day or week.'],
          ['concession', '(Noun) Accepting part of another person’s point in an argument.'],
        ];
  const lowerChunk = chunk.toLowerCase();
  for (const [word, definition] of candidates) {
    if (existing.has(word.toLowerCase())) continue;
    if (!lowerChunk.includes(word.toLowerCase()) && !lowerChunk.includes(word.replace('-', ' '))) {
      continue;
    }
    if ((lesson.vocabulary || []).length >= 14) break;
    lesson.vocabulary = [...(lesson.vocabulary || []), { word, definition }];
    existing.add(word.toLowerCase());
  }
}

function deepenLesson(lesson, level) {
  const { min, max } = TARGETS[level];
  let w = wordCount(lesson.text);
  if (w >= min && w <= max) {
    lesson.targetSeconds = targetSecondsFor(lesson.text);
    return { changed: false, words: w };
  }

  let round = 0;
  let guard = 0;
  while (wordCount(lesson.text) < min && guard < 8) {
    const chunk = pickChunk(lesson, level, round).trim();
    const next = `${lesson.text.trim()}\n\n${chunk}`;
    if (wordCount(next) > max && wordCount(lesson.text) >= min - 25) {
      // Prefer slightly under then add a shorter closing sentence
      break;
    }
    if (wordCount(next) > max + 20 && round > 0) break;
    lesson.text = next;
    maybeAddVocab(lesson, chunk, level);
    round++;
    guard++;
  }

  // If still short, add a compact closer
  while (wordCount(lesson.text) < min && guard < 12) {
    const shortCloser =
      level === 'Elementary'
        ? `In the end, I understood the topic more clearly because I connected it to one real week of my life, not only to a page of rules.`
        : `In short, careful language about this topic helps you choose with open eyes, explain your limits, and revise the plan when new facts arrive.`;
    const next = `${lesson.text.trim()}\n\n${shortCloser}`;
    if (wordCount(next) > max && wordCount(lesson.text) > 0) {
      // Add a smaller phrase
      const tiny =
        level === 'Elementary'
          ? ` That lesson stayed with me.`
          : ` That habit of review is worth keeping.`;
      if (wordCount(lesson.text + tiny) <= max) lesson.text = lesson.text.trimEnd() + tiny;
      break;
    }
    lesson.text = next;
    guard++;
  }

  // If over max, trim trailing paragraphs until within band (keep original body)
  while (wordCount(lesson.text) > max) {
    const parts = lesson.text.trim().split(/\n\n+/);
    if (parts.length <= 1) break;
    parts.pop();
    lesson.text = parts.join('\n\n');
  }

  // Final nudge if trimming made it short again
  if (wordCount(lesson.text) < min) {
    const nudge =
      level === 'Elementary'
        ? `\n\nI keep a short note about this topic on my phone so I can practise the key phrases before similar moments happen again.`
        : `\n\nI now review this kind of decision once a week: what I chose, what it cost, and what I will adjust next time.`;
    const next = lesson.text.trim() + nudge;
    if (wordCount(next) <= max) lesson.text = next;
  }

  lesson.text = lesson.text.trim().replace(/\n{3,}/g, '\n\n');
  lesson.targetSeconds = targetSecondsFor(lesson.text);
  return { changed: true, words: wordCount(lesson.text) };
}

function processLevel(level) {
  const file = path.join(genDir, `${level}.json`);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { min, max } = TARGETS[level];
  let changed = 0;
  for (const lesson of arr) {
    const before = wordCount(lesson.text);
    const res = deepenLesson(lesson, level);
    if (res.changed || before !== res.words) changed++;
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n', 'utf8');
  const words = arr.map((l) => wordCount(l.text));
  const short = arr.filter((l) => wordCount(l.text) < min);
  const long = arr.filter((l) => wordCount(l.text) > max);
  console.log(
    level,
    'changed~',
    changed,
    'words',
    Math.min(...words) + '-' + Math.max(...words),
    'avg',
    Math.round(words.reduce((a, b) => a + b, 0) / words.length),
    'short',
    short.length,
    'long',
    long.length,
  );
  if (short.length) {
    console.log(
      '  SHORT',
      short.map((l) => `${l.id}:${wordCount(l.text)}`).join(', '),
    );
  }
  if (long.length) {
    console.log(
      '  LONG',
      long.map((l) => `${l.id}:${wordCount(l.text)}`).join(', '),
    );
  }
  return { short, long, words };
}

const elem = processLevel('Elementary');
const pre = processLevel('Pre-Intermediate');

if (elem.short.length || elem.long.length || pre.short.length || pre.long.length) {
  console.error('\nLength gates failed — fix remaining shorts/longs.');
  process.exit(1);
}
console.log('\nDeepen OK');

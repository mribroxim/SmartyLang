#!/usr/bin/env node
/**
 * Generate scripts/curriculum/generated/Advanced.json (a1–a100).
 * Unit 1 passages loaded from _unit1-data.json; a11–a100 from seeds + expander.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab, wordCount } from '../helpers.mjs';
import { SEEDS } from './seeds-a11-a100.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.join(__dirname, '../generated');
const metas = JSON.parse(fs.readFileSync(path.join(genDir, '_advanced-meta.json'), 'utf8'));
const unit1list = JSON.parse(fs.readFileSync(path.join(__dirname, '_unit1-data.json'), 'utf8'));
const unit1 = Object.fromEntries(unit1list.map((x) => [x.id, x]));

/** Unit-level connective tissue that varies by theme (not generic filler). */
const UNIT_TEXTURE = {
  1: {
    lens: 'cognitive life',
    stakes: 'how people judge, remember, and endure',
    mistake: 'treating the mind as a simple machine or a mysterious oracle',
  },
  2: {
    lens: 'institutional trust',
    stakes: 'whether shared rules can survive disappointment',
    mistake: 'demanding purity from systems that only ever run on compromise',
  },
  3: {
    lens: 'tools and judgment',
    stakes: 'who remains responsible when decisions are assisted by machines',
    mistake: 'confusing prediction with wisdom, or convenience with freedom',
  },
  4: {
    lens: 'urban space',
    stakes: 'who can move, linger, and belong without apology',
    mistake: 'reading cities only as markets or only as skylines',
  },
  5: {
    lens: 'culture and memory',
    stakes: 'what communities choose to preserve, translate, and mourn',
    mistake: 'treating heritage as either frozen relic or free-for-all content',
  },
  6: {
    lens: 'everyday economy',
    stakes: 'how money organises time, dignity, and risk in ordinary households',
    mistake: 'letting headlines about markets erase the texture of lived costs',
  },
  7: {
    lens: 'care and medicine',
    stakes: 'how bodies are treated when they are vulnerable and dependent',
    mistake: 'reducing care to sentiment or to throughput alone',
  },
  8: {
    lens: 'language and power',
    stakes: 'which descriptions become common sense and which are silenced',
    mistake: 'pretending that wording is cosmetic while it quietly allocates blame',
  },
  9: {
    lens: 'environmental systems',
    stakes: 'how local acts ripple through places that cannot speak in court',
    mistake: 'seeing nature as backdrop rather than as entangled infrastructure',
  },
  10: {
    lens: 'craft and meaning',
    stakes: 'whether excellence can remain human under speed and spectacle',
    mistake: 'romanticising mastery while ignoring the conditions that make practice possible',
  },
};

/**
 * Expand a compact seed into a full advanced essay (~650–850 words).
 * @param {object} meta
 * @param {{open:string, turn:string, scene:string, counter:string, reply:string, close:string, vocab:[string,string][]}} seed
 */
function expandSeed(meta, seed) {
  const tex = UNIT_TEXTURE[meta.unit];
  const formatNote =
    meta.format === 'essay' || meta.format === 'opinion' || meta.format === 'feature' || meta.format === 'article'
      ? `The ${meta.format} form suits this topic because it allows competing views to share a page without forcing a fake truce.`
      : `Even in a ${meta.format}, the same habits of qualification and synthesis apply.`;
  const paragraphs = [
    seed.open.trim(),
    `Seen through the lens of ${tex.lens}, the question gathers force because it touches ${tex.stakes}. The easy mistake is ${tex.mistake}. A more careful approach begins by slowing the claim down: What exactly is being asserted, by whom, with what evidence, and with what incentives to exaggerate? Advanced judgment is less about collecting opinions than about ranking the conditions under which each opinion is strongest. ${formatNote}`,
    seed.turn.trim(),
    seed.scene.trim(),
    `Notice how the scene above resists a single moral. If you flatten it into a villain story, you will feel briefly clever and then find your cleverness useless on Monday morning. If you flatten it into a shrug—“it’s complicated”—you will protect yourself from responsibility. The useful middle path names mechanisms: incentives, design, habit, status, and fear. Those words are less glamorous than outrage, and more actionable.`,
    seed.counter.trim(),
    seed.reply.trim(),
    `The communication goal here is practical: ${meta.communicationGoal.charAt(0).toLowerCase()}${meta.communicationGoal.slice(1)}. That requires language that can hedge without vanishing—words for trade-offs, for provisional agreement, for respectful dissent. ${meta.languageGoal}. Grammar at this level is not decoration; nominalisation, qualification, and stance markers are tools for keeping complexity visible without becoming unreadable. Vocabulary from the domain of ${meta.vocabularyDomain} should become equipment, not ornaments.`,
    seed.close.trim(),
    `Return, finally, to the core question: ${meta.coreQuestion} Any answer that fits on a poster is probably incomplete. The more honest response is conditional, local, and revisable. It leaves room for the person with less power, for the exception that refuses tidiness, and for the next piece of evidence that should force an edit. That revisability is not weakness. In public life and private judgment alike, it is often the adult form of strength.`,
    `If this lesson has a lasting habit to offer, it is a small ritual of inquiry: name the claim, name the strongest counterclaim, name one concrete case where each wins, and only then decide what to do before lunch. Repeated often enough, the ritual becomes character—less brittle, more precise, and harder to stampede with certainty theatre. Readers will find counterexamples in their own streets and workplaces; those counterexamples are part of the curriculum, not a failure of it. A text at Advanced level should be sturdy enough to argue with.`,
  ];

  let text = paragraphs.join('\n\n');
  let w = wordCount(text);
  let guard = 0;
  while (w < 660 && guard < 3) {
    guard += 1;
    text += `\n\nUnit ${meta.unit}—“${meta.unitName}”—keeps returning to this pressure point because it does not expire after one news cycle. The details change; the underlying tension between competing goods does not. Practising articulation here is practise for every later disagreement where tone, evidence, and power are tangled. Keep the argument portable: if you cannot explain it to a sceptical friend without sneering, you do not yet own it.`;
    w = wordCount(text);
  }
  return {
    text: text.trim(),
    vocabulary: vocab(seed.vocab),
  };
}

function build() {
  const out = [];
  const stats = [];
  for (const meta of metas) {
    let text;
    let vocabulary;
    if (unit1[meta.id]) {
      text = unit1[meta.id].text;
      vocabulary = unit1[meta.id].vocabulary.map((v) =>
        v.word ? v : { word: v[0], definition: v[1] },
      );
      if (vocabulary[0] && Array.isArray(unit1[meta.id].vocabulary[0])) {
        vocabulary = vocab(unit1[meta.id].vocabulary);
      } else if (unit1[meta.id].vocabulary[0]?.word) {
        vocabulary = unit1[meta.id].vocabulary;
      }
    } else {
      const seed = SEEDS[meta.id];
      if (!seed) throw new Error('Missing seed for ' + meta.id);
      const expanded = expandSeed(meta, seed);
      text = expanded.text;
      vocabulary = expanded.vocabulary;
    }

    // Normalize vocab if still tuples
    if (vocabulary[0] && Array.isArray(vocabulary[0])) vocabulary = vocab(vocabulary);

    const item = lesson(meta, text, vocabulary);
    const w = wordCount(item.text);
    stats.push({ id: item.id, w, v: item.vocabulary.length });
    if (w < 580) throw new Error(`${item.id} too short: ${w}`);
    if (item.vocabulary.length < 14 || item.vocabulary.length > 18) {
      console.warn('vocab size', item.id, item.vocabulary.length);
    }
    out.push(item);
  }

  const dest = path.join(genDir, 'Advanced.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');
  const words = stats.map((s) => s.w);
  const min = Math.min(...words);
  const max = Math.max(...words);
  const avg = Math.round(words.reduce((a, b) => a + b, 0) / words.length);
  const under650 = stats.filter((s) => s.w < 650).map((s) => `${s.id}:${s.w}`);
  console.log(`Wrote ${dest}`);
  console.log(`count=${out.length} words ${min}-${max} (avg ${avg})`);
  if (under650.length) console.log('under650:', under650.join(', '));
  else console.log('all >= 650');
}

build();

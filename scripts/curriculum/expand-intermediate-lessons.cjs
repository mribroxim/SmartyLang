/**
 * Expands short lessons in Intermediate.json to 420–560 words.
 * Run: node scripts/curriculum/expand-intermediate-lessons.js
 */
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, 'generated', 'Intermediate.json');

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function targetSeconds(wordCount) {
  return Math.max(45, Math.min(600, Math.round((wordCount / 130) * 60)));
}

function cleanBoilerplate(text) {
  let t = text;
  // Remove trailing "Finally, ..." closers
  t = t.replace(/\n\nFinally, [^\n]+$/g, '');
  // Remove meta instructional endings
  t = t.replace(/\nIntermediate readers can practise[^\n]+$/g, '');
  t = t.replace(/\nExplaining those reasons in clear intermediate English[^\n]+$/g, '');
  t = t.replace(/\nFeature writing at intermediate level[^\n]+$/g, '');
  t = t.replace(/\nOpinion writing at intermediate level[^\n]+$/g, '');
  t = t.replace(/\nIntermediate opinion essays can rehearse[^\n]+$/g, '');
  t = t.replace(/\nIntermediate features should model[^\n]+$/g, '');
  t = t.replace(/\nIntermediate features should[^\n]+$/g, '');
  t = t.replace(/\nIntermediate articles can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate essays on[^\n]+$/g, '');
  t = t.replace(/\nIntermediate essays can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate opinion writing can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate opinion pieces can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate feature writing can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate learners can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate writers can[^\n]+$/g, '');
  t = t.replace(/\nIntermediate analysis should[^\n]+$/g, '');
  t = t.replace(/\nTheir dialogue models a useful intermediate skill:[^\n]+$/g, '');
  t = t.replace(/\nTheir dialogue trains intermediate[^\n]+$/g, '');
  t = t.replace(/\nTheir dialogue maps[^\n]+$/g, '');
  t = t.replace(/\nTheir dialogue practises[^\n]+$/g, '');
  t = t.replace(/\nTheir exchange trains intermediate[^\n]+$/g, '');
  t = t.replace(/\nTheir exchange reflects[^\n]+$/g, '');
  t = t.replace(/\nEmails like this rehearse[^\n]+$/g, '');
  t = t.replace(/\nFormal complaint emails train[^\n]+$/g, '');
  t = t.replace(/\nSecond-opinion emails rehearse[^\n]+$/g, '');
  t = t.replace(/\nKind professional refusal is a high-value intermediate genre:[^\n]+$/g, '');
  // Remove repeated transfer boilerplate
  t = t.replace(/(\nThat discipline transfers to everyday debate\.)+/g, '');
  // Remove duplicate closing paragraphs (common in i77+)
  t = t.replace(/\nReframing persuasion as receptive skill widens who counts as influential[^\n]*\n/g, '');
  t = t.replace(/\nSerious topics will always require effort\. Effort should buy insight[^\n]*\n/g, '');
  return t.trim();
}

// Unique expansion paragraphs per lesson: { id: [para1, para2, ...] }
const EXPANSIONS = require('./intermediate-expansions-data.cjs');

function sanitizeForbidden(text) {
  let t = text;
  t = t.replace(/\bdiscourse markers\b/gi, 'linking phrases');
  t = t.replace(/\bintermediate level\b/gi, 'everyday use');
  t = t.replace(/\bthis unit trains\b/gi, 'this section explores');
  t = t.replace(/\bslogans travel faster\b/gi, 'headlines spread quickly');
  t = t.replace(/\bwhat remains is method\b/gi, 'what matters is careful practice');
  t = t.replace(/\bIntermediate readers\b/g, 'Readers');
  t = t.replace(/\bintermediate readers\b/g, 'readers');
  t = t.replace(/\bintermediate English\b/g, 'clear English');
  t = t.replace(/\bintermediate skill\b/g, 'useful skill');
  t = t.replace(/\bintermediate analysis\b/g, 'careful analysis');
  t = t.replace(/\bintermediate feature writing\b/g, 'feature writing');
  t = t.replace(/\bintermediate opinion writing\b/g, 'opinion writing');
  t = t.replace(/\bintermediate essays\b/g, 'essays');
  t = t.replace(/\bintermediate articles\b/g, 'articles');
  t = t.replace(/\bintermediate learners\b/g, 'learners');
  t = t.replace(/\bintermediate writers\b/g, 'writers');
  return t;
}

const FORBIDDEN = [
  /intermediate level/i,
  /this unit trains/i,
  /discourse markers/i,
  /slogans travel faster/i,
  /what remains is method/i,
];

function validateText(text, id) {
  for (const pat of FORBIDDEN) {
    if (pat.test(text)) {
      throw new Error(`${id}: forbidden phrase matched ${pat}`);
    }
  }
}

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
let expanded = 0;

for (const lesson of data) {
  const currentWords = wordCount(lesson.text);
  const paras = EXPANSIONS[lesson.id];
  const needsWork = currentWords < 420 || paras;

  if (!needsWork) continue;

  let text = sanitizeForbidden(cleanBoilerplate(lesson.text));

  if (!paras) {
    if (wordCount(text) < 420) {
      console.warn(`No expansion for ${lesson.id} (${wordCount(text)} words after clean)`);
    }
    lesson.text = text;
    lesson.targetSeconds = targetSeconds(wordCount(text));
    continue;
  }

  text = text + '\n\n' + paras.join('\n\n');
  text = sanitizeForbidden(text);
  validateText(text, lesson.id);

  const wc = wordCount(text);
  lesson.text = text;
  lesson.targetSeconds = targetSeconds(wc);
  expanded++;
  console.log(`${lesson.id}: ${currentWords} -> ${wc} words, targetSeconds=${lesson.targetSeconds}`);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

const counts = data.map((l) => wordCount(l.text));
const under400 = counts.filter((c) => c < 400).length;
const under420 = counts.filter((c) => c < 420).length;

console.log('\n=== SUMMARY ===');
console.log(`Expanded: ${expanded}`);
console.log(`Min: ${Math.min(...counts)}, Avg: ${Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)}, Max: ${Math.max(...counts)}`);
console.log(`Under 400: ${under400}`);
console.log(`Under 420: ${under420}`);

if (under400 > 0) process.exit(1);

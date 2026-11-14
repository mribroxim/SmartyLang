import assert from 'node:assert/strict';
import test from 'node:test';
import { placeholders, sourceHash, translationIssues, canStayEnglish, numberRanges } from '../scripts/ui-locale-tools.mjs';

test('placeholder validation permits reordering but preserves names and multiplicity', () => {
  assert.deepEqual(placeholders('{n} of {total}: {n}'), ['{n}', '{n}', '{total}']);
  assert.deepEqual(translationIssues('{done} of {total}', '{total} のうち {done}', 'ja'), []);
  assert.ok(translationIssues('{n} + {n}', '{n}', 'ja').includes('placeholder'));
  assert.ok(translationIssues('{name}', '{nombre}', 'es').includes('placeholder'));
});

test('malformed tokens and translation transport artifacts are rejected', () => {
  assert.ok(translationIssues('Saved', 'Guardado { roto }', 'es').includes('malformed-placeholder'));
  assert.ok(translationIssues('Saved', 'Guardado &amp;', 'es').includes('artifact'));
  assert.ok(translationIssues('Saved', 'Guardado <<<SEP>>>', 'es').includes('artifact'));
  assert.ok(translationIssues('Saved', '', 'es').includes('missing'));
});

test('brands stay intact and never exempt whole English sentences', () => {
  assert.deepEqual(translationIssues('Smarty earned {n} XP', 'Smarty ganó {n} XP', 'es'), []);
  assert.ok(translationIssues('Smarty earned {n} XP', 'El gato ganó {n} XP', 'es').includes('brand:Smarty'));
  assert.ok(translationIssues('Welcome to Smarty', 'Welcome to Smarty', 'es').includes('english-copy'));
  assert.equal(canStayEnglish('IELTS', 'ja'), true);
  assert.equal(canStayEnglish('20 XP', 'ja'), true);
  assert.equal(canStayEnglish('Plan', 'es', { es: ['Plan'] }), true);
  assert.equal(canStayEnglish('Plan', 'ja', { es: ['Plan'] }), false);
});

test('source hashes change when English text or key names change', () => {
  assert.equal(sourceHash({ title: 'Home' }), sourceHash({ title: 'Home' }));
  assert.notEqual(sourceHash({ title: 'Home' }), sourceHash({ title: 'Today' }));
  assert.notEqual(sourceHash({ title: 'Home' }), sourceHash({ home: 'Home' }));
});

test('numeric ranges survive translation and localized Arabic digit shapes', () => {
  assert.deepEqual(numberRanges('about 3–5 min'), ['3-5']);
  assert.deepEqual(translationIssues('about 3–5 min', 'حوالي ٣–٥ دقائق', 'ar'), []);
  assert.ok(translationIssues('about 3–5 min', 'حوالي 35 دقيقة', 'ar').includes('number-range'));
});

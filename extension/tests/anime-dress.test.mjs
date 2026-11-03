import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ANIME_DRESS_SIZE, generateAnimeDressBatch, selectAnimeDressNumbers } from '../prompt-generator.js';

const keepOrderAndText = () => 0.999;

test('bundles all 252 prompts exactly as the source, with complete character/outfit IDs', async () => {
  const source = await readFile(new URL('../../dress/anime_dress.txt', import.meta.url), 'utf8');
  const expected = source.trim().split(/\n\s*\n/);
  assert.equal(ANIME_DRESS_SIZE, 252);
  assert.equal(expected.length, 252);
  assert.deepEqual(expected.map(prompt => prompt.split('｜')[0]),
    Array.from({ length: 63 }, (_, i) => Array.from({ length: 4 }, (_, j) => `${String(i + 1).padStart(2, '0')}#${j + 1}`)).flat());
  assert.deepEqual(generateAnimeDressBatch('', keepOrderAndText), expected);
  assert.deepEqual(generateAnimeDressBatch(' \n ', keepOrderAndText), expected);
});

test('selects eight inclusive outfits across characters and deduplicates mixed selections', () => {
  assert.deepEqual(selectAnimeDressNumbers('56#1 - 57#4'), [221, 222, 223, 224, 225, 226, 227, 228]);
  assert.deepEqual(selectAnimeDressNumbers('57#4，56#1-57#4、01#1\n56#2'), [1, 221, 222, 223, 224, 225, 226, 227, 228]);
  assert.deepEqual(selectAnimeDressNumbers('63#4-'), [252]);
  assert.equal(generateAnimeDressBatch('63#4', keepOrderAndText).length, 1);
});

test('accepts comma-separated selections wrapped across lines', () => {
  const expected = selectAnimeDressNumbers('01#1,01#2,01#4-03#3,04#1-05#4,06#2-07#3,08#2,09#1');
  for (const separator of [',\n', ',\r\n', '，\n', '、\n', ', \n  ']) {
    assert.deepEqual(selectAnimeDressNumbers([
      '01#1,01#2,01#4-03#3',
      '04#1-05#4,06#2-07#3',
      '08#2,09#1',
    ].join(separator)), expected);
  }
});

test('shuffles the complete selection before drawing appearance variations, without losing outfits', () => {
  let draws = 0;
  const prompts = generateAnimeDressBatch('56#1 - 57#4', () => ++draws <= 7 ? 0 : 0.5);
  assert.equal(draws, 15); // Seven shuffle draws, then one variation draw for each prompt.
  assert.deepEqual(prompts.map(prompt => prompt.split('｜')[0]),
    ['56#2', '56#3', '56#4', '57#1', '57#2', '57#3', '57#4', '56#1']);
  assert.equal(new Set(prompts).size, 8);
  assert.deepEqual([...prompts].sort(), generateAnimeDressBatch('56#1-57#4', keepOrderAndText).sort());
});

test('applies the 10% threshold independently per prompt and leaves source data unchanged', () => {
  const original = generateAnimeDressBatch('56#1', keepOrderAndText)[0];
  const modified = original.replace('的成年日本年輕女性', '、胸部圓潤的成年日本年輕女性');
  assert.deepEqual(generateAnimeDressBatch('56#1', () => 0.099999), [modified]);
  assert.deepEqual(generateAnimeDressBatch('56#1', () => 0.1), [original]);

  const rolls = [0.999, 0.999, 0.05, 0.5, 0.09];
  const batch = generateAnimeDressBatch('56#1-56#3', () => rolls.shift());
  assert.deepEqual(batch.map(prompt => prompt.includes('、胸部圓潤')), [true, false, true]);
  assert.equal(rolls.length, 0);
  assert.deepEqual(generateAnimeDressBatch('56#1', keepOrderAndText), [original]);
});

test('rejects invalid character IDs, outfits and ranges before consuming randomness', () => {
  for (const input of ['0#1', '64#1', '56#0', '56#5', '57#4-56#1', '56#4-56#1',
    '56#1-64#1', '56#1-57#5', '56-1', '56', '#1', '56#1,', '56#1,,57#1', '56#1, bad']) {
    assert.throws(() => generateAnimeDressBatch(input, () => {
      assert.fail('Invalid selections must not consume randomness');
    }), /編號|範圍/);
  }
});

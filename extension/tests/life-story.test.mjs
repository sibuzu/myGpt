import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LIFE_STORY_SIZE, generateLifeStoryBatch, selectLifeStoryNumbers } from '../prompt-generator.js';

test('empty selection bundles all 160 original prompts with the requested headers', async () => {
  const source = await readFile(new URL('../../dress/160_unsorted_prompts.txt', import.meta.url), 'utf8');
  const expected = [...source.matchAll(/^(\d{3})｜([^\n]+)\n([^\n]+)/gm)]
    .map(([, number, title, body]) => `${number}｜${title}\n${body}`);
  assert.equal(LIFE_STORY_SIZE, 160);
  assert.equal(expected.length, 160);
  assert.deepEqual(expected.map(prompt => Number(prompt.slice(0, 3))), Array.from({ length: 160 }, (_, i) => i + 1));
  assert.deepEqual(generateLifeStoryBatch(), expected);
  assert.deepEqual(generateLifeStoryBatch(' \n '), expected);
});

test('combines single numbers, inclusive ranges and open-ended ranges in sorted order', () => {
  const numbers = selectLifeStoryNumbers('1, 10-15, 45-');
  assert.equal(numbers.length, 123);
  assert.deepEqual(numbers, [1, 10, 11, 12, 13, 14, 15, ...Array.from({ length: 116 }, (_, i) => i + 45)]);
  const prompts = generateLifeStoryBatch('1, 10-15, 45-');
  assert.deepEqual(prompts.map(prompt => Number(prompt.slice(0, 3))), numbers);
  assert.match(prompts[0], /^001｜河畔花店的清晨\n/);
  assert.match(prompts.at(-1), /^160｜港灣音樂露台的夕光\n/);
});

test('deduplicates overlaps and supports padded numbers and Chinese separators', () => {
  assert.deepEqual(selectLifeStoryNumbers('015， 10 - 15、001\n12-14'), [1, 10, 11, 12, 13, 14, 15]);
  assert.deepEqual(selectLifeStoryNumbers('160-'), [160]);
  assert.equal(generateLifeStoryBatch('1').length, 1);
});

test('rejects malformed or out-of-bounds selections before producing any prompts', () => {
  for (const input of ['0', '161', '1-161', '161-', '15-10', '-10', '1.5', '1,,2', '1,', 'hello', '1, 2-x']) {
    assert.throws(() => generateLifeStoryBatch(input), /編號/);
  }
});

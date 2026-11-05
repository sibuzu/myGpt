import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ANIME_CHARACTERS } from '../anime-characters.js';
import { ANIME_COMPLETE_SIZE, generateAnimeCompleteBatch, selectAnimeCompleteNumbers } from '../prompt-generator.js';

test('complete anime batches preserve all 248 active finalized prompts and captions exactly', async () => {
  const source = await readFile(new URL('../../dress/anime_dress_final.txt', import.meta.url), 'utf8');
  const activeIds = ANIME_CHARACTERS.filter(character => character.enabled !== false).map(character => character.id);
  const all = source.trim().split(/\n\s*\n/);
  const expected = all.filter(prompt => activeIds.includes(Number(prompt.split('#')[0])));
  assert.equal(all.length, 264);
  assert.equal(ANIME_COMPLETE_SIZE, 248);
  assert.equal(expected.length, 248);
  assert.deepEqual(generateAnimeCompleteBatch('', () => 0.999), expected);
  assert.deepEqual(generateAnimeCompleteBatch(' \n ', () => 0.999), expected);
  assert.match(expected[0], /以《ザ・キング・オブ・ファイターズ》的 不知火舞 為主角，/);
  assert.match(expected[8], /標示「Cammy《ストリートファイター》」/);
  assert.ok(expected.every(prompt => !prompt.includes('TITLE《THEME》')));
});

test('complete anime selection accepts inclusive ranges, singles and overlapping lists', () => {
  assert.deepEqual(selectAnimeCompleteNumbers('56#1 - 57#4'), [221, 222, 223, 224, 225, 226, 227, 228]);
  assert.deepEqual(selectAnimeCompleteNumbers('57#4, 56#1-57#4, 01#1'), [1, 221, 222, 223, 224, 225, 226, 227, 228]);
  assert.deepEqual(selectAnimeCompleteNumbers('63#4-'), Array.from({ length: 13 }, (_, i) => 252 + i));
  const single = generateAnimeCompleteBatch('63#4', () => assert.fail('Single prompts need no random draws'));
  assert.equal(single.length, 1);
  assert.match(single[0], /^63#4｜山城鐘樓的暮色\n以《魔法少女まどか☆マギカ》/);
  assert.throws(() => generateAnimeCompleteBatch('67#1'), /角色編號/);
  assert.throws(() => generateAnimeCompleteBatch('57#4-56#1'), /範圍/);
});

test('complete anime batches shuffle without any appearance changes or variation draws', () => {
  const original = generateAnimeCompleteBatch('56#1-57#4', () => 0.999);
  let draws = 0;
  const shuffled = generateAnimeCompleteBatch('56#1-57#4', () => { draws++; return 0; });
  assert.equal(draws, 7);
  assert.deepEqual(shuffled.map(prompt => prompt.split('｜')[0]),
    ['56#2', '56#3', '56#4', '57#1', '57#2', '57#3', '57#4', '56#1']);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
  assert.ok(shuffled.every(prompt => !prompt.includes('胸部圓潤')));
  assert.deepEqual(generateAnimeCompleteBatch('56#1-57#4', () => 0.999), original);
});

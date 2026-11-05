import assert from 'node:assert/strict';
import test from 'node:test';
import { ANIME_CHARACTERS } from '../anime-characters.js';
import { ANIME_BATCH_CHARACTER_IDS, generateAnimeBatch } from '../prompt-generators/anime-batch.js';
import { createAnimeGenerator } from '../prompt-generators/anime.js';
import { ANIME_BATCH_SIZE, generateAnimeCharacterBatch, generateImagePrompt } from '../prompt-generator.js';

const removed = new Map([
  [12, 'シェルミー'], [20, 'ヨルハ二号B型（2B）'], [46, 'ペローナ'], [48, '日向ヒナタ']
]);

test('reserves removed character IDs and appends the new characters without renumbering', () => {
  assert.equal(new Set(ANIME_CHARACTERS.map(character => character.id)).size, ANIME_CHARACTERS.length);
  assert.deepEqual(ANIME_CHARACTERS.map(character => character.id), Array.from({ length: 66 }, (_, i) => i + 1));
  for (const [id, jaName] of removed) {
    const character = ANIME_CHARACTERS.find(character => character.id === id);
    assert.equal(character.jaName, jaName);
    assert.equal(character.enabled, false);
    assert.ok(!ANIME_BATCH_CHARACTER_IDS.includes(id));
  }
  assert.deepEqual(ANIME_CHARACTERS.slice(-3).map(({ id, name }) => [id, name]), [
    [64, '竈門禰豆子'], [65, '胡蝶忍'], [66, '甘露寺蜜璃']
  ]);
  assert.equal(ANIME_CHARACTERS.find(character => character.id === 13).name, '蒂法');
  assert.equal(ANIME_CHARACTERS.find(character => character.id === 63).name, '佐倉杏子');
  assert.equal(ANIME_BATCH_SIZE, 62);
});

test('single prompts exclude removed characters, and explicit reserved IDs are unavailable', t => {
  const generator = createAnimeGenerator({
    pick: candidates => {
      assert.ok(candidates.every(character => !removed.has(character.id)));
      return candidates[0];
    },
    chooseGaze: () => '在動作間自然看向鏡頭', naturalInteractions: () => [],
    clothingSceneDescription: text => text, renderNarrative: (_context, overrides) => overrides.subject
  });
  const context = { theme: { atmosphere: '' }, scene: { description: '' }, expression: '' };
  for (const id of removed.keys()) assert.throws(() => generator.generate(context, id), /Unknown anime character ID/);
  generator.generate(context);
  t.mock.method(Math, 'random', () => 0.999);
  for (let i = 0; i < 2; i++) {
    const prompt = generateImagePrompt('anime-characters');
    assert.doesNotMatch(prompt, /シェルミー|ペローナ|日向ヒナタ|2B/);
  }
});

test('batches include each active character once per round, including the three additions', t => {
  t.mock.method(Math, 'random', () => 0.999);
  const ids = generateAnimeBatch(id => id, ANIME_BATCH_SIZE * 2);
  assert.deepEqual(ids.slice(0, ANIME_BATCH_SIZE), ANIME_BATCH_CHARACTER_IDS);
  assert.deepEqual(ids.slice(ANIME_BATCH_SIZE), ANIME_BATCH_CHARACTER_IDS);
  const prompts = generateAnimeCharacterBatch();
  assert.equal(prompts.length, 62);
  assert.ok(prompts.every(prompt => !/シェルミー|ペローナ|日向ヒナタ|2B/.test(prompt)));
  for (const name of ['竈門禰豆子', '胡蝶しのぶ', '甘露寺蜜璃']) {
    const matches = prompts.filter(prompt => prompt.includes(name));
    assert.equal(matches.length, 1);
    assert.ok(matches[0].includes(`「${name}《鬼滅の刃》」`));
  }
});

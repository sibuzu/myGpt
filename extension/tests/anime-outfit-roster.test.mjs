import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ANIME_DRESS_CHARACTER_HELP, selectAnimeDressNumbers, generateAnimeDressBatch,
  ANIME_COMPLETE_CHARACTER_HELP, selectAnimeCompleteNumbers, generateAnimeCompleteBatch
} from '../prompt-generator.js';

const styles = [
  ['anime dress', selectAnimeDressNumbers, generateAnimeDressBatch, ANIME_DRESS_CHARACTER_HELP],
  ['anime complete', selectAnimeCompleteNumbers, generateAnimeCompleteBatch, ANIME_COMPLETE_CHARACTER_HELP]
];
for (const [name, select, generate, help] of styles) {
  test(`${name} keeps sparse IDs stable and includes all 12 new outfits`, () => {
    assert.deepEqual(select('64#1-66#4'), Array.from({ length: 12 }, (_, i) => 253 + i));
    const prompts = generate('64#1-66#4', () => 0.999);
    assert.deepEqual(prompts.map(prompt => prompt.split('｜')[0]),
      [64, 65, 66].flatMap(id => [1, 2, 3, 4].map(outfit => `${id}#${outfit}`)));
    assert.match(prompts[0], /麻葉紋/);
    assert.match(prompts[4], /蝶翼紋/);
    assert.match(prompts[8], /三股長辮/);
    assert.deepEqual(select('66#4-'), [264]);
    assert.match(generate('66#4', () => 0.999)[0], /^66#4｜/);
    if (name === 'anime complete') {
      for (const [index, character] of [[0, '竈門禰豆子'], [4, '胡蝶しのぶ'], [8, '甘露寺蜜璃']]) {
        assert.ok(prompts[index].includes(`以《鬼滅の刃》的 ${character} 為主角`));
        assert.ok(prompts[index].includes(`「${character}《鬼滅の刃》」`));
      }
    }
  });

  test(`${name} skips disabled IDs in ranges and blank selections`, () => {
    assert.deepEqual(select('11#4-13#1'), [44, 49]);
    assert.deepEqual(select('19#4-21#1'), [76, 81]);
    assert.deepEqual(select('45#4-49#1'), [180, 185, 186, 187, 188, 193]);
    assert.deepEqual(select('11#4-13#1,\n13#1'), [44, 49]);
    const all = generate('', () => 0.999);
    assert.equal(all.length, 248);
    assert.ok(all.every(prompt => !/^(12|20|46|48)#/.test(prompt)));
    assert.equal(new Set(all.map(prompt => prompt.split('｜')[0])).size, 248);
  });

  test(`${name} reports disabled IDs and the updated bounds before drawing randomness`, () => {
    for (const selection of ['12#1', '20#4', '46#1', '48#2', '11#1-12#4']) {
      assert.throws(() => generate(selection, () => assert.fail('Invalid selections must not consume randomness')), /已停用/);
    }
    for (const selection of ['67#1', '66#5', '0#1']) {
      assert.throws(() => generate(selection, () => assert.fail('Invalid selections must not consume randomness')), /1–66.*1–4/);
    }
    assert.match(help, /1–66/);
    assert.match(help, /12、20、46、48 已停用/);
  });
}

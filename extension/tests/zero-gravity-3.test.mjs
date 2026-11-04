import assert from 'node:assert/strict';
import test from 'node:test';
import { generateImagePrompt } from '../prompt-generator.js';
import { createBeautifulGenerator } from '../prompt-generators/beautiful.js';
import { createZeroGravity3Generator } from '../prompt-generators/zero-gravity-3.js';

const suffix = '，在無重力空間的天空，細膩寫實，細節豐富，4K，高品質畫面，直式 9:16 。';

test('zero-gravity-3 reproduces the sample with only temperament and outfit varying', () => {
  const generator = createZeroGravity3Generator({ pick: options => {
    if (options.includes('溫柔沉靜')) return '溫柔沉靜';
    if (options[0]?.palettes) return options.find(option => option.top === '薄紗襯衫');
    if (Array.isArray(options[0])) return options.find(palette => palette[0] === '珍珠白色');
    return '側綁帶迷你裙';
  } });
  assert.equal(generator.generate(), `獨立生圖：一位氣質溫柔沉靜的成年日本年輕女性，身穿珍珠白色薄紗襯衫+炭灰色側綁帶迷你裙${suffix}`);
  const prompt = generateImagePrompt('zero-gravity-3');
  assert.match(prompt, /^獨立生圖：一位氣質[^，]+的成年日本年輕女性，身穿.+/);
  assert.ok(prompt.endsWith(suffix));
  assert.doesNotMatch(prompt, /\n|姿勢:|視角:|半寫實|20歲|\{[^}]+\}/);
});

test('copied wardrobe matches every outfit category in the 美麗性感 generator', () => {
  let outfitCount;
  const pickFor = index => options => {
    if (options[0]?.palettes) {
      outfitCount = options.length;
      return options[index];
    }
    return options[0];
  };
  const check = index => {
    const original = createBeautifulGenerator({
      pick: pickFor(index), chooseGaze: () => '', naturalInteractions: () => [],
      clothingSceneDescription: text => text,
      renderNarrative: (_context, overrides) => overrides.lookDescription
    }).generate({ scene: { description: '' }, look: { text: '', details: [] } });
    const copied = createZeroGravity3Generator({ pick: pickFor(index) }).generate();
    assert.equal(copied, `獨立生圖：一位氣質清新自然的成年日本年輕女性，${original}${suffix}`);
  };
  check(0);
  assert.ok(outfitCount >= 20);
  for (let index = 1; index < outfitCount; index++) check(index);
});

test('avoids consecutive temperament and per-outfit palette repeats', () => {
  const generator = createZeroGravity3Generator({ pick: options => options[0] });
  assert.equal(generator.generate(), `獨立生圖：一位氣質清新自然的成年日本年輕女性，身穿櫻花粉色細肩帶上衣+奶油白色高腰A字短裙${suffix}`);
  assert.equal(generator.generate(), `獨立生圖：一位氣質甜美優雅的成年日本年輕女性，身穿天空藍色細肩帶上衣+霧灰色高腰A字短裙${suffix}`);
});

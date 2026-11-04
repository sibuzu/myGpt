import assert from 'node:assert/strict';
import test from 'node:test';
import { generateImagePrompt } from '../prompt-generator.js';
import { createZeroGravity2Generator } from '../prompt-generators/zero-gravity-2.js';

test('zero-gravity-2 uses the requested two-paragraph format through the public generator', () => {
  const prompt = generateImagePrompt('zero-gravity-2');
  const paragraphs = prompt.split('\n\n');
  assert.equal(paragraphs.length, 2);
  assert.match(paragraphs[0], /^獨立生圖： 9:16，\*\*姿勢和視角要和上張圖不同\*\*，一位氣質[^、]+、胸部圓潤的20歲日本年輕女性/);
  assert.match(paragraphs[0], /呈現自然光影與柔和的日系美感。$/);
  assert.match(paragraphs[1], /^.+＋.+迷你裙（.+），無重力空間，天空。$/);
  assert.doesNotMatch(prompt, /主色：|視覺特效：|表情：|視角：|\{[^}]+\}/);
});

test('varies temperament, palette, top and skirt independently', () => {
  const first = createZeroGravity2Generator({ pick: options => options[0] }).generate();
  assert.match(first, /一位氣質清新自然、/);
  assert.equal(first.split('\n\n')[1], '曜石黑修身襯衫＋香檳金迷你裙（迷你、低腰、平口裙襬、無開衩、純棉、單層、蝴蝶結、修身），無重力空間，天空。');
  const last = createZeroGravity2Generator({ pick: options => options.at(-1) }).generate();
  assert.match(last, /一位氣質陽光開朗、/);
  assert.equal(last.split('\n\n')[1], '覆盆莓紅改良式短版洋裝＋深紫迷你裙（超迷你），無重力空間，天空。');

  let paletteCount;
  const generate = (paletteIndex, topIndex, skirtIndex) => createZeroGravity2Generator({ pick: options => {
    if (Array.isArray(options[0])) {
      paletteCount = options.length;
      return options[paletteIndex];
    }
    if (options.includes('修身襯衫')) return options[topIndex];
    if (options.includes('迷你')) return options[skirtIndex];
    if (options.includes('')) return '';
    return options[0];
  } }).generate().split('\n\n')[1];
  assert.equal(generate(1, 0, 0), '冰川藍修身襯衫＋月光銀迷你裙（迷你），無重力空間，天空。');
  assert.equal(generate(0, 1, 0), '曜石黑精緻針織衫＋香檳金迷你裙（迷你），無重力空間，天空。');
  assert.equal(generate(0, 0, 1), '曜石黑修身襯衫＋香檳金迷你裙（短版迷你），無重力空間，天空。');
  assert.ok(paletteCount >= 20);
});

test('skips empty skirt parameters and combines distinct nonempty fabrics', () => {
  const generate = (fabric = '') => createZeroGravity2Generator({ pick: options => {
    if (options.includes('異材質拼接')) return '異材質拼接';
    if (options.includes('純棉')) return fabric;
    if (options.includes('復古丹寧') && !options.includes('')) return options.at(-1);
    return options.includes('') ? '' : options[0];
  } }).generate();
  assert.match(generate(), /迷你裙（迷你、異材質拼接），無重力空間/);
  const mixed = generate('純棉');
  assert.match(mixed, /迷你裙（迷你、純棉與雪紡、異材質拼接）/);
  assert.doesNotMatch(mixed, /、、|、）|undefined/);
});

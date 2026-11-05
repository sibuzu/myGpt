import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { generateImagePrompt } from '../prompt-generator.js';
import { createZeroGravityGenerator } from '../prompt-generators/zero-gravity.js';

test('zero-gravity prompts preserve the source visual style and end with 9:16', async () => {
  const source = await readFile(new URL('../../dress/無重力.md', import.meta.url), 'utf8');
  const template = source.split('TEMPLATE:\n\n')[1].split('\n\n\nEXAMPLE:')[0];
  const prompt = generateImagePrompt('zero-gravity');
  assert.match(prompt.split('\n')[0], /^獨立生圖：一位氣質[^、的]+(?:、胸部圓潤)?的20歲日本年輕女性/);
  assert.equal(prompt.split('\n')[0].replace(/^獨立生圖：一位氣質[^、的]+(?:、胸部圓潤)?的/, ''), `${template.split('。')[0]}。`);
  assert.match(prompt.split('\n')[4], /^上衣: .+。$/);
  assert.doesNotMatch(prompt.split('\n')[4], /自由設計|可搭配|或是/);
  for (const field of ['地點', '主色', '輔色', '點綴', '迷你裙', '視覺特效', '光線', '表情', '姿勢', '視角']) {
    assert.ok(prompt.includes(`${field}：`), `Missing template field: ${field}`);
  }
  assert.equal(prompt.split('\n')[1], '地點： 無重力空間，天空。');
  assert.doesNotMatch(prompt, /\{[^}]+\}|16:9/);
  assert.ok(prompt.endsWith('\n畫面比例： 9:16'));
});

test('adds the chest description only below the independent 10% threshold on each call', () => {
  const rolls = [0.099999, 0.1, 0, 0.999999];
  const generator = createZeroGravityGenerator({
    pick: options => options[0],
    random: () => rolls.shift()
  });
  for (const included of [true, false, true, false]) {
    const prompt = generator.generate();
    assert.equal(prompt.includes('胸部圓潤'), included);
    assert.ok(prompt.startsWith(`獨立生圖：一位氣質清新自然${included ? '、胸部圓潤' : ''}的20歲日本年輕女性，`));
    assert.doesNotMatch(prompt, /\{[^}]+\}|、的/);
  }
  assert.equal(rolls.length, 0);
});

test('fills the outlook placeholder with at least ten distinct temperament choices', () => {
  const outlooks = new Set();
  let index = 0;
  const generator = createZeroGravityGenerator({ random: () => 0, pick: options =>
    options.includes('清新自然') ? options[index++ % options.length] : options[0]
  });
  for (let i = 0; i < 20; i++) {
    const prompt = generator.generate();
    outlooks.add(prompt.match(/一位氣質([^、]+)、/)[1]);
    assert.doesNotMatch(prompt, /\{outlook\}/);
  }
  assert.ok(outlooks.size >= 10);
  assert.ok(outlooks.has('清新自然'));
  assert.ok(outlooks.has('陽光開朗'));
});

test('samples all eight skirt parameters and uses different palettes on consecutive calls', () => {
  const generator = createZeroGravityGenerator({ pick: options => options[0] });
  const first = generator.generate();
  const second = generator.generate();
  assert.match(first, /迷你裙： 一般迷你、低腰、平口裙襬、無開衩、純棉、單層、蝴蝶結、修身\n/);
  assert.match(first, /主色： 曜石黑｜輔色： 香檳金｜點綴： 象牙白/);
  assert.match(second, /主色： 冰川藍｜輔色： 月光銀｜點綴： 雪白/);
  assert.match(first, /視覺特效： 星塵流光｜光線： 柔和晨光/);
  assert.match(first, /表情：開心大笑\n姿勢：全身拉直漂浮\n視角：動態構圖\n畫面比例： 9:16$/);

  const last = createZeroGravityGenerator({ pick: options => options.at(-1) }).generate();
  assert.equal(last.split('\n')[3], '迷你裙： 超迷你');
  assert.match(last, /視覺特效： 絲綢光帶｜光線： 霓虹夜景/);
  assert.match(last, /表情：堅定有神\n姿勢：完全放鬆的長弧形漂浮\n視角：斜前方30度俯拍：鏡頭從人物前側上方約30度斜向拍攝，同時呈現臉部、肩線與四肢層次，讓身體沿畫面自然延伸。\n畫面比例： 9:16$/);
});

test('selects exactly one top', () => {
  const first = createZeroGravityGenerator({ pick: options => options[0] }).generate();
  assert.equal(first.split('\n')[4], '上衣: 修身襯衫。');
  const last = createZeroGravityGenerator({ pick: options => options.at(-1) }).generate();
  assert.equal(last.split('\n')[4], '上衣: 改良式短版洋裝。');
});

test('mixed-material skirts combine two distinct fabrics', () => {
  const generator = createZeroGravityGenerator({
    pick: options => options.includes('異材質拼接') ? '異材質拼接' : options[0]
  });
  assert.match(generator.generate(), /純棉與復古丹寧、異材質拼接/);
});

test('skips empty skirt choices without leaving separators or undefined values', () => {
  const generator = createZeroGravityGenerator({
    pick: options => options.includes('') ? '' : options[0]
  });
  const prompt = generator.generate();
  assert.equal(prompt.split('\n')[3], '迷你裙： 一般迷你');
  assert.doesNotMatch(prompt, /、、|、\n|undefined/);
});

test('mixed-material construction skips omitted fabric and excludes empty secondary fabrics', () => {
  const omitted = createZeroGravityGenerator({ pick: options => {
    if (options.includes('異材質拼接')) return '異材質拼接';
    return options.includes('') ? '' : options[0];
  } }).generate();
  assert.equal(omitted.split('\n')[3], '迷你裙： 一般迷你、異材質拼接');

  const selected = createZeroGravityGenerator({ pick: options => {
    if (options.includes('異材質拼接')) return '異材質拼接';
    if (options.includes('復古丹寧') && !options.includes('純棉')) return options.at(-1);
    return options[0];
  } }).generate();
  assert.match(selected, /純棉與雪紡、異材質拼接/);
});

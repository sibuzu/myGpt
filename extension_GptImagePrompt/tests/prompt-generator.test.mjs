import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPromptGenerator, selectAutomaticClothing } from '../prompt-generator.js';
import { BACKGROUNDS, POSES } from '../prompt-generators/scene-options.js';
import { EXPRESSION_OPTIONS } from '../prompt-generators/expression-options.js';

test('bundles local title-only scenes and removes pose reference numbers', async () => {
  const titles = await readFile(new URL('../data/scene-titles.txt', import.meta.url), 'utf8');
  assert.deepEqual(BACKGROUNDS, titles.trim().split('\n'));
  assert.ok(BACKGROUNDS.includes('朱橋庭院的晨練'));
  assert.ok(BACKGROUNDS.includes('紙傘工坊的扇面'));
  assert.ok(BACKGROUNDS.every(title => !/[#｜\n]|氛圍。$/.test(title)));
  const poses = await readFile(new URL('../data/poses.md', import.meta.url), 'utf8');
  assert.deepEqual(POSES, poses.trim().split('\n').map(line => line.replace(/\s*\([\d,\s]+\)\s*$/, '')));
  assert.ok(POSES.every(pose => !/\(\d/.test(pose)));
});

test('all five clothing modes render the requested five-part template', () => {
  let seed = 44;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const generator = createPromptGenerator({ random });
  for (const clothingType of ['auto', 'natural', 'sexy', 'anime', 'mini']) {
    for (let i = 0; i < 20; i++) {
      const prompt = generator.generate({ clothingType, sceneType: 'auto' });
      const parts = prompt.split('\n\n');
      assert.equal(parts.length, 5);
      assert.match(parts[0], /^一位氣質.+的成年日本年輕女性，/);
      assert.ok(EXPRESSION_OPTIONS.some(expression => parts[0].includes(`的成年日本年輕女性，${expression}，半寫實日系動畫風格人像，保留超寫實`)));
      assert.ok(parts[1].includes('身穿'));
      assert.ok(parts[2] === '無重力空間，天空。' || BACKGROUNDS.includes(parts[2]));
      assert.ok(POSES.includes(parts[3].replace('姿勢：', '')));
      assert.equal(parts[4], '電影級構圖，細膩華麗，細節豐富，4K，高品質畫面，直式 9:16。');
      assert.doesNotMatch(prompt, /undefined|\{[^}]+\}|\(\d/);
      if (clothingType === 'mini') {
        assert.match(parts[1], /\+.+裙/);
        assert.doesNotMatch(parts[1], /泳褲|連身裙|短洋裝|短版和服/);
      }
    }
  }
});

test('applies the exact 10% appearance and 20% automatic-scene thresholds independently', () => {
  for (const appearance of [0.099999, 0.1]) {
    for (const scene of [0.199999, 0.2]) {
      const rolls = [0.5, 0.5, appearance, scene, 0.5, 0.5, 0.5];
      const generator = createPromptGenerator({ random: () => rolls.shift() });
      const parts = generator.generate({ clothingType: 'natural', sceneType: 'auto' }).split('\n\n');
      assert.equal(parts[0].includes('、胸部圓潤'), appearance < 0.1);
      assert.equal(parts[2] === '無重力空間，天空。', scene < 0.2);
    }
  }
  let draws = 0;
  const generator = createPromptGenerator({ random: () => { draws++; return 0.999; } });
  const first = generator.generate({ clothingType: 'natural', sceneType: 'zero-gravity' });
  const second = generator.generate({ clothingType: 'natural', sceneType: 'zero-gravity' });
  assert.equal(draws, 10); // Five choices each; forced zero gravity needs no probability draw.
  assert.equal(first.split('\n\n')[2], '無重力空間，天空。');
  assert.notEqual(first.split('\n\n')[0], second.split('\n\n')[0]);
});

test('every expression in the merged local list can appear at the requested position', () => {
  assert.equal(EXPRESSION_OPTIONS.length, new Set(EXPRESSION_OPTIONS).size);
  assert.equal(EXPRESSION_OPTIONS.length, 88);
  assert.ok(EXPRESSION_OPTIONS.includes('開心大笑'));
  assert.ok(EXPRESSION_OPTIONS.includes('甜蜜心動'));
  assert.ok(EXPRESSION_OPTIONS.includes('人物露出溫柔自然的微笑'));
  assert.ok(EXPRESSION_OPTIONS.includes('人物眼神平靜，流露書寫時的從容'));
  for (let i = 0; i < EXPRESSION_OPTIONS.length; i++) {
    let draws = 0;
    const generator = createPromptGenerator({ random: () => ++draws === 5 ? (i + 0.5) / EXPRESSION_OPTIONS.length : 0.5 });
    const prompt = generator.generate({ clothingType: 'natural', sceneType: 'zero-gravity' });
    assert.ok(prompt.includes(`的成年日本年輕女性，${EXPRESSION_OPTIONS[i]}，半寫實日系動畫風格人像，保留超寫實`));
    assert.equal(draws, 5);
  }
});

test('automatic clothing uses exact 30/30/40 boundaries and excludes natural outfits', () => {
  for (const [roll, expected] of [[0, 'sexy'], [0.299999, 'sexy'], [0.3, 'anime'], [0.599999, 'anime'], [0.6, 'mini'], [0.999999, 'mini']]) {
    assert.equal(selectAutomaticClothing(() => roll), expected);
    const rolls = [roll];
    const auto = createPromptGenerator({ random: () => rolls.length ? rolls.shift() : 0.5 });
    const manual = createPromptGenerator({ random: () => 0.5 });
    assert.equal(auto.generate({ clothingType: 'auto' }), manual.generate({ clothingType: expected }));
  }
  const counts = { sexy: 0, anime: 0, mini: 0 };
  for (let i = 0; i < 100; i++) counts[selectAutomaticClothing(() => (i + 0.5) / 100)]++;
  assert.deepEqual(counts, { sexy: 30, anime: 30, mini: 40 });
});

test('clothing and scene default to auto in both generator and menu order', async () => {
  const defaults = createPromptGenerator({ random: () => 0.5 }).generate();
  const explicit = createPromptGenerator({ random: () => 0.5 }).generate({ clothingType: 'auto', sceneType: 'auto' });
  assert.equal(defaults, explicit);
  const html = await readFile(new URL('../sidepanel.html', import.meta.url), 'utf8');
  for (const [id, expected] of [['clothingType', ['auto', 'natural', 'sexy', 'anime', 'mini']], ['sceneType', ['auto', 'zero-gravity']]]) {
    const options = html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`))[1];
    assert.deepEqual([...options.matchAll(/value="([^"]+)"/g)].map(match => match[1]), expected);
    assert.match(options, /value="auto" selected/);
  }
});

test('rejects unknown modes before generating an unusable prompt', () => {
  const generator = createPromptGenerator();
  assert.throws(() => generator.generate({ clothingType: 'bad' }), /衣服|清新/);
  assert.throws(() => generator.generate({ sceneType: 'bad' }), /場景/);
});

test('manifest and local assets do not require other project folders or removed features', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.name, 'GptImagePrompt 1.0.3');
  assert.deepEqual(manifest.host_permissions, ['https://chat.openai.com/*', 'https://chatgpt.com/*']);
  const html = await readFile(new URL('../sidepanel.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /promptStyle|notifyTelegram|downloadImages|Image Download/);
  for (const filename of ['sidepanel.js', 'content.js', 'background.js', 'prompt-generator.js']) {
    const source = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /api-download|sendTelegram|queryImageList|from ['"]\.\.\//);
  }
  for (const size of [16, 48, 128]) {
    const png = await readFile(new URL(`../images/icon${size}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

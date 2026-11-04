import assert from 'node:assert/strict';
import test from 'node:test';

// A local panel harness: no browser messages or network requests are sent.
class Element {
  children = [];
  listeners = new Map();
  textContent = '';
  value = '';
  title = '';
  disabled = false;
  hidden = false;
  get innerText() { return this.textContent; }
  set innerHTML(value) { this.children = []; this.textContent = value; }
  appendChild(child) { this.children.push(child); }
  querySelector(selector) { return this.children.find(child => `.${child.className}` === selector); }
  querySelectorAll() { return []; }
  focus() {}
  dispatchEvent() {}
  reportValidity() { return Number.isInteger(this.valueAsNumber) && this.valueAsNumber > 0; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  async trigger(type) {
    for (const callback of this.listeners.get(type) ?? []) await callback({ target: this });
  }
}

test('message-selected styles preview counts and directly append their batches to the queue', async t => {
  const previousDocument = globalThis.document;
  const previousChrome = globalThis.chrome;
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = previousChrome;
  });
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  let ready;
  globalThis.document = {
    getElementById: getElement,
    createElement: () => new Element(),
    createRange: () => ({ selectNodeContents() {}, collapse() {} }),
    querySelectorAll: () => [],
    addEventListener: (type, callback) => { if (type === 'DOMContentLoaded') ready = callback; }
  };
  globalThis.chrome = {
    runtime: { getManifest: () => ({ version: 'test' }), onMessage: { addListener() {} } },
    storage: { local: { get: async () => ({}), set: async () => {} } },
    tabs: { query: () => { throw new Error('The harness must not send queued prompts'); } }
  };
  getElement('promptStyle').value = 'natural';
  getElement('promptCount').valueAsNumber = 1;
  await import('../sidepanel.js');
  ready();

  const style = getElement('promptStyle');
  const count = getElement('promptCount');
  const status = getElement('promptStatus');
  const queue = getElement('promptList');
  const input = getElement('messageInput');
  const text = () => input.querySelector('.text-container');
  style.value = 'life-story';
  await style.trigger('change');
  assert.equal(count.disabled, true);
  assert.equal(getElement('promptHelp').hidden, false);
  assert.equal(status.textContent, '將產生 160 個 prompt。');

  // The style uses the message selection even when the unrelated count is invalid.
  count.valueAsNumber = NaN;
  text().textContent = '1';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 1 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 1);
  assert.match(queue.children[0].textContent, /^1\. 001｜河畔花店的清晨/);
  assert.equal(status.textContent, '已產生 1 個 prompt，已加入 queue。');
  assert.equal(text().textContent, '1');

  text().textContent = '1, 10-15, 45-';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 123 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 124);
  assert.match(queue.children[2].textContent, /^3\. 010｜竹影下的紙藝廊/);
  assert.match(queue.children.at(-1).textContent, /^124\. 160｜港灣音樂露台的夕光/);

  text().textContent = '1, 161';
  await getElement('genPromptBtn').trigger('click');
  assert.match(status.textContent, /編號須介於/);
  assert.equal(queue.children.length, 124);

  text().textContent = '';
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 284);
  assert.equal(status.textContent, '已產生 160 個 prompt，已加入 queue。');

  await getElement('clearQueue').trigger('click');
  t.mock.method(Math, 'random', () => 0.999);
  style.value = 'anime-dress';
  await style.trigger('change');
  assert.equal(count.disabled, true);
  assert.equal(getElement('promptHelp').hidden, false);
  assert.match(getElement('promptHelp').textContent, /56#1 - 57#4/);
  assert.equal(status.textContent, '將產生 252 個 prompt。');

  text().textContent = '63#4';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 1 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 1);
  assert.match(queue.children[0].textContent, /^1\. 63#4｜山城鐘樓的暮色/);
  assert.equal(status.textContent, '已產生 1 個 prompt，已加入 queue。');

  text().textContent = '56#1 - 57#4';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 8 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 9);
  assert.match(queue.children[1].textContent, /^2\. 56#1｜/);
  assert.match(queue.children.at(-1).textContent, /^9\. 57#4｜/);
  assert.equal(status.textContent, '已產生 8 個 prompt，已加入 queue。');
  assert.equal(text().textContent, '56#1 - 57#4');

  text().textContent = '64#1';
  await getElement('genPromptBtn').trigger('click');
  assert.match(status.textContent, /角色編號須介於/);
  assert.equal(queue.children.length, 9);

  text().textContent = '';
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 261);
  assert.equal(status.textContent, '已產生 252 個 prompt，已加入 queue。');

  await getElement('clearQueue').trigger('click');
  style.value = 'anime-complete';
  await style.trigger('change');
  assert.equal(count.disabled, true);
  assert.equal(getElement('promptHelp').hidden, false);
  assert.match(getElement('promptHelp').textContent, /56#1 - 57#4/);
  assert.doesNotMatch(getElement('promptHelp').textContent, /10%|胸部圓潤/);
  assert.equal(status.textContent, '將產生 252 個 prompt。');

  text().textContent = '56#1 - 57#4';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 8 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 8);
  assert.match(queue.children[0].textContent, /^1\. 56#1｜/);
  assert.match(queue.children.at(-1).textContent, /^8\. 57#4｜/);
  assert.equal(status.textContent, '已產生 8 個 prompt，已加入 queue。');

  text().textContent = '63#4';
  await input.trigger('input');
  assert.equal(status.textContent, '將產生 1 個 prompt。');
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 9);
  assert.match(queue.children.at(-1).textContent, /^9\. 63#4｜/);

  text().textContent = '1';
  await getElement('genPromptBtn').trigger('click');
  assert.match(status.textContent, /編號格式錯誤/);
  assert.equal(queue.children.length, 9);

  text().textContent = '';
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 261);
  assert.equal(status.textContent, '已產生 252 個 prompt，已加入 queue。');

  style.value = 'life-story';
  await style.trigger('change');
  assert.equal(status.textContent, '將產生 160 個 prompt。');
  assert.match(getElement('promptHelp').textContent, /原始編號/);

  style.value = 'natural';
  await style.trigger('change');
  assert.equal(count.disabled, false);
  assert.equal(getElement('promptHelp').hidden, true);
  assert.equal(status.textContent, '');

  // The random style follows the existing single-input and multi-prompt queue flow.
  await getElement('clearQueue').trigger('click');
  style.value = 'zero-gravity';
  await style.trigger('change');
  assert.equal(count.disabled, false);
  assert.equal(getElement('promptHelp').hidden, true);
  count.valueAsNumber = 3;
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 3);
  for (const item of queue.children) assert.match(item.textContent, /獨立生圖：一位氣質/);

  const previousWindow = globalThis.window;
  const previousInputEvent = globalThis.InputEvent;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousInputEvent === undefined) delete globalThis.InputEvent;
    else globalThis.InputEvent = previousInputEvent;
  });
  globalThis.window = { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) };
  globalThis.InputEvent = class {};
  count.valueAsNumber = 1;
  await getElement('genPromptBtn').trigger('click');
  assert.match(text().textContent, /地點： 無重力空間/);
  assert.ok(text().textContent.endsWith('\n畫面比例： 9:16'));
  assert.equal(queue.children.length, 3);

  await getElement('clearQueue').trigger('click');
  style.value = 'zero-gravity-2';
  await style.trigger('change');
  assert.equal(count.disabled, false);
  assert.equal(getElement('promptHelp').hidden, true);
  count.valueAsNumber = 3;
  await getElement('genPromptBtn').trigger('click');
  assert.equal(queue.children.length, 3);
  for (const item of queue.children) assert.match(item.textContent, /獨立生圖： 9:16，/);
  count.valueAsNumber = 1;
  await getElement('genPromptBtn').trigger('click');
  assert.equal(text().textContent.split('\n\n').length, 2);
  assert.match(text().textContent, /＋.+迷你裙（.+），無重力空間，天空。\n姿勢:[^\n]+\n視角:[^\n]+$/);
  assert.equal(queue.children.length, 3);
});

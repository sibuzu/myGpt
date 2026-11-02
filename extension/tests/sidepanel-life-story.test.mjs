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
  reportValidity() { return Number.isInteger(this.valueAsNumber) && this.valueAsNumber > 0; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  async trigger(type) {
    for (const callback of this.listeners.get(type) ?? []) await callback({ target: this });
  }
}

test('life story previews the count and directly appends ordered batches to the queue', async t => {
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

  style.value = 'natural';
  await style.trigger('change');
  assert.equal(count.disabled, false);
  assert.equal(getElement('promptHelp').hidden, true);
  assert.equal(status.textContent, '');
});

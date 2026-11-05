import assert from 'node:assert/strict';
import test from 'node:test';
import { PromptQueue } from '../prompt-queue.js';

test('pause prevents sending and each next prompt waits for a running-to-input transition', async () => {
  const sent = [];
  const queue = new PromptQueue({ send: async text => sent.push(text) });
  await queue.setState('input-mode');
  await queue.enqueue(['first', 'second']);
  assert.deepEqual(sent, []);
  await queue.setPaused(false);
  assert.deepEqual(sent, ['first']);
  await queue.setState('ready-to-send');
  await queue.setState('input-mode');
  assert.deepEqual(sent, ['first']);
  await queue.setState('running');
  await queue.setState('input-mode');
  assert.deepEqual(sent, ['first', 'second']);
  assert.equal(queue.items.length, 0);
});

test('send failures preserve the message and pause the queue until an explicit retry', async () => {
  let fail = true;
  const errors = [];
  const queue = new PromptQueue({ paused: false, send: async () => {
    if (fail) throw new Error('Disconnected');
  }, onError: error => errors.push(error.message) });
  await queue.setState('edit-mode');
  await queue.enqueue(['retained']);
  assert.equal(queue.paused, true);
  assert.equal(queue.items[0].text, 'retained');
  assert.deepEqual(errors, ['Disconnected']);
  fail = false;
  await queue.setPaused(false);
  assert.equal(queue.items.length, 0);
});

test('clearing during a send preserves newly queued messages and never sends twice', async () => {
  let resolveSend;
  const sent = [];
  const queue = new PromptQueue({ paused: false, send: text => {
    sent.push(text);
    return new Promise(resolve => { resolveSend = resolve; });
  } });
  await queue.setState('input-mode');
  const first = queue.enqueue(['first']);
  queue.clear();
  await queue.enqueue(['replacement']);
  resolveSend();
  await first;
  assert.deepEqual(sent, ['first']);
  assert.equal(queue.items[0].text, 'replacement');
  await queue.setState('running');
  const second = queue.setState('input-mode');
  assert.deepEqual(sent, ['first', 'replacement']);
  resolveSend();
  await second;
  assert.equal(queue.items.length, 0);
});

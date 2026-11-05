import { createPromptGenerator } from './prompt-generator.js';
import { PromptQueue } from './prompt-queue.js';
import { initializeComposer } from './message-input.js';

document.title = `GptImagePrompt ${chrome.runtime.getManifest().version}`;

document.addEventListener('DOMContentLoaded', () => {
  const element = id => document.getElementById(id);
  const input = element('messageInput');
  const composer = initializeComposer(input);
  const pause = element('pauseQueue');
  const status = element('promptStatus');
  const generator = createPromptGenerator();
  let startTime = null;
  let timer = null;
  const queue = new PromptQueue({
    paused: pause.checked,
    send: async text => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('找不到目前分頁。');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'sendMsg', text });
      if (!response?.ok) throw new Error(response?.error ?? '未收到 ChatGPT 的傳送確認。');
    },
    onChange: items => {
      const list = element('promptList');
      list.innerHTML = '';
      items.forEach(({ text }, index) => {
        const row = document.createElement('div');
        row.className = 'prompt-item';
        row.textContent = `${index + 1}. ${text.replace(/!\[.*?\]\(.*?\)\n/g, '').slice(0, 32)}…`;
        row.title = text;
        list.appendChild(row);
      });
      status.textContent = `佇列剩餘 ${items.length} 則。`;
    },
    onError: error => {
      pause.checked = true;
      status.textContent = `傳送失敗，已暫停並保留訊息：${error.message}`;
    }
  });

  const template = element('toggle-icon-template');
  document.querySelectorAll('.toggle-icon-container').forEach(container => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('#v-line').style.display = 'none';
    container.appendChild(clone);
  });
  document.querySelectorAll('.panel-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const open = content.style.display === 'none';
      content.style.display = open ? 'block' : 'none';
      header.querySelector('#v-line').style.display = open ? 'none' : 'block';
    });
  });

  pause.addEventListener('change', () => queue.setPaused(pause.checked));
  element('clearQueue').addEventListener('click', () => queue.clear());
  element('sendMsg').addEventListener('click', () => {
    const message = composer.read();
    if (!message) return;
    composer.reset();
    queue.enqueue([message]);
  });
  input.addEventListener('click', event => {
    if (event.target === input) composer.text().focus();
  });

  element('genPromptBtn').addEventListener('click', () => {
    const count = element('promptCount');
    if (!count.reportValidity()) return;
    try {
      const prompts = Array.from({ length: count.valueAsNumber }, () => generator.generate({
        clothingType: element('clothingType').value,
        sceneType: element('sceneType').value
      }));
      if (prompts.length === 1) {
        composer.text().textContent = prompts[0];
        composer.text().focus();
        const range = document.createRange();
        range.selectNodeContents(composer.text());
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = '已產生 1 則，請按 Send 加入佇列。';
      } else {
        queue.enqueue(prompts);
      }
    } catch (error) {
      status.textContent = error.message;
    }
  });

  element('sceneType').title = '無重力：固定天空；自動：20% 無重力，其餘隨機場景 title。';
  const scriptButton = element('scriptBtn');
  scriptButton.addEventListener('click', async () => {
    scriptButton.disabled = true;
    const scriptStatus = element('scriptStatus');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('找不到目前分頁。');
      const [snapshot] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => (document.doctype ? new XMLSerializer().serializeToString(document.doctype) + '\n' : '')
          + document.documentElement.outerHTML
      });
      if (typeof snapshot?.result !== 'string' || !snapshot.result) throw new Error('無法讀取網頁。');
      await navigator.clipboard.writeText(snapshot.result);
      scriptStatus.textContent = '已複製目前網頁。';
    } catch (error) {
      scriptStatus.textContent = `複製失敗：${error.message}`;
    } finally {
      scriptButton.disabled = false;
    }
  });

  function updateTimer() {
    if (startTime) element('elapsedTime').textContent = `Elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`;
  }

  async function receiveState(state) {
    element('state').textContent = `State: ${state}`;
    if (state === 'running' && !startTime) {
      startTime = Date.now();
      timer = setInterval(updateTimer, 1000);
    } else if ((state === 'input-mode' || state === 'edit-mode') && startTime) {
      updateTimer();
      clearInterval(timer);
      timer = null;
      startTime = null;
    }
    await queue.setState(state);
  }

  chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.type === 'closePanel') window.close();
    if (request.type === 'selectedText') {
      composer.text().textContent = request.text;
      composer.text().focus();
    }
    if (request.type === 'stateChange') {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (sender.tab && sender.tab.id !== tab?.id) return;
        receiveState(request.state);
      }).catch(error => { status.textContent = error.message; });
    }
  });
  chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
    if (!tab?.id) return;
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'getState' });
    if (response?.state) receiveState(response.state);
  }).catch(() => { element('state').textContent = 'State: 請開啟或重新整理 ChatGPT 分頁'; });
  window.addEventListener('unload', () => clearInterval(timer));
});

(() => {
if (globalThis.__gptImagePromptLoaded) return;
globalThis.__gptImagePromptLoaded = true;
// ChatGPT updates composer button ids/testids often. Prefer stable composer
// structure and accessible labels, with data-testid as a fast path when present.
const SELECTORS = {
  composer: 'form[data-chatgpt-composer], [data-composer-surface="true"]',
  prompt: [
    '#prompt-textarea',
    'textarea[name="prompt-textarea"]',
    'form[data-chatgpt-composer] [data-composer-markdown][role="textbox"][contenteditable]',
    '[data-composer-surface="true"] [data-composer-markdown][role="textbox"][contenteditable]'
  ].join(', '),
  editPrompt: '[data-composer-markdown][role="textbox"][contenteditable]',
  trailing: '[data-composer-trailing-controls="true"], [data-composer-transition-slot="trailing"]',
  sendButton: [
    'button#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="Submit"]',
    'button[aria-label*="傳送"]',
    'button[aria-label*="发送"]'
  ].join(', '),
  voiceButton: [
    'button[data-testid="composer-speech-button"]',
    'button[aria-label*="voice" i]',
    'button[aria-label*="語音"]',
    'button[aria-label*="语音"]',
    'button[aria-label*="聽寫"]',
    'button[aria-label*="听写"]'
  ].join(', '),
  stopButton: [
    'button[data-testid="stop-button"]',
    'button[aria-label*="Stop"]',
    'button[aria-label*="停止"]'
  ].join(', ')
};

function isVisible(element) {
  if (!element) return false;
  return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function queryVisible(selector, root = document) {
  return Array.from(root.querySelectorAll(selector)).find(isVisible);
}

function getComposerPrompt() {
  return queryVisible(SELECTORS.prompt);
}

function getEditContext() {
  for (const prompt of document.querySelectorAll(SELECTORS.editPrompt)) {
    if (!isVisible(prompt) || prompt.closest(SELECTORS.composer)) continue;
    const form = prompt.closest('form');
    if (!form) continue;
    const submit = queryVisible('button[type="submit"]', form);
    const cancel = Array.from(form.querySelectorAll('button[type="button"]'))
      .find(button => isVisible(button)
        && /^(取消|取消編輯|Cancel|Cancel edit)$/i.test(
          (button.getAttribute('aria-label') || button.textContent).trim()
        ));
    if (submit && cancel) return { prompt, root: form, editing: true };
  }
  return null;
}

function getComposerRoot() {
  const prompt = getComposerPrompt();
  return prompt?.closest(SELECTORS.composer)
    || prompt?.closest('form')
    || queryVisible(SELECTORS.composer)
    || document;
}

function getSendContext() {
  return getEditContext() || {
    prompt: getComposerPrompt(),
    root: getComposerRoot(),
    editing: false
  };
}

function getTrailingActionRoot(composer = getComposerRoot()) {
  return queryVisible(SELECTORS.trailing, composer) || composer;
}

function isEnabledButton(button) {
  return isVisible(button) && !button.disabled && button.getAttribute('aria-disabled') !== 'true';
}

function isVoiceActionButton(button) {
  const ariaLabel = button.getAttribute('aria-label') || '';
  const iconHref = button.querySelector('use')?.getAttribute('href') || '';
  return /voice|語音|语音|聽寫|听写/i.test(ariaLabel) || /#(?:voice|microphone)-/i.test(iconHref);
}

function isReadySendButton(button) {
  return isEnabledButton(button)
    && !isVoiceActionButton(button)
    && !button.matches(SELECTORS.stopButton);
}

function getReadySendButton(context = getSendContext()) {
  if (!context.prompt?.isConnected || !isVisible(context.prompt)
    || !isEditablePrompt(context.prompt)) return null;
  const trailing = context.editing ? context.root : getTrailingActionRoot(context.root);
  const labelledSendButton = Array.from(trailing.querySelectorAll(SELECTORS.sendButton))
    .find(isReadySendButton);
  if (labelledSendButton) return labelledSendButton;

  // The current ChatGPT composer reuses its last circular action button and
  // does not always add send-button/testid when it changes from voice to send.
  return Array.from(trailing.querySelectorAll([
    'button.composer-submit-button-color',
    'button[type="submit"]',
    'button[data-testid*="send"]'
  ].join(', ')))
    .reverse()
    .find(isReadySendButton);
}

function isEditablePrompt(prompt) {
  return Boolean(prompt
    && !prompt.disabled
    && !prompt.readOnly
    && prompt.getAttribute('contenteditable') !== 'false'
    && prompt.getAttribute('aria-disabled') !== 'true');
}

function hasIdleComposerControls() {
  const trailing = getTrailingActionRoot();
  // An empty composer may show a disabled send button instead of a voice button.
  return Boolean(queryVisible([
    SELECTORS.voiceButton,
    SELECTORS.sendButton,
    'button[type="submit"]'
  ].join(', '), trailing));
}

function hasRunningStopButton() {
  return Boolean(queryVisible(SELECTORS.stopButton, getComposerRoot()));
}

// 列出所有 data-testid
function logAllDataTestIds() {
  const elements = document.querySelectorAll('[data-testid]');
  console.log('[Contents] All data-testid elements found:');
  elements.forEach(element => {
    let attr = element.getAttribute('data-testid');
    console.log(`[Contents] - ${attr}`);
    if (attr === 'composer-speech-button') {
      console.log('[Contents] Found composer-speech-button element:', element);
      console.log('[Contents] Voice button HTML:', element.outerHTML);
    }
  });
}

function logComposerButtons() {
  const composer = getComposerRoot();
  const buttons = composer.querySelectorAll('button');
  console.log('[Contents] Composer buttons found:');
  buttons.forEach(button => {
    console.log('[Contents] - button', {
      testId: button.getAttribute('data-testid'),
      ariaLabel: button.getAttribute('aria-label'),
      disabled: button.disabled,
      className: button.className
    });
  });
}

// 檢查當前狀態
function checkState() {
  const context = getSendContext();
  const state = hasRunningStopButton() ? 'running'
    : context.editing && isEditablePrompt(context.prompt) ? 'edit-mode'
    : getReadySendButton(context) ? 'ready-to-send'
    : isEditablePrompt(getComposerPrompt()) && hasIdleComposerControls() ? 'input-mode'
    : 'not-found';
  chrome.runtime.sendMessage({ type: 'stateChange', state }).catch(() => {});
  return state;
}

// 設置 MutationObserver
const observer = new MutationObserver((mutations) => {
  // console.log('[Contents] DOM mutation detected');
  checkState();
});

// 開始觀察
function startObserving() {
  console.log('[Contents] Starting observation...');
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'class', 'disabled', 'aria-disabled', 'aria-label', 'contenteditable',
      'readonly', 'hidden', 'style', 'id', 'data-testid'
    ]
  });

  // 初始檢查
  checkState();
}

// 當 DOM 載入完成後開始觀察
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserving);
} else {
  startObserving();
}

async function insertTextIntoPrompt(promptElement, text) {
  const normalizedText = text.replace(/\r\n?/g, '\n').trim();
  if (!normalizedText) return;

  window.focus();
  promptElement.focus();
  await new Promise(resolve => setTimeout(resolve, 100));

  const lines = normalizedText.split('\n');
  lines.forEach((line, index) => {
    if (index > 0) {
      const insertedBreak = document.execCommand('insertLineBreak') || document.execCommand('insertParagraph');
      if (!insertedBreak) {
        throw new Error(`Could not insert line break before line ${index + 1}`);
      }
    }
    if (line) {
      const insertedText = document.execCommand('insertText', false, line);
      if (!insertedText) {
        throw new Error(`Could not insert text on line ${index + 1}`);
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 150));

  const promptText = ('value' in promptElement ? promptElement.value : promptElement.innerText || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ');
  const expectedLines = lines.map(line => line.trim()).filter(Boolean);
  let searchFrom = 0;
  const hasEveryLine = expectedLines.every(line => {
    const lineIndex = promptText.indexOf(line, searchFrom);
    if (lineIndex === -1) return false;
    searchFrom = lineIndex + line.length;
    return true;
  });

  if (!hasEveryLine) {
    throw new Error('Prompt insertion was incomplete; message was not sent');
  }
}

function clearPromptForReplacement(promptElement) {
  window.focus();
  promptElement.focus();
  if ('value' in promptElement) {
    promptElement.select();
  } else {
    const range = document.createRange();
    range.selectNodeContents(promptElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  // Use the editor's normal input path so its internal document stays in sync.
  if (!document.execCommand('delete')) {
    throw new Error('Could not clear the message being edited');
  }
  const remainingText = 'value' in promptElement ? promptElement.value : promptElement.innerText;
  if (remainingText.trim()) {
    throw new Error('The original message was not fully cleared; message was not sent');
  }
}

async function insertImage(textarea, blob) {
  try {
    // 使用 input event 直接插入檔案
    const file = new File([blob], 'image.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);

    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromPaste',
      data: null,
      dataTransfer: dt
    });

    textarea.dispatchEvent(inputEvent);

    // 如果上面的方法失敗，嘗試使用 drop 事件
    if (!textarea.querySelector('img')) {
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
      });
      textarea.dispatchEvent(dropEvent);
    }
  } catch (error) {
    console.error('[Contents] Image insertion failed:', error);
    // 備用方案：使用 FormData
    const formData = new FormData();
    formData.append('image', blob, 'image.png');
    textarea.dispatchEvent(new CustomEvent('imageUpload', {
      detail: { formData: formData }
    }));
  }
}

async function waitForAndClickSendButton(maxAttempts, context = getSendContext()) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkButton = () => {
      const sendButton = getReadySendButton(context);
      if (sendButton) {
        console.log('[Contents] Send button is ready:', {
          testId: sendButton.getAttribute('data-testid'),
          ariaLabel: sendButton.getAttribute('aria-label'),
          className: sendButton.className
        });
        sendButton.focus();
        sendButton.click();
        resolve();
      } else if (attempts >= maxAttempts) {
        logComposerButtons();
        reject(new Error(`Timeout waiting for send button after ${maxAttempts * 2000}ms`));
      } else {
        console.log('[Contents] Waiting for send button... attempt:', attempts + 1,
                   `(${attempts * 2000}ms / ${maxAttempts * 2000}ms)`);
        attempts++;
        setTimeout(checkButton, 2000);
      }
    };
    checkButton();
  });
}


let sending = false;
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'ping') {
    sendResponse({ ok: true });
    return false;
  }
  if (request.type === 'getState') {
    sendResponse({ state: checkState() });
    return false;
  }
  if (request.action !== 'sendMsg') return false;
  if (sending) {
    sendResponse({ ok: false, error: '上一則訊息仍在傳送中。' });
    return false;
  }
  sending = true;
  sendMessage(request.text).then(
    () => { sending = false; sendResponse({ ok: true }); },
    error => { sending = false; sendResponse({ ok: false, error: error.message }); }
  );
  return true;
});

async function sendMessage(text) {
  const context = getSendContext();
  const prompt = context.prompt;
  if (!isEditablePrompt(prompt)) throw new Error('找不到可輸入的 ChatGPT 訊息框。');
  if (context.editing) clearPromptForReplacement(prompt);
  const images = text.match(/!\[.*?\]\((.*?)\)\n/g) ?? [];
  const textContent = text.replace(/!\[.*?\]\((.*?)\)\n/g, '');
  for (const image of images) {
    const url = image.match(/\((.*?)\)/)[1];
    const response = await fetch(url);
    if (!response.ok) throw new Error('無法讀取貼上的圖片。');
    window.focus();
    prompt.focus();
    await insertImage(prompt, await response.blob());
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (textContent.trim()) await insertTextIntoPrompt(prompt, textContent);
  prompt.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  await waitForAndClickSendButton(images.length ? 40 : 10, context);
}

})();

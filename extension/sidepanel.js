const API_URL = 'http://localhost:12345';

document.addEventListener('DOMContentLoaded', function () {
  // 原有的元素獲取
  const downloadImagesButton = document.getElementById('downloadImages');
  const statusElement = document.getElementById('status');
  const messageInput = document.getElementById('messageInput');
  const sendMessageButton = document.getElementById('sendMessage');
  const chatContainer = document.getElementById('chatContainer');
  const elapsedTimeElement = document.getElementById('elapsedTime');
  const notifyTelegramCheckbox = document.getElementById('notifyTelegram');
  const sendGptButton = document.getElementById('sendGpt');

  // 初始化可折疊面板
  const headers = document.querySelectorAll('.panel-header');
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('#toggle-icon');
      const verticalLine = icon.querySelector('#v-line');
      const isOpen = content.style.display === 'block';

      content.style.display = isOpen ? 'none' : 'block';

      if (isOpen) {
        verticalLine.style.display = 'block';  // show "+" when closed
        icon.setAttribute('data-state', 'closed');
      } else {
        verticalLine.style.display = 'none';   // hide vertical bar to make it "-"
        icon.setAttribute('data-state', 'open');
      }
    });
  });

  let startTime = null;

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  function startTimer() {
    if (startTime) return;
    startTime = Date.now();
    elapsedTimeElement.textContent = `Elapsed: -- (${formatTimestamp(startTime)})`;
  }

  function stopTimer() {
    if (startTime) {
      const endTime = Date.now();
      const elapsed = (endTime - startTime) / 1000;
      elapsedTimeElement.textContent = `Elapsed: ${(elapsed).toFixed(2)}s (${formatTimestamp(endTime)})`;
      startTime = null;
    }
  }

  // Download Images button click handler
  downloadImagesButton.addEventListener('click', function () {
    console.log('[Sidepanel] Downloading images...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const currentUrl = tabs[0].url;
        console.log('[Sidepanel] Current URL:', currentUrl);
        
        // 解析 pageId
        let pageId = '';
        if (currentUrl.match(/-[0-9a-f]{12}$/)) {
          pageId = currentUrl.slice(-12);
        }
        
        // 更新 pageId 顯示
        const pageIdElement = document.getElementById('pageId');
        pageIdElement.textContent = `PageID: ${pageId}`;

        // 如果有 pageId，請求圖片列表
        if (pageId) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'queryImageList'
          });
        } else {
          statusElement.textContent = 'Status: no image';
          document.getElementById('imgList').innerHTML = '';
          document.getElementById('totalTurns').textContent = 'Total Turns: 0';
        }
      }
    });
  });

  // Add message to chat
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'gpt-message'}`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Send message to GPT
  async function sendToGPT(message) {
  }

  // Handle send message button
  sendMessageButton.addEventListener('click', function () {
    const message = messageInput.value.trim();
    if (message) {
      sendToGPT(message);
      messageInput.value = '';
    }
  });

  // Handle enter key in textarea
  messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageButton.click();
    }
  });

  // 初始化時從 storage 讀取 checkbox 狀態
  chrome.storage.local.get(['notifyTelegram'], function(result) {
    notifyTelegramCheckbox.checked = result.notifyTelegram || false;
  });

  // 監聽 checkbox 變化並保存狀態
  notifyTelegramCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ notifyTelegram: this.checked });
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Sidepanel] Received message:', request);

    if (request.type === 'selectedText') {
      console.log('[Sidepanel] Setting selected text to input:', request.text);
      messageInput.value = request.text;
    } else if (request.type === 'closePanel') {
      console.log('[Sidepanel] Closing side panel');
      window.close();
    } else if (request.type === 'stateChange') {
      console.log('[Sidepanel] Updating state display:', request.state);
      const stateElement = document.getElementById('state');
      stateElement.textContent = `State: ${request.state}`;

      // 處理計時邏輯和 Telegram 通知
      if (request.state === 'running' && startTime === null) {
        startTimer();
      } else if (request.state === 'waiting' && startTime) {
        stopTimer();
        
        // 檢查是否需要發送 Telegram 通知
        chrome.storage.local.get(['notifyTelegram'], function(result) {
          if (result.notifyTelegram) {
            // 發送通知到 API
            fetch(`${API_URL}/notify/telegram`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'ChatGPT is ready.'
              })
            })
            .then(response => response.text())
            .then(result => {
              console.log('[Sidepanel] Telegram notification sent:', result);
            })
            .catch(error => {
              console.error('[Sidepanel] Failed to send Telegram notification:', error);
            });
          }
        });
      }
    } else {
      console.log('[Sidepanel] Unknown message type:', request.type);
    }
  });

  // 監聽來自 content script 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'imageList') {
      const imgListElement = document.getElementById('imgList');
      const totalTurnsElement = document.getElementById('totalTurns');
      
      if (request.list.length === 0) {
        statusElement.textContent = 'Status: no image';
        imgListElement.innerHTML = '';
        totalTurnsElement.textContent = 'Total Turns: 0';
        return;
      }

      // 更新總數顯示
      totalTurnsElement.textContent = `Total Turns: ${request.list.length}`;
      
      // 清除並更新圖片列表
      imgListElement.innerHTML = '';
      request.list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.textContent = `Turn ${item.turnId}: ${item.src.substring(0, 50)}...`;
        imgListElement.appendChild(div);
      });

      // 準備 API 請求數據
      const apiData = {
        pageId: document.getElementById('pageId').textContent.replace('PageID: ', ''),
        turns: request.list.map(item => ({
          id: item.turnId,
          url: item.src
        }))
      };

      // 調用 API
      statusElement.textContent = 'Status: call API ...';
      
      fetch(`${API_URL}/images/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })
      .then(response => response.text())
      .then(result => {
        statusElement.textContent = `Status: ${result}`;
      })
      .catch(error => {
        statusElement.textContent = `Status: API error: ${error.message}`;
      });
    }
  });

  // 添加 Send GPT 按鈕處理
  sendGptButton.addEventListener('click', async function() {
    // 發送消息到 content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'sendGpt',
        text: 'Hi, GPT'
      });
    });
  });
});

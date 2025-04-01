const API_URL = 'http://solarsuna.com:32345';
let startTime = null;

document.addEventListener('DOMContentLoaded', function () {
  // 元素獲取
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
      const icon = this.querySelector('.toggle-icon');
      const verticalLine = icon.querySelector('#v-line');
      const isOpen = content.style.display === 'block';

      content.style.display = isOpen ? 'none' : 'block';
      
      if (isOpen) {
        verticalLine.style.display = 'block';
        icon.setAttribute('data-state', 'closed');
      } else {
        verticalLine.style.display = 'none';
        icon.setAttribute('data-state', 'open');
      }
    });
  });

  // Timer functions
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
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
      elapsedTimeElement.textContent = `Elapsed: ${elapsed.toFixed(2)}s (${formatTimestamp(endTime)})`;
      startTime = null;
    }
  }

  // 初始化時從 storage 讀取 checkbox 狀態
  chrome.storage.local.get(['notifyTelegram']).then(result => {
    notifyTelegramCheckbox.checked = result.notifyTelegram || false;
  }).catch(error => {
    console.error('[Sidepanel] Error reading storage:', error);
  });

  // 監聽 checkbox 變化並保存狀態
  notifyTelegramCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ notifyTelegram: this.checked }).catch(error => {
      console.error('[Sidepanel] Error saving to storage:', error);
    });
  });

  // Download Images button click handler
  downloadImagesButton.addEventListener('click', async function() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs[0]) {
        const currentUrl = tabs[0].url;
        console.log('[Sidepanel] Current URL:', currentUrl);
        
        let pageId = '';
        if (currentUrl.match(/-[0-9a-f]{12}$/)) {
          pageId = currentUrl.slice(-12);
        }
        
        const pageIdElement = document.getElementById('pageId');
        pageIdElement.textContent = `PageID: ${pageId}`;

        if (pageId) {
          await chrome.tabs.sendMessage(tabs[0].id, {
            type: 'queryImageList'
          });
        } else {
          statusElement.textContent = 'Status: no image';
          document.getElementById('imgList').innerHTML = '';
          document.getElementById('totalTurns').textContent = 'Total Turns: 0';
        }
      }
    } catch (error) {
      console.error('[Sidepanel] Error in download handler:', error);
      statusElement.textContent = 'Status: Error occurred';
    }
  });

  // Message handling functions
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'gpt-message'}`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Send GPT button handler
  sendGptButton.addEventListener('click', async function() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'sendGpt',
          text: 'Hi, GPT'
        });
      }
    } catch (error) {
      console.error('[Sidepanel] Error sending GPT message:', error);
    }
  });

  // Message listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Sidepanel] Received message:', request);

    switch (request.type) {
      case 'selectedText':
        messageInput.value = request.text;
        break;
      case 'closePanel':
        window.close();
        break;
      case 'stateChange':
        const stateElement = document.getElementById('state');
        stateElement.textContent = `State: ${request.state}`;
        
        if (request.state === 'running' && !startTime) {
          startTimer();
        } else if (request.state === 'waiting' && startTime) {
          stopTimer();
          handleTelegramNotification();
        }
        break;
      case 'imageList':
        handleImageList(request.list);
        break;
    }
  });

  async function handleTelegramNotification() {
    try {
      const result = await chrome.storage.local.get(['notifyTelegram']);
      if (result.notifyTelegram) {
        const response = await fetch(`${API_URL}/notify/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ChatGPT is ready.' })
        });
        console.log('[Sidepanel] Telegram notification sent:', await response.text());
      }
    } catch (error) {
      console.error('[Sidepanel] Failed to send Telegram notification:', error);
    }
  }

  function handleImageList(list) {
    const imgListElement = document.getElementById('imgList');
    const totalTurnsElement = document.getElementById('totalTurns');
    
    if (list.length === 0) {
      statusElement.textContent = 'Status: no image';
      imgListElement.innerHTML = '';
      totalTurnsElement.textContent = 'Total Turns: 0';
      return;
    }

    totalTurnsElement.textContent = `Total Turns: ${list.length}`;
    imgListElement.innerHTML = '';
    
    list.forEach(item => {
      const div = document.createElement('div');
      div.className = 'mb-2';
      div.textContent = `Turn ${item.turnId}: ${item.src.substring(56, 83)}`;
      imgListElement.appendChild(div);
    });

    handleImageDownload(list);
  }

  async function handleImageDownload(list) {
    try {
      statusElement.textContent = 'Status: call API ...';
      const response = await fetch(`${API_URL}/images/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: document.getElementById('pageId').textContent.replace('PageID: ', ''),
          turns: list.map(item => ({
            id: item.turnId,
            url: item.src
          }))
        })
      });
      statusElement.textContent = `Status: ${await response.text()}`;
    } catch (error) {
      statusElement.textContent = `Status: API error: ${error.message}`;
    }
  }
});

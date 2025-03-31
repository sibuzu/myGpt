document.addEventListener('DOMContentLoaded', function () {
  const queryDataButton = document.getElementById('queryData');
  const messageInput = document.getElementById('messageInput');
  const sendMessageButton = document.getElementById('sendMessage');
  const chatContainer = document.getElementById('chatContainer');
  const elapsedTimeElement = document.getElementById('elapsedTime');

  let startTime = null;

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    // const year = date.getFullYear();
    // const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份從 0 開始，需要 +1
    // const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
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

  // Query Content Data
  queryDataButton.addEventListener('click', function () {
    console.log('[Sidepanel] Querying content data...');
    
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
          console.log('[Sidepanel] Requesting image list for pageId:', pageId);
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'queryImageList'
          });
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

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Sidepanel] Received message:', request);
    console.log('[Sidepanel] Sender:', sender);

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

      // 處理計時邏輯
      if (request.state === 'running' && startTime === null) {
        startTimer();
      } else if (request.state === 'waiting' && startTime) {
        stopTimer();
      }
    } else {
      console.log('[Sidepanel] Unknown message type:', request.type);
    }
  });

  // 監聽來自 content script 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'imageList') {
      const imgListElement = document.getElementById('imgList');
      imgListElement.innerHTML = ''; // 清除舊的列表
      
      request.list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.textContent = `Turn ${item.turnId}: ${item.src.substring(0, 50)}...`;
        imgListElement.appendChild(div);
      });
    }
  });
});

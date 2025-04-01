// 定義狀態和對應的選擇器
const STATE_SELECTORS = {
  'waiting': 'button[data-testid="send-button"][disabled], button[data-testid="composer-speech-button"]',
  'ready-to-send': 'button[data-testid="send-button"]:not([disabled])',
  'running': 'button[data-testid="stop-button"]'
};

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

// 檢查當前狀態
function checkState() {
  // console.log('[Contents] Checking state...');

  for (const [state, selector] of Object.entries(STATE_SELECTORS)) {
    if (document.querySelector(selector)) {
      // console.log('[Contents] Current state:', state);
      chrome.runtime.sendMessage({
        type: 'stateChange',
        state: state
      });
      return;
    }
  }

  // 如果都沒找到，則為 not-found
  console.log('[Contents] Current state: not-found');
  logAllDataTestIds();
  chrome.runtime.sendMessage({
    type: 'stateChange',
    state: 'not-found'
  });
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
    attributeFilter: ['class', 'disabled']
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

// 監聽來自 sidepanel 的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'queryImageList') {
    console.log('[Contents] Querying image list...');
    const imageList = [];
    
    // 查找所有對話回合
    const turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    
    turns.forEach(turn => {
      // 獲取 turnId
      console.log('[Contents] Turn:', turn);
      const turnId = turn.getAttribute('data-testid').replace('conversation-turn-', '');
      
      // 查找圖片容器
      const imageContainer = turn.querySelector('.group\\/imagegen-image');
      if (imageContainer) {
        // 查找第一個圖片元素
        const img = imageContainer.querySelector('img');
        if (img) {
          imageList.push({
            turnId: turnId,
            src: img.src
          });
        }
      }
    });
    
    // 發送結果回 sidepanel
    chrome.runtime.sendMessage({
      type: 'imageList',
      list: imageList
    });
  } else if (request.action === 'sendMsg') {

    console.log('[Contents] Sending GPT message:', request.text);
    // 找到 ChatGPT 的輸入框
    const promptTextarea = document.querySelector('[id="prompt-textarea"]');
    
    if (promptTextarea) {
      // 設置文本
      promptTextarea.innerHTML = `<p>${request.text}</p>`;
      console.log('[Contents] Prompt textarea:', promptTextarea);

      // 觸發 input 事件以激活發送按鈕
      promptTextarea.dispatchEvent(new Event('input', { 
        bubbles: true,
        cancelable: true 
      }));
      
      // 等待發送按鈕變為可用，設置最大等待時間為 5 秒 (10次 * 500ms)
      await new Promise((resolve, reject) => {
        const maxAttempts = 10;
        let attempts = 0;
        
        const checkButton = () => {
          const sendButton = document.querySelector('button[data-testid="send-button"]:not([disabled])');
          if (sendButton) {
            console.log('[Contents] Send button is ready');
            sendButton.click();
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('Timeout waiting for send button'));
          } else {
            console.log('[Contents] Waiting for send button... attempt:', attempts + 1);
            attempts++;
            setTimeout(checkButton, 500);
          }
        };
        checkButton();
      }).catch(error => {
        console.error('[Contents] Error:', error.message);
      });
    }
  }
});

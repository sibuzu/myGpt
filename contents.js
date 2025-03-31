// 定義狀態和對應的選擇器
const STATE_SELECTORS = {
  'waiting': 'span[data-state="closed"] button[data-testid="send-button"][disabled]',
  'ready-to-send': 'button[data-testid="send-button"]:not([disabled])',
  'running': 'button[data-testid="stop-button"]'
};

// 檢查當前狀態
function checkState() {
  console.log('[Contents] Checking state...');
  
  for (const [state, selector] of Object.entries(STATE_SELECTORS)) {
    if (document.querySelector(selector)) {
      console.log('[Contents] Current state:', state);
      chrome.runtime.sendMessage({
        type: 'stateChange',
        state: state
      });
      return;
    }
  }
  
  // 如果都沒找到，則為 not-found
  console.log('[Contents] Current state: not-found');
  chrome.runtime.sendMessage({
    type: 'stateChange',
    state: 'not-found'
  });
}

// 設置 MutationObserver
const observer = new MutationObserver((mutations) => {
  console.log('[Contents] DOM mutation detected');
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
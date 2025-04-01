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
      // 解析 markdown 格式的圖片
      const imageMatches = request.text.match(/!\[.*?\]\((.*?)\)\n/g);
      const textContent = request.text.replace(/!\[.*?\]\((.*?)\)\n/g, '');
      
      // 如果有圖片，先處理圖片
      if (imageMatches) {
        for (const imgMarkdown of imageMatches) {
          const imgUrl = imgMarkdown.match(/\((.*?)\)/)[1];
          
          try {
            console.log('[Contents] Processing image:', imgUrl.substring(0, 50) + '...');
            
            // 將 base64 圖片轉換為 blob
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            
            // 確保頁面和輸入框有焦點
            window.focus();
            promptTextarea.focus();
            
            // 等待焦點設置完成
            await new Promise(resolve => setTimeout(resolve, 100));

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
              
              promptTextarea.dispatchEvent(inputEvent);
              
              // 如果上面的方法失敗，嘗試使用 drop 事件
              if (!promptTextarea.querySelector('img')) {
                const dropEvent = new DragEvent('drop', {
                  bubbles: true,
                  cancelable: true,
                  dataTransfer: dt
                });
                promptTextarea.dispatchEvent(dropEvent);
              }
            } catch (pasteError) {
              console.error('[Contents] Primary paste method failed:', pasteError);
              
              // 備用方案：使用 FormData 和 XHR
              try {
                const formData = new FormData();
                formData.append('image', blob, 'image.png');
                
                // 觸發自定義事件
                const customEvent = new CustomEvent('imageUpload', {
                  detail: { formData: formData }
                });
                promptTextarea.dispatchEvent(customEvent);
              } catch (backupError) {
                console.error('[Contents] Backup paste method failed:', backupError);
              }
            }
            
            // 等待圖片插入完成
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[Contents] Image insertion attempted');
          } catch (error) {
            console.error('[Contents] Error handling image:', error);
          }
        }
      }
      
      // 處理文本內容
      if (textContent.trim()) {
        promptTextarea.focus();
        document.execCommand('insertText', false, textContent.trim());
      }
      
      // 觸發 input 事件以激活發送按鈕
      promptTextarea.dispatchEvent(new Event('input', { 
        bubbles: true,
        cancelable: true 
      }));
      
      // 等待發送按鈕變為可用
      await new Promise((resolve, reject) => {
        // 如果有圖片，則等待更久
        const maxAttempts = imageMatches ? 40 : 10; // 有圖等20秒，無圖等5秒
        let attempts = 0;
        
        const checkButton = () => {
          const sendButton = document.querySelector('button[data-testid="send-button"]:not([disabled])');
          if (sendButton) {
            console.log('[Contents] Send button is ready');
            sendButton.click();
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error(`Timeout waiting for send button after ${maxAttempts * 500}ms`));
          } else {
            console.log('[Contents] Waiting for send button... attempt:', attempts + 1, 
                       `(${attempts * 500}ms / ${maxAttempts * 500}ms)`);
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

// 添加必要的輔助函數
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

const panelStates = new Map();

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  const isOpen = panelStates.get(tab.windowId) || false;
  console.log('[Background] Icon clicked. Current panel state:', isOpen);
  
  try {
    if (isOpen) {
      chrome.runtime.sendMessage('closeSidePanel');
      panelStates.set(tab.windowId, false);
      console.log('[Background] Side panel closed');
    } else {
      await chrome.sidePanel.open({ windowId: tab.windowId});
      panelStates.set(tab.windowId, true);
      console.log('[Background] Side panel opened');
    }
  } catch (error) {
    console.error('[Background] Error toggling side panel:', error);
  }
});

// Create context menu
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.contextMenus.create({
      id: "askGPT",
      title: "Ask GPT: %s",
      contexts: ["selection"]
    });
    console.log('[Background] Context menu created successfully');
  } catch (error) {
    console.error('[Background] Error creating context menu:', error);
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "askGPT") {
    console.log('[Background] Context menu clicked with text:', info.selectionText);
    const selectedText = info.selectionText;
    
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      panelStates.set(tab.windowId, true);
      console.log('[Background] Side panel opened from context menu');

      // Send selected text to side panel
      // 使用 Promise 和 setTimeout
      await new Promise(resolve => setTimeout(resolve, 500));
      await chrome.runtime.sendMessage({
        type: 'selectedText',
        text: selectedText
      });
      console.log('[Background] Selected text sent to side panel');
    } catch (error) {
      console.error('[Background] Error handling context menu click:', error);
    }
  }
});

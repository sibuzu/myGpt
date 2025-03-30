// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askGPT",
    title: "Ask GPT: %s",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askGPT") {
    const selectedText = info.selectionText;
    
    // Open side panel
    chrome.sidePanel.open({ windowId: tab.windowId });

    // Send selected text to side panel
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'selectedText',
        text: selectedText
      });
    }, 500);
  }
});
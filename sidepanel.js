document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  const messageInput = document.getElementById('messageInput');
  const sendMessageButton = document.getElementById('sendMessage');
  const chatContainer = document.getElementById('chatContainer');

  // Load saved API key
  chrome.storage.sync.get(['apiKey'], function(result) {
    apiKeyInput.value = result.apiKey || '';
  });

  // Save API key
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({
      apiKey: apiKey
    }, function() {
      alert('API key saved!');
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
    try {
      const result = await chrome.storage.sync.get(['apiKey']);
      if (!result.apiKey) {
        alert('Please set your OpenAI API key first');
        return;
      }

      addMessage(message, true);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: message
          }]
        })
      });

      const data = await response.json();
      const answer = data.choices[0].message.content;
      addMessage(answer);
    } catch (error) {
      console.error('Error:', error);
      addMessage('Error: Failed to get response from GPT');
    }
  }

  // Handle send message button
  sendMessageButton.addEventListener('click', function() {
    const message = messageInput.value.trim();
    if (message) {
      sendToGPT(message);
      messageInput.value = '';
    }
  });

  // Handle enter key in textarea
  messageInput.addEventListener('keypress', function(e) {
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
    } else if (request === 'closeSidePanel') {
      console.log('[Sidepanel] Closing side panel');
      window.close();
    } else if (request.type === 'stateChange') {
      console.log('[Sidepanel] Updating state display:', request.state);
      const stateElement = document.getElementById('state');
      stateElement.textContent = `State: ${request.state}`;
    } else {
      console.log('[Sidepanel] Unknown message type:', request.type);
    }
  });
});

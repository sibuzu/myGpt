export function initializeComposer(messageInput) {
  // 初始化輸入框結構
  function initializeMessageInput() {
    // 清空現有內容
    messageInput.innerHTML = '';

    // 創建圖片容器
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'images-container';

    // 創建文字容器
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';
    textContainer.contentEditable = true;

    messageInput.appendChild(imagesContainer);
    messageInput.appendChild(textContainer);

    // 將焦點設置到文字容器
    textContainer.focus();
  }

  // 初始化輸入框
  initializeMessageInput();

  function insertPlainText(textContainer, text) {
    const normalizedText = text.replace(/\r\n?/g, '\n');
    const selection = window.getSelection();
    let range;

    if (selection.rangeCount > 0 && textContainer.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(textContainer);
      range.collapse(false);
    }

    range.deleteContents();
    const textNode = document.createTextNode(normalizedText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    textContainer.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: normalizedText
    }));
  }

  // 處理貼上事件
  messageInput.addEventListener('paste', async (e) => {
    e.preventDefault();

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const imagesContainer = messageInput.querySelector('.images-container');
    const textContainer = messageInput.querySelector('.text-container');

    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = function (event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          imagesContainer.appendChild(img);
        };

        reader.readAsDataURL(blob);
      } else if (item.type === 'text/plain') {
        // 處理純文本
        const text = await new Promise(resolve => item.getAsString(resolve));
        insertPlainText(textContainer, text);
      }
    }
  });

  return {
    text: () => messageInput.querySelector('.text-container'),
    reset: initializeMessageInput,
    read: () => {
      const text = messageInput.querySelector('.text-container').innerText;
      const images = Array.from(messageInput.querySelector('.images-container').querySelectorAll('img'));
      return images.map((image, index) => `![Image ${index + 1}](${image.src})\n`).join('') + text.trim();
    }
  };
}

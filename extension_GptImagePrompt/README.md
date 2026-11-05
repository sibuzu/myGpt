# GptImagePrompt

獨立的 Chrome 側欄擴充功能，依衣服、場景與姿勢產生圖片提示詞。

1. 開啟 `chrome://extensions` 並開啟「開發人員模式」。
2. 選擇「載入未封裝項目」，指定本資料夾。
3. 開啟或重新整理 ChatGPT 分頁，點擊擴充功能圖示。

衣服包含清新、性感、動漫、迷你裙。場景選「無重力」時固定使用天空；選「自動」時，20% 使用無重力，其餘抽選本地場景 title。氣質每次隨機抽選，「、胸部圓潤」獨立以 10% 機率加入。

1 張會填入訊息框；多張會直接加入佇列。預設勾選 Pause，取消後於 ChatGPT 可輸入時依序傳送。傳送失敗會保留訊息並暫停。保留文字／圖片貼上與複製網頁功能。

所有 reference 均已複製至本資料夾：衣櫥與角色資料位於 `prompt-generators/`，場景 title 與原始姿勢清單位於 `data/`。原始姿勢尾端的數字不會輸出。執行時不讀取其他專案。

Icon 的 SVG 原稿與 16／48／128 PNG 均位於 `images/`。

驗證指令：

```bash
node --test extension_GptImagePrompt/tests/*.test.mjs
```

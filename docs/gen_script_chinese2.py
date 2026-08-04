import json
import random
import sys
import os
import base64
from typing import List

# 問候語列表
GREETINGS = [
    "痛", "投降", "Yeah!", "Hi", "秀秀", "愛你", "早安", "你好", "晚安", 
    "謝謝", "奸笑", "失望", "累", "努力", "大笑", "感謝", "期待", "讚", 
    "喜", "怒", "哀", "樂", "真的嗎", "sure", "no problem", "where?", "失望", "期待", "大笑", 
    "Let's go", "Wait", "Take break", "準備", "第一名", "第二名", "第三名", 
    "最後一名", "怕", "不要", "要", "だめ", "恐惧", "可惡", "豈有此理", 
    "慢吞吞", "謝謝", "幫大忙", "應該的", "不客氣", "不錯", "Good Job", 
    "感動", "Please", "笑倒", "起床", "睡覺", "sorry", "失神", "忙", 
    "在忙嗎", "加油", "Good idea", "no idea", "Holiday", "買東西", 
    "計畫通り", "生氣", "吃飯", "買東西", "誰理你", "沒錢", "錢", "逛街", 
    "早安", "你好", "晚安", "謝謝", "看清楚", "得獎", "wanted", "怎麼辦", 
    "出國比賽", "煮東西", "下雨了", "好熱", "牙痛", "愛你", "你試試看", 
    "喔", "坐車", "走路", "看電視", "好忙", "打電腦", "工作中", "正在忙", 
    "休閑中", "我有空", "搞定"
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
    "Style-6.png"
]

def get_greetings(idx: int, count: int) -> str:
    selected = GREETINGS[idx*count:(idx+1)*count]
    return " ".join(selected)

def encode_image_to_base64(image_path: str) -> str:
    """將圖片轉換為 base64 編碼"""
    try:
        with open(image_path, 'rb') as image_file:
            # 讀取圖片內容
            binary_data = image_file.read()
            # 轉換為 base64
            base64_data = base64.b64encode(binary_data).decode('utf-8')
            
            # 判斷圖片類型
            ext = os.path.splitext(image_path)[1].lower()
            mime_type = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }.get(ext, 'image/png')
            
            return f"data:{mime_type};base64,{base64_data}"
    except Exception as e:
        print(f"Warning: Failed to encode image {image_path}: {e}")
        return None

def generate_script(num_prompts: int, number_stickers: int) -> dict:
    """生成新格式的提示腳本"""
    prompts = []
    images_dict = {}  # 用來存儲圖片的字典，避免重複編碼
    
    for i in range(num_prompts):
        # 使用固定的圖片檔案
        image_paths = [os.path.join(IMAGE_DIR, file) for file in IMAGE_FILES]
        
        # 生成問候語
        selected_greetings = GREETINGS[i*number_stickers:(i+1)*number_stickers]
        greetings = " ".join([f"{{{greeting}}}" for greeting in selected_greetings])
        
        # 建立提示
        prompt = {
            "prompt": f"表情包的圖貼 {greetings}\n\n"
                     f"請根據我提供的主角圖片和{number_stickers}個文案生成一張九宮格 ( 3 × 3 ) 排列的 LINE 貼圖 總覽圖 , 並請遵守以下要點 : \n"
                     "* 每张贴圖皆為尺寸相同的 1 : 1 正方形 , 主角需完整呈現於中心位置 , 避免發生被 裁切的情形 。 \n"
                     "* 每张贴圖皆為同一個 主角的不同姿態或表情 , 且角色外觀必須與原圖一致 ( 包含 服裝 、 眼鏡 、 眼睛 、 髮型、 色調 、 畫風 等 )，黑短髮，但不要頭髮太少。 \n"
                     "* 整張圖請使用透明背景 ( Alpha channel ) \n"
                     "* 每张贴圖 「 不要 」 包含任何文字 、 標語 或 對話框 。",
            "files": image_paths
        }
        prompts.append(prompt)
        
        # 編碼所有圖片
        for image_path in image_paths:
            if image_path not in images_dict:
                base64_image = encode_image_to_base64(image_path)
                if base64_image:
                    images_dict[image_path] = base64_image
    
    # 返回新的格式
    return {
        "prompt": prompts,
        "images": images_dict
    }

def main():
    if len(sys.argv) != 2:
        print("Usage: python gen_script.py <number_of_stickers>")
        sys.exit(1)
    
    try:
        number_stickers = int(sys.argv[1])
        if number_stickers <= 0:
            raise ValueError("Number of stickers must be positive")
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    num_prompts = len(GREETINGS) // number_stickers
    script = generate_script(num_prompts, number_stickers)
    
    # 修改輸出檔案名稱為 myscript.json
    output_file = "myscript.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {num_prompts} prompts in {output_file}")
    print("Images encoded in base64 format")

if __name__ == "__main__":
    main()

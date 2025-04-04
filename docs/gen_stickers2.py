import json
import random
import sys
import os
import base64
from typing import List

# 日文問候語列表
GREETINGS = [
    "大丈夫", "お休み",
    "大丈夫です", "すみません", "おはよう", "こんにちは", "こんばんは",
    "元気"
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
    "a10.png", "a10x.png"
]

def get_greetings(idx: int, count: int) -> str:
    selected = GREETINGS[idx*count:(idx+1)*count]
    return " ".join(f"{{{greeting}}}" for greeting in selected)

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
        # 使用兩個固定的圖片檔案
        image_paths = [os.path.join(IMAGE_DIR, file) for file in IMAGE_FILES]
        
        # 生成問候語
        greetings = get_greetings(i, number_stickers)
        
        # 建立提示
        prompt = {
            "prompt": "請依據照片(圖一)中的女孩角色，製作日系動漫風格的可愛Q版貼圖。"
                     "角色應保留長直髮、紅背包、白上衣與紅花圖案洋裝的特色。"
                     f"每张贴圖表現不同的情緒與手勢，搭配以下{number_stickers}句日文文字："
                     f"{greetings}。"
                     "風格需參考參考圖（如附圖二）呈現Q版比例、大眼圓臉、誇張表情與日文字效果文字。"
                     "背景需為透明色，方便製作LINE貼圖使用。",
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

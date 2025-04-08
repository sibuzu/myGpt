import json
import random
import sys
import os
import base64
from typing import List

# 動漫風格列表
GREETINGS = [
    # "蠟筆小新", "七龍珠", "Jojo冒險野狼", "辛普森家庭", 
    # "航海王", "美少女戰士", "伊藤潤二", "賭博默示錄",
    # "排球少年", "藍色監獄", "天官賜福", "魔道祖師",
    # "我推的孩子", "我獨自升級", "藥師少女的獨語", "吉卜力"
    "多啦A夢", "名侦探柯南", "火影忍者", "鋼之鍊金術師", "新海诚",
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
    "a6.png"
]

def get_greetings(idx: int, count: int) -> str:
    selected = GREETINGS[idx*count:(idx+1)*count]
    return " ".join(f"{greeting}" for greeting in selected)

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
        
        # 生成風格名稱
        styles = get_greetings(i, number_stickers)
        
        # 建立提示
        prompt = {
            "prompt": f"請依據照片中的人物，使用「{styles}」的繪畫風格重新詮釋。",
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

import json
import random
import sys
import os
import base64
from typing import List

# 日文問候語列表
GREETINGS = [
    "真的嗎？", "不會吧？", "為什麼？", "竟然", "是啊", 
    "當然", "真棒", "好啊", "贊成", "說得對",
    "就是這樣", "不行", "不可能", "饒了我吧", "別這樣",
    "加油", "沒關係", "了解", "明白了", "原來如此",
    "我懂了", "對不起", "不好意思", "沒事", "沒問題",
    "幫大忙", "大感謝", "哭哭", "太棒了", "成功了",
    "耶", "期待", "好期待", "想哭", "太感人了",
    "好難受", "太痛苦了", "失望", "真失望", "不知道",
    "不明白", "了解", "辛苦了", "就是說", "我也是",
    "欸", "什麼", "哇", "哎呀", "好可怕",
    "衝擊", "震撼", "嚇", "驚", "真是的",
    "完全", "知道了", "無異議", "最高", "太好了",
    "不愧是", "果然", "拒絕", "困擾", "傷腦筋",
    "可惜", "真遺憾", "莫名其妙", "意義不明", "混亂",
    "失禮了", "謝謝", "完美", "下次", "OK",
    "Thank you", "Sorry", "Don't Mind", "晚安", "早安",
    "午安", "還好嗎？", "你好"
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
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
            "prompt": "用角色A，製作日系動漫風格的可愛Q版貼圖。每张贴圖表現不同的情緒與手勢，搭配以下4句中文文字："
            f"{greetings}。"
            "50歲，穿著粉色上衣、戴白色遮陽帽與太陽眼鏡，呈現誇張表情與中文字效果文字。"
            "背景需為白色透明，可以製作LINE貼圖使用。圖形比例為正方型。",
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

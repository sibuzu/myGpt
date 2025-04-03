import json
import random
import sys
import os
import base64
from typing import List

# 日文問候語列表
GREETINGS = [
    "ありえん！", "ええっ！", "え、マジで？", "おつぽん", "お断り！",
    "がっかり", "かんべん！", "きょひ！", "くる！", "こんらん！",
    "ごめん！", "すみません", "その通り！", "それな！", "それな",
    "たすかる", "つらい！", "つらい", "とうぜん！", "どうして？",
    "どう？", "どきも！", "どがん！", "なぜ？", "なるほど",
    "なんで？", "はんたい！", "びびる！", "ぴえん", "ファイト！",
    "まさか！", "まじか", "まじかよ！", "まじで？", "まじ？",
    "むり！", "もちろん", "やったぜ！", "やったー！", "ゆるして！",
    "りょうかい！", "りょうかいぽよ", "わからない", "うそでしょ？", "うわー！",
    "うん、そうだね", "いいね！", "いぎむ！", "いみふ！", "さいこう！",
    "さすが！", "しょうち！", "しょうち！", "しょくげき！", "たいへん！",
    "だいじょうぶです", "ていかん！", "ドンマイ！", "はんせい！", "ひえー！",
    "ほんとう？", "らくしみ！", "ざんねん！", "ぜんく！", "しつれい！",
    "ありがとう！", "がんばれ！"
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
    "a11.png", "a10.png"
]

def get_random_greetings(count: int = 9) -> str:
    """隨機選擇指定數量的問候語並格式化"""
    selected = random.sample(GREETINGS, count)
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

def generate_prompt() -> dict:
    """生成單個提示"""
    # 隨機選擇一個圖片
    image_file = random.choice(IMAGE_FILES)
    image_path = os.path.join(IMAGE_DIR, image_file)
    
    # 生成9個隨機問候語
    greetings = get_random_greetings(9)
    
    # 編碼圖片
    base64_image = encode_image_to_base64(image_path)
    
    return {
        "prompt": f"產生圖貼：依圖片角色，產生9張可愛圖貼，用日文問候語，"
                 f"背景是透明色。不用再問我，依我的需求直接產生。後面是9個問候語：{greetings}",
        "files": [image_path],
        "images": [base64_image] if base64_image else []
    }

def generate_script(num_prompts: int) -> List[dict]:
    """生成指定數量的提示腳本"""
    return [generate_prompt() for _ in range(num_prompts)]

def main():
    if len(sys.argv) != 2:
        print("Usage: python gen_script.py <number_of_prompts>")
        sys.exit(1)
    
    try:
        num_prompts = int(sys.argv[1])
        if num_prompts <= 0:
            raise ValueError("Number of prompts must be positive")
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    script = generate_script(num_prompts)
    
    # 修改輸出檔案名稱為 myscript.json
    output_file = "myscript.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {num_prompts} prompts in {output_file}")
    print("Images encoded in base64 format")

if __name__ == "__main__":
    main()

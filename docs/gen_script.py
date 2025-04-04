import json
import random
import sys
import os
import base64
from typing import List

# 日文問候語列表
GREETINGS = [
    "え、マジで？", "うそでしょ？", "まじか", "なんで？", "どうして？", "まさか！",
    "うん、そうだね", "もちろん", "いいね！", "賛成！", "その通り！", "無理！",
    "勘弁して！", "頑張れ！", "ファイト！", "ドンマイ！", "了解です", "なるほど",
    "すみません", "大丈夫", "助かる", "ぴえん", "まじかよ！", "やったぜ！",
    "やったー！", "楽しみ！", "泣ける", "つらい", "がっかり", "わからない",
    "了解ぽよ", "おつぽん", "それな", "ええっ！", "ありえん！", "まじで？",
    "驚き！", "ひえー！", "うわー！", "ビビる！", "衝撃！", "度肝！",
    "当然！", "全く！", "承知！", "異議なし", "最高！", "流石！",
    "無理！", "勘弁！", "お断り！", "困る！", "拒否！", "残念！",
    "泣ける！", "辛い！", "意味不明！", "混乱！", "了解！", "それな！",
    "賛成！", "まじ？", "本当？", "なぜ？", "どう？", "マジか",
    "失礼！", "ありがとう！", "完璧", "今度",
    "ごめん！", "OK!", "Thank you!", "Sorry!", 
    "大丈夫", "頑張れ！", "ありがとう！"
]

# 圖片目錄
IMAGE_DIR = os.path.expanduser("~/圖庫")
IMAGE_FILES = [
    "a10.png"
]

def get_greetings(idx: int, count: int) -> str:
    """隨機選擇指定數量的問候語並格式化"""
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
        # 隨機選擇一個圖片
        image_file = random.choice(IMAGE_FILES)
        image_path = os.path.join(IMAGE_DIR, image_file)
        
        # 生成問候語
        greetings = get_greetings(i, number_stickers)
        
        # 建立提示
        prompt = {
            "prompt": "產生公仔造形的圖貼：人物外貌請根據上圖訂製，讓角色好像潮玩一樣精致可愛，"
                     f"3D渲染風格，簡潔線條與低飽和度配色，現代感時尚造型，產生{number_stickers}張圖貼，"
                     f"用日文問候語，背景是透明色。不用再問我，依我的需求直接產生。後面是{number_stickers}個問候語："
                     f"{greetings}",
            "files": [image_path]
        }
        prompts.append(prompt)
        
        # 如果這個圖片還沒有被編碼，就進行編碼
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

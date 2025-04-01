from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
import os
import aiohttp
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# 設定目錄路徑
BASE_DIR = os.path.dirname(__file__)
IMAGE_PATH = os.path.join(BASE_DIR, "images")
LOG_PATH = os.path.join(BASE_DIR, "log")

# 確保必要的目錄存在
os.makedirs(IMAGE_PATH, exist_ok=True)
os.makedirs(LOG_PATH, exist_ok=True)

# 配置日誌
log_file = os.path.join(LOG_PATH, f"api_{datetime.now().strftime('%Y%m%d')}.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        ),
        logging.StreamHandler()  # 同時輸出到控制台
    ]
)
logger = logging.getLogger(__name__)

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該設置具體的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
async def test():
    """
    Test endpoint to verify API is running
    """
    logger.info("Test endpoint called")
    return "my-gpt-api is running"

# 定義數據模型
class Turn(BaseModel):
    id: str
    url: str

class ImageDownloadRequest(BaseModel):
    pageId: str
    turns: List[Turn]

async def download_image(session: aiohttp.ClientSession, url: str, filepath: str) -> bool:
    try:
        async with session.get(url) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                return True
    except Exception as e:
        logger.error(f"Error downloading {url}: {e}")
    return False

@app.post("/images/download")
async def download_images(request: ImageDownloadRequest):
    logger.info(f"Received download request for PageID: {request.pageId}")
    logger.info("Processing turns:")
    
    download_count = 0
    list_count = len(request.turns)
    
    async with aiohttp.ClientSession() as session:
        for turn in request.turns:
            logger.info(f"Processing Turn {turn.id}: {turn.url}")
            
            # 構建圖片文件名
            image_filename = f"{request.pageId}-{int(turn.id):03d}.png"
            image_path = os.path.join(IMAGE_PATH, image_filename)
            
            # 檢查文件是否已存在
            if os.path.exists(image_path):
                logger.info(f"Image {image_filename} already exists, skipping...")
                continue
            
            # 下載圖片
            if await download_image(session, turn.url, image_path):
                download_count += 1
                logger.info(f"Successfully downloaded {image_filename}")
            else:
                logger.error(f"Failed to download {image_filename}")
    
    result = f"finish download {download_count}/{list_count} images"
    logger.info(result)
    return result

# 新增 Telegram 相關配置
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

# 測試 Telegram 通知
# cmd = f"curl -X POST 'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage' -d 'chat_id={TELEGRAM_CHAT_ID}&text=Hello, World!'" 
# print(cmd)

# 新增 Telegram 通知請求模型
class TelegramNotification(BaseModel):
    message: str

@app.post("/notify/telegram")
async def send_telegram_notification(notification: TelegramNotification):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram credentials not configured")
        return "Telegram notification skipped - not configured"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(TELEGRAM_API_URL, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": notification.message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"Telegram notification sent successfully: {result}")
                    return "Telegram notification sent"
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to send Telegram notification. Status: {response.status}, Response: {error_text}")
                    return f"Failed to send Telegram notification: {response.status}"
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {e}")
        return f"Error sending Telegram notification: {str(e)}"

if __name__ == "__main__":
    logger.info("Starting API server...")
    uvicorn.run(app, host="0.0.0.0", port=12345)

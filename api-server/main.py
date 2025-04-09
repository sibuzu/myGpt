from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import os
import aiohttp
import logging
from datetime import datetime, timedelta
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import yt_dlp
import json
import asyncio
from collections import deque
from enum import Enum

load_dotenv()
app = FastAPI()

# 設定目錄路徑
BASE_DIR = os.path.dirname(__file__)
IMAGE_PATH = os.path.join(BASE_DIR, "images")
LOG_PATH = os.path.join(BASE_DIR, "log")
MISSAV_PATH = os.path.join(BASE_DIR, "missav")

# 確保必要的目錄存在
os.makedirs(IMAGE_PATH, exist_ok=True)
os.makedirs(LOG_PATH, exist_ok=True)
os.makedirs(MISSAV_PATH, exist_ok=True)

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

@app.get("/")
async def root():
    """
    Root endpoint to verify API is running
    """
    logger.info("Root endpoint called")
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

class MissavInfo(BaseModel):
    description: str
    image: str
    source: str
    title: str
    url: str

def my_hook(d):
    if d['status'] == 'downloading':
        # 獲取當前進度百分比
        current_percent = float(d.get('_percent_str', '0%').replace('%', ''))
        
        # 使用靜態變數記錄上次記錄的進度
        if not hasattr(my_hook, 'last_percent'):
            my_hook.last_percent = 0
        
        # 只有當進度增加超過1%時才記錄
        if current_percent - my_hook.last_percent >= 1:
            progress = (
                f"下載進度: {d.get('_percent_str', '0%')} "
                f"速度: {d.get('_speed_str', 'N/A')} "
                f"剩餘時間: {d.get('_eta_str', 'N/A')}"
            )
            logger.info(progress)
            my_hook.last_percent = current_percent
    elif d['status'] == 'finished':
        logger.info('原始文件下載完成，等待 ffmpeg 處理...')

def postprocess_hook(d):
    if d['status'] == 'started':
        logger.info(f'開始 ffmpeg 處理: {d.get("postprocessor")}')
    elif d['status'] == 'processing':
        logger.info(f'ffmpeg 處理中: {d.get("postprocessor")}')
    elif d['status'] == 'finished':
        logger.info(f'ffmpeg 處理完成: {d.get("postprocessor")}')

# 設定最大同時下載數和下載佇列
MAX_CONCURRENT_DOWNLOADS = 3
download_semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)
download_queue = deque()
queue_lock = asyncio.Lock()

class DownloadStatus(Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

# 任務狀態追蹤
class TaskStatus:
    def __init__(self, video_id: str, status: DownloadStatus, position: Optional[int] = None):
        self.video_id = video_id
        self.status = status
        self.position = position
        self.progress = 0
        self.message = ""
        self.errors = []
        self.completed_files = 0
        self.timestamp = datetime.now()

# 全局任務狀態存儲
download_tasks: Dict[str, TaskStatus] = {}

async def process_download_queue():
    while True:
        async with queue_lock:
            if not download_queue:
                return
            info = download_queue.popleft()
            video_id = info.title.split()[0]
            
            # 更新狀態：從排隊到下載中
            if video_id in download_tasks:
                download_tasks[video_id].status = DownloadStatus.DOWNLOADING
                download_tasks[video_id].position = None
        
        async with download_semaphore:
            try:
                await perform_download(info)
            except Exception as e:
                logger.error(f"Error processing queued download for {info.title}: {e}")
                if video_id in download_tasks:
                    download_tasks[video_id].status = DownloadStatus.FAILED
                    download_tasks[video_id].errors.append(str(e))

async def perform_download(info: MissavInfo):
    video_id = info.title.split()[0]
    base_filename = os.path.join(MISSAV_PATH, video_id)
    video_path = f"{base_filename}.mp4"
    
    task_status = download_tasks.get(video_id)
    if not task_status:
        return
    
    # 檢查影片檔案是否已存在
    if os.path.exists(video_path):
        logger.info(f"Video file already exists: {video_path}")
        task_status.status = DownloadStatus.SKIPPED
        task_status.message = "Video file already exists"
        return
    
    task_status.status = DownloadStatus.DOWNLOADING
    
    try:
        # 下載圖片
        async with aiohttp.ClientSession() as session:
            async with session.get(info.image) as response:
                if response.status == 200:
                    image_path = f"{base_filename}.jpg"
                    with open(image_path, 'wb') as f:
                        f.write(await response.read())
                    task_status.completed_files += 1
                    task_status.progress = 33
        
        # 保存 info json
        with open(f"{base_filename}.json", 'w', encoding='utf-8') as f:
            json.dump(info.dict(), f, ensure_ascii=False, indent=2)
        task_status.completed_files += 1
        task_status.progress = 66
        
        # 下載視頻
        ydl_opts = {
            'format': 'best',
            'outtmpl': f'{base_filename}.mp4',
            'quiet': True,
            'protocol': 'm3u8',
            'ffmpeg_location': '/usr/bin/ffmpeg',
            'progress_hooks': [lambda d: update_download_progress(video_id, d)],
            'postprocessor_hooks': [lambda d: update_postprocess_progress(video_id, d)],
            'logger': logger,
            'verbose': True
        }
        yt_dlp.YoutubeDL(ydl_opts).download([info.source])
        task_status.completed_files += 1
        task_status.progress = 100
        task_status.status = DownloadStatus.COMPLETED
        
    except Exception as e:
        task_status.status = DownloadStatus.FAILED
        task_status.errors.append(str(e))
        logger.error(f"Error downloading {video_id}: {e}")

def update_download_progress(video_id: str, d: dict):
    if video_id in download_tasks and d['status'] == 'downloading':
        current_percent = float(d.get('_percent_str', '0%').replace('%', ''))
        download_tasks[video_id].progress = 66 + (current_percent * 0.33)
        download_tasks[video_id].message = (
            f"下載進度: {d.get('_percent_str', '0%')} "
            f"速度: {d.get('_speed_str', 'N/A')} "
            f"剩餘時間: {d.get('_eta_str', 'N/A')}"
        )

def update_postprocess_progress(video_id: str, d: dict):
    if video_id in download_tasks:
        if d['status'] == 'started':
            download_tasks[video_id].message = f"開始處理: {d.get('postprocessor')}"
        elif d['status'] == 'finished':
            download_tasks[video_id].message = f"處理完成: {d.get('postprocessor')}"

@app.post("/missav/download")
async def download_missav(info: MissavInfo):
    video_id = info.title.split()[0]
    
    # 創建任務狀態
    if download_semaphore._value > 0:  # 有可用的下載槽
        task_status = TaskStatus(video_id, DownloadStatus.DOWNLOADING)
        download_tasks[video_id] = task_status
        # 非阻塞方式啟動下載
        asyncio.create_task(perform_download(info))
        return {
            "task_id": video_id,
            "status": "started",
            "message": "Download started"
        }
    else:
        # 加入佇列
        queue_position = len(download_queue) + 1
        task_status = TaskStatus(video_id, DownloadStatus.QUEUED, queue_position)
        download_tasks[video_id] = task_status
        download_queue.append(info)
        # 確保佇列處理器在運行
        asyncio.create_task(process_download_queue())
        return {
            "task_id": video_id,
            "status": "queued",
            "position": queue_position,
            "message": f"Download queued. Position in queue: {queue_position}"
        }

@app.get("/missav/status/{task_id}")
async def get_download_status(task_id: str):
    if task_id not in download_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = download_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task.status.value,
        "progress": task.progress,
        "message": task.message,
        "position": task.position,
        "errors": task.errors if task.errors else None,
        "completed_files": task.completed_files,
        "timestamp": task.timestamp.isoformat()
    }

@app.get("/missav/queue")
async def get_download_queue():
    # 建立當前佇列的快照
    queue_snapshot = []
    
    # 首先加入正在下載的任務（status 為 DOWNLOADING 的任務）
    downloading_tasks = [
        {
            "task_id": task_id,
            "status": task.status.value,
            "progress": task.progress,
            "message": task.message,
            "position": task.position,
            "errors": task.errors if task.errors else None,
            "completed_files": task.completed_files,
            "timestamp": task.timestamp.isoformat(),
            "title": task.video_id  # 假設 video_id 就是標題
        }
        for task_id, task in download_tasks.items()
        if task.status == DownloadStatus.DOWNLOADING
    ]
    queue_snapshot.extend(downloading_tasks)
    
    # 然後加入等待中的任務（status 為 QUEUED 的任務）
    queued_tasks = [
        {
            "task_id": task_id,
            "status": task.status.value,
            "progress": task.progress,
            "message": task.message,
            "position": task.position,
            "errors": task.errors if task.errors else None,
            "completed_files": task.completed_files,
            "timestamp": task.timestamp.isoformat(),
            "title": task.video_id
        }
        for task_id, task in download_tasks.items()
        if task.status == DownloadStatus.QUEUED
    ]
    # 根據 position 排序等待中的任務
    queued_tasks.sort(key=lambda x: x["position"] or float('inf'))
    queue_snapshot.extend(queued_tasks)
    
    # 最後加入已完成或失敗的任務（最近24小時內的）
    cutoff_time = datetime.now() - timedelta(hours=24)
    completed_tasks = [
        {
            "task_id": task_id,
            "status": task.status.value,
            "progress": task.progress,
            "message": task.message,
            "position": task.position,
            "errors": task.errors if task.errors else None,
            "completed_files": task.completed_files,
            "timestamp": task.timestamp.isoformat(),
            "title": task.video_id
        }
        for task_id, task in download_tasks.items()
        if task.status in [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.SKIPPED]
        and task.timestamp > cutoff_time
    ]
    # 根據時間戳記排序已完成的任務（最新的在前）
    completed_tasks.sort(key=lambda x: x["timestamp"], reverse=True)
    queue_snapshot.extend(completed_tasks)
    
    return {
        "queue": queue_snapshot,
        "stats": {
            "downloading": len(downloading_tasks),
            "queued": len(queued_tasks),
            "completed_24h": len(completed_tasks),
            "total": len(queue_snapshot)
        }
    }

if __name__ == "__main__":
    logger.info("Starting API server...")
    uvicorn.run(app, host="0.0.0.0", port=12345)

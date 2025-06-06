from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import aiohttp
import logging
import json
from datetime import datetime, timedelta
from enum import Enum
import re
import asyncio
from collections import deque
from typing import Dict, Optional
import yt_dlp
from task_manager import TaskManager, TaskStatus, DownloadStatus

# 創建路由器
router = APIRouter(prefix="/missav", tags=["missav"])

# 獲取 logger
logger = logging.getLogger(__name__)

# 設定目錄路徑
MISSAV_PATH = os.path.join(os.path.dirname(__file__), "missav")

# 設定最大同時下載數和下載佇列
MAX_CONCURRENT_DOWNLOADS = 3
download_semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)
download_queue = deque()
queue_lock = asyncio.Lock()

class MissavInfo(BaseModel):
    description: str
    image: str
    source: str
    title: str
    url: str

# 創建任務管理器實例
task_manager = TaskManager(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379))
)

def update_download_progress(video_id: str, d: dict):
    """更新下載進度的回調函數"""
    task_status = task_manager.get_task(video_id)
    if not task_status or d['status'] != 'downloading':
        return

    try:
        # 清理 ANSI 轉義序列
        cleaned_string = re.sub(r'\x1b\[[0-9;]*m', '', d.get('_percent_str', '0%'))
        current_percent = float(cleaned_string.replace('%', ''))
        
        # 計算總體進度
        total_progress = current_percent
        
        # 獲取上次記錄的進度
        last_progress = task_status.last_logged_progress
        
        # 只有當進度增加超過 0.5% 時才記錄日誌
        if total_progress - last_progress >= 0.5:
            logger.info(f"[{video_id}] 下載進度: {total_progress:.1f}%, 剩餘時間: {d.get('_eta_str', 'N/A')}, 速度: {d.get('_speed_str', 'N/A')}")
            # 更新最後記錄的進度
            task_status.last_logged_progress = total_progress
            
        # 更新任務狀態
        task_status.progress = total_progress
        task_status.message = (
            f"下載進度: {d.get('_percent_str', '0%')} "
            f"速度: {d.get('_speed_str', 'N/A')} "
            f"剩餘時間: {d.get('_eta_str', 'N/A')}"
        )
        task_manager.set_task(task_status)
    except Exception as e:
        logger.error(f"Error in update_download_progress for {video_id}: {e}")

def update_postprocess_progress(video_id: str, d: dict):
    """更新後處理進度的回調函數"""
    task_status = task_manager.get_task(video_id)
    if not task_status:
        return

    try:
        if d['status'] == 'started':
            message = f"開始處理: {d.get('postprocessor')}"
            task_status.message = message
            logger.info(f"Postprocess for {video_id}: {message}")
        elif d['status'] == 'processing':
            message = f"處理中: {d.get('postprocessor')}"
            task_status.message = message
            logger.info(f"Postprocess for {video_id}: {message}")
        elif d['status'] == 'finished':
            message = f"處理完成: {d.get('postprocessor')}"
            task_status.message = message
            logger.info(f"Postprocess for {video_id}: {message}")
        task_manager.set_task(task_status)
    except Exception as e:
        logger.error(f"Error in update_postprocess_progress for {video_id}: {e}")

async def perform_download(info: MissavInfo):
    video_id = info.title.split()[0]
    # 建立影片專屬目錄
    video_dir = os.path.join(MISSAV_PATH, video_id)
    os.makedirs(video_dir, exist_ok=True)
    
    base_filename = os.path.join(video_dir, video_id)
    video_path = f"{base_filename}.mp4"
    
    task_status = task_manager.get_task(video_id)
    if not task_status:
        return
        
    task_status.status = DownloadStatus.DOWNLOADING
    task_manager.set_task(task_status)
    
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
                    task_manager.set_task(task_status)
        
        # 保存 info json
        with open(f"{base_filename}.json", 'w', encoding='utf-8') as f:
            json.dump(info.dict(), f, ensure_ascii=False, indent=2)
        task_status.completed_files += 1
        task_status.progress = 66
        task_manager.set_task(task_status)
        
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
        task_manager.set_task(task_status)
        
    except Exception as e:
        task_status.status = DownloadStatus.FAILED
        task_status.errors.append(str(e))
        task_manager.set_task(task_status)
        logger.error(f"Error downloading {video_id}: {e}")

async def process_download_queue():
    while True:
        # 檢查當前正在下載的任務數量
        downloading_tasks = [
            task for task in task_manager.get_all_tasks().values()
            if task.status == DownloadStatus.DOWNLOADING
        ]
        
        if len(downloading_tasks) >= MAX_CONCURRENT_DOWNLOADS:
            # 如果已達到最大下載數，等待一段時間後再檢查
            await asyncio.sleep(5)
            continue

        # 從隊列中獲取下一個任務
        next_task_info = task_manager.get_from_queue()
        if not next_task_info:
            # 如果隊列為空，結束處理
            return

        info = MissavInfo(**next_task_info)
        video_id = info.title.split()[0]
        
        # 更新任務狀態為下載中
        task_status = task_manager.get_task(video_id)
        if task_status:
            task_status.status = DownloadStatus.DOWNLOADING
            task_status.position = None
            task_manager.set_task(task_status)
            
            try:
                await perform_download(info)
            except Exception as e:
                logger.error(f"Error processing queued download for {info.title}: {e}")
                task_status.status = DownloadStatus.FAILED
                task_status.errors.append(str(e))
                task_manager.set_task(task_status)

@router.post("/download")
async def download_missav(info: MissavInfo):
    logger.info(f"Received download request for {info.title}")
    video_id = info.title.split()[0]
    # 建立影片專屬目錄
    video_dir = os.path.join(MISSAV_PATH, video_id)
    os.makedirs(video_dir, exist_ok=True)
    
    base_filename = os.path.join(video_dir, video_id)
    video_path = f"{base_filename}.mp4"

    # 檢查影片是否已存在
    if os.path.exists(video_path):
        logger.info(f"Video file already exists: {video_path}")
        task = TaskStatus(video_id, DownloadStatus.SKIPPED)
        task_manager.set_task(task)
        return {
            "task_id": video_id,
            "status": "skipped",
            "message": "Video file already exists"
        }

    # 檢查是否已在任務列表中
    existing_task = task_manager.get_task(video_id)
    if existing_task:
        if existing_task.status in [DownloadStatus.DOWNLOADING, DownloadStatus.QUEUED]:
            logger.info(f"Task {video_id} is already {existing_task.status.value}")
            return {
                "task_id": video_id,
                "status": existing_task.status.value,
                "message": f"Task is already {existing_task.status.value}",
                "progress": existing_task.progress,
                "position": existing_task.position
            }

    # 檢查當前正在下載的任務數量
    downloading_tasks = [
        task for task in task_manager.get_all_tasks().values()
        if task.status == DownloadStatus.DOWNLOADING
    ]

    # 如果當前下載數量小於最大限制，直接開始下載
    if len(downloading_tasks) < MAX_CONCURRENT_DOWNLOADS:
        task = TaskStatus(video_id, DownloadStatus.DOWNLOADING)
        task_manager.set_task(task)
        asyncio.create_task(perform_download(info))
        logger.info(f"Started download for {video_id}")
        return {
            "task_id": video_id,
            "status": "started",
            "message": "Download started"
        }
    else:
        # 否則加入隊列
        queue_position = task_manager.get_queue_length() + 1
        task = TaskStatus(video_id, DownloadStatus.QUEUED, queue_position)
        task_manager.set_task(task)
        task_manager.add_to_queue(info.dict())
        # 確保隊列處理任務正在運行
        asyncio.create_task(process_download_queue())
        logger.info(f"Queued download for {video_id} at position {queue_position}")
        return {
            "task_id": video_id,
            "status": "queued",
            "position": queue_position,
            "message": f"Download queued. Position in queue: {queue_position}"
        }

@router.get("/status/{task_id}")
async def get_download_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
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

@router.get("/queue")
async def get_download_queue():
    # 建立當前佇列的快照
    queue_snapshot = []
    all_tasks = task_manager.get_all_tasks()
    
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
            "title": task.video_id
        }
        for task_id, task in all_tasks.items()
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
        for task_id, task in all_tasks.items()
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
        for task_id, task in all_tasks.items()
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






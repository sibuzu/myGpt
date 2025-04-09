from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import aiohttp
import logging
import os

# 創建路由器
router = APIRouter(prefix="/images", tags=["images"])

# 獲取 logger
logger = logging.getLogger(__name__)

# 設定目錄路徑
IMAGE_PATH = os.path.join(os.path.dirname(__file__), "images")

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

@router.post("/download")
async def download_images(request: ImageDownloadRequest):
    logger.info(f"Received download request for PageID: {request.pageId}")
    logger.info("Processing turns:")
    print(f"DEBUG: Received download request for PageID: {request.pageId}")
    
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
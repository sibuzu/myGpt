from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import aiohttp
import base64
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
    url: Optional[str] = None
    data: Optional[str] = None

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
            logger.error(f"Download returned HTTP {response.status} for {url}")
    except Exception as e:
        logger.error(f"Error downloading {url}: {e}")
    return False

def save_image_data(data_url: str, filepath: str) -> bool:
    try:
        header, encoded_data = data_url.split(',', 1)
        if not header.startswith('data:image/') or ';base64' not in header:
            raise ValueError('Expected a base64 image data URL')
        image_data = base64.b64decode(encoded_data, validate=True)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return True
    except Exception as e:
        logger.error(f"Error saving uploaded image data: {e}")
        return False

@router.post("/download")
async def download_images(request: ImageDownloadRequest):
    logger.info(f"Received download request for PageID: {request.pageId}")
    logger.info("Processing turns:")
    print(f"DEBUG: Received download request for PageID: {request.pageId}")
    
    download_count = 0
    skipped_count = 0
    failed_count = 0
    list_count = len(request.turns)
    
    async with aiohttp.ClientSession() as session:
        for turn in request.turns:
            logger.info(f"Processing Turn {turn.id}")
            
            # 構建圖片文件名
            # 檢查 turn.id 的格式並相應處理
            base_id = ''.join(filter(str.isdigit, turn.id))  # 取得數字部分
            suffix = turn.id[len(base_id):]  # 取得非數字後綴（如 'b', 'c' 等）
            
            # 根據是否有後綴決定格式
            if suffix:
                image_filename = f"{request.pageId}-{int(base_id):03d}{suffix}.png"  # 例如: xxx-002b.png
            else:
                image_filename = f"{request.pageId}-{int(base_id):03d}.png"  # 例如: xxx-002.png
            image_path = os.path.join(IMAGE_PATH, image_filename)
            
            # 檢查文件是否已存在
            if os.path.exists(image_path):
                logger.info(f"Image {image_filename} already exists, skipping...")
                skipped_count += 1
                continue
            
            # Prefer image data fetched by the authenticated browser. Public
            # URLs remain supported for older extension versions.
            if turn.data:
                success = save_image_data(turn.data, image_path)
            elif turn.url:
                success = await download_image(session, turn.url, image_path)
            else:
                logger.error(f"Turn {turn.id} has neither image data nor URL")
                success = False

            if success:
                download_count += 1
                logger.info(f"Successfully downloaded {image_filename}")
            else:
                failed_count += 1
                logger.error(f"Failed to download {image_filename}")
    
    result = (
        f"finish download {download_count}/{list_count} images "
        f"(skipped: {skipped_count}, failed: {failed_count})"
    )
    logger.info(result)
    return result

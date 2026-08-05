from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import aiohttp
import base64
import logging
import os
from datetime import datetime

# 創建路由器
router = APIRouter(prefix="/images", tags=["images"])

# 獲取 logger
logger = logging.getLogger(__name__)

# 設定目錄路徑
IMAGE_PATH = os.path.join(os.path.dirname(__file__), "images")

def get_page_directory(page_id: str, download_date: Optional[str] = None) -> str:
    os.makedirs(IMAGE_PATH, exist_ok=True)

    for date_name in sorted(os.listdir(IMAGE_PATH)):
        date_path = os.path.join(IMAGE_PATH, date_name)
        if not os.path.isdir(date_path):
            continue

        page_path = os.path.join(date_path, page_id)
        if os.path.isdir(page_path):
            return page_path

    date_name = download_date or datetime.now().strftime("%Y%m%d")
    page_path = os.path.join(IMAGE_PATH, date_name, page_id)
    os.makedirs(page_path, exist_ok=True)
    return page_path

def build_turn_filename(page_id: str, turn_id: str, extension: str = ".png") -> str:
    base_id = ''.join(filter(str.isdigit, turn_id))
    suffix = turn_id[len(base_id):]
    turn_number = int(base_id) if base_id else 0
    page_suffix = page_id[-4:]
    return f"{page_suffix}-{turn_number:03d}{suffix}{extension}"

class Turn(BaseModel):
    id: str
    url: Optional[str] = None
    data: Optional[str] = None
    prompt: Optional[str] = None

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

def save_prompt(prompt: Optional[str], filepath: str) -> bool:
    if not prompt or not prompt.strip():
        logger.warning(f"No prompt available for {os.path.basename(filepath)}")
        return False
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(prompt.strip() + '\n')
        return True
    except Exception as e:
        logger.error(f"Error saving prompt {filepath}: {e}")
        return False

@router.post("/download")
async def download_images(request: ImageDownloadRequest):
    logger.info(f"Received download request for PageID: {request.pageId}")
    logger.info("Processing turns:")
    print(f"DEBUG: Received download request for PageID: {request.pageId}")
    
    download_count = 0
    skipped_count = 0
    failed_count = 0
    prompt_count = 0
    list_count = len(request.turns)
    
    async with aiohttp.ClientSession() as session:
        for turn in request.turns:
            logger.info(f"Processing Turn {turn.id}")
            
            page_dir = get_page_directory(request.pageId)
            image_filename = build_turn_filename(request.pageId, turn.id)
            image_path = os.path.join(page_dir, image_filename)
            prompt_path = os.path.splitext(image_path)[0] + '.txt'
            
            # 檢查文件是否已存在
            if os.path.exists(image_path):
                logger.info(f"Image {image_filename} already exists, skipping...")
                if not os.path.exists(prompt_path) and save_prompt(turn.prompt, prompt_path):
                    prompt_count += 1
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
                if save_prompt(turn.prompt, prompt_path):
                    prompt_count += 1
            else:
                failed_count += 1
                logger.error(f"Failed to download {image_filename}")
    
    result = (
        f"finish download {download_count}/{list_count} images "
        f"(skipped: {skipped_count}, failed: {failed_count}, prompts: {prompt_count})"
    )
    logger.info(result)
    return result

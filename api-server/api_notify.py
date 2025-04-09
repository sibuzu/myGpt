from fastapi import APIRouter
from pydantic import BaseModel
import aiohttp
import logging
import os

# 創建路由器
router = APIRouter(prefix="/notify", tags=["notify"])

# 獲取 logger
logger = logging.getLogger(__name__)

# Telegram 相關配置
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

class TelegramNotification(BaseModel):
    message: str

@router.post("/telegram")
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
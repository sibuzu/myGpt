from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from dotenv import load_dotenv
import multiprocessing

def setup_logging():
    # 設定目錄路徑
    LOG_PATH = os.path.join(os.path.dirname(__file__), "log")
    os.makedirs(LOG_PATH, exist_ok=True)
    
    # 配置日誌
    log_file = os.path.join(LOG_PATH, f"api_{datetime.now().strftime('%Y%m%d')}.log")
    
    # 創建 root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # 清除現有的 handlers
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)
    
    # 添加文件 handler
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(processName)s - %(levelname)s - %(message)s')
    )
    root_logger.addHandler(file_handler)
    
    # 添加控制台 handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(processName)s - %(levelname)s - %(message)s')
    )
    root_logger.addHandler(console_handler)
    
    # 只在主進程中輸出初始化消息
    if multiprocessing.current_process().name == 'MainProcess':
        logging.info("Logging system initialized in main process")

# 在應用啟動前設置日誌
setup_logging()

# Import routers
from api_missav import router as missav_router
from api_images import router as images_router
from api_notify import router as notify_router

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

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(missav_router)
app.include_router(images_router)
app.include_router(notify_router)

@app.get("/")
async def root():
    """
    Root endpoint to verify API is running
    """
    logger.info("Root endpoint called")
    return "my-gpt-api is running"

if __name__ == "__main__":
    logger = logging.getLogger(__name__)
    logger.info("Starting API server...")
    workers = multiprocessing.cpu_count() * 2 + 1
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=12345,
        workers=workers,
        loop="uvloop",
        limit_concurrency=1000,
        timeout_keep_alive=30,
    )

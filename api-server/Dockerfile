# 使用 Python 3.10.8 作為基礎映像
FROM python:3.10.8-slim

# 設置工作目錄
WORKDIR /app

# install ffmpeg and redis and required packages
RUN apt-get update && \
    apt-get install -y ffmpeg procps redis-server && \
    rm -rf /var/lib/apt/lists/*

# 複製 requirements.txt
COPY requirements.txt .

# 安裝依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式代碼
COPY main.py .
COPY api_missav.py .
COPY api_images.py .
COPY api_notify.py .
COPY task_manager.py .

# 創建必要的目錄
RUN mkdir -p images log missav

# 設置環境變數
ENV PYTHONUNBUFFERED=1
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

# 設置時區為 Asia/Taipei (UTC+8)
ENV TZ=Asia/Taipei
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 暴露端口
EXPOSE 12345

# 啟動 Redis 和應用
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]

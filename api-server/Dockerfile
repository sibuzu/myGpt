# 使用 Python 3.10.8 作為基礎映像
FROM python:3.10.8-slim

# 設置工作目錄
WORKDIR /app

# 複製 requirements.txt
COPY requirements.txt .

# 安裝依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式代碼
COPY main.py .

# 創建必要的目錄
RUN mkdir -p images log

# 設置環境變數
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 12345

# 啟動應用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "12345"]
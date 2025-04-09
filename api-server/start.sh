#!/bin/bash
# 啟動 Redis 服務器
redis-server --daemonize yes

# 等待 Redis 啟動
sleep 1

# 啟動應用
python main.py
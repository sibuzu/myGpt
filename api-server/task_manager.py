import redis
from redis import Redis
from datetime import datetime
from enum import Enum
import json
from typing import Optional, Dict, List

class DownloadStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class TaskStatus:
    def __init__(self, video_id: str, status: DownloadStatus, position: Optional[int] = None):
        self.video_id = video_id
        self.status = status
        self.position = position
        self.progress = 0
        self.message = ""
        self.errors: List[str] = []
        self.completed_files = 0
        self.timestamp = datetime.now()
        self.last_logged_progress = -1

    def to_dict(self) -> dict:
        return {
            'video_id': self.video_id,
            'status': self.status.value,
            'position': self.position,
            'progress': self.progress,
            'message': self.message,
            'errors': self.errors,
            'completed_files': self.completed_files,
            'timestamp': self.timestamp.isoformat(),
            'last_logged_progress': self.last_logged_progress
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'TaskStatus':
        task = cls(
            video_id=data['video_id'],
            status=DownloadStatus(data['status']),
            position=data.get('position')
        )
        task.progress = data.get('progress', 0)
        task.message = data.get('message', '')
        task.errors = data.get('errors', [])
        task.completed_files = data.get('completed_files', 0)
        task.timestamp = datetime.fromisoformat(data['timestamp'])
        task.last_logged_progress = data.get('last_logged_progress', -1)
        return task

class TaskManager:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis: Redis = redis.Redis(host=host, port=port, db=db)
        self.task_prefix = "task:"
        self.queue_key = "download_queue"

    def get_task(self, video_id: str) -> Optional[TaskStatus]:
        data = self.redis.get(f"{self.task_prefix}{video_id}")
        if data:
            return TaskStatus.from_dict(json.loads(data))
        return None

    def set_task(self, task: TaskStatus):
        self.redis.set(
            f"{self.task_prefix}{task.video_id}",
            json.dumps(task.to_dict())
        )

    def update_task(self, video_id: str, **kwargs):
        task = self.get_task(video_id)
        if task:
            for key, value in kwargs.items():
                setattr(task, key, value)
            self.set_task(task)

    def get_all_tasks(self) -> Dict[str, TaskStatus]:
        tasks = {}
        for key in self.redis.keys(f"{self.task_prefix}*"):
            video_id = key.decode('utf-8').replace(self.task_prefix, '')
            task = self.get_task(video_id)
            if task:
                tasks[video_id] = task
        return tasks

    def add_to_queue(self, info_dict: dict):
        self.redis.rpush(self.queue_key, json.dumps(info_dict))

    def get_from_queue(self) -> Optional[dict]:
        data = self.redis.lpop(self.queue_key)
        if data:
            return json.loads(data)
        return None

    def get_queue_length(self) -> int:
        return self.redis.llen(self.queue_key)

    def clear_old_tasks(self, hours: int = 24):
        """清理超過指定小時數的已完成或失敗任務"""
        cutoff = datetime.now().timestamp() - (hours * 3600)
        for key in self.redis.keys(f"{self.task_prefix}*"):
            data = self.redis.get(key)
            if data:
                task = TaskStatus.from_dict(json.loads(data))
                if (task.status in [DownloadStatus.COMPLETED, DownloadStatus.FAILED] and
                    task.timestamp.timestamp() < cutoff):
                    self.redis.delete(key)
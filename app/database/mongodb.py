from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None
    novels = None
    users = None

    async def connect_to_database(self):
        """连接到MongoDB数据库"""
        logger.info("连接到MongoDB...")
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        self.novels = self.db[settings.NOVELS_COLLECTION]
        self.users = self.db[settings.USERS_COLLECTION]
        logger.info("连接到MongoDB成功")

    async def close_database_connection(self):
        """关闭MongoDB连接"""
        logger.info("关闭MongoDB连接...")
        if self.client:
            self.client.close()
        logger.info("MongoDB连接已关闭")

    def get_novel_collection(self):
        """获取小说集合"""
        return self.novels
    
    def get_user_collection(self):
        """获取用户集合"""
        return self.users


mongodb = MongoDB() 
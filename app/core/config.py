import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from datetime import timedelta
import secrets

# 加载环境变量
load_dotenv()

class Settings(BaseSettings):
    """应用配置类"""
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # MongoDB配置
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:4000")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "zhangzhixing")
    NOVELS_COLLECTION: str = os.getenv("NOVELS_COLLECTION", "novels")
    USERS_COLLECTION: str = os.getenv("USERS_COLLECTION", "users")

    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7天

    # 分页默认值
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100

    class Config:
        case_sensitive = True


settings = Settings() 
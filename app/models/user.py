from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any, Callable
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls) -> List[Callable]:
        yield cls.validate

    @classmethod
    def validate(cls, v: Any) -> str:
        if not ObjectId.is_valid(v):
            raise ValueError("无效的ObjectId")
        return str(v)
    
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        """
        为Pydantic V2提供核心模式
        """
        from pydantic_core import PydanticCustomError, core_schema
        
        def validate_object_id(value):
            if not ObjectId.is_valid(value):
                raise PydanticCustomError("invalid_objectid", "无效的ObjectId")
            return str(value)
        
        return core_schema.string_schema(
            constraint_works_on_python_types=True,
            to_python=validate_object_id
        )

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名，唯一")
    email: EmailStr = Field(..., description="用户邮箱，唯一")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="用户密码，至少6个字符")
    nickname: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    """
    数据库中存储的用户模型
    _id: MongoDB自动生成的唯一标识符
    user_id: 使用与_id相同的值
    """
    id: Optional[str] = None  # 对应MongoDB的_id
    user_id: Optional[str] = None  # 使用与_id相同的值
    nickname: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = ""
    password: str  # 存储加密后的密码
    createTime: datetime = Field(default_factory=datetime.utcnow)
    lastLoginTime: Optional[datetime] = None
    favoriteNovels: List[str] = Field(default_factory=list)
    readingHistory: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=lambda: ["user"])
    isActive: bool = True
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class User(BaseModel):
    """
    返回给客户端的用户模型
    """
    id: str  # 使用MongoDB自动生成的_id作为用户ID
    username: str
    email: EmailStr
    user_id: str  # 与id相同
    nickname: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = ""
    createTime: datetime
    lastLoginTime: Optional[datetime] = None
    favoriteNovels: List[str] = Field(default_factory=list)
    readingHistory: List[str] = Field(default_factory=list)
    roles: List[str]
    isActive: bool = True
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class TokenData(BaseModel):
    username: Optional[str] = None
    
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User 
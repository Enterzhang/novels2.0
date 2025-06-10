from fastapi import APIRouter, HTTPException, status, Depends, Body, Path
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from ..models.user import UserCreate, User, Token, UserInDB
from ..core.auth import get_password_hash, verify_password, create_access_token, get_current_user
from ..core.config import settings
from ..database.mongodb import mongodb
from typing import List, Dict, Any
from bson import ObjectId
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    注册新用户
    """
    # 检查用户名是否已存在
    user_collection = mongodb.get_user_collection()
    existing_user = await user_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    existing_email = await user_collection.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(user.password)
    
    # 使用model_validate创建用户模型
    user_data = user.model_dump()
    user_data.pop("password")  # 移除明文密码
    user_data["password"] = hashed_password  # 添加加密后的密码
    
    user_in_db = UserInDB.model_validate(user_data)
    
    # 保存到数据库（不包含id字段，让MongoDB自动生成）
    user_dict = user_in_db.model_dump(exclude={"id"})
    new_user = await user_collection.insert_one(user_dict)
    
    # 获取创建的用户
    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    
    # 更新user_id字段为MongoDB生成的_id
    await user_collection.update_one(
        {"_id": new_user.inserted_id},
        {"$set": {"user_id": str(new_user.inserted_id)}}
    )
    
    # 返回用户信息（不含密码）
    created_user["id"] = str(created_user["_id"])
    created_user["user_id"] = str(created_user["_id"])
    return User.model_validate(created_user)

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    用户登录获取令牌
    """
    # 验证用户
    user_collection = mongodb.get_user_collection()
    user = await user_collection.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 更新最后登录时间
    await user_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLoginTime": datetime.utcnow()}}
    )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=access_token_expires
    )
    
    # 添加id字段
    user["id"] = str(user["_id"])
    
    # 确保favoriteNovels字段是字符串列表
    if "favoriteNovels" in user:
        if not isinstance(user["favoriteNovels"], list):
            user["favoriteNovels"] = []
        else:
            # 确保所有元素都是字符串
            user["favoriteNovels"] = [str(item) if item is not None else "" for item in user["favoriteNovels"]]
    
    # 返回令牌和用户信息
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User.model_validate(user)
    )

@router.post("/favorite/{novel_id}")
async def toggle_favorite_novel(
    novel_id: str = Path(..., description="小说ID"),
    novel_info: Dict[str, Any] = Body(..., description="小说信息"),
    current_user: User = Depends(get_current_user)
):
    """
    收藏或取消收藏小说
    """
    user_collection = mongodb.get_user_collection()
    user_id = current_user.id
    
    # 检查小说是否已被收藏
    user_data = await user_collection.find_one({"_id": ObjectId(user_id)})
    
    # 检查favoriteNovels字段是否存在，如果不存在则初始化为空列表
    favorite_novels = user_data.get("favoriteNovels", [])
    
    # 确保favorite_novels是字符串列表
    if not isinstance(favorite_novels, list):
        favorite_novels = []
    
    # 确保所有元素都是字符串
    favorite_novels = [str(item) for item in favorite_novels if item is not None]
    
    is_favorite = novel_id in favorite_novels
    
    if is_favorite:
        # 如果已收藏，则取消收藏
        await user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"favoriteNovels": novel_id}}
        )
        return {"isFavorite": False}
    else:
        # 如果未收藏，则添加收藏
        # 确保novel_id是字符串
        await user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"favoriteNovels": str(novel_id)}}
        )
        return {"isFavorite": True}

@router.get("/favorite/status/{novel_id}")
async def check_favorite_status(
    novel_id: str = Path(..., description="小说ID"),
    current_user: User = Depends(get_current_user)
):
    """
    检查小说是否已被收藏
    """
    user_collection = mongodb.get_user_collection()
    user_id = current_user.id
    
    # 查询用户数据
    user_data = await user_collection.find_one({"_id": ObjectId(user_id)})
    
    # 检查favoriteNovels字段是否存在，如果不存在则初始化为空列表
    favorite_novels = user_data.get("favoriteNovels", [])
    
    # 检查小说ID是否在收藏列表中
    is_favorite = novel_id in favorite_novels
    
    return {"isFavorite": is_favorite} 
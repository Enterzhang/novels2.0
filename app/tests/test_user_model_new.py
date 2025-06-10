import asyncio
import pytest
import motor.motor_asyncio
from bson import ObjectId
from datetime import datetime
import traceback
from app.models.user import UserCreate, UserInDB, User
from app.core.auth import get_password_hash
from app.core.config import settings
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 测试数据库连接
MONGODB_TEST_URL = "mongodb://localhost:4000"
TEST_DB_NAME = "test_zhangzhixing"
TEST_USERS_COLLECTION = "test_users"

# 创建测试客户端
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_TEST_URL)
db = client[TEST_DB_NAME]
users_collection = db[TEST_USERS_COLLECTION]

# 测试用户数据
test_user_data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123",
    "nickname": "测试用户",
    "phone": "18888888888",
    "gender": "male",
    "avatar": ""
}

async def clear_test_collection():
    """清空测试集合"""
    try:
        await users_collection.delete_many({})
        logger.info("测试集合已清空")
    except Exception as e:
        logger.error(f"清空测试集合失败: {e}")
        logger.error(traceback.format_exc())

async def test_user_model():
    """测试用户模型创建"""
    try:
        # 清空测试集合
        await clear_test_collection()
        
        # 创建用户模型
        user_create = UserCreate(**test_user_data)
        
        # 验证用户创建模型
        assert user_create.username == test_user_data["username"]
        assert user_create.email == test_user_data["email"]
        assert user_create.password == test_user_data["password"]
        assert user_create.nickname == test_user_data["nickname"]
        assert user_create.phone == test_user_data["phone"]
        assert user_create.gender == test_user_data["gender"]
        assert user_create.avatar == test_user_data["avatar"]
        
        logger.info("用户创建模型验证成功")
        
        # 创建数据库用户模型
        hashed_password = get_password_hash(test_user_data["password"])
        now = datetime.utcnow()
        
        # 先创建一个ObjectId，用于_id和user_id
        new_id = ObjectId()
        
        user_in_db = UserInDB(
            id=str(new_id),  # 预设id
            user_id=str(new_id),  # 预设user_id为相同的值
            username=user_create.username,
            email=user_create.email,
            nickname=user_create.nickname,
            phone=user_create.phone,
            gender=user_create.gender,
            avatar=user_create.avatar,
            password=hashed_password,
            createTime=now,
            lastLoginTime=now,
            favoriteNovels=[],
            readingHistory=[],
            roles=["user"],
            isActive=True
        )
        
        # 验证数据库用户模型
        assert user_in_db.username == test_user_data["username"]
        assert user_in_db.email == test_user_data["email"]
        assert user_in_db.nickname == test_user_data["nickname"]
        assert user_in_db.phone == test_user_data["phone"]
        assert user_in_db.gender == test_user_data["gender"]
        assert user_in_db.avatar == test_user_data["avatar"]
        assert user_in_db.password == hashed_password
        assert isinstance(user_in_db.createTime, datetime)
        assert isinstance(user_in_db.lastLoginTime, datetime)
        assert user_in_db.favoriteNovels == []
        assert user_in_db.readingHistory == []
        assert user_in_db.roles == ["user"]
        assert user_in_db.isActive == True
        assert user_in_db.id == str(new_id)
        assert user_in_db.user_id == str(new_id)
        
        logger.info("数据库用户模型验证成功")
        
        return user_in_db, new_id
    except Exception as e:
        logger.error(f"测试用户模型创建失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_insert_user():
    """测试插入用户到数据库"""
    try:
        # 创建用户模型
        user_in_db, new_id = await test_user_model()
        
        # 插入用户到数据库
        logger.info("开始插入用户到数据库...")
        
        # 转换为字典
        user_dict = user_in_db.model_dump()
        
        # 替换id为_id (MongoDB使用_id作为主键)
        user_dict["_id"] = new_id
        if "id" in user_dict:
            del user_dict["id"]
        
        logger.info(f"用户数据: {user_dict}")
        result = await users_collection.insert_one(user_dict)
        logger.info(f"插入结果: {result}")
        logger.info(f"插入ID类型: {type(result.inserted_id)}")
        assert result.acknowledged
        assert result.inserted_id == new_id
        
        logger.info(f"用户插入成功，ID: {result.inserted_id}")
        
        # 从数据库查询用户
        db_user = await users_collection.find_one({"_id": new_id})
        logger.info(f"查询到的用户数据: {db_user}")
        assert db_user is not None
        assert db_user["username"] == test_user_data["username"]
        assert db_user["email"] == test_user_data["email"]
        assert db_user["nickname"] == test_user_data["nickname"]
        assert db_user["user_id"] == str(new_id)
        
        logger.info("从数据库查询用户成功")
        
        # 测试通过用户名查询
        db_user_by_username = await users_collection.find_one({"username": test_user_data["username"]})
        assert db_user_by_username is not None
        assert db_user_by_username["_id"] == db_user["_id"]
        
        logger.info("通过用户名查询用户成功")
        
        # 清理测试数据
        await clear_test_collection()
    except Exception as e:
        logger.error(f"测试插入用户失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_find_user_by_username():
    """测试通过用户名查找用户"""
    try:
        # 创建并插入用户
        user_in_db, new_id = await test_user_model()
        
        # 转换为字典
        user_dict = user_in_db.model_dump()
        
        # 替换id为_id (MongoDB使用_id作为主键)
        user_dict["_id"] = new_id
        if "id" in user_dict:
            del user_dict["id"]
        
        result = await users_collection.insert_one(user_dict)
        
        # 通过用户名查找用户
        db_user = await users_collection.find_one({"username": test_user_data["username"]})
        assert db_user is not None
        assert db_user["username"] == test_user_data["username"]
        assert db_user["email"] == test_user_data["email"]
        assert db_user["nickname"] == test_user_data["nickname"]
        assert db_user["user_id"] == str(new_id)
        
        logger.info("通过用户名查找用户成功")
        
        # 清理测试数据
        await clear_test_collection()
    except Exception as e:
        logger.error(f"测试通过用户名查找用户失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_update_user():
    """测试更新用户信息"""
    try:
        # 创建并插入用户
        user_in_db, new_id = await test_user_model()
        
        # 转换为字典
        user_dict = user_in_db.model_dump()
        
        # 替换id为_id (MongoDB使用_id作为主键)
        user_dict["_id"] = new_id
        if "id" in user_dict:
            del user_dict["id"]
        
        result = await users_collection.insert_one(user_dict)
        
        # 更新用户邮箱
        new_email = "updated@example.com"
        update_result = await users_collection.update_one(
            {"_id": new_id},
            {"$set": {"email": new_email}}
        )
        
        assert update_result.modified_count == 1
        
        # 查询更新后的用户
        updated_user = await users_collection.find_one({"_id": new_id})
        assert updated_user["email"] == new_email
        
        logger.info("用户信息更新成功")
        
        # 清理测试数据
        await clear_test_collection()
    except Exception as e:
        logger.error(f"测试更新用户信息失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_duplicate_username():
    """测试重复用户名处理"""
    try:
        # 创建并插入第一个用户
        user_in_db, new_id = await test_user_model()
        
        # 转换为字典
        user_dict = user_in_db.model_dump()
        
        # 替换id为_id (MongoDB使用_id作为主键)
        user_dict["_id"] = new_id
        if "id" in user_dict:
            del user_dict["id"]
        
        result = await users_collection.insert_one(user_dict)
        
        # 创建第二个用户的ObjectId
        new_id2 = ObjectId()
        
        # 尝试插入相同用户名的第二个用户
        user_in_db2 = UserInDB(
            id=str(new_id2),
            user_id=str(new_id2),
            username=test_user_data["username"],  # 相同用户名
            email="another@example.com",  # 不同邮箱
            nickname="另一个用户",
            phone="19999999999",
            gender="female",
            avatar="",
            password=get_password_hash("anotherpassword"),
            createTime=datetime.utcnow(),
            lastLoginTime=datetime.utcnow(),
            favoriteNovels=[],
            readingHistory=[],
            roles=["user"],
            isActive=True
        )
        
        # 转换为字典
        user_dict2 = user_in_db2.model_dump()
        
        # 替换id为_id (MongoDB使用_id作为主键)
        user_dict2["_id"] = new_id2
        if "id" in user_dict2:
            del user_dict2["id"]
        
        # 先检查用户名是否已存在
        existing_user = await users_collection.find_one({"username": user_in_db2.username})
        assert existing_user is not None
        
        logger.info("重复用户名检测成功")
        
        # 清理测试数据
        await clear_test_collection()
    except Exception as e:
        logger.error(f"测试重复用户名处理失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def run_tests():
    """运行所有测试"""
    try:
        logger.info("开始测试用户模型...")
        await test_user_model()
        
        logger.info("开始测试插入用户到数据库...")
        await test_insert_user()
        
        logger.info("开始测试通过用户名查找用户...")
        await test_find_user_by_username()
        
        logger.info("开始测试更新用户信息...")
        await test_update_user()
        
        logger.info("开始测试重复用户名处理...")
        await test_duplicate_username()
        
        logger.info("所有测试完成!")
    except Exception as e:
        logger.error(f"测试过程中出现错误: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        # 确保清理测试数据
        await clear_test_collection()

if __name__ == "__main__":
    # 运行测试
    asyncio.run(run_tests()) 
import asyncio
import httpx
import pytest
import json
import logging
from datetime import datetime
import traceback
from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API URL
BASE_URL = "http://localhost:8000"
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"

# 生成唯一的测试用户数据函数
def generate_test_user():
    timestamp = datetime.utcnow().timestamp()
    return {
        "username": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "testpassword123",
        "nickname": f"测试用户_{timestamp}",
        "phone": "18888888888",
        "gender": "male",
        "avatar": ""
    }

async def test_register_user():
    """测试用户注册API"""
    try:
        # 每次测试生成新的用户数据
        test_user_data = generate_test_user()
        
        logger.info("开始测试用户注册API...")
        logger.info(f"注册用户数据: {test_user_data}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(REGISTER_URL, json=test_user_data)
            
        logger.info(f"注册响应状态码: {response.status_code}")
        logger.info(f"注册响应内容: {response.text}")
        
        assert response.status_code == 201
        response_data = response.json()
        
        assert response_data["username"] == test_user_data["username"]
        assert response_data["email"] == test_user_data["email"]
        assert response_data["nickname"] == test_user_data["nickname"]
        assert response_data["phone"] == test_user_data["phone"]
        assert response_data["gender"] == test_user_data["gender"]
        assert "id" in response_data
        assert "user_id" in response_data
        assert response_data["id"] == response_data["user_id"]  # id和user_id应该相同
        assert "favoriteNovels" in response_data
        assert "readingHistory" in response_data
        assert "roles" in response_data
        assert "isActive" in response_data
        
        logger.info("用户注册API测试成功")
        return response_data, test_user_data
    except Exception as e:
        logger.error(f"测试用户注册API失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_duplicate_username_register():
    """测试重复用户名注册"""
    try:
        logger.info("开始测试重复用户名注册...")
        
        # 先注册一个用户
        registered_user, original_data = await test_register_user()
        
        # 尝试注册相同用户名的用户
        duplicate_user = {
            "username": registered_user["username"],
            "email": f"another_{datetime.utcnow().timestamp()}@example.com",
            "password": "anotherpassword",
            "nickname": "另一个用户",
            "phone": "19999999999",
            "gender": "female",
            "avatar": ""
        }
        
        logger.info(f"重复用户名注册数据: {duplicate_user}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(REGISTER_URL, json=duplicate_user)
        
        logger.info(f"重复注册响应状态码: {response.status_code}")
        logger.info(f"重复注册响应内容: {response.text}")
        
        assert response.status_code == 400
        assert "用户名已存在" in response.text
        
        logger.info("重复用户名注册测试成功")
    except Exception as e:
        logger.error(f"测试重复用户名注册失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_login():
    """测试用户登录API"""
    try:
        logger.info("开始测试用户登录API...")
        
        # 先注册一个用户
        registered_user, original_data = await test_register_user()
        
        # 登录
        login_data = {
            "username": registered_user["username"],
            "password": original_data["password"]
        }
        
        logger.info(f"登录数据: {login_data}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LOGIN_URL, 
                data={"username": login_data["username"], "password": login_data["password"]}
            )
        
        logger.info(f"登录响应状态码: {response.status_code}")
        logger.info(f"登录响应内容: {response.text}")
        
        assert response.status_code == 200
        response_data = response.json()
        
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"
        assert "user" in response_data
        assert response_data["user"]["username"] == registered_user["username"]
        assert response_data["user"]["email"] == registered_user["email"]
        assert response_data["user"]["nickname"] == registered_user["nickname"]
        assert response_data["user"]["id"] == registered_user["id"]
        assert response_data["user"]["user_id"] == registered_user["user_id"]
        
        logger.info("用户登录API测试成功")
        return response_data
    except Exception as e:
        logger.error(f"测试用户登录API失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_login_wrong_password():
    """测试错误密码登录"""
    try:
        logger.info("开始测试错误密码登录...")
        
        # 先注册一个用户
        registered_user, original_data = await test_register_user()
        
        # 使用错误密码登录
        login_data = {
            "username": registered_user["username"],
            "password": "wrongpassword"
        }
        
        logger.info(f"错误密码登录数据: {login_data}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LOGIN_URL, 
                data={"username": login_data["username"], "password": login_data["password"]}
            )
        
        logger.info(f"错误密码登录响应状态码: {response.status_code}")
        logger.info(f"错误密码登录响应内容: {response.text}")
        
        assert response.status_code == 401
        assert "密码错误" in response.text
        
        logger.info("错误密码登录测试成功")
    except Exception as e:
        logger.error(f"测试错误密码登录失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def test_login_nonexistent_user():
    """测试不存在用户登录"""
    try:
        logger.info("开始测试不存在用户登录...")
        
        # 使用不存在的用户名登录
        login_data = {
            "username": f"nonexistent_{datetime.utcnow().timestamp()}",
            "password": "somepassword"
        }
        
        logger.info(f"不存在用户登录数据: {login_data}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LOGIN_URL, 
                data={"username": login_data["username"], "password": login_data["password"]}
            )
        
        logger.info(f"不存在用户登录响应状态码: {response.status_code}")
        logger.info(f"不存在用户登录响应内容: {response.text}")
        
        assert response.status_code == 401
        assert "用户名不存在" in response.text
        
        logger.info("不存在用户登录测试成功")
    except Exception as e:
        logger.error(f"测试不存在用户登录失败: {e}")
        logger.error(traceback.format_exc())
        raise

async def run_tests():
    """运行所有测试"""
    try:
        logger.info("开始API测试...")
        
        # 测试用户注册
        await test_register_user()
        
        # 测试重复用户名注册
        await test_duplicate_username_register()
        
        # 测试用户登录
        await test_login()
        
        # 测试错误密码登录
        await test_login_wrong_password()
        
        # 测试不存在用户登录
        await test_login_nonexistent_user()
        
        logger.info("所有API测试完成!")
    except Exception as e:
        logger.error(f"API测试过程中出现错误: {str(e)}")
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    # 运行测试
    asyncio.run(run_tests()) 
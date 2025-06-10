import asyncio
import logging
import traceback
from app.tests.test_user_model_new import run_tests as run_model_tests
from app.tests.test_user_api_new import run_tests as run_api_tests

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def run_all_tests():
    """运行所有测试"""
    try:
        logger.info("===== 开始运行所有测试 =====")
        
        # 运行用户模型测试
        logger.info("===== 运行用户模型测试 =====")
        await run_model_tests()
        
        # 运行API测试
        logger.info("===== 运行用户API测试 =====")
        await run_api_tests()
        
        logger.info("===== 所有测试完成 =====")
    except Exception as e:
        logger.error(f"测试过程中出现错误: {str(e)}")
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    # 运行所有测试
    asyncio.run(run_all_tests()) 
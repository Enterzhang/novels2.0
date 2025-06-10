from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from .core.config import settings
from .database.mongodb import mongodb
from .api import novels
from .api.users import router as users_router  # 直接导入用户路由

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="小说应用API",
    description="小说应用的后端API",
    version="1.0.0",
    debug=settings.DEBUG
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求处理时间中间件
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # 添加日志记录请求路径
    logger.info(f"收到请求: {request.method} {request.url.path}")
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # 添加日志记录响应状态码
    logger.info(f"响应状态码: {response.status_code}")
    
    return response

# 启动事件
@app.on_event("startup")
async def startup_db_client():
    await mongodb.connect_to_database()
    # 打印所有路由信息
    logger.info("应用启动，注册的路由:")
    for route in app.routes:
        logger.info(f"路由: {route.path} - 方法: {route.methods}")

# 关闭事件
@app.on_event("shutdown")
async def shutdown_db_client():
    await mongodb.close_database_connection()

# 注册路由
app.include_router(novels.router, prefix=settings.API_PREFIX)
# 明确注册用户路由
app.include_router(users_router, prefix=f"{settings.API_PREFIX}/users", tags=["users"])

# 根路由
@app.get("/")
async def root():
    return {"message": "欢迎使用小说应用API"}

# 健康检查
@app.get("/health")
async def health():
    return {"status": "ok"} 
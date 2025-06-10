# 小说应用平台

## 项目简介

本项目是一个基于MongoDB的小说应用平台，旨在提供小说创作、阅读、评论等一站式服务。平台采用现代化的前后端分离架构，后端基于高性能的FastAPI框架构建RESTful API，前端则使用React开发用户友好的交互界面。数据存储方面，项目利用MongoDB分片集群实现高并发读写和大数据量存储，确保系统的可伸缩性和稳定性。

## 功能特性

*   **用户管理**：注册、登录、个人信息修改、收藏管理、阅读历史。
*   **小说创作与管理**：发布、更新、删除小说及章节。
*   **小说阅读**：在线阅读小说内容，章节导航。
*   **互动功能**：小说点赞、评论。
*   **搜索与分类**：支持小说搜索，按标签/分类浏览。
*   **推荐系统**：智能推荐用户可能感兴趣的小说。

## 技术栈

### 后端技术栈 (Python)

*   **主框架**: `FastAPI==0.104.1` (高性能、易于使用的Web框架)
*   **Web 服务器**: `uvicorn==0.24.0` (ASGI服务器)
*   **数据库**: `MongoDB` (分片集群，非关系型数据库)
*   **异步MongoDB驱动**: `motor==3.3.1`
*   **数据验证**: `pydantic>=2.7.0`
*   **配置管理**: `pydantic-settings==2.9.1`, `python-dotenv==1.0.0`
*   **认证**: `JWT` (JSON Web Token)
*   **测试**: `pytest==7.4.3`, `httpx==0.25.1`, `pytest-asyncio==0.21.1`
*   **HTTP 客户端**: `requests==2.31.0` (可能用于爬虫等)
*   **HTML 解析**: `beautifulsoup4==4.12.3` (可能用于爬虫等)

### 前端技术栈 (React)

*   **主框架**: `React` (版本 `^18.2.0`)
*   **构建工具**: `Vite` (版本 `^5.0.0`)
*   **路由**: `react-router-dom` (版本 `^7.6.1`)
*   **状态管理**: `React Context API`
*   **UI 组件库**: `Ant Design` (版本 `^5.25.4`)
*   **HTTP 客户端**: `axios` (版本 `^1.9.0`)
*   **图标库**: `@ant-design/icons` (版本 `^6.0.0`)

## 数据库设计

本项目采用MongoDB分片集群架构，以支持高并发读写和大数据量存储。主要集合及分片键如下：

*   **users**: 存储用户信息。分片键：`user_id`。
*   **novels**: 存储小说信息，包含章节内容。分片键：`_id`。
*   **(可扩展) comments**: 存储评论信息。
*   **(可扩展) reading_history**: 存储阅读历史。

### 数据模型示例 (Pydantic)

#### 用户模型 (`User`, `UserInDB`, `UserCreate`, `UserBase`)

```python
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    nickname: Optional[str]
    phone: Optional[str]
    gender: Optional[str]
    avatar: Optional[str]

class UserInDB(UserBase):
    id: Optional[str]
    user_id: Optional[str]
    nickname: Optional[str]
    phone: Optional[str]
    gender: Optional[str]
    avatar: Optional[str]
    password: str  # 存储加密后的密码
    createTime: datetime
    lastLoginTime: Optional[datetime]
    favoriteNovels: List[str]
    readingHistory: List[str]
    roles: List[str]
    isActive: bool

class User(BaseModel):
    id: str
    username: str
    email: EmailStr
    user_id: str
    nickname: Optional[str]
    phone: Optional[str]
    gender: Optional[str]
    avatar: Optional[str]
    createTime: datetime
    lastLoginTime: Optional[datetime]
    favoriteNovels: List[str]
    readingHistory: List[str]
    roles: List[str]
    isActive: bool
```

#### 小说模型 (`NovelModel`, `ChapterModel`, `CommentModel`, `NovelMetaModel`)

```python
class NovelModel(BaseModel):
    id: str
    user_id: str
    title: str
    author: str
    tags: List[str]
    publication_status: str
    cover: str
    description: str
    createTime: datetime
    updateTime: datetime
    chapters: List[ChapterModel]
    meta: NovelMetaModel

class ChapterModel(BaseModel):
    chapterId: str
    title: str
    content: str
    publishTime: datetime
    wordCount: int
    comments: List[CommentModel]

class CommentModel(BaseModel):
    id: str
    userId: str
    content: str
    createTime: datetime

class NovelMetaModel(BaseModel):
    totalChapters: int
    totalWords: int
    readCount: int
    likeCount: int
    commentCount: int
```

## API 设计

FastAPI 自动生成 Swagger UI 文档，可在项目运行后访问 `/docs` 查看详细API接口。

### 用户 API (`/api/users`)

*   `POST /register`: 用户注册
*   `POST /login`: 用户登录
*   `GET /me`: 获取当前用户信息 (需要认证)
*   `PUT /me`: 更新当前用户信息 (需要认证)
*   `GET /{user_id}`: 获取指定用户信息
*   `GET /me/favorites`: 获取用户收藏的小说 (需要认证)
*   `POST /me/favorites/{novel_id}`: 添加小说到收藏 (需要认证)
*   `DELETE /me/favorites/{novel_id}`: 从收藏中删除小说 (需要认证)

### 小说 API (`/api/novels`)

*   `GET /`: 获取小说列表 (支持分页、筛选、排序)
*   `POST /`: 创建新小说 (需要认证，作者角色)
*   `GET /{novel_id}`: 获取小说详情
*   `PUT /{novel_id}`: 更新小说信息 (需要认证，作者角色)
*   `DELETE /{novel_id}`: 删除小说 (需要认证，作者角色或管理员)
*   `GET /{novel_id}/chapters`: 获取小说章节列表
*   `POST /{novel_id}/chapters`: 添加新章节 (需要认证，作者角色)
*   `GET /{novel_id}/chapters/{chapter_id}`: 获取章节内容
*   `PUT /{novel_id}/chapters/{chapter_id}`: 更新章节内容 (需要认证，作者角色)
*   `DELETE /{novel_id}/chapters/{chapter_id}`: 删除章节 (需要认证，作者角色或管理员)
*   `POST /{novel_id}/like`: 点赞小说
*   `POST /{novel_id}/read`: 记录阅读
*   `GET /tags`: 获取所有标签
*   `GET /recommendations`: 获取推荐小说

## 前端页面规划

*   **首页 (`/`)**: 展示热门、最新、推荐小说。
*   **登录/注册页 (`/login`, `/register`)**: 用户认证入口。
*   **小说详情页 (`/novel/:id`)**: 展示小说信息、章节列表、评论区。
*   **阅读页 (`/novel/:id/chapter/:chapterId`)**: 沉浸式阅读体验，章节导航。
*   **搜索页 (`/search`)**: 提供小说搜索功能。
*   **分类页 (`/category`, `/category/:tag`)**: 允许用户按标签或分类浏览小说。
*   **用户资料页 (`/profile`)**: 包含个人信息、收藏列表、阅读历史和创作的小说 (作者可见)。
*   **阅读历史页 (`/reading-history`)**: 展示用户的阅读历史记录。
*   **404 页面 (`*`)**: 未找到页面提示。

## 认证与授权

*   **认证**: 使用JWT (JSON Web Token) 进行用户身份验证。
*   **授权**: 基于角色的访问控制 (RBAC)，预设角色包括：
    *   `user` (普通用户)
    *   `author` (作者)
    *   `admin` (管理员)

## 性能优化

*   **数据库层面**: MongoDB分片集群、适当的索引设计、数据模型优化。
*   **后端层面**: FastAPI的异步处理能力 (基于`asyncio`)、分页查询。
*   **前端层面**: 组件懒加载 (`React.lazy` 和 `Suspense`)、UI组件库优化。

## 项目目录结构

```
Novel2.0/
├── app/                        # 后端应用 (FastAPI)
│   ├── api/                    # API路由模块
│   │   ├── novels.py           # 小说相关API
│   │   └── users.py            # 用户相关API
│   ├── core/                   # 核心配置，如环境变量
│   │   └── config.py           # 应用配置
│   ├── database/               # 数据库连接与操作
│   │   └── mongodb.py          # MongoDB连接
│   ├── models/                 # 数据模型 (Pydantic)
│   │   ├── novel.py            # 小说模型定义
│   │   └── user.py             # 用户模型定义
│   ├── tests/                  # 后端测试文件
│   └── main.py                 # FastAPI 应用入口文件
├── src/                        # 前端应用 (React)
│   ├── components/             # 可复用UI组件
│   │   ├── common/             # 通用组件
│   │   └── layout/             # 页面布局组件 (如Header, Footer)
│   │   └── novel/              # 小说相关组件
│   ├── contexts/               # React Context API，用于全局状态管理
│   │   └── AuthContext.jsx     # 认证上下文
│   ├── pages/                  # 各个页面组件
│   │   ├── Auth/               # 认证页面 (登录、注册)
│   │   ├── Home/               # 首页
│   │   ├── NovelDetail/        # 小说详情页
│   │   ├── Reader/             # 阅读页
│   │   ├── Search/             # 搜索页
│   │   ├── Category/           # 分类页
│   │   └── Profile/            # 用户资料页
│   ├── services/               # API 服务调用，与后端交互
│   ├── styles/                 # 全局样式文件
│   ├── App.jsx                 # 应用主组件，定义路由
│   └── main.jsx                # 前端应用入口文件
├── System/                     # 系统级脚本或配置
│   ├── mongodb_cluster.ps1     # MongoDB集群配置脚本 (PowerShell)
│   └── novel_crawler.py        # 小说爬虫脚本 (Python)
├── requirements.txt            # Python后端依赖列表
├── package.json                # Node.js/前端依赖列表
├── package-lock.json           # Node.js 依赖锁定文件
├── vite.config.js              # Vite 前端构建工具配置
├── index.html                  # 前端HTML入口文件
├── run.py                      # 后端应用启动脚本
├── .idea/                      # IDE (PyCharm/WebStorm) 配置文件
├── .venv/                      # Python 虚拟环境
├── .pytest_cache/              # pytest 缓存目录
├── 非关系型数据库大作业报告.html # 项目报告或文档
├── 项目概述.md                 # 项目概述文档 (本项目 README 的原始参考)
└── check_openapi.py            # 可能用于检查OpenAPI规范的脚本
```

## 快速开始

请确保您的系统已安装 `Python 3.9+` 和 `Node.js` 以及 `npm` 或 `yarn`。

### 1. 克隆项目

```bash
git clone <您的项目GitHub仓库URL>
cd Novel2.0
```

### 2. 设置后端

1.  **创建 Python 虚拟环境并激活**：
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # macOS/Linux
    source .venv/bin/activate
    ```

2.  **安装后端依赖**：
    ```bash
    pip install -r requirements.txt
    ```

3.  **配置 MongoDB**：
    *   确保您有一个运行中的MongoDB实例或集群。如果使用分片集群，请根据 `System/mongodb_cluster.ps1` 配置。推荐使用Docker或MongoDB Atlas进行快速部署。
    *   在 `app/core/config.py` 或通过环境变量配置MongoDB连接字符串。

4.  **启动后端服务**：
    ```bash
    python run.py
    # 或者直接使用 uvicorn
    # uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    后端服务默认将在 `http://localhost:8000` 运行。
    API 文档 (Swagger UI) 将在 `http://localhost:8000/docs` 可用。

### 3. 设置前端

1.  **安装前端依赖**：
    ```bash
    npm install
    # 或者 yarn install
    ```

2.  **启动前端开发服务器**：
    ```bash
    npm run dev
    # 或者 yarn dev
    ```
    前端应用默认将在 `http://localhost:5173` (Vite 默认端口) 运行。

### 4. 访问应用

在浏览器中打开 `http://localhost:5173` 即可访问小说应用。

## 部署

生产环境部署请参考 FastAPI 和 React 的官方部署文档。通常涉及以下步骤：

*   **后端**: 使用Gunicorn配合Nginx或Docker部署FastAPI应用。
*   **前端**: 将前端静态文件打包后 (运行 `npm run build`) 部署到任何静态文件服务器，如Nginx、CDN或云存储服务。
*   **数据库**: 确保MongoDB集群在高可用和可伸缩的环境中运行。

## 贡献

欢迎贡献！如果您有任何问题或建议，请提交 Issue 或 Pull Request。

## 许可证

本项目采用 MIT 许可证。详情请参阅 `LICENSE` 文件 (如果存在)。 
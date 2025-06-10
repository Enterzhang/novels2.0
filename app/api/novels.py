from fastapi import APIRouter, HTTPException, Query, Path, Body, Depends
from typing import List, Optional
from datetime import datetime
from ..models.novel import (
    NovelListResponse, NovelDetailResponse, ChapterDetailResponse,
    TagsResponse, ReadCountResponse, LikeResponse,
    CommentCreateRequest, CommentResponse, CommentsListResponse,
    RecommendationResponse, NovelListItem
)
from ..database.mongodb import mongodb
from ..core.config import settings
from bson import ObjectId
import logging
import random

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/novels", response_model=NovelListResponse)
async def get_novels(
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="每页数量"),
    tags: Optional[str] = Query(None, description="标签筛选，多个标签用逗号分隔"),
    publication_status: Optional[str] = Query(None, description="出版状态筛选"),
    search: Optional[str] = Query(None, description="搜索关键词")
):
    """获取小说列表"""
    skip = (page - 1) * limit
    
    # 构建查询条件
    query = {}
    
    # 标签筛选
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$all": tag_list}
    
    # 出版状态筛选
    if publication_status:
        query["publication_status"] = publication_status
    
    # 搜索关键词
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    
    # 查询总数
    total = await mongodb.novels.count_documents(query)
    
    # 查询小说列表
    cursor = mongodb.novels.find(query).skip(skip).limit(limit).sort("updateTime", -1)
    
    # 构建响应数据
    novels = []
    async for novel in cursor:
        # 确保 _id 是字符串
        novel["_id"] = str(novel["_id"])
        
        # 构建列表项
        novel_item = {
            "_id": novel["_id"],
            "title": novel["title"],
            "author": novel["author"],
            "tags": novel["tags"],
            "publication_status": novel["publication_status"],
            "cover": novel["cover"],
            "description": novel["description"][:100] + "..." if len(novel["description"]) > 100 else novel["description"],
            "updateTime": novel["updateTime"],
            "meta": novel["meta"]
        }
        novels.append(novel_item)
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "novels": novels
    }


@router.get("/novels/popular", response_model=RecommendationResponse)
async def get_popular_novels(
    limit: int = Query(10, ge=1, le=20, description="返回数量")
):
    """获取热门小说"""
    # 基于阅读量排序
    cursor = mongodb.novels.find().sort("meta.readCount", -1).limit(limit)
    
    # 收集热门小说
    popular_novels = []
    async for doc in cursor:
        # 确保 _id 是字符串
        doc["_id"] = str(doc["_id"])
        
        # 构建热门项
        novel = {
            "_id": doc["_id"],
            "title": doc["title"],
            "author": doc["author"],
            "tags": doc["tags"],
            "publication_status": doc["publication_status"],
            "cover": doc["cover"],
            "description": doc["description"][:100] + "..." if len(doc["description"]) > 100 else doc["description"],
            "updateTime": doc["updateTime"],
            "meta": doc["meta"]
        }
        popular_novels.append(novel)
    
    return {"recommendations": popular_novels}


@router.get("/novels/{novel_id}", response_model=NovelDetailResponse)
async def get_novel_detail(
    novel_id: str = Path(..., description="小说ID")
):
    """获取小说详情"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 查询小说
    novel = await mongodb.novels.find_one({"_id": object_id})
    
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 确保 _id 是字符串
    novel["_id"] = str(novel["_id"])
    
    # 只返回章节的ID和标题
    chapters = []
    for chapter in novel["chapters"]:
        chapters.append({
            "chapterId": chapter["chapterId"],
            "title": chapter["title"]
        })
    
    # 构建响应数据
    novel_detail = {
        "_id": novel["_id"],
        "title": novel["title"],
        "author": novel["author"],
        "tags": novel["tags"],
        "publication_status": novel["publication_status"],
        "cover": novel["cover"],
        "description": novel["description"],
        "createTime": novel["createTime"],
        "updateTime": novel["updateTime"],
        "chapters": chapters,
        "meta": novel["meta"]
    }
    
    return novel_detail


@router.get("/novels/{novel_id}/chapters/{chapter_id}", response_model=ChapterDetailResponse)
async def get_chapter_detail(
    novel_id: str = Path(..., description="小说ID"),
    chapter_id: str = Path(..., description="章节ID")
):
    """获取章节内容"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 查询小说
    novel = await mongodb.novels.find_one({"_id": object_id})
    
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 查找章节
    chapter = None
    chapter_index = -1
    
    for i, ch in enumerate(novel["chapters"]):
        if ch["chapterId"] == chapter_id:
            chapter = ch
            chapter_index = i
            break
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # 确定前一章和后一章
    prev_chapter = None
    next_chapter = None
    
    if chapter_index > 0:
        prev_chapter = novel["chapters"][chapter_index - 1]["chapterId"]
    
    if chapter_index < len(novel["chapters"]) - 1:
        next_chapter = novel["chapters"][chapter_index + 1]["chapterId"]
    
    # 构建响应数据
    chapter_detail = {
        "chapterId": chapter["chapterId"],
        "title": chapter["title"],
        "content": chapter["content"],
        "publishTime": chapter["publishTime"],
        "wordCount": chapter["wordCount"],
        "prevChapter": prev_chapter,
        "nextChapter": next_chapter
    }
    
    # 更新阅读计数
    await mongodb.novels.update_one(
        {"_id": object_id},
        {"$inc": {"meta.readCount": 1}}
    )
    
    return chapter_detail


@router.get("/tags", response_model=TagsResponse)
async def get_tags():
    """获取所有标签"""
    # 聚合查询所有标签
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = mongodb.novels.aggregate(pipeline)
    
    tags = []
    async for doc in cursor:
        tags.append(doc["_id"])
    
    return {"tags": tags}


@router.post("/novels/{novel_id}/read", response_model=ReadCountResponse)
async def increment_read_count(
    novel_id: str = Path(..., description="小说ID")
):
    """增加阅读计数"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 更新阅读计数
    result = await mongodb.novels.update_one(
        {"_id": object_id},
        {"$inc": {"meta.readCount": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 获取更新后的阅读计数
    novel = await mongodb.novels.find_one(
        {"_id": object_id},
        {"meta.readCount": 1}
    )
    
    return {
        "success": True,
        "readCount": novel["meta"]["readCount"]
    }


@router.post("/novels/{novel_id}/like", response_model=LikeResponse)
async def like_novel(
    novel_id: str = Path(..., description="小说ID"),
    user_id: str = Query(..., description="用户ID")
):
    """点赞小说"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 更新点赞计数
    result = await mongodb.novels.update_one(
        {"_id": object_id},
        {"$inc": {"meta.likeCount": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 获取更新后的点赞计数
    novel = await mongodb.novels.find_one(
        {"_id": object_id},
        {"meta.likeCount": 1}
    )
    
    return {
        "success": True,
        "likeCount": novel["meta"]["likeCount"]
    }


@router.post("/novels/{novel_id}/comments", response_model=CommentResponse)
async def add_comment(
    novel_id: str = Path(..., description="小说ID"),
    comment: CommentCreateRequest = Body(..., description="评论内容")
):
    """添加评论"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 创建评论
    new_comment = {
        "_id": ObjectId(),
        "userId": comment.userId,
        "content": comment.content,
        "createTime": datetime.now()
    }
    
    # 更新评论计数并添加评论
    result = await mongodb.novels.update_one(
        {"_id": object_id},
        {
            "$inc": {"meta.commentCount": 1},
            "$push": {"comments": new_comment}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 确保 _id 是字符串
    new_comment["_id"] = str(new_comment["_id"])
    
    return {
        "success": True,
        "comment": new_comment
    }


@router.get("/novels/{novel_id}/comments", response_model=CommentsListResponse)
async def get_comments(
    novel_id: str = Path(..., description="小说ID"),
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取评论列表"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 查询小说
    novel = await mongodb.novels.find_one(
        {"_id": object_id},
        {"comments": 1, "meta.commentCount": 1}
    )
    
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 分页获取评论
    skip = (page - 1) * limit
    comments = novel.get("comments", [])
    
    # 确保每个评论的 _id 是字符串
    for comment in comments:
        comment["_id"] = str(comment["_id"])
    
    # 分页
    paginated_comments = comments[skip:skip + limit]
    
    return {
        "total": novel["meta"]["commentCount"],
        "comments": paginated_comments
    }


@router.get("/novels/{novel_id}/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    novel_id: str = Path(..., description="小说ID"),
    limit: int = Query(5, ge=1, le=10, description="返回数量")
):
    """获取推荐小说"""
    try:
        # 转换字符串ID为ObjectId
        object_id = ObjectId(novel_id)
    except:
        raise HTTPException(status_code=400, detail="无效的小说ID格式")
    
    # 查询当前小说的标签
    novel = await mongodb.novels.find_one(
        {"_id": object_id},
        {"tags": 1}
    )
    
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")
    
    # 基于标签查询相似小说
    tags = novel.get("tags", [])
    
    if not tags:
        # 如果没有标签，返回随机小说
        cursor = mongodb.novels.find(
            {"_id": {"$ne": object_id}}
        ).limit(limit * 3)  # 获取更多，然后随机选择
    else:
        # 基于标签查询
        cursor = mongodb.novels.find(
            {
                "_id": {"$ne": object_id},
                "tags": {"$in": tags}
            }
        ).limit(limit * 3)  # 获取更多，然后随机选择
    
    # 收集推荐小说
    recommendations = []
    async for doc in cursor:
        # 确保 _id 是字符串
        doc["_id"] = str(doc["_id"])
        
        # 构建推荐项
        recommendation = {
            "_id": doc["_id"],
            "title": doc["title"],
            "author": doc["author"],
            "tags": doc["tags"],
            "publication_status": doc["publication_status"],
            "cover": doc["cover"],
            "description": doc["description"][:100] + "..." if len(doc["description"]) > 100 else doc["description"],
            "updateTime": doc["updateTime"],
            "meta": doc["meta"]
        }
        recommendations.append(recommendation)
    
    # 随机选择指定数量的推荐
    if len(recommendations) > limit:
        recommendations = random.sample(recommendations, limit)
    
    return {"recommendations": recommendations} 
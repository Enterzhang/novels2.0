from pydantic import BaseModel, Field, field_serializer, field_validator
from typing import List, Optional, Dict, Any, Annotated, ClassVar
from datetime import datetime
from bson.objectid import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_pydantic_json_schema__(cls, _schema, field_schema):
        field_schema.update(type="string")
        return field_schema

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return str(v)
        raise ValueError("Invalid ObjectId")


class CommentModel(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    userId: str
    content: str
    createTime: datetime = Field(default_factory=datetime.now)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class ChapterModel(BaseModel):
    chapterId: str
    title: str
    content: str = ""
    publishTime: datetime = Field(default_factory=datetime.now)
    wordCount: int = 0
    comments: List[CommentModel] = []

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class NovelMetaModel(BaseModel):
    totalChapters: int = 0
    totalWords: int = 0
    readCount: int = 0
    likeCount: int = 0
    commentCount: int = 0

    model_config = {
        "populate_by_name": True
    }


class NovelModel(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    title: str
    author: str
    tags: List[str] = []
    publication_status: str
    cover: str = ""
    description: str = ""
    createTime: datetime = Field(default_factory=datetime.now)
    updateTime: datetime = Field(default_factory=datetime.now)
    chapters: List[ChapterModel] = []
    meta: NovelMetaModel = NovelMetaModel()

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class NovelListItem(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    author: str
    tags: List[str]
    publication_status: str
    cover: str
    description: str
    updateTime: datetime
    meta: NovelMetaModel

    model_config = {
        "populate_by_name": True
    }


class NovelListResponse(BaseModel):
    total: int
    page: int
    limit: int
    novels: List[NovelListItem]

    model_config = {
        "populate_by_name": True
    }


class NovelDetailResponse(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    author: str
    tags: List[str]
    publication_status: str
    cover: str
    description: str
    createTime: datetime
    updateTime: datetime
    chapters: List[Dict[str, Any]]  # 只返回章节的ID和标题
    meta: NovelMetaModel

    model_config = {
        "populate_by_name": True
    }


class ChapterDetailResponse(BaseModel):
    chapterId: str
    title: str
    content: str
    publishTime: datetime
    wordCount: int
    prevChapter: Optional[str] = None
    nextChapter: Optional[str] = None

    model_config = {
        "populate_by_name": True
    }


class TagsResponse(BaseModel):
    tags: List[str]

    model_config = {
        "populate_by_name": True
    }


class ReadCountResponse(BaseModel):
    success: bool
    readCount: int

    model_config = {
        "populate_by_name": True
    }


class LikeResponse(BaseModel):
    success: bool
    likeCount: int

    model_config = {
        "populate_by_name": True
    }


class CommentCreateRequest(BaseModel):
    userId: str
    content: str

    model_config = {
        "populate_by_name": True
    }


class CommentResponse(BaseModel):
    success: bool
    comment: CommentModel

    model_config = {
        "populate_by_name": True
    }


class CommentsListResponse(BaseModel):
    total: int
    comments: List[CommentModel]

    model_config = {
        "populate_by_name": True
    }


class RecommendationResponse(BaseModel):
    recommendations: List[NovelListItem]

    model_config = {
        "populate_by_name": True
    } 
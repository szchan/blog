import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.post import PostStatus
from app.schemas.auth import UserResponse
from app.schemas.category import CategoryResponse
from app.schemas.tag import TagResponse


class PostBase(BaseModel):
    title: str
    slug: str
    excerpt: str | None = None
    content: str
    cover_image: str | None = None


class PostCreate(PostBase):
    tag_ids: list[uuid.UUID] = []
    category_id: uuid.UUID | None = None
    status: PostStatus = PostStatus.draft


class PostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    cover_image: str | None = None
    status: PostStatus | None = None
    tag_ids: list[uuid.UUID] | None = None
    category_id: uuid.UUID | None = None


class PostListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None
    cover_image: str | None
    status: PostStatus
    views: int
    created_at: datetime
    published_at: datetime | None
    tags: list[TagResponse]
    category: CategoryResponse | None


class PostDetailResponse(PostListResponse):
    content: str
    author: UserResponse
    updated_at: datetime

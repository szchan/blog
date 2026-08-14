from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.post import PostDetailResponse, PostListResponse
from app.services.post import PostService

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=PaginatedResponse[PostListResponse])
def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    tag: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PaginatedResponse[PostListResponse]:
    svc = PostService(db)
    return svc.list_published_posts(page=page, per_page=per_page, tag=tag, category=category)


@router.get("/{slug}", response_model=PostDetailResponse)
def get_post(slug: str, db: Session = Depends(get_db)) -> PostDetailResponse:
    svc = PostService(db)
    post = svc.get_post(slug)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

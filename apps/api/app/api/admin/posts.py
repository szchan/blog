import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.post import PostCreate, PostListResponse, PostUpdate
from app.services.post import PostService

router = APIRouter(prefix="/api/admin/posts", tags=["admin-posts"])


@router.get("", response_model=list[PostListResponse])
def list_all_posts(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[PostListResponse]:
    svc = PostService(db)
    return svc.get_all_posts()


@router.post("", response_model=PostListResponse, status_code=201)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PostListResponse:
    svc = PostService(db)
    post = svc.create_post(data, author_id=admin.id)
    return PostListResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostListResponse)
def update_post(
    post_id: uuid.UUID,
    data: PostUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PostListResponse:
    svc = PostService(db)
    post = svc.update_post(post_id, data)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostListResponse.model_validate(post)


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = PostService(db)
    if not svc.delete_post(post_id):
        raise HTTPException(status_code=404, detail="Post not found")

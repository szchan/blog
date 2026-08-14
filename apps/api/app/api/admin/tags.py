import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse, TagUpdate
from app.services.tag import TagService

router = APIRouter(prefix="/api/admin/tags", tags=["admin-tags"])


@router.get("", response_model=list[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[TagResponse]:
    svc = TagService(db)
    return svc.list_tags()


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TagResponse:
    svc = TagService(db)
    tag = svc.create_tag(data)
    return TagResponse.model_validate(tag)


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: uuid.UUID,
    data: TagUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TagResponse:
    svc = TagService(db)
    tag = svc.update_tag(tag_id, data)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return TagResponse.model_validate(tag)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = TagService(db)
    if not svc.delete_tag(tag_id):
        raise HTTPException(status_code=404, detail="Tag not found")

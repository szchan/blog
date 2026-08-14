from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tag import TagWithCountResponse
from app.services.tag import TagService

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagWithCountResponse])
def list_tags(db: Session = Depends(get_db)) -> list[TagWithCountResponse]:
    svc = TagService(db)
    return svc.list_tags_with_counts()

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.category import CategoryWithCountResponse
from app.services.category import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithCountResponse])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryWithCountResponse]:
    svc = CategoryService(db)
    return svc.list_categories_with_counts()

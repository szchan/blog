import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/api/admin/categories", tags=["admin-categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[CategoryResponse]:
    svc = CategoryService(db)
    return svc.list_categories()


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> CategoryResponse:
    svc = CategoryService(db)
    cat = svc.create_category(data)
    return CategoryResponse.model_validate(cat)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> CategoryResponse:
    svc = CategoryService(db)
    cat = svc.update_category(category_id, data)
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse.model_validate(cat)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = CategoryService(db)
    if not svc.delete_category(category_id):
        raise HTTPException(status_code=404, detail="Category not found")

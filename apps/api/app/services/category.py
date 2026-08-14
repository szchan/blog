import uuid

from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithCountResponse,
)


class CategoryService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = CategoryRepository(session)

    def list_categories(self) -> list[CategoryResponse]:
        cats = self.repo.get_all()
        return [CategoryResponse.model_validate(c) for c in cats]

    def list_categories_with_counts(self) -> list[CategoryWithCountResponse]:
        results = self.repo.get_all_with_counts()
        return [
            CategoryWithCountResponse(
                id=cat.id, name=cat.name, slug=cat.slug, post_count=count
            )
            for cat, count in results
        ]

    def create_category(self, data: CategoryCreate) -> Category:
        cat = Category(name=data.name, slug=data.slug)
        self.repo.add(cat)
        self.session.commit()
        return cat

    def update_category(self, cat_id: uuid.UUID, data: CategoryUpdate) -> Category | None:
        cat = self.repo.get_by_id(cat_id)
        if cat is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cat, key, value)
        self.session.commit()
        return cat

    def delete_category(self, cat_id: uuid.UUID) -> bool:
        cat = self.repo.get_by_id(cat_id)
        if cat is None:
            return False
        self.repo.delete(cat)
        self.session.commit()
        return True

from sqlalchemy import Row, func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.post import Post
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Category)

    def get_all_with_counts(self) -> list[Row[tuple[Category, int]]]:
        return (
            self.session.query(Category, func.count(Post.id).label("post_count"))
            .outerjoin(Post, Post.category_id == Category.id)
            .group_by(Category.id)
            .all()
        )

    def get_by_slug(self, slug: str) -> Category | None:
        return self.session.query(Category).filter(Category.slug == slug).first()

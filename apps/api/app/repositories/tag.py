from sqlalchemy import Row, func
from sqlalchemy.orm import Session

from app.models.tag import Tag, post_tags
from app.repositories.base import BaseRepository


class TagRepository(BaseRepository[Tag]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Tag)

    def get_all_with_counts(self) -> list[Row[tuple[Tag, int]]]:
        return (
            self.session.query(Tag, func.count(post_tags.c.post_id).label("post_count"))
            .outerjoin(post_tags)
            .group_by(Tag.id)
            .all()
        )

    def get_by_slug(self, slug: str) -> Tag | None:
        return self.session.query(Tag).filter(Tag.slug == slug).first()

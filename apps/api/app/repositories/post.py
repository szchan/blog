import uuid

from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.post import Post, PostStatus
from app.models.tag import Tag, post_tags
from app.repositories.base import BaseRepository


class PostRepository(BaseRepository[Post]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Post)

    def get_published_posts(
        self,
        page: int,
        per_page: int,
        tag_slug: str | None = None,
        category_slug: str | None = None,
    ) -> tuple[list[Post], int]:
        query = (
            self.session.query(Post)
            .filter(Post.status == PostStatus.published)
            .options(
                selectinload(Post.tags),
                joinedload(Post.category),
            )
        )
        if tag_slug:
            query = query.join(post_tags).join(Tag).filter(Tag.slug == tag_slug)
        if category_slug:
            from app.models.category import Category

            query = query.join(Category).filter(Category.slug == category_slug)
        total = query.count()
        posts = (
            query.order_by(Post.published_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return posts, total

    def get_by_slug(self, slug: str) -> Post | None:
        return (
            self.session.query(Post)
            .filter(Post.slug == slug)
            .options(
                joinedload(Post.author),
                selectinload(Post.tags),
                joinedload(Post.category),
            )
            .first()
        )

    def get_by_id(self, obj_id: uuid.UUID) -> Post | None:
        return (
            self.session.query(Post)
            .filter(Post.id == obj_id)
            .options(
                joinedload(Post.author),
                selectinload(Post.tags),
                joinedload(Post.category),
            )
            .first()
        )

    def get_all(self) -> list[Post]:
        return (
            self.session.query(Post)
            .options(selectinload(Post.tags), joinedload(Post.category))
            .order_by(Post.created_at.desc())
            .all()
        )

    def increment_views(self, post: Post) -> None:
        post.views += 1
        self.session.flush()

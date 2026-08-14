import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.post import Post, PostStatus
from app.models.tag import Tag
from app.repositories.post import PostRepository
from app.schemas.common import PaginatedResponse
from app.schemas.post import PostCreate, PostDetailResponse, PostListResponse, PostUpdate


class PostService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = PostRepository(session)

    def list_published_posts(
        self,
        page: int = 1,
        per_page: int = 10,
        tag: str | None = None,
        category: str | None = None,
    ) -> PaginatedResponse[PostListResponse]:
        posts, total = self.repo.get_published_posts(page, per_page, tag, category)
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        return PaginatedResponse[PostListResponse](
            items=[PostListResponse.model_validate(p) for p in posts],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
        )

    def get_post(self, slug: str) -> PostDetailResponse | None:
        post = self.repo.get_by_slug(slug)
        if post is None:
            return None
        self.repo.increment_views(post)
        self.session.commit()
        return PostDetailResponse.model_validate(post)

    def create_post(self, data: PostCreate, author_id: uuid.UUID) -> Post:
        post = Post(
            title=data.title,
            slug=data.slug,
            excerpt=data.excerpt,
            content=data.content,
            cover_image=data.cover_image,
            status=data.status,
            author_id=author_id,
            category_id=data.category_id,
            published_at=None,
        )
        if data.status == PostStatus.published:
            post.published_at = datetime.now(UTC)
        if data.tag_ids:
            tags = self.session.query(Tag).filter(Tag.id.in_(data.tag_ids)).all()
            post.tags = tags
        self.repo.add(post)
        self.session.commit()
        return post

    def update_post(self, post_id: uuid.UUID, data: PostUpdate) -> Post | None:
        post = self.repo.get_by_id(post_id)
        if post is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "tag_ids" in update_data:
            tag_ids = update_data.pop("tag_ids")
            tags = self.session.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            post.tags = tags
        if "status" in update_data:
            if update_data["status"] == PostStatus.published and post.published_at is None:
                post.published_at = datetime.now(UTC)
        for key, value in update_data.items():
            setattr(post, key, value)
        self.session.commit()
        return post

    def delete_post(self, post_id: uuid.UUID) -> bool:
        post = self.repo.get_by_id(post_id)
        if post is None:
            return False
        self.repo.delete(post)
        self.session.commit()
        return True

    def get_all_posts(self) -> list[PostListResponse]:
        posts = self.repo.get_all()
        return [PostListResponse.model_validate(p) for p in posts]

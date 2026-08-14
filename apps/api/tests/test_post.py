import uuid

from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.tag import Tag
from app.models.user import User


def test_create_draft_post(session):
    author = User(email="a@example.com", username="author", password_hash="h")
    session.add(author)
    session.flush()

    post = Post(
        title="My First Post",
        slug="my-first-post",
        content="Hello world!",
        author_id=author.id,
    )
    session.add(post)
    session.commit()

    assert post.id is not None
    assert isinstance(post.id, uuid.UUID)
    assert post.status == PostStatus.draft
    assert post.views == 0
    assert post.published_at is None
    assert post.created_at is not None
    assert post.updated_at is not None
    assert post.author.email == "a@example.com"


def test_post_with_tags_and_category(session):
    author = User(email="a@example.com", username="author", password_hash="h")
    category = Category(name="Tech", slug="tech")
    tag1 = Tag(name="Python", slug="python")
    tag2 = Tag(name="FastAPI", slug="fastapi")
    session.add_all([author, category, tag1, tag2])
    session.flush()

    post = Post(
        title="Building APIs",
        slug="building-apis",
        content="Content here",
        author_id=author.id,
        category_id=category.id,
        status=PostStatus.published,
    )
    post.tags.extend([tag1, tag2])
    session.add(post)
    session.commit()

    assert len(post.tags) == 2
    assert post.category.name == "Tech"
    assert {t.name for t in post.tags} == {"Python", "FastAPI"}

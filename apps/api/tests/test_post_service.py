from app.models.post import PostStatus
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate
from app.services.post import PostService


def make_author(session):
    author = User(email="author@test.com", username="author", password_hash="h")
    session.add(author)
    session.flush()
    return author


def test_create_and_get_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(
            title="Test Post",
            slug="test-post",
            content="Hello",
            status=PostStatus.published,
        ),
        author_id=author.id,
    )
    assert post.id is not None
    assert post.status == PostStatus.published
    assert post.published_at is not None

    result = svc.get_post("test-post")
    assert result is not None
    assert result.title == "Test Post"
    assert result.views == 1


def test_list_published_posts_pagination(session):
    author = make_author(session)
    svc = PostService(session)
    for i in range(15):
        svc.create_post(
            PostCreate(
                title=f"Post {i}",
                slug=f"post-{i}",
                content="content",
                status=PostStatus.published,
            ),
            author_id=author.id,
        )
    result = svc.list_published_posts(page=1, per_page=10)
    assert result.total == 15
    assert len(result.items) == 10
    assert result.total_pages == 2

    page2 = svc.list_published_posts(page=2, per_page=10)
    assert len(page2.items) == 5


def test_update_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(title="Old", slug="old", content="old"),
        author_id=author.id,
    )
    updated = svc.update_post(post.id, PostUpdate(title="New Title"))
    assert updated is not None
    assert updated.title == "New Title"


def test_delete_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(title="Delete Me", slug="delete-me", content="bye"),
        author_id=author.id,
    )
    assert svc.delete_post(post.id) is True
    assert svc.get_post("delete-me") is None

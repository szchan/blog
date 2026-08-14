from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.project import Project
from app.models.tag import Tag
from app.models.user import User


def make_published_post(session, slug, title="Test", tags=None, category=None):
    author = User(email=f"{slug}@test.com", username=slug, password_hash="h")
    session.add(author)
    session.flush()
    post = Post(
        title=title,
        slug=slug,
        content="Content here",
        status=PostStatus.published,
        author_id=author.id,
        category_id=category.id if category else None,
    )
    if tags:
        post.tags = tags
    session.add(post)
    session.commit()
    return post


def test_list_posts_empty(client):
    response = client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_list_posts_with_data(client, session):
    make_published_post(session, "post-1", "First Post")
    make_published_post(session, "post-2", "Second Post")
    response = client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_get_post_by_slug(client, session):
    make_published_post(session, "my-post", "My Post")
    response = client.get("/api/posts/my-post")
    assert response.status_code == 200
    assert response.json()["title"] == "My Post"
    assert response.json()["content"] == "Content here"


def test_get_post_not_found(client):
    response = client.get("/api/posts/nonexistent")
    assert response.status_code == 404


def test_list_tags_with_counts(client, session):
    post = make_published_post(session, "tagged-post")
    tag = Tag(name="Python", slug="python")
    session.add(tag)
    session.flush()
    post.tags = [tag]
    session.commit()

    response = client.get("/api/tags")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Python"
    assert data[0]["post_count"] == 1


def test_list_categories_with_counts(client, session):
    cat = Category(name="Tech", slug="tech")
    session.add(cat)
    session.commit()
    make_published_post(session, "cat-post", category=cat)

    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Tech"
    assert data[0]["post_count"] == 1


def test_list_projects(client, session):
    project = Project(
        title="My Project",
        slug="my-project",
        description="A cool project",
        content="Details",
        tech_stack=["Python", "React"],
        github_url="https://github.com/me/project",
    )
    session.add(project)
    session.commit()

    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "My Project"
    assert data[0]["tech_stack"] == ["Python", "React"]


def test_get_project_by_slug(client, session):
    project = Project(
        title="Portfolio",
        slug="portfolio",
        description="My portfolio",
        content="Details",
        tech_stack=["FastAPI"],
        github_url="https://github.com/me/portfolio",
    )
    session.add(project)
    session.commit()

    response = client.get("/api/projects/portfolio")
    assert response.status_code == 200
    assert response.json()["title"] == "Portfolio"


def test_get_project_not_found(client):
    response = client.get("/api/projects/nonexistent")
    assert response.status_code == 404

import uuid

from app.models.post import Post
from app.models.user import User


def test_admin_create_post(admin_client):
    response = admin_client.post(
        "/api/admin/posts",
        json={
            "title": "New Post",
            "slug": "new-post",
            "content": "Content",
            "status": "draft",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Post"
    assert response.json()["slug"] == "new-post"


def test_admin_list_all_posts(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Admin Post", slug="admin-post", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.get("/api/admin/posts")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Admin Post"


def test_admin_get_post_by_id(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(
        title="Detail Post",
        slug="detail-post",
        content="Full content here",
        author_id=author.id,
    )
    session.add(post)
    session.commit()

    response = admin_client.get(f"/api/admin/posts/{post.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Detail Post"
    assert body["content"] == "Full content here"
    assert body["author"]["username"] == "a"
    assert "updated_at" in body


def test_admin_get_post_not_found(admin_client):
    response = admin_client.get(f"/api/admin/posts/{uuid.uuid4()}")
    assert response.status_code == 404


def test_admin_update_post(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Old", slug="old", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.put(
        f"/api/admin/posts/{post.id}",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_admin_delete_post(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Delete", slug="delete", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.delete(f"/api/admin/posts/{post.id}")
    assert response.status_code == 204


def test_admin_endpoints_require_auth(client):
    assert client.get("/api/admin/posts").status_code == 401
    assert (
        client.post(
            "/api/admin/posts", json={"title": "x", "slug": "x", "content": "x"}
        ).status_code
        == 401
    )


def test_admin_get_post_requires_auth(client):
    assert client.get(f"/api/admin/posts/{uuid.uuid4()}").status_code == 401

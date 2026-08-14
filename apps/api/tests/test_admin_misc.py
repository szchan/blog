import uuid

from app.models.project import Project


def test_admin_create_tag(admin_client):
    response = admin_client.post(
        "/api/admin/tags",
        json={"name": "Python", "slug": "python"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Python"


def test_admin_update_tag(admin_client, session):
    create_resp = admin_client.post(
        "/api/admin/tags",
        json={"name": "Old Tag", "slug": "old-tag"},
    )
    tag_id = create_resp.json()["id"]
    response = admin_client.put(
        f"/api/admin/tags/{tag_id}",
        json={"name": "New Tag"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Tag"


def test_admin_delete_tag(admin_client):
    create_resp = admin_client.post(
        "/api/admin/tags",
        json={"name": "Delete Tag", "slug": "delete-tag"},
    )
    tag_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/tags/{tag_id}")
    assert response.status_code == 204


def test_admin_create_category(admin_client):
    response = admin_client.post(
        "/api/admin/categories",
        json={"name": "Tech", "slug": "tech"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Tech"


def test_admin_delete_category(admin_client):
    create_resp = admin_client.post(
        "/api/admin/categories",
        json={"name": "Delete", "slug": "delete"},
    )
    cat_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/categories/{cat_id}")
    assert response.status_code == 204


def test_admin_create_project(admin_client):
    response = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "New Project",
            "slug": "new-project",
            "description": "A project",
            "content": "Details",
            "tech_stack": ["Python"],
            "github_url": "https://github.com/me/proj",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Project"


def test_admin_update_project(admin_client):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Old",
            "slug": "old-proj",
            "description": "d",
            "content": "c",
            "tech_stack": [],
            "github_url": "https://github.com/me/old",
        },
    )
    proj_id = create_resp.json()["id"]
    response = admin_client.put(
        f"/api/admin/projects/{proj_id}",
        json={"title": "Updated Project"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Project"


def test_admin_delete_project(admin_client):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Delete",
            "slug": "del-proj",
            "description": "d",
            "content": "c",
            "tech_stack": [],
            "github_url": "https://github.com/me/del",
        },
    )
    proj_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/projects/{proj_id}")
    assert response.status_code == 204


def test_admin_tags_require_auth(client):
    assert client.get("/api/admin/tags").status_code == 401


def test_admin_get_project_by_id(admin_client, session):
    project = Project(
        title="Detail Project",
        slug="detail-project",
        description="A project",
        content="Full content here",
        tech_stack=["Python"],
        github_url="https://github.com/me/proj",
    )
    session.add(project)
    session.commit()

    response = admin_client.get(f"/api/admin/projects/{project.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Detail Project"
    assert body["content"] == "Full content here"
    assert "created_at" in body


def test_admin_get_project_not_found(admin_client):
    response = admin_client.get(f"/api/admin/projects/{uuid.uuid4()}")
    assert response.status_code == 404


def test_admin_get_project_requires_auth(client):
    assert client.get(f"/api/admin/projects/{uuid.uuid4()}").status_code == 401

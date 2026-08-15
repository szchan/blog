from app.models.project import Project, ProjectStatus


def test_default_status_is_draft(session):
    project = Project(
        title="Test",
        slug="test",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
    )
    session.add(project)
    session.commit()
    assert project.status == ProjectStatus.draft
    assert project.published_at is None


def test_published_project_has_published_at(session):
    project = Project(
        title="Test",
        slug="test",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    session.add(project)
    session.commit()
    assert project.status == ProjectStatus.published
    assert project.published_at is not None


def test_public_api_only_returns_published(client, session):
    published = Project(
        title="Published",
        slug="published",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    draft = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add_all([published, draft])
    session.commit()

    response = client.get("/api/projects")
    assert response.status_code == 200
    slugs = [p["slug"] for p in response.json()]
    assert "published" in slugs
    assert "draft" not in slugs


def test_public_api_404_for_draft_project(client, session):
    project = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add(project)
    session.commit()

    response = client.get("/api/projects/draft")
    assert response.status_code == 404


def test_admin_api_returns_all_projects(admin_client, session):
    published = Project(
        title="Published",
        slug="published",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    draft = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add_all([published, draft])
    session.commit()

    response = admin_client.get("/api/admin/projects")
    assert response.status_code == 200
    slugs = [p["slug"] for p in response.json()]
    assert "published" in slugs
    assert "draft" in slugs


def test_create_project_defaults_to_draft(admin_client):
    response = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "New Project",
            "slug": "new-project",
            "description": "desc",
            "content": "content",
            "tech_stack": [],
            "github_url": "https://github.com/test/repo",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "draft"


def test_update_to_published_sets_published_at(admin_client, session):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Test",
            "slug": "test",
            "description": "desc",
            "content": "content",
            "tech_stack": [],
            "github_url": "https://github.com/test/repo",
        },
    )
    project_id = create_resp.json()["id"]

    update_resp = admin_client.put(
        f"/api/admin/projects/{project_id}",
        json={"status": "published"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "published"
    assert update_resp.json()["published_at"] is not None


def test_update_to_draft_clears_published_at(admin_client):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Test",
            "slug": "test-draft-clear",
            "description": "desc",
            "content": "content",
            "tech_stack": [],
            "github_url": "https://github.com/test/repo",
            "status": "published",
        },
    )
    project_id = create_resp.json()["id"]
    assert create_resp.json()["published_at"] is not None

    update_resp = admin_client.put(
        f"/api/admin/projects/{project_id}",
        json={"status": "draft"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "draft"
    assert update_resp.json()["published_at"] is None

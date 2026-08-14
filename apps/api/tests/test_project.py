import uuid

from app.models.project import Project


def test_create_project(session):
    project = Project(
        title="Blog System",
        slug="blog-system",
        description="A personal blog",
        content="Detailed description",
        tech_stack=["Python", "FastAPI", "React"],
        github_url="https://github.com/user/blog",
        demo_url="https://blog.example.com",
    )
    session.add(project)
    session.commit()

    assert project.id is not None
    assert isinstance(project.id, uuid.UUID)
    assert project.title == "Blog System"
    assert project.tech_stack == ["Python", "FastAPI", "React"]
    assert project.sort_order == 0
    assert project.created_at is not None

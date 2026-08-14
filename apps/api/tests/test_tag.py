import uuid

from app.models.tag import Tag


def test_create_tag(session):
    tag = Tag(name="Python", slug="python")
    session.add(tag)
    session.commit()

    assert tag.id is not None
    assert isinstance(tag.id, uuid.UUID)
    assert tag.name == "Python"
    assert tag.slug == "python"

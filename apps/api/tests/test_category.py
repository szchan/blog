import uuid

from app.models.category import Category


def test_create_category(session):
    category = Category(name="Technology", slug="technology")
    session.add(category)
    session.commit()

    assert category.id is not None
    assert isinstance(category.id, uuid.UUID)
    assert category.name == "Technology"
    assert category.slug == "technology"

import uuid

from app.models.user import User


def test_create_user(session):
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="hashedpassword",
        is_admin=False,
    )
    session.add(user)
    session.commit()

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.is_admin is False
    assert user.created_at is not None

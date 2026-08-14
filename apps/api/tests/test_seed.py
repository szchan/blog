from app.core.seed import seed_admin
from app.models.user import User


def test_seed_admin_creates_user(session, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "testpass123")

    seed_admin(session)

    admin = session.query(User).filter(User.email == "admin@example.com").first()
    assert admin is not None
    assert admin.username == "admin"
    assert admin.is_admin is True
    assert admin.password_hash != "testpass123"  # must be hashed


def test_seed_admin_idempotent(session, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "testpass123")

    seed_admin(session)
    seed_admin(session)  # second call should not fail

    count = session.query(User).filter(User.email == "admin@example.com").count()
    assert count == 1

import os

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


def seed_admin(session: Session) -> None:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")

    existing = session.query(User).filter(User.email == admin_email).first()
    if existing:
        print(f"Admin user already exists: {admin_email}")
        return

    admin = User(
        email=admin_email,
        username=admin_username,
        password_hash=hash_password(admin_password),
        is_admin=True,
    )
    session.add(admin)
    session.commit()
    print(f"Admin user created: {admin_email}")

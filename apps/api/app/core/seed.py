import os

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
        password_hash=pwd_context.hash(admin_password),
        is_admin=True,
    )
    session.add(admin)
    session.commit()
    print(f"Admin user created: {admin_email}")

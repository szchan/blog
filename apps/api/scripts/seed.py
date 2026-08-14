from app.core.database import SessionLocal
from app.core.seed import seed_admin

if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed_admin(session)
    finally:
        session.close()

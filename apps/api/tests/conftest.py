import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 - register all models with Base.metadata
from app.core.database import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.base import Base
from app.models.user import User


def _resolvable_tables(metadata):
    for table in metadata.tables.values():
        if all(
            fk.target_fullname.split(".")[0] in metadata.tables
            for fk in table.foreign_keys
        ):
            yield table


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=list(_resolvable_tables(Base.metadata)))
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def session(engine):
    Session = sessionmaker(bind=engine)  # noqa: N806
    session = Session()
    yield session
    session.close()


@pytest.fixture
def client(session):
    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client, session):
    admin = User(
        email="admin@test.com",
        username="admin",
        password_hash="hashed",
        is_admin=True,
    )
    session.add(admin)
    session.commit()
    token = create_access_token(str(admin.id))
    client.headers["Authorization"] = f"Bearer {token}"
    yield client

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 - register all models with Base.metadata
from app.models.base import Base


def _resolvable_tables(metadata):
    for table in metadata.tables.values():
        if all(
            fk.target_fullname.split(".")[0] in metadata.tables
            for fk in table.foreign_keys
        ):
            yield table


@pytest.fixture
def engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine, tables=list(_resolvable_tables(Base.metadata)))
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def session(engine):
    Session = sessionmaker(bind=engine)  # noqa: N806
    session = Session()
    yield session
    session.close()

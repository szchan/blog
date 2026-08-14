# Phase 1: Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo scaffolding, all database models with tests, Alembic migrations, FastAPI health-check endpoint, admin seed script, Next.js frontend placeholder, Docker Compose dev environment, and CI pipeline.

**Architecture:** Monorepo with `apps/api` (FastAPI + SQLAlchemy 2.0 + Alembic) and `apps/web` (Next.js App Router + Tailwind). Backend uses layered architecture starting with models. SQLite in-memory for tests, PostgreSQL 16 for dev/prod. Docker Compose orchestrates all services.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2, passlib[bcrypt], PostgreSQL 16, Redis 7, Next.js 15, React 19, Tailwind CSS, Docker Compose, GitHub Actions.

**Phase scope:** This is Phase 1 of 5. Phases 2–5 (backend API, frontend public pages, admin panel, deployment) will be planned separately after Phase 1 is implemented and verified.

## Global Constraints

- Python >= 3.12, use `pyproject.toml` for project config and dependency management
- SQLAlchemy 2.0+ with `Mapped` / `mapped_column` style (not legacy `Column` style)
- All UUIDs use Python `uuid.UUID` type with SQLAlchemy `Uuid` column type (works on both PostgreSQL and SQLite)
- Test database: SQLite in-memory (`sqlite:///:memory:`), never touch production PostgreSQL
- Next.js App Router (not Pages Router), no `src/` directory
- Tailwind CSS via `create-next-app --tailwind` (v3 config style)
- All code must pass `ruff check` and `mypy` (backend) / `tsc --noEmit` and `next build` (frontend)
- Every task ends with a git commit using conventional commits (`feat:`, `chore:`, etc.)

---

## File Structure

```
blog/
├── .gitignore                          # Task 1
├── .env.example                         # Task 1
├── docker-compose.yml                   # Task 9
├── .github/workflows/ci.yml             # Task 10
├── README.md                            # Task 10
├── apps/
│   ├── api/
│   │   ├── pyproject.toml              # Task 1
│   │   ├── Dockerfile                   # Task 9
│   │   ├── .dockerignore               # Task 9
│   │   ├── alembic.ini                 # Task 5
│   │   ├── app/
│   │   │   ├── __init__.py             # Task 1
│   │   │   ├── main.py                 # Task 6
│   │   │   ├── core/
│   │   │   │   ├── __init__.py         # Task 1
│   │   │   │   ├── config.py          # Task 1
│   │   │   │   ├── database.py         # Task 1
│   │   │   │   └── seed.py            # Task 7
│   │   │   └── models/
│   │   │       ├── __init__.py        # Task 1 (updated 2-4)
│   │   │       ├── base.py            # Task 1
│   │   │       ├── user.py            # Task 1 (modified 3)
│   │   │       ├── category.py        # Task 2 (modified 3)
│   │   │       ├── tag.py             # Task 2 (modified 3)
│   │   │       ├── post.py            # Task 3
│   │   │       └── project.py         # Task 4
│   │   ├── alembic/
│   │   │   ├── env.py                 # Task 5
│   │   │   ├── script.py.mako         # Task 5
│   │   │   └── versions/              # Task 5
│   │   ├── scripts/seed.py            # Task 7
│   │   └── tests/
│   │       ├── __init__.py            # Task 1
│   │       ├── conftest.py            # Task 1
│   │       ├── test_user.py           # Task 1
│   │       ├── test_category.py       # Task 2
│   │       ├── test_tag.py            # Task 2
│   │       ├── test_post.py           # Task 3
│   │       ├── test_project.py        # Task 4
│   │       └── test_health.py         # Task 6
│   └── web/                           # Task 8 (create-next-app)
│       ├── Dockerfile                 # Task 9
│       └── .dockerignore             # Task 9
```

---

## Task 1: Backend Setup + User Model

**Files:**

- Create: `.gitignore`, `.env.example`, `apps/api/pyproject.toml`, `apps/api/app/__init__.py`, `apps/api/app/core/__init__.py`, `apps/api/app/core/config.py`, `apps/api/app/core/database.py`, `apps/api/app/models/__init__.py`, `apps/api/app/models/base.py`, `apps/api/app/models/user.py`, `apps/api/tests/__init__.py`, `apps/api/tests/conftest.py`, `apps/api/tests/test_user.py`

**Interfaces:**

- Produces: `Base` (DeclarativeBase subclass), `User` model (id, email, username, password_hash, is_admin, created_at), `settings` (Settings instance), `engine` + `SessionLocal` + `get_db()`, test fixtures `engine` and `session`

- [ ] **Step 1: Create root `.gitignore`**

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
env/
.venv/
.env
*.egg-info/
dist/
build/

# Node
node_modules/
.next/
out/
build/
*.tsbuildinfo
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
postgres_data/
```

- [ ] **Step 2: Create `.env.example`**

```env
DATABASE_URL=postgresql+psycopg2://blog:blog@localhost:5432/blog
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=24
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 3: Create `apps/api/pyproject.toml`**

```toml
[project]
name = "blog-api"
version = "0.1.0"
description = "Personal blog + portfolio API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy>=2.0.35",
    "alembic>=1.13.0",
    "psycopg2-binary>=2.9.9",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.8.0",
    "python-multipart>=0.0.9",
    "redis>=5.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]

[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 4: Create `app/core/config.py` and `app/core/database.py`**

Also create empty `app/__init__.py` and `app/core/__init__.py`.

`apps/api/app/core/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "postgresql+psycopg2://blog:blog@localhost:5432/blog"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "changeme123"


settings = Settings()
```

`apps/api/app/core/database.py`:

```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
```

- [ ] **Step 5: Create `app/models/base.py` and `app/models/__init__.py`**

`apps/api/app/models/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

`apps/api/app/models/__init__.py` (will be updated as models are added):

```python
from app.models.base import Base
from app.models.user import User

__all__ = ["Base", "User"]
```

- [ ] **Step 6: Create `tests/conftest.py` with test DB fixtures**

Also create empty `tests/__init__.py`.

`apps/api/tests/conftest.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 - register all models with Base.metadata
from app.models.base import Base


@pytest.fixture
def engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
```

- [ ] **Step 7: Write failing test for User model**

`apps/api/tests/test_user.py`:

```python
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
```

- [ ] **Step 8: Run test to verify it fails**

Run: `cd apps/api && python -m pytest tests/test_user.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.user'`

- [ ] **Step 9: Create `app/models/user.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 10: Install deps and run test to verify it passes**

Run: `cd apps/api && pip install -e ".[dev]" && python -m pytest tests/test_user.py -v`
Expected: PASS

- [ ] **Step 11: Verify lint and type check**

Run: `cd apps/api && ruff check . && mypy app/`
Expected: No errors

- [ ] **Step 12: Commit**

```bash
git add .gitignore .env.example apps/api/
git commit -m "feat: backend setup with User model and test infrastructure"
```

---

## Task 2: Category + Tag Models

**Files:**

- Create: `apps/api/app/models/category.py`, `apps/api/app/models/tag.py` (includes `post_tags`), `apps/api/tests/test_category.py`, `apps/api/tests/test_tag.py`
- Modify: `apps/api/app/models/__init__.py`

**Interfaces:**

- Consumes: `Base` from Task 1, `session` fixture from Task 1
- Produces: `Category` (id, name, slug), `Tag` (id, name, slug), `post_tags` Table (post_id FK, tag_id FK)

- [ ] **Step 1: Write failing tests**

`apps/api/tests/test_category.py`:

```python
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
```

`apps/api/tests/test_tag.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/api && python -m pytest tests/test_category.py tests/test_tag.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create `models/category.py`**

```python
import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
```

- [ ] **Step 4: Create `models/tag.py` with `post_tags` association table**

```python
import uuid
from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
```

> Note: `post_tags` references `posts.id` via string ForeignKey, resolved at metadata compilation time. The `posts` table is defined in Task 3. SQLite test DB accepts FK references to non-existent tables.

- [ ] **Step 5: Update `models/__init__.py`**

```python
from app.models.base import Base
from app.models.category import Category
from app.models.tag import Tag, post_tags
from app.models.user import User

__all__ = ["Base", "Category", "Tag", "User", "post_tags"]
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/api && python -m pytest tests/test_category.py tests/test_tag.py -v`
Expected: PASS

- [ ] **Step 7: Verify lint and type check, then commit**

Run: `cd apps/api && ruff check . && mypy app/`
Expected: No errors

```bash
git add apps/api/
git commit -m "feat: add Category and Tag models with post_tags association"
```

---

## Task 3: Post Model + Relationships

**Files:**

- Create: `apps/api/app/models/post.py`, `apps/api/tests/test_post.py`
- Modify: `apps/api/app/models/user.py` (add `posts` relationship)
- Modify: `apps/api/app/models/category.py` (add `posts` relationship)
- Modify: `apps/api/app/models/tag.py` (add `posts` relationship)
- Modify: `apps/api/app/models/__init__.py`

**Interfaces:**

- Consumes: `User` from Task 1, `Category` + `Tag` + `post_tags` from Task 2
- Produces: `Post` model (id, title, slug, excerpt, content, cover_image, status, views, author_id, category_id, published_at, created_at, updated_at; relationships: author, category, tags), `PostStatus` enum (draft, published)

- [ ] **Step 1: Write failing test for Post model**

`apps/api/tests/test_post.py`:

```python
import uuid
from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.tag import Tag
from app.models.user import User


def test_create_draft_post(session):
    author = User(email="a@example.com", username="author", password_hash="h")
    session.add(author)
    session.flush()

    post = Post(
        title="My First Post",
        slug="my-first-post",
        content="Hello world!",
        author_id=author.id,
    )
    session.add(post)
    session.commit()

    assert post.id is not None
    assert isinstance(post.id, uuid.UUID)
    assert post.status == PostStatus.draft
    assert post.views == 0
    assert post.published_at is None
    assert post.created_at is not None
    assert post.updated_at is not None
    assert post.author.email == "a@example.com"


def test_post_with_tags_and_category(session):
    author = User(email="a@example.com", username="author", password_hash="h")
    category = Category(name="Tech", slug="tech")
    tag1 = Tag(name="Python", slug="python")
    tag2 = Tag(name="FastAPI", slug="fastapi")
    session.add_all([author, category, tag1, tag2])
    session.flush()

    post = Post(
        title="Building APIs",
        slug="building-apis",
        content="Content here",
        author_id=author.id,
        category_id=category.id,
        status=PostStatus.published,
    )
    post.tags.extend([tag1, tag2])
    session.add(post)
    session.commit()

    assert len(post.tags) == 2
    assert post.category.name == "Tech"
    assert {t.name for t in post.tags} == {"Python", "FastAPI"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && python -m pytest tests/test_post.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.post'`

- [ ] **Step 3: Create `models/post.py`**

```python
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.tag import post_tags


class PostStatus(enum.Enum):
    draft = "draft"
    published = "published"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus), default=PostStatus.draft
    )
    views: Mapped[int] = mapped_column(Integer, default=0)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["User"] = relationship(back_populates="posts")
    category: Mapped["Category | None"] = relationship(back_populates="posts")
    tags: Mapped[list["Tag"]] = relationship(
        secondary=post_tags, back_populates="posts"
    )
```

- [ ] **Step 4: Add `posts` relationship to `user.py`, `category.py`, `tag.py`**

Add to `User` class in `apps/api/app/models/user.py`:

```python
from sqlalchemy.orm import relationship

posts: Mapped[list["Post"]] = relationship(back_populates="author")
```

Add to `Category` class in `apps/api/app/models/category.py`:

```python
from sqlalchemy.orm import relationship

posts: Mapped[list["Post"]] = relationship(back_populates="category")
```

Add to `Tag` class in `apps/api/app/models/tag.py`:

```python
from sqlalchemy.orm import relationship

posts: Mapped[list["Post"]] = relationship(
    secondary=post_tags, back_populates="tags"
)
```

- [ ] **Step 5: Update `models/__init__.py`**

```python
from app.models.base import Base
from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.tag import Tag, post_tags
from app.models.user import User

__all__ = ["Base", "Category", "Post", "PostStatus", "Tag", "User", "post_tags"]
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/api && python -m pytest tests/test_post.py -v`
Expected: PASS

- [ ] **Step 7: Verify lint and type check, then commit**

Run: `cd apps/api && ruff check . && mypy app/`
Expected: No errors (may need to add `from __future__ import annotations` for forward references)

```bash
git add apps/api/
git commit -m "feat: add Post model with relationships to User, Category, Tag"
```

---

## Task 4: Project Model

**Files:**

- Create: `apps/api/app/models/project.py`, `apps/api/tests/test_project.py`
- Modify: `apps/api/app/models/__init__.py`

**Interfaces:**

- Consumes: `Base` from Task 1, `session` fixture from Task 1
- Produces: `Project` model (id, title, slug, description, content, tech_stack, github_url, demo_url, cover_image, sort_order, created_at)

- [ ] **Step 1: Write failing test for Project model**

`apps/api/tests/test_project.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && python -m pytest tests/test_project.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create `models/project.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tech_stack: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    github_url: Mapped[str] = mapped_column(String(500), nullable=False)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 4: Update `models/__init__.py`**

```python
from app.models.base import Base
from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.project import Project
from app.models.tag import Tag, post_tags
from app.models.user import User

__all__ = [
    "Base", "Category", "Post", "PostStatus",
    "Project", "Tag", "User", "post_tags",
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && python -m pytest tests/test_project.py -v`
Expected: PASS

- [ ] **Step 6: Run all tests, verify lint, then commit**

Run: `cd apps/api && python -m pytest -v && ruff check . && mypy app/`
Expected: All tests pass, no lint/type errors

```bash
git add apps/api/
git commit -m "feat: add Project model for portfolio showcase"
```

---

## Task 5: Alembic Migrations

**Files:**

- Create: `apps/api/alembic.ini`, `apps/api/alembic/env.py`, `apps/api/alembic/script.py.mako`, `apps/api/alembic/versions/` (dir)
- No test file — verification is running migration against a fresh database

**Interfaces:**

- Consumes: All models from Tasks 1–4, `settings.DATABASE_URL` from Task 1
- Produces: Alembic migration environment, initial migration creating all tables

- [ ] **Step 1: Initialize Alembic**

Run: `cd apps/api && alembic init alembic`
This creates `alembic.ini`, `alembic/env.py`, `alembic/script.py.mako`, and `alembic/versions/`.

- [ ] **Step 2: Replace `alembic/env.py` with customized version**

```python
from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models  # noqa: F401 - register all models
from app.core.config import settings
from app.models.base import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Generate initial migration**

Run: `cd apps/api && alembic revision --autogenerate -m "initial schema"`
Expected: Creates a migration file in `alembic/versions/` with `create_table` for users, categories, tags, post_tags, posts, projects.

- [ ] **Step 4: Verify migration runs against a fresh SQLite database**

Run:

```
cd apps/api
set DATABASE_URL=sqlite:///test_migrate.db
alembic upgrade head
python -c "import sqlite3; c=sqlite3.connect('test_migrate.db'); print(c.execute('SELECT name FROM sqlite_master WHERE type=\"table\"').fetchall())"
del test_migrate.db
```

Expected: All 6 tables listed (users, categories, tags, post_tags, posts, projects, alembic_version)

- [ ] **Step 5: Verify lint, then commit**

Run: `cd apps/api && ruff check . && mypy app/`
Expected: No errors

```bash
git add apps/api/alembic.ini apps/api/alembic/
git commit -m "feat: set up Alembic with initial schema migration"
```

---

## Task 6: FastAPI App + Health Check

**Files:**

- Create: `apps/api/app/main.py`, `apps/api/tests/test_health.py`

**Interfaces:**

- Consumes: `app.core.config.settings` from Task 1
- Produces: `app` (FastAPI instance with `GET /api/health` endpoint returning `{"status": "healthy"}`)

- [ ] **Step 1: Write failing test for health check**

`apps/api/tests/test_health.py`:

```python
from fastapi.testclient import TestClient
from app.main import app


def test_health_check():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && python -m pytest tests/test_health.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.main'`

- [ ] **Step 3: Create `app/main.py`**

```python
from fastapi import FastAPI

app = FastAPI(title="Blog API", version="0.1.0")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && python -m pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 5: Run all tests, verify lint, then commit**

Run: `cd apps/api && python -m pytest -v && ruff check . && mypy app/`
Expected: All pass, no errors

```bash
git add apps/api/app/main.py apps/api/tests/test_health.py
git commit -m "feat: add FastAPI app with health check endpoint"
```

---

## Task 7: Admin Seed Script

**Files:**

- Create: `apps/api/app/core/seed.py`, `apps/api/scripts/seed.py`
- Create: `apps/api/tests/test_seed.py`

**Interfaces:**

- Consumes: `User` model from Task 1, `settings.ADMIN_EMAIL/USERNAME/PASSWORD` from Task 1, `session` fixture from Task 1
- Produces: `seed_admin(session: Session) -> None` function that creates admin user if not exists

- [ ] **Step 1: Write failing test for seed_admin**

`apps/api/tests/test_seed.py`:

```python
from app.models.user import User
from app.core.seed import seed_admin


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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && python -m pytest tests/test_seed.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.core.seed'`

- [ ] **Step 3: Create `app/core/seed.py`**

```python
import os

from sqlalchemy.orm import Session

from app.models.user import User
from passlib.context import CryptContext

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
```

- [ ] **Step 4: Create `scripts/seed.py` (entry point)**

```python
from app.core.database import SessionLocal
from app.core.seed import seed_admin

if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed_admin(session)
    finally:
        session.close()
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && python -m pytest tests/test_seed.py -v`
Expected: PASS

- [ ] **Step 6: Verify lint, then commit**

Run: `cd apps/api && ruff check . && mypy app/`
Expected: No errors

```bash
git add apps/api/app/core/seed.py apps/api/scripts/ apps/api/tests/test_seed.py
git commit -m "feat: add admin seed script with bcrypt password hashing"
```

---

## Task 8: Frontend Setup (Next.js + Tailwind)

**Files:**

- Create: `apps/web/` (via `create-next-app`)
- Customize: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`

**Interfaces:**

- Produces: Next.js app with App Router, Tailwind CSS, TypeScript, placeholder home page

- [ ] **Step 1: Scaffold Next.js app**

Run from project root:

```
npx create-next-app@latest apps/web --ts --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

Expected: `apps/web/` directory created with Next.js boilerplate

- [ ] **Step 2: Customize `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "Personal blog + portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Customize `app/page.tsx` as placeholder**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-4 text-lg text-gray-500">
        Personal blog + portfolio — coming soon
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Verify the build passes**

Run: `cd apps/web && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Verify type check passes**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold Next.js frontend with Tailwind CSS"
```

---

## Task 9: Docker Compose Dev Environment

**Files:**

- Create: `apps/api/Dockerfile`, `apps/api/.dockerignore`
- Create: `apps/web/Dockerfile`, `apps/web/.dockerignore`
- Create: `docker-compose.yml`

**Interfaces:**

- Consumes: Backend app from Tasks 1–7, frontend from Task 8
- Produces: `docker compose up` starts PostgreSQL, Redis, API, and Web with hot reload

- [ ] **Step 1: Create `apps/api/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir -e ".[dev]"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Create `apps/api/.dockerignore`**

```
__pycache__/
*.pyc
.pytest_cache/
.mypy_cache/
.ruff_cache/
*.egg-info/
.env
.venv/
```

- [ ] **Step 3: Create `apps/web/Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 4: Create `apps/web/.dockerignore`**

```
node_modules/
.next/
out/
.env
```

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: blog
      POSTGRES_PASSWORD: blog
      POSTGRES_DB: blog
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blog"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./apps/api
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+psycopg2://blog:blog@postgres:5432/blog
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: dev-secret-key-change-in-production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./apps/api:/app

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - api
    volumes:
      - ./apps/web:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
```

- [ ] **Step 6: Verify Docker Compose starts all services**

Run: `docker compose up -d`
Then wait 10 seconds and verify:

```
docker compose ps
```

Expected: All 4 services (postgres, redis, api, web) show as "running"

Verify API health check:

```
curl http://localhost:8000/api/health
```

Expected: `{"status":"healthy"}`

Verify web serves:

```
curl http://localhost:3000
```

Expected: HTML containing "Blog"

- [ ] **Step 7: Run Alembic migration against Docker PostgreSQL**

```
docker compose exec api alembic upgrade head
```

Expected: Creates all tables in PostgreSQL

- [ ] **Step 8: Seed admin user**

```
docker compose exec api python scripts/seed.py
```

Expected: "Admin user created: admin@example.com"

- [ ] **Step 9: Tear down and commit**

```
docker compose down
```

```bash
git add apps/api/Dockerfile apps/api/.dockerignore apps/web/Dockerfile apps/web/.dockerignore docker-compose.yml
git commit -m "feat: add Docker Compose for full-stack local development"
```

---

## Task 10: CI Pipeline + README

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `README.md`

**Interfaces:**

- Consumes: Backend test/lint commands from Tasks 1–7, frontend build from Task 8
- Produces: GitHub Actions CI that runs on every PR, project README

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: mypy app/
      - run: python -m pytest -v

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build
```

- [ ] **Step 2: Create `README.md`**

````markdown
# Personal Blog + Portfolio

A full-stack personal blog and portfolio system built with FastAPI and Next.js.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2
- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Database:** PostgreSQL 16, Redis 7
- **DevOps:** Docker Compose, GitHub Actions

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local backend development)
- Node.js 20+ (for local frontend development)

### Quick Start with Docker

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec api alembic upgrade head

# Seed admin user
docker compose exec api python scripts/seed.py
```
````

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Local Development (without Docker)

**Backend:**

```bash
cd apps/api
pip install -e ".[dev]"
# Set DATABASE_URL to your PostgreSQL instance
python -m pytest -v        # run tests
ruff check .               # lint
mypy app/                  # type check
```

**Frontend:**

```bash
cd apps/web
npm install
npm run dev                # start dev server
npm run build              # production build
npx tsc --noEmit           # type check
```

## Project Structure

```
blog/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── docker-compose.yml
└── .github/workflows/
```

## License

MIT

````

- [ ] **Step 3: Commit**

```bash
git add .github/ README.md
git commit -m "feat: add CI pipeline and project README"
````

- [ ] **Step 4: Push to GitHub and verify CI passes**

```bash
git push origin master
```

Expected: GitHub Actions CI runs and both backend and frontend jobs pass.

---

## Self-Review

### Spec Coverage

- [x] Monorepo scaffolding (Task 1, Task 8)
- [x] Docker Compose (Task 9)
- [x] Database models: users, posts, tags, post_tags, categories, projects (Tasks 1–4)
- [x] Alembic migrations (Task 5)
- [x] CI pipeline (Task 10)
- [x] Seed admin user (Task 7)
- [x] FastAPI app entry (Task 6)
- [x] Next.js frontend placeholder (Task 8)

### Placeholder Scan

No TBDs, TODOs, or "implement later" found. All steps contain concrete code or commands.

### Type Consistency

- `Base` class used consistently across all model files
- `User`, `Category`, `Tag`, `Post`, `Project` class names match across `__init__.py` imports, test files, and model files
- `PostStatus` enum defined in `post.py`, imported in tests and `__init__.py`
- `post_tags` Table defined in `tag.py`, imported in `post.py` and `__init__.py`
- `seed_admin(session: Session)` signature matches test usage
- `get_db()` return type `Generator[Session, None, None]` matches FastAPI dependency pattern
- `settings` instance fields (ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD) match seed.py env var lookups

### Scope Check

This plan covers Phase 1 (infrastructure) only. It produces working, testable software: a running monorepo with all database models, migrations, a health-check API, admin seed, Docker dev environment, and CI. Subsequent phases (backend API, frontend pages, admin panel, deployment) will be planned separately.

---

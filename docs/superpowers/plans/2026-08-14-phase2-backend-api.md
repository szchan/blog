# Phase 2: Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete FastAPI backend API — Pydantic schemas, JWT authentication, layered repositories/services, public read endpoints, and admin CRUD endpoints — with full test coverage.

**Architecture:** Layered: `routers → services → repositories → models`. Schemas (Pydantic) decouple API contracts from ORM. Security module handles JWT + bcrypt. Dependency injection for DB session and current user.

**Tech Stack:** FastAPI, Pydantic 2, python-jose (JWT), passlib (bcrypt), SQLAlchemy 2.0, pytest, httpx TestClient.

## Global Constraints

- Python >= 3.12, SQLAlchemy 2.0+ `Mapped`/`mapped_column` style
- Pydantic 2+ with `from_attributes=True` for ORM compatibility (`model_config = ConfigDict(from_attributes=True)`)
- Test DB: SQLite in-memory, override `get_db` for TestClient
- All code must pass `ruff check` and `mypy app/`
- `uv pip install` / `uv run pytest` (venv at `apps/api/.venv/`)
- Run commands from `apps/api/` directory
- Conventional commits
- DO NOT add comments to code unless asked
- Existing patterns: `from __future__ import annotations` + `TYPE_CHECKING` for forward refs

---

## File Structure

```
apps/api/app/
├── api/                         # NEW
│   ├── __init__.py
│   ├── deps.py                  # get_current_user, get_current_admin
│   ├── auth.py                  # login, logout, me
│   ├── posts.py                 # public post endpoints
│   ├── tags.py                  # public tag endpoints
│   ├── categories.py            # public category endpoints
│   ├── projects.py              # public project endpoints
│   └── admin/
│       ├── __init__.py
│       ├── posts.py             # admin post CRUD
│       ├── tags.py              # admin tag CRUD
│       ├── categories.py        # admin category CRUD
│       └── projects.py          # admin project CRUD
├── core/
│   ├── security.py              # NEW: JWT, password hashing
│   └── seed.py                  # MODIFY: import pwd_context from security
├── repositories/                # NEW
│   ├── __init__.py
│   ├── base.py
│   ├── post.py
│   ├── tag.py
│   ├── category.py
│   └── project.py
├── schemas/                     # NEW
│   ├── __init__.py
│   ├── auth.py
│   ├── common.py
│   ├── post.py
│   ├── tag.py
│   ├── category.py
│   └── project.py
├── services/                    # NEW
│   ├── __init__.py
│   ├── auth.py
│   ├── post.py
│   ├── tag.py
│   ├── category.py
│   └── project.py
└── main.py                      # MODIFY: include routers, CORS

apps/api/tests/
├── conftest.py                  # MODIFY: add client, admin_client fixtures
├── test_security.py             # NEW
├── test_post_service.py         # NEW
├── test_auth.py                 # NEW
├── test_public_api.py           # NEW
├── test_admin_posts.py          # NEW
└── test_admin_misc.py           # NEW
```

---

## Task 1: Schemas + Security Module

**Files:**
- Create: `app/core/security.py`, `app/schemas/__init__.py`, `app/schemas/auth.py`, `app/schemas/common.py`, `app/schemas/tag.py`, `app/schemas/category.py`, `app/schemas/post.py`, `app/schemas/project.py`, `tests/test_security.py`
- Modify: `app/core/seed.py` (import pwd_context from security)

**Interfaces:**
- Produces: `hash_password(plain) -> str`, `verify_password(plain, hashed) -> bool`, `create_access_token(subject) -> str`, `decode_access_token(token) -> str | None`, all Pydantic schemas listed below

- [ ] **Step 1: Create `app/core/security.py`**

```python
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None
```

- [ ] **Step 2: Modify `app/core/seed.py` to import from security**

Replace the `pwd_context` import and definition:
```python
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
```

- [ ] **Step 3: Create `app/schemas/__init__.py`** (empty)

- [ ] **Step 4: Create `app/schemas/common.py`**

```python
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int
```

- [ ] **Step 5: Create `app/schemas/auth.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    username: str
    is_admin: bool
    created_at: datetime
```

- [ ] **Step 6: Create `app/schemas/tag.py`**

```python
import uuid

from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    name: str
    slug: str


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class TagWithCountResponse(TagResponse):
    post_count: int
```

- [ ] **Step 7: Create `app/schemas/category.py`**

```python
import uuid

from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    slug: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class CategoryWithCountResponse(CategoryResponse):
    post_count: int
```

- [ ] **Step 8: Create `app/schemas/post.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.post import PostStatus
from app.schemas.category import CategoryResponse
from app.schemas.tag import TagResponse
from app.schemas.auth import UserResponse


class PostBase(BaseModel):
    title: str
    slug: str
    excerpt: str | None = None
    content: str
    cover_image: str | None = None


class PostCreate(PostBase):
    tag_ids: list[uuid.UUID] = []
    category_id: uuid.UUID | None = None
    status: PostStatus = PostStatus.draft


class PostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    cover_image: str | None = None
    status: PostStatus | None = None
    tag_ids: list[uuid.UUID] | None = None
    category_id: uuid.UUID | None = None


class PostListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None
    cover_image: str | None
    status: PostStatus
    views: int
    created_at: datetime
    published_at: datetime | None
    tags: list[TagResponse]
    category: CategoryResponse | None


class PostDetailResponse(PostListResponse):
    content: str
    author: UserResponse
    updated_at: datetime
```

- [ ] **Step 9: Create `app/schemas/project.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    title: str
    slug: str
    description: str
    content: str
    tech_stack: list[str]
    github_url: str
    demo_url: str | None = None
    cover_image: str | None = None
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    content: str | None = None
    tech_stack: list[str] | None = None
    github_url: str | None = None
    demo_url: str | None = None
    cover_image: str | None = None
    sort_order: int | None = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
```

- [ ] **Step 10: Write failing test `tests/test_security.py`**

```python
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_password():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token("user-123")
    assert token is not None
    assert decode_access_token(token) == "user-123"


def test_decode_invalid_token_returns_none():
    assert decode_access_token("invalid.token.here") is None
```

- [ ] **Step 11: Run test to verify it passes**

Run: `uv run python -m pytest tests/test_security.py -v`
Expected: PASS (3 tests)

- [ ] **Step 12: Run existing tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/ tests/test_security.py
git commit -m "feat: add Pydantic schemas and JWT security module"
```

---

## Task 2: Repository Layer

**Files:**
- Create: `app/repositories/__init__.py`, `app/repositories/base.py`, `app/repositories/post.py`, `app/repositories/tag.py`, `app/repositories/category.py`, `app/repositories/project.py`

**Interfaces:**
- Consumes: Models from Phase 1, `Session` from `app.core.database`
- Produces: `BaseRepository(session)`, `PostRepository`, `TagRepository`, `CategoryRepository`, `ProjectRepository`

- [ ] **Step 1: Create `app/repositories/__init__.py`** (empty)

- [ ] **Step 2: Create `app/repositories/base.py`**

```python
from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, session: Session, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, obj_id: uuid.UUID) -> ModelT | None:
        return self.session.get(self.model, obj_id)

    def get_all(self) -> list[ModelT]:
        return self.session.query(self.model).all()

    def add(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
        self.session.flush()
```

> Note: Add `import uuid` at the top of `base.py`.

- [ ] **Step 3: Create `app/repositories/post.py`**

```python
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.post import Post, PostStatus
from app.models.tag import post_tags, Tag
from app.repositories.base import BaseRepository


class PostRepository(BaseRepository[Post]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Post)

    def get_published_posts(
        self,
        page: int,
        per_page: int,
        tag_slug: str | None = None,
        category_slug: str | None = None,
    ) -> tuple[list[Post], int]:
        query = (
            self.session.query(Post)
            .filter(Post.status == PostStatus.published)
            .options(
                selectinload(Post.tags),
                joinedload(Post.category),
            )
        )
        if tag_slug:
            query = query.join(post_tags).join(Tag).filter(Tag.slug == tag_slug)
        if category_slug:
            from app.models.category import Category
            query = query.join(Category).filter(Category.slug == category_slug)
        total = query.count()
        posts = (
            query.order_by(Post.published_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return posts, total

    def get_by_slug(self, slug: str) -> Post | None:
        return (
            self.session.query(Post)
            .filter(Post.slug == slug)
            .options(
                joinedload(Post.author),
                selectinload(Post.tags),
                joinedload(Post.category),
            )
            .first()
        )

    def get_by_id(self, obj_id: uuid.UUID) -> Post | None:
        return (
            self.session.query(Post)
            .filter(Post.id == obj_id)
            .options(
                joinedload(Post.author),
                selectinload(Post.tags),
                joinedload(Post.category),
            )
            .first()
        )

    def get_all(self) -> list[Post]:
        return (
            self.session.query(Post)
            .options(selectinload(Post.tags), joinedload(Post.category))
            .order_by(Post.created_at.desc())
            .all()
        )

    def increment_views(self, post: Post) -> None:
        post.views += 1
        self.session.flush()
```

- [ ] **Step 4: Create `app/repositories/tag.py`**

```python
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.tag import Tag, post_tags
from app.repositories.base import BaseRepository


class TagRepository(BaseRepository[Tag]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Tag)

    def get_all_with_counts(self) -> list[tuple[Tag, int]]:
        return (
            self.session.query(Tag, func.count(post_tags.c.post_id).label("post_count"))
            .outerjoin(post_tags)
            .group_by(Tag.id)
            .all()
        )

    def get_by_slug(self, slug: str) -> Tag | None:
        return self.session.query(Tag).filter(Tag.slug == slug).first()
```

- [ ] **Step 5: Create `app/repositories/category.py`**

```python
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.post import Post
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Category)

    def get_all_with_counts(self) -> list[tuple[Category, int]]:
        return (
            self.session.query(Category, func.count(Post.id).label("post_count"))
            .outerjoin(Post, Post.category_id == Category.id)
            .group_by(Category.id)
            .all()
        )

    def get_by_slug(self, slug: str) -> Category | None:
        return self.session.query(Category).filter(Category.slug == slug).first()
```

- [ ] **Step 6: Create `app/repositories/project.py`**

```python
from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Project)

    def get_all_ordered(self) -> list[Project]:
        return (
            self.session.query(Project)
            .order_by(Project.sort_order, Project.created_at.desc())
            .all()
        )

    def get_by_slug(self, slug: str) -> Project | None:
        return self.session.query(Project).filter(Project.slug == slug).first()
```

- [ ] **Step 7: Run ruff and mypy, then commit**

Run: `uv run ruff check . && uv run mypy app/`
Expected: No errors

```bash
git add app/repositories/
git commit -m "feat: add repository layer with eager loading and pagination"
```

---

## Task 3: Service Layer

**Files:**
- Create: `app/services/__init__.py`, `app/services/auth.py`, `app/services/post.py`, `app/services/tag.py`, `app/services/category.py`, `app/services/project.py`, `tests/test_post_service.py`

**Interfaces:**
- Consumes: Repositories from Task 2, security from Task 1, schemas from Task 1
- Produces: `AuthService`, `PostService`, `TagService`, `CategoryService`, `ProjectService`

- [ ] **Step 1: Create `app/services/__init__.py`** (empty)

- [ ] **Step 2: Create `app/services/auth.py`**

```python
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def authenticate(self, request: LoginRequest) -> TokenResponse | None:
        user = (
            self.session.query(User)
            .filter(User.email == request.email)
            .first()
        )
        if not user or not verify_password(request.password, user.password_hash):
            return None
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token)

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.session.query(User).filter(User.id == user_id).first()
```

- [ ] **Step 3: Create `app/services/post.py`**

```python
import uuid

from sqlalchemy.orm import Session

from app.models.post import Post, PostStatus
from app.repositories.post import PostRepository
from app.schemas.common import PaginatedResponse
from app.schemas.post import PostCreate, PostDetailResponse, PostListResponse, PostUpdate


class PostService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = PostRepository(session)

    def list_published_posts(
        self,
        page: int = 1,
        per_page: int = 10,
        tag: str | None = None,
        category: str | None = None,
    ) -> PaginatedResponse[PostListResponse]:
        posts, total = self.repo.get_published_posts(page, per_page, tag, category)
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        return PaginatedResponse[PostListResponse](
            items=[PostListResponse.model_validate(p) for p in posts],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
        )

    def get_post(self, slug: str) -> PostDetailResponse | None:
        post = self.repo.get_by_slug(slug)
        if post is None:
            return None
        self.repo.increment_views(post)
        self.session.commit()
        return PostDetailResponse.model_validate(post)

    def create_post(self, data: PostCreate, author_id: uuid.UUID) -> Post:
        post = Post(
            title=data.title,
            slug=data.slug,
            excerpt=data.excerpt,
            content=data.content,
            cover_image=data.cover_image,
            status=data.status,
            author_id=author_id,
            category_id=data.category_id,
            published_at=None,
        )
        if data.status == PostStatus.published:
            from datetime import datetime, timezone
            post.published_at = datetime.now(timezone.utc)
        if data.tag_ids:
            from app.models.tag import Tag
            tags = self.session.query(Tag).filter(Tag.id.in_(data.tag_ids)).all()
            post.tags = tags
        self.repo.add(post)
        self.session.commit()
        return post

    def update_post(self, post_id: uuid.UUID, data: PostUpdate) -> Post | None:
        post = self.repo.get_by_id(post_id)
        if post is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "tag_ids" in update_data:
            tag_ids = update_data.pop("tag_ids")
            from app.models.tag import Tag
            tags = self.session.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            post.tags = tags
        if "status" in update_data:
            if update_data["status"] == PostStatus.published and post.published_at is None:
                from datetime import datetime, timezone
                post.published_at = datetime.now(timezone.utc)
        for key, value in update_data.items():
            setattr(post, key, value)
        self.session.commit()
        return post

    def delete_post(self, post_id: uuid.UUID) -> bool:
        post = self.repo.get_by_id(post_id)
        if post is None:
            return False
        self.repo.delete(post)
        self.session.commit()
        return True

    def get_all_posts(self) -> list[PostListResponse]:
        posts = self.repo.get_all()
        return [PostListResponse.model_validate(p) for p in posts]
```

- [ ] **Step 4: Create `app/services/tag.py`**

```python
import uuid

from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.repositories.tag import TagRepository
from app.schemas.tag import TagCreate, TagResponse, TagUpdate, TagWithCountResponse


class TagService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = TagRepository(session)

    def list_tags(self) -> list[TagResponse]:
        tags = self.repo.get_all()
        return [TagResponse.model_validate(t) for t in tags]

    def list_tags_with_counts(self) -> list[TagWithCountResponse]:
        results = self.repo.get_all_with_counts()
        return [
            TagWithCountResponse(
                id=tag.id, name=tag.name, slug=tag.slug, post_count=count
            )
            for tag, count in results
        ]

    def create_tag(self, data: TagCreate) -> Tag:
        tag = Tag(name=data.name, slug=data.slug)
        self.repo.add(tag)
        self.session.commit()
        return tag

    def update_tag(self, tag_id: uuid.UUID, data: TagUpdate) -> Tag | None:
        tag = self.repo.get_by_id(tag_id)
        if tag is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(tag, key, value)
        self.session.commit()
        return tag

    def delete_tag(self, tag_id: uuid.UUID) -> bool:
        tag = self.repo.get_by_id(tag_id)
        if tag is None:
            return False
        self.repo.delete(tag)
        self.session.commit()
        return True
```

- [ ] **Step 5: Create `app/services/category.py`**

```python
import uuid

from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithCountResponse,
)


class CategoryService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = CategoryRepository(session)

    def list_categories(self) -> list[CategoryResponse]:
        cats = self.repo.get_all()
        return [CategoryResponse.model_validate(c) for c in cats]

    def list_categories_with_counts(self) -> list[CategoryWithCountResponse]:
        results = self.repo.get_all_with_counts()
        return [
            CategoryWithCountResponse(
                id=cat.id, name=cat.name, slug=cat.slug, post_count=count
            )
            for cat, count in results
        ]

    def create_category(self, data: CategoryCreate) -> Category:
        cat = Category(name=data.name, slug=data.slug)
        self.repo.add(cat)
        self.session.commit()
        return cat

    def update_category(self, cat_id: uuid.UUID, data: CategoryUpdate) -> Category | None:
        cat = self.repo.get_by_id(cat_id)
        if cat is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cat, key, value)
        self.session.commit()
        return cat

    def delete_category(self, cat_id: uuid.UUID) -> bool:
        cat = self.repo.get_by_id(cat_id)
        if cat is None:
            return False
        self.repo.delete(cat)
        self.session.commit()
        return True
```

- [ ] **Step 6: Create `app/services/project.py`**

```python
import uuid

from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate


class ProjectService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = ProjectRepository(session)

    def list_projects(self) -> list[ProjectResponse]:
        projects = self.repo.get_all_ordered()
        return [ProjectResponse.model_validate(p) for p in projects]

    def get_project(self, slug: str) -> ProjectResponse | None:
        project = self.repo.get_by_slug(slug)
        if project is None:
            return None
        return ProjectResponse.model_validate(project)

    def create_project(self, data: ProjectCreate) -> Project:
        project = Project(
            title=data.title,
            slug=data.slug,
            description=data.description,
            content=data.content,
            tech_stack=data.tech_stack,
            github_url=data.github_url,
            demo_url=data.demo_url,
            cover_image=data.cover_image,
            sort_order=data.sort_order,
        )
        self.repo.add(project)
        self.session.commit()
        return project

    def update_project(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project | None:
        project = self.repo.get_by_id(project_id)
        if project is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
        self.session.commit()
        return project

    def delete_project(self, project_id: uuid.UUID) -> bool:
        project = self.repo.get_by_id(project_id)
        if project is None:
            return False
        self.repo.delete(project)
        self.session.commit()
        return True
```

- [ ] **Step 7: Write failing test `tests/test_post_service.py`**

```python
import uuid

from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.tag import Tag
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate
from app.services.post import PostService


def make_author(session):
    author = User(email="author@test.com", username="author", password_hash="h")
    session.add(author)
    session.flush()
    return author


def test_create_and_get_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(
            title="Test Post",
            slug="test-post",
            content="Hello",
            status=PostStatus.published,
        ),
        author_id=author.id,
    )
    assert post.id is not None
    assert post.status == PostStatus.published
    assert post.published_at is not None

    result = svc.get_post("test-post")
    assert result is not None
    assert result.title == "Test Post"
    assert result.views == 1


def test_list_published_posts_pagination(session):
    author = make_author(session)
    svc = PostService(session)
    for i in range(15):
        svc.create_post(
            PostCreate(
                title=f"Post {i}",
                slug=f"post-{i}",
                content="content",
                status=PostStatus.published,
            ),
            author_id=author.id,
        )
    result = svc.list_published_posts(page=1, per_page=10)
    assert result.total == 15
    assert len(result.items) == 10
    assert result.total_pages == 2

    page2 = svc.list_published_posts(page=2, per_page=10)
    assert len(page2.items) == 5


def test_update_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(title="Old", slug="old", content="old"),
        author_id=author.id,
    )
    updated = svc.update_post(post.id, PostUpdate(title="New Title"))
    assert updated is not None
    assert updated.title == "New Title"


def test_delete_post(session):
    author = make_author(session)
    svc = PostService(session)
    post = svc.create_post(
        PostCreate(title="Delete Me", slug="delete-me", content="bye"),
        author_id=author.id,
    )
    assert svc.delete_post(post.id) is True
    assert svc.get_post("delete-me") is None
```

- [ ] **Step 8: Run test to verify it passes**

Run: `uv run python -m pytest tests/test_post_service.py -v`
Expected: PASS (4 tests)

- [ ] **Step 9: Run all tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/services/ tests/test_post_service.py
git commit -m "feat: add service layer with business logic and post service tests"
```

---

## Task 4: Auth Router + Test Client Fixtures

**Files:**
- Create: `app/api/__init__.py`, `app/api/deps.py`, `app/api/auth.py`, `tests/test_auth.py`
- Modify: `tests/conftest.py` (add client, admin_client fixtures)

**Interfaces:**
- Consumes: `AuthService` from Task 3, security from Task 1
- Produces: `get_current_user` dependency, `get_current_admin` dependency, `oauth2_scheme`, auth router with login/logout/me

- [ ] **Step 1: Create `app/api/__init__.py`** (empty)

- [ ] **Step 2: Create `app/api/deps.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user
```

- [ ] **Step 3: Create `app/api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    svc = AuthService(db)
    token = svc.authenticate(request)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    response = JSONResponse(content=token.model_dump())
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        samesite="lax",
    )
    return response


@router.post("/logout")
def logout() -> dict[str, str]:
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token")
    return response


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)) -> User:
    return user
```

- [ ] **Step 4: Modify `tests/conftest.py` — add client and admin_client fixtures**

Add these fixtures to the existing conftest.py (keep existing engine, session, _resolvable_tables):

```python
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User


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
```

- [ ] **Step 5: Write failing test `tests/test_auth.py`**

```python
from app.core.security import hash_password
from app.models.user import User


def test_login_success(client, session):
    user = User(
        email="test@test.com",
        username="testuser",
        password_hash=hash_password("password123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, session):
    user = User(
        email="test@test.com",
        username="testuser",
        password_hash=hash_password("password123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me_with_token(client, session):
    user = User(
        email="me@test.com",
        username="meuser",
        password_hash=hash_password("pass123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "me@test.com", "password": "pass123"},
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_get_me_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
```

- [ ] **Step 6: Run test to verify — some may fail because routers aren't wired into main.py yet**

Run: `uv run python -m pytest tests/test_auth.py -v`
Expected: Tests may fail because main.py doesn't include the auth router yet. That's OK — we'll wire up in Task 8. But to make these tests pass now, we need to include the auth router in main.py.

Actually, to make tests pass, add a temporary include in main.py:

Modify `app/main.py` to include the auth router:
```python
from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(title="Blog API", version="0.1.0")
app.include_router(auth_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `uv run python -m pytest tests/test_auth.py -v`
Expected: PASS (4 tests)

- [ ] **Step 8: Run all tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/api/ tests/conftest.py tests/test_auth.py app/main.py
git commit -m "feat: add auth router with JWT login, logout, me endpoints"
```

---

## Task 5: Public API Routers

**Files:**
- Create: `app/api/posts.py`, `app/api/tags.py`, `app/api/categories.py`, `app/api/projects.py`, `tests/test_public_api.py`
- Modify: `app/main.py` (include new routers)

**Interfaces:**
- Consumes: `PostService`, `TagService`, `CategoryService`, `ProjectService` from Task 3
- Produces: Public API routers for posts, tags, categories, projects

- [ ] **Step 1: Create `app/api/posts.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.post import PostDetailResponse, PostListResponse
from app.services.post import PostService

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=PaginatedResponse[PostListResponse])
def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    tag: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PaginatedResponse[PostListResponse]:
    svc = PostService(db)
    return svc.list_published_posts(page=page, per_page=per_page, tag=tag, category=category)


@router.get("/{slug}", response_model=PostDetailResponse)
def get_post(slug: str, db: Session = Depends(get_db)) -> PostDetailResponse:
    svc = PostService(db)
    post = svc.get_post(slug)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
```

- [ ] **Step 2: Create `app/api/tags.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tag import TagWithCountResponse
from app.services.tag import TagService

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagWithCountResponse])
def list_tags(db: Session = Depends(get_db)) -> list[TagWithCountResponse]:
    svc = TagService(db)
    return svc.list_tags_with_counts()
```

- [ ] **Step 3: Create `app/api/categories.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.category import CategoryWithCountResponse
from app.services.category import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithCountResponse])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryWithCountResponse]:
    svc = CategoryService(db)
    return svc.list_categories_with_counts()
```

- [ ] **Step 4: Create `app/api/projects.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.project import ProjectResponse
from app.services.project import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectResponse]:
    svc = ProjectService(db)
    return svc.list_projects()


@router.get("/{slug}", response_model=ProjectResponse)
def get_project(slug: str, db: Session = Depends(get_db)) -> ProjectResponse:
    svc = ProjectService(db)
    project = svc.get_project(slug)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
```

- [ ] **Step 5: Update `app/main.py` to include all public routers**

```python
from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.posts import router as posts_router
from app.api.projects import router as projects_router
from app.api.tags import router as tags_router

app = FastAPI(title="Blog API", version="0.1.0")

app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(tags_router)
app.include_router(categories_router)
app.include_router(projects_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

- [ ] **Step 6: Write failing test `tests/test_public_api.py`**

```python
from app.models.category import Category
from app.models.post import Post, PostStatus
from app.models.project import Project
from app.models.tag import Tag
from app.models.user import User


def make_published_post(session, slug, title="Test", tags=None, category=None):
    author = User(email=f"{slug}@test.com", username=slug, password_hash="h")
    session.add(author)
    session.flush()
    post = Post(
        title=title,
        slug=slug,
        content="Content here",
        status=PostStatus.published,
        author_id=author.id,
        category_id=category.id if category else None,
    )
    if tags:
        post.tags = tags
    session.add(post)
    session.commit()
    return post


def test_list_posts_empty(client):
    response = client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_list_posts_with_data(client, session):
    make_published_post(session, "post-1", "First Post")
    make_published_post(session, "post-2", "Second Post")
    response = client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_get_post_by_slug(client, session):
    make_published_post(session, "my-post", "My Post")
    response = client.get("/api/posts/my-post")
    assert response.status_code == 200
    assert response.json()["title"] == "My Post"
    assert response.json()["content"] == "Content here"


def test_get_post_not_found(client):
    response = client.get("/api/posts/nonexistent")
    assert response.status_code == 404


def test_list_tags_with_counts(client, session):
    post = make_published_post(session, "tagged-post")
    tag = Tag(name="Python", slug="python")
    session.add(tag)
    session.flush()
    post.tags = [tag]
    session.commit()

    response = client.get("/api/tags")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Python"
    assert data[0]["post_count"] == 1


def test_list_categories_with_counts(client, session):
    cat = Category(name="Tech", slug="tech")
    session.add(cat)
    session.commit()
    make_published_post(session, "cat-post", category=cat)

    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Tech"
    assert data[0]["post_count"] == 1


def test_list_projects(client, session):
    project = Project(
        title="My Project",
        slug="my-project",
        description="A cool project",
        content="Details",
        tech_stack=["Python", "React"],
        github_url="https://github.com/me/project",
    )
    session.add(project)
    session.commit()

    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "My Project"
    assert data[0]["tech_stack"] == ["Python", "React"]


def test_get_project_by_slug(client, session):
    Project(
        title="Portfolio",
        slug="portfolio",
        description="My portfolio",
        content="Details",
        tech_stack=["FastAPI"],
        github_url="https://github.com/me/portfolio",
    )
    session.commit()

    response = client.get("/api/projects/portfolio")
    assert response.status_code == 200
    assert response.json()["title"] == "Portfolio"


def test_get_project_not_found(client):
    response = client.get("/api/projects/nonexistent")
    assert response.status_code == 404
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `uv run python -m pytest tests/test_public_api.py -v`
Expected: PASS (9 tests)

- [ ] **Step 8: Run all tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/api/ tests/test_public_api.py app/main.py
git commit -m "feat: add public API endpoints for posts, tags, categories, projects"
```

---

## Task 6: Admin API — Posts CRUD

**Files:**
- Create: `app/api/admin/__init__.py`, `app/api/admin/posts.py`, `tests/test_admin_posts.py`

**Interfaces:**
- Consumes: `PostService` from Task 3, `get_current_admin` from Task 4
- Produces: Admin posts CRUD router

- [ ] **Step 1: Create `app/api/admin/__init__.py`** (empty)

- [ ] **Step 2: Create `app/api/admin/posts.py`**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.post import PostCreate, PostListResponse, PostUpdate
from app.services.post import PostService

router = APIRouter(prefix="/api/admin/posts", tags=["admin-posts"])


@router.get("", response_model=list[PostListResponse])
def list_all_posts(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[PostListResponse]:
    svc = PostService(db)
    return svc.get_all_posts()


@router.post("", response_model=PostListResponse, status_code=201)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PostListResponse:
    svc = PostService(db)
    post = svc.create_post(data, author_id=admin.id)
    return PostListResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostListResponse)
def update_post(
    post_id: uuid.UUID,
    data: PostUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PostListResponse:
    svc = PostService(db)
    post = svc.update_post(post_id, data)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostListResponse.model_validate(post)


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = PostService(db)
    if not svc.delete_post(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
```

- [ ] **Step 3: Update `app/main.py` to include admin posts router**

Add to the imports:
```python
from app.api.admin.posts import router as admin_posts_router
```

Add to the router includes:
```python
app.include_router(admin_posts_router)
```

- [ ] **Step 4: Write failing test `tests/test_admin_posts.py`**

```python
from app.models.post import Post, PostStatus
from app.models.user import User


def test_admin_create_post(admin_client):
    response = admin_client.post(
        "/api/admin/posts",
        json={
            "title": "New Post",
            "slug": "new-post",
            "content": "Content",
            "status": "draft",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Post"
    assert response.json()["slug"] == "new-post"


def test_admin_list_all_posts(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Admin Post", slug="admin-post", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.get("/api/admin/posts")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Admin Post"


def test_admin_update_post(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Old", slug="old", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.put(
        f"/api/admin/posts/{post.id}",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_admin_delete_post(admin_client, session):
    author = User(email="a@t.com", username="a", password_hash="h", is_admin=True)
    session.add(author)
    session.commit()
    post = Post(title="Delete", slug="delete", content="c", author_id=author.id)
    session.add(post)
    session.commit()

    response = admin_client.delete(f"/api/admin/posts/{post.id}")
    assert response.status_code == 204


def test_admin_endpoints_require_auth(client):
    assert client.get("/api/admin/posts").status_code == 401
    assert client.post("/api/admin/posts", json={"title": "x", "slug": "x", "content": "x"}).status_code == 401
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `uv run python -m pytest tests/test_admin_posts.py -v`
Expected: PASS (5 tests)

- [ ] **Step 6: Run all tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/api/admin/ tests/test_admin_posts.py app/main.py
git commit -m "feat: add admin posts CRUD endpoints with auth"
```

---

## Task 7: Admin API — Tags, Categories, Projects + Image Upload

**Files:**
- Create: `app/api/admin/tags.py`, `app/api/admin/categories.py`, `app/api/admin/projects.py`, `tests/test_admin_misc.py`
- Modify: `app/main.py` (include new routers)

**Interfaces:**
- Consumes: `TagService`, `CategoryService`, `ProjectService` from Task 3, `get_current_admin` from Task 4
- Produces: Admin CRUD routers for tags, categories, projects

- [ ] **Step 1: Create `app/api/admin/tags.py`**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse, TagUpdate
from app.services.tag import TagService

router = APIRouter(prefix="/api/admin/tags", tags=["admin-tags"])


@router.get("", response_model=list[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[TagResponse]:
    svc = TagService(db)
    return svc.list_tags()


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TagResponse:
    svc = TagService(db)
    tag = svc.create_tag(data)
    return TagResponse.model_validate(tag)


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: uuid.UUID,
    data: TagUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TagResponse:
    svc = TagService(db)
    tag = svc.update_tag(tag_id, data)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return TagResponse.model_validate(tag)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = TagService(db)
    if not svc.delete_tag(tag_id):
        raise HTTPException(status_code=404, detail="Tag not found")
```

- [ ] **Step 2: Create `app/api/admin/categories.py`**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/api/admin/categories", tags=["admin-categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[CategoryResponse]:
    svc = CategoryService(db)
    return svc.list_categories()


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> CategoryResponse:
    svc = CategoryService(db)
    cat = svc.create_category(data)
    return CategoryResponse.model_validate(cat)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> CategoryResponse:
    svc = CategoryService(db)
    cat = svc.update_category(category_id, data)
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse.model_validate(cat)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = CategoryService(db)
    if not svc.delete_category(category_id):
        raise HTTPException(status_code=404, detail="Category not found")
```

- [ ] **Step 3: Create `app/api/admin/projects.py`**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project import ProjectService

router = APIRouter(prefix="/api/admin/projects", tags=["admin-projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[ProjectResponse]:
    svc = ProjectService(db)
    return svc.list_projects()


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> ProjectResponse:
    svc = ProjectService(db)
    project = svc.create_project(data)
    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> ProjectResponse:
    svc = ProjectService(db)
    project = svc.update_project(project_id, data)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    svc = ProjectService(db)
    if not svc.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
```

- [ ] **Step 4: Update `app/main.py` to include all admin routers**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.categories import router as admin_categories_router
from app.api.admin.posts import router as admin_posts_router
from app.api.admin.projects import router as admin_projects_router
from app.api.admin.tags import router as admin_tags_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.posts import router as posts_router
from app.api.projects import router as projects_router
from app.api.tags import router as tags_router

app = FastAPI(title="Blog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(tags_router)
app.include_router(categories_router)
app.include_router(projects_router)
app.include_router(admin_posts_router)
app.include_router(admin_tags_router)
app.include_router(admin_categories_router)
app.include_router(admin_projects_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

- [ ] **Step 5: Write test `tests/test_admin_misc.py`**

```python
def test_admin_create_tag(admin_client):
    response = admin_client.post(
        "/api/admin/tags",
        json={"name": "Python", "slug": "python"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Python"


def test_admin_update_tag(admin_client, session):
    create_resp = admin_client.post(
        "/api/admin/tags",
        json={"name": "Old Tag", "slug": "old-tag"},
    )
    tag_id = create_resp.json()["id"]
    response = admin_client.put(
        f"/api/admin/tags/{tag_id}",
        json={"name": "New Tag"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Tag"


def test_admin_delete_tag(admin_client):
    create_resp = admin_client.post(
        "/api/admin/tags",
        json={"name": "Delete Tag", "slug": "delete-tag"},
    )
    tag_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/tags/{tag_id}")
    assert response.status_code == 204


def test_admin_create_category(admin_client):
    response = admin_client.post(
        "/api/admin/categories",
        json={"name": "Tech", "slug": "tech"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Tech"


def test_admin_delete_category(admin_client):
    create_resp = admin_client.post(
        "/api/admin/categories",
        json={"name": "Delete", "slug": "delete"},
    )
    cat_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/categories/{cat_id}")
    assert response.status_code == 204


def test_admin_create_project(admin_client):
    response = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "New Project",
            "slug": "new-project",
            "description": "A project",
            "content": "Details",
            "tech_stack": ["Python"],
            "github_url": "https://github.com/me/proj",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Project"


def test_admin_update_project(admin_client):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Old",
            "slug": "old-proj",
            "description": "d",
            "content": "c",
            "tech_stack": [],
            "github_url": "https://github.com/me/old",
        },
    )
    proj_id = create_resp.json()["id"]
    response = admin_client.put(
        f"/api/admin/projects/{proj_id}",
        json={"title": "Updated Project"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Project"


def test_admin_delete_project(admin_client):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Delete",
            "slug": "del-proj",
            "description": "d",
            "content": "c",
            "tech_stack": [],
            "github_url": "https://github.com/me/del",
        },
    )
    proj_id = create_resp.json()["id"]
    response = admin_client.delete(f"/api/admin/projects/{proj_id}")
    assert response.status_code == 204


def test_admin_tags_require_auth(client):
    assert client.get("/api/admin/tags").status_code == 401
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `uv run python -m pytest tests/test_admin_misc.py -v`
Expected: PASS (9 tests)

- [ ] **Step 7: Run all tests, ruff, mypy, then commit**

Run: `uv run python -m pytest -v && uv run ruff check . && uv run mypy app/`
Expected: All pass

```bash
git add app/api/admin/ tests/test_admin_misc.py app/main.py
git commit -m "feat: add admin CRUD for tags, categories, projects with CORS"
```

---

## Task 8: Final Integration Test + Cleanup

**Files:**
- Modify: `tests/test_health.py` (verify health still works with all routers)

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: Run the full test suite**

Run: `uv run python -m pytest -v`
Expected: All tests pass — should be approximately 30+ tests across all files

- [ ] **Step 2: Run ruff and mypy on the full codebase**

Run: `uv run ruff check . && uv run mypy app/`
Expected: No errors

- [ ] **Step 3: Verify API docs are accessible**

Run the API server:
```
uv run uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` in a browser — verify all endpoints are listed:
- Auth: login, logout, me
- Public: posts (list + detail), tags, categories, projects (list + detail)
- Admin: posts CRUD, tags CRUD, categories CRUD, projects CRUD
- Health: /api/health

Stop the server (Ctrl+C).

- [ ] **Step 4: Commit if any fixes were needed**

If everything passes without fixes, skip this step. If fixes were needed:
```bash
git add -A
git commit -m "fix: integration test fixes for Phase 2 API"
```

---

## Self-Review

### Spec Coverage

- [x] Pydantic schemas for all entities (Task 1)
- [x] JWT authentication: login, logout, me (Task 4)
- [x] Security: password hashing, token creation/verification (Task 1)
- [x] Layered architecture: routers → services → repositories (Tasks 2-7)
- [x] Public API: posts list/detail, tags, categories, projects (Task 5)
- [x] Admin API: CRUD for posts, tags, categories, projects (Tasks 6-7)
- [x] Pagination: PaginatedResponse generic (Task 1, used in Task 5)
- [x] CORS middleware for frontend (Task 7)
- [x] Error handling: 404 for not found, 401 for unauth, 403 for forbidden (Tasks 4-7)
- [x] Tests: security, service, auth, public API, admin API (Tasks 1, 3-7)

### Placeholder Scan

No TBDs, TODOs, or "implement later" found. All steps contain concrete code.

### Type Consistency

- `PostService.create_post(data: PostCreate, author_id: uuid.UUID) -> Post` — matches usage in admin/posts.py
- `PostService.update_post(post_id: uuid.UUID, data: PostUpdate) -> Post | None` — matches admin router
- `PostService.list_published_posts(...) -> PaginatedResponse[PostListResponse]` — matches public router
- `AuthService.authenticate(request: LoginRequest) -> TokenResponse | None` — matches auth router
- `get_current_user` and `get_current_admin` return `User` — consistent across all admin routers
- `TagWithCountResponse` has `post_count: int` — matches service construction
- `CategoryWithCountResponse` has `post_count: int` — matches service construction
- `PaginatedResponse[T]` generic — used with `PostListResponse` in posts router

### Scope Check

This plan covers Phase 2 (backend API) only. It produces a fully working API with all endpoints from the design spec. Subsequent phases (frontend, admin panel, deployment) will be planned separately.

---

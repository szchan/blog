# Project Draft/Published Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add draft/published status to projects — new projects default to draft, public API only returns published, admin can toggle status.

**Architecture:** Mirrors the existing PostStatus pattern exactly: a `ProjectStatus` enum on the Project model, a filtered public service method, an unfiltered admin service method, and a status dropdown in the admin form.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Next.js 16, React 19, TypeScript.

## Global Constraints

- Backend commands: `uv run` from `apps/api/` (venv at `apps/api/.venv/`)
- Frontend commands: `npm run` from `apps/web/`
- ruff (`E, F, I, N, W, UP`; line-length 100), mypy (`warn_return_any`, `warn_unused_configs`, `disallow_untyped_defs`)
- TypeScript strict, conventional commits, NO comments in code unless asked
- Existing tests must not break: backend 56 tests, frontend 56 tests
- `from __future__ import annotations` + `TYPE_CHECKING` in models (follow Post model pattern)
- Backend on port 8001, frontend on port 3000

---

## File Structure

```
apps/api/
├── app/
│   ├── models/
│   │   └── project.py              # MODIFY: add ProjectStatus enum, status + published_at
│   ├── schemas/
│   │   └── project.py              # MODIFY: add status to ProjectBase/ProjectCreate/ProjectUpdate
│   ├── services/
│   │   └── project.py              # MODIFY: filter list_projects by published, add get_all_projects
│   ├── repositories/
│   │   └── project.py              # MODIFY: add get_published_ordered method
│   └── api/
│       └── admin/projects.py       # MODIFY: list endpoint calls get_all_projects instead of list_projects
├── alembic/versions/
│   └── *_add_status_to_projects.py # CREATE: migration
└── tests/
    └── test_project_status.py      # CREATE: status filtering tests

apps/web/
├── lib/types.ts                    # MODIFY: add status to Project, ProjectCreate, ProjectUpdate
├── components/admin/ProjectForm.tsx # MODIFY: add status dropdown
└── app/admin/projects/page.tsx      # MODIFY: add status badge column
```

---

## Task 1: Backend — Model, Migration, Service, Tests

**Files:**
- Modify: `apps/api/app/models/project.py`
- Modify: `apps/api/app/repositories/project.py`
- Modify: `apps/api/app/schemas/project.py`
- Modify: `apps/api/app/services/project.py`
- Modify: `apps/api/app/api/admin/projects.py`
- Create: `apps/api/alembic/versions/<auto>_add_status_to_projects.py`
- Create: `apps/api/tests/test_project_status.py`

**Interfaces:**
- Consumes: existing `BaseRepository`, `Project` model, `PostStatus` pattern from `app/models/post.py`
- Produces: `ProjectStatus` enum, `Project.status` / `Project.published_at` fields, `ProjectService.get_all_projects()`, filtered `ProjectService.list_projects()` / `get_project()`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/test_project_status.py`:

```python
from app.models.project import Project, ProjectStatus


def test_default_status_is_draft(session):
    project = Project(
        title="Test",
        slug="test",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
    )
    session.add(project)
    session.commit()
    assert project.status == ProjectStatus.draft
    assert project.published_at is None


def test_published_project_has_published_at(session):
    project = Project(
        title="Test",
        slug="test",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    session.add(project)
    session.commit()
    assert project.status == ProjectStatus.published
    assert project.published_at is not None


def test_public_api_only_returns_published(client, session):
    published = Project(
        title="Published",
        slug="published",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    draft = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add_all([published, draft])
    session.commit()

    response = client.get("/api/projects")
    assert response.status_code == 200
    slugs = [p["slug"] for p in response.json()]
    assert "published" in slugs
    assert "draft" not in slugs


def test_public_api_404_for_draft_project(client, session):
    project = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add(project)
    session.commit()

    response = client.get("/api/projects/draft")
    assert response.status_code == 404


def test_admin_api_returns_all_projects(admin_client, session):
    published = Project(
        title="Published",
        slug="published",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.published,
    )
    draft = Project(
        title="Draft",
        slug="draft",
        description="desc",
        content="content",
        tech_stack=[],
        github_url="https://github.com/test/repo",
        status=ProjectStatus.draft,
    )
    session.add_all([published, draft])
    session.commit()

    response = admin_client.get("/api/admin/projects")
    assert response.status_code == 200
    slugs = [p["slug"] for p in response.json()]
    assert "published" in slugs
    assert "draft" in slugs


def test_create_project_defaults_to_draft(admin_client):
    response = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "New Project",
            "slug": "new-project",
            "description": "desc",
            "content": "content",
            "tech_stack": [],
            "github_url": "https://github.com/test/repo",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "draft"


def test_update_to_published_sets_published_at(admin_client, session):
    create_resp = admin_client.post(
        "/api/admin/projects",
        json={
            "title": "Test",
            "slug": "test",
            "description": "desc",
            "content": "content",
            "tech_stack": [],
            "github_url": "https://github.com/test/repo",
        },
    )
    project_id = create_resp.json()["id"]

    update_resp = admin_client.put(
        f"/api/admin/projects/{project_id}",
        json={"status": "published"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "published"
    assert update_resp.json()["published_at"] is not None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run python -m pytest tests/test_project_status.py -v`
Expected: FAIL — `ProjectStatus` doesn't exist, `status` field missing

- [ ] **Step 3: Update `apps/api/app/models/project.py`**

Replace the entire file:

```python
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import Base

if TYPE_CHECKING:
    pass


class ProjectStatus(enum.Enum):
    draft = "draft"
    published = "published"


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
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.draft
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 4: Update `apps/api/app/repositories/project.py`**

Add a `get_published_ordered` method and modify `get_by_slug` to filter by published:

```python
from sqlalchemy.orm import Session

from app.models.project import Project, ProjectStatus
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Project)

    def get_published_ordered(self) -> list[Project]:
        return (
            self.session.query(Project)
            .filter(Project.status == ProjectStatus.published)
            .order_by(Project.sort_order, Project.created_at.desc())
            .all()
        )

    def get_by_slug(self, slug: str) -> Project | None:
        return (
            self.session.query(Project)
            .filter(Project.slug == slug)
            .filter(Project.status == ProjectStatus.published)
            .first()
        )

    def get_all_ordered(self) -> list[Project]:
        return (
            self.session.query(Project)
            .order_by(Project.sort_order, Project.created_at.desc())
            .all()
        )
```

Note: `get_by_slug` now filters by published. The admin router's `get_project_by_id` uses `svc.repo.get_by_id()` from `BaseRepository` which does NOT filter — this is correct for admin.

- [ ] **Step 5: Update `apps/api/app/schemas/project.py`**

Add `status` to `ProjectBase` (so it appears in Create, Update, and Response) and `published_at` to `ProjectResponse`:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus


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
    status: ProjectStatus = ProjectStatus.draft


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
    status: ProjectStatus | None = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    published_at: datetime | None
```

- [ ] **Step 6: Update `apps/api/app/services/project.py`**

- `list_projects()` calls `repo.get_published_ordered()` (public, filtered)
- `get_project(slug)` uses `repo.get_by_slug()` which now filters by published
- `get_all_projects()` calls `repo.get_all_ordered()` (admin, unfiltered)
- `create_project()` sets `published_at` if status is published
- `update_project()` sets/clears `published_at` on status change

```python
import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.project import Project, ProjectStatus
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate


class ProjectService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = ProjectRepository(session)

    def list_projects(self) -> list[ProjectResponse]:
        projects = self.repo.get_published_ordered()
        return [ProjectResponse.model_validate(p) for p in projects]

    def get_all_projects(self) -> list[ProjectResponse]:
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
            status=data.status,
        )
        if data.status == ProjectStatus.published:
            project.published_at = datetime.now(UTC)
        self.repo.add(project)
        self.session.commit()
        return project

    def update_project(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project | None:
        project = self.repo.get_by_id(project_id)
        if project is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data:
            new_status = update_data["status"]
            if new_status == ProjectStatus.published and project.published_at is None:
                update_data["published_at"] = datetime.now(UTC)
            elif new_status == ProjectStatus.draft:
                update_data["published_at"] = None
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

- [ ] **Step 7: Update `apps/api/app/api/admin/projects.py`**

Change the admin `list_projects` endpoint to call `svc.get_all_projects()` instead of `svc.list_projects()`:

In the `list_projects` function (line 21), change:
```python
    return svc.list_projects()
```
to:
```python
    return svc.get_all_projects()
```

- [ ] **Step 8: Create Alembic migration**

Run:
```bash
uv run alembic revision --autogenerate -m "add status to projects"
```

Then edit the generated migration file to add a server_default for existing rows. After the `add_column` calls, add:

```python
    op.execute("UPDATE projects SET status = 'published', published_at = created_at")
```

And change the `status` column to have `server_default="draft"` so new rows without a value get draft.

The migration should look like:

```python
"""add status to projects

Revision ID: <auto-generated>
Revises: <auto-generated>
Create Date: 2026-08-15
"""
from alembic import op
import sqlalchemy as sa
from app.models.project import ProjectStatus


def upgrade() -> None:
    op.add_column("projects", sa.Column("status", sa.Enum(ProjectStatus), nullable=True))
    op.add_column("projects", sa.Column("published_at", sa.DateTime(), nullable=True))
    op.execute("UPDATE projects SET status = 'published', published_at = created_at")
    op.alter_column("projects", "status", nullable=False, server_default="draft")


def downgrade() -> None:
    op.drop_column("projects", "published_at")
    op.drop_column("projects", "status")
```

- [ ] **Step 9: Run migration + tests**

```bash
uv run alembic upgrade head
uv run python -m pytest tests/test_project_status.py -v
```
Expected: 7 tests pass

- [ ] **Step 10: Run full suite + lint + typecheck**

```bash
uv run python -m pytest -v
uv run ruff check .
uv run mypy app/
```
Expected: All 63 tests pass (56 + 7 new), lint clean, typecheck clean

- [ ] **Step 11: Commit**

```bash
git add apps/api/app/models/project.py apps/api/app/repositories/project.py apps/api/app/schemas/project.py apps/api/app/services/project.py apps/api/app/api/admin/projects.py apps/api/alembic/versions/ apps/api/tests/test_project_status.py
git commit -m "feat: add draft/published status to projects"
```

---

## Task 2: Frontend — Types, Form, Admin List

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/components/admin/ProjectForm.tsx`
- Modify: `apps/web/app/admin/projects/page.tsx`

**Interfaces:**
- Consumes: `Project.status` field from Task 1's API response, existing `PostStatus` type
- Produces: status dropdown in ProjectForm, status badge in admin projects list

- [ ] **Step 1: Add `status` to frontend types**

In `apps/web/lib/types.ts`, update the `Project` interface (line 59) — add after `created_at`:

```typescript
  status: PostStatus;
  published_at: string | null;
```

Update `ProjectCreate` (line 125) — add after `sort_order`:

```typescript
  status?: PostStatus;
```

Update `ProjectUpdate` (line 137) — add after `sort_order`:

```typescript
  status?: PostStatus;
```

- [ ] **Step 2: Add status dropdown to ProjectForm**

In `apps/web/components/admin/ProjectForm.tsx`:

Add import:
```tsx
import type { PostStatus } from "@/lib/types";
```

Add state (after `sortOrder` state):
```tsx
const [status, setStatus] = useState<PostStatus>(project?.status ?? "draft");
```

In the submit data object, add:
```tsx
status,
```

Add the status dropdown UI. Place it in a 2-column grid alongside the Sort Order field (replace the existing single-column Sort Order div with a 2-column grid):

```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <div>
    <label className="mb-1 block text-sm text-muted">Tech Stack (comma-separated)</label>
    <input
      type="text"
      value={techStack}
      onChange={(e) => setTechStack(e.target.value)}
      placeholder="React, FastAPI, PostgreSQL"
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
    />
  </div>
  <div>
    <label className="mb-1 block text-sm text-muted">Sort Order</label>
    <input
      type="number"
      value={sortOrder}
      onChange={(e) => setSortOrder(Number(e.target.value))}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
    />
  </div>
</div>

<div>
  <label className="mb-1 block text-sm text-muted">Status</label>
  <select
    value={status}
    onChange={(e) => setStatus(e.target.value as PostStatus)}
    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
  >
    <option value="draft">Draft</option>
    <option value="published">Published</option>
  </select>
</div>
```

Note: The existing Tech Stack and Sort Order are already in a 2-col grid. Add the Status field as a new row below that grid (as a single full-width field, matching PostForm's layout).

- [ ] **Step 3: Add status badge to admin projects list**

In `apps/web/app/admin/projects/page.tsx`:

Add import:
```tsx
import { Badge } from "@/components/ui/Badge";
```

Add a "Status" column header in the table (after "Title", before "Tech Stack"):
```tsx
<th className="px-4 py-3 text-left text-sm font-medium text-muted">Status</th>
```

Add the status cell in each row (after the title cell):
```tsx
<td className="px-4 py-3">
  <Badge variant={project.status === "published" ? "gradient" : "default"}>
    {project.status}
  </Badge>
</td>
```

- [ ] **Step 4: Run frontend tests + build**

```bash
npm test
npm run build
```
Expected: All 56 tests pass, build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/types.ts apps/web/components/admin/ProjectForm.tsx apps/web/app/admin/projects/page.tsx
git commit -m "feat: add status dropdown and badge to project admin UI"
```

---

## Verification

After both tasks:

- [ ] Backend: `uv run python -m pytest -v` — 63 tests pass
- [ ] Backend lint: `uv run ruff check . && uv run mypy app/` — clean
- [ ] Frontend: `npm test` — 56 tests pass
- [ ] Frontend build: `npm run build` — succeeds
- [ ] Manual: create a project in admin (default draft) → not visible at `/projects` → change to published → visible at `/projects`

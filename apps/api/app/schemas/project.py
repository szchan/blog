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

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

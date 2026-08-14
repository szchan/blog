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

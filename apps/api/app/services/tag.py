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

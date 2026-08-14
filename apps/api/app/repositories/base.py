import uuid

from sqlalchemy.orm import Session

from app.models.base import Base


class BaseRepository[ModelT: Base]:
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

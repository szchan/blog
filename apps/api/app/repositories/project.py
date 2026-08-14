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

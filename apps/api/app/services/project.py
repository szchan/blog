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

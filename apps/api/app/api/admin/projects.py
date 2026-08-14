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

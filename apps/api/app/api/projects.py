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

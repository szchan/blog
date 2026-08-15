from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.admin.categories import router as admin_categories_router
from app.api.admin.posts import router as admin_posts_router
from app.api.admin.projects import router as admin_projects_router
from app.api.admin.tags import router as admin_tags_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.posts import router as posts_router
from app.api.projects import router as projects_router
from app.api.tags import router as tags_router
from app.core.config import settings

app = FastAPI(title="Blog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(tags_router)
app.include_router(categories_router)
app.include_router(projects_router)
app.include_router(admin_posts_router)
app.include_router(admin_tags_router)
app.include_router(admin_categories_router)
app.include_router(admin_projects_router)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": "Resource with this slug already exists"},
    )


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}

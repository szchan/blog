from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.categories import router as admin_categories_router
from app.api.admin.posts import router as admin_posts_router
from app.api.admin.projects import router as admin_projects_router
from app.api.admin.tags import router as admin_tags_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.posts import router as posts_router
from app.api.projects import router as projects_router
from app.api.tags import router as tags_router

app = FastAPI(title="Blog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}

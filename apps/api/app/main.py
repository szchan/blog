from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.posts import router as posts_router
from app.api.projects import router as projects_router
from app.api.tags import router as tags_router

app = FastAPI(title="Blog API", version="0.1.0")

app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(tags_router)
app.include_router(categories_router)
app.include_router(projects_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}

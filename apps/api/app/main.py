from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(title="Blog API", version="0.1.0")
app.include_router(auth_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}

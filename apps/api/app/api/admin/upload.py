import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.api.deps import get_current_admin
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/admin/upload", tags=["admin-upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("", status_code=201)
def upload_file(
    file: UploadFile,
    admin: User = Depends(get_current_admin),
) -> dict[str, str]:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")
    contents = file.file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/{filename}"}

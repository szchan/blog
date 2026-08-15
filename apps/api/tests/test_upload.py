import io

from fastapi.testclient import TestClient

from app.main import app


def test_upload_requires_auth():
    client = TestClient(app)
    response = client.post(
        "/api/admin/upload",
        files={"file": ("test.png", io.BytesIO(b"fake-png"), "image/png")},
    )
    assert response.status_code == 401


def test_upload_image_success(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("test.png", io.BytesIO(b"fake-png-data"), "image/png")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/")
    assert data["url"].endswith(".png")


def test_upload_rejects_non_image(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("test.txt", io.BytesIO(b"text-data"), "text/plain")},
    )
    assert response.status_code == 400


def test_upload_rejects_empty_file(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("empty.png", io.BytesIO(b""), "image/png")},
    )
    assert response.status_code == 400

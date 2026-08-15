from app.core.config import Settings


def test_default_cors_origins():
    settings = Settings()
    assert "http://localhost:3000" in settings.CORS_ORIGINS


def test_default_upload_dir():
    settings = Settings()
    assert settings.UPLOAD_DIR == "uploads"


def test_default_secure_cookies():
    settings = Settings()
    assert settings.SECURE_COOKIES is False

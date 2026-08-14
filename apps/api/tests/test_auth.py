from app.core.security import hash_password
from app.models.user import User


def test_login_success(client, session):
    user = User(
        email="test@test.com",
        username="testuser",
        password_hash=hash_password("password123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, session):
    user = User(
        email="test@test.com",
        username="testuser",
        password_hash=hash_password("password123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me_with_token(client, session):
    user = User(
        email="me@test.com",
        username="meuser",
        password_hash=hash_password("pass123"),
        is_admin=True,
    )
    session.add(user)
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "me@test.com", "password": "pass123"},
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_get_me_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

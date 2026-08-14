from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_password():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token("user-123")
    assert token is not None
    assert decode_access_token(token) == "user-123"


def test_decode_invalid_token_returns_none():
    assert decode_access_token("invalid.token.here") is None

from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def authenticate(self, request: LoginRequest) -> TokenResponse | None:
        user = (
            self.session.query(User)
            .filter(User.email == request.email)
            .first()
        )
        if not user or not verify_password(request.password, user.password_hash):
            return None
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token)

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.session.query(User).filter(User.id == user_id).first()

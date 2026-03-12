from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import (
    create_access_token,
    hash_password,
    require_admin,
    require_rd,
    verify_password,
)
from ..database import get_db
from ..models import Team, User
from ..schemas import LoginRequest, TokenOut, UserCreate, UserOut, UserTeamUpdate

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(400, "Username already exists")
    user = User(
        username=body.username,
        display_name=body.display_name,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(require_rd)):
    return user


# --- User management (admin only) ---


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).options(joinedload(User.teams)).all()


@router.patch("/users/{user_id}/teams", response_model=UserOut)
def update_user_teams(
    user_id: int,
    body: UserTeamUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).options(joinedload(User.teams)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.teams = db.query(Team).filter(Team.id.in_(body.team_ids)).all()
    db.commit()
    db.refresh(user)
    return user

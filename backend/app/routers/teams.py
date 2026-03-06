from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_rd
from ..database import get_db
from ..models import Team, User
from ..schemas import TeamCreate, TeamOut, TeamUpdate

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).order_by(Team.name).all()


@router.post("", response_model=TeamOut, status_code=201)
def create_team(body: TeamCreate, db: Session = Depends(get_db), _: User = Depends(require_rd)):
    if db.query(Team).filter(Team.name == body.name).first():
        raise HTTPException(400, "Team name already exists")
    team = Team(**body.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, body: TeamUpdate, db: Session = Depends(get_db), _: User = Depends(require_rd)):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(team, key, val)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db), _: User = Depends(require_rd)):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    db.delete(team)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..auth import require_rd
from ..database import get_db
from ..models import KanbanCard, Request, User
from ..schemas import (
    KanbanBoardOut,
    KanbanCardCreate,
    KanbanCardMove,
    KanbanCardOut,
    KanbanCardUpdate,
)

router = APIRouter(prefix="/api/kanban", tags=["kanban"])


def _check_team_access(user: User, team_id: int) -> None:
    if not user.is_admin and team_id not in user.team_ids:
        raise HTTPException(403, "Not a member of this team")


@router.post("/cards", response_model=KanbanCardOut, status_code=201)
def create_card(body: KanbanCardCreate, db: Session = Depends(get_db), user: User = Depends(require_rd)):
    _check_team_access(user, body.team_id)
    req = db.get(Request, body.request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status in ("done", "cancelled", "archived"):
        raise HTTPException(400, "Cannot assign completed or cancelled requests")
    existing = (
        db.query(KanbanCard)
        .filter(KanbanCard.request_id == body.request_id)
        .first()
    )

    max_pos = (
        db.query(KanbanCard.position)
        .filter(KanbanCard.team_id == body.team_id, KanbanCard.stage == "todo")
        .order_by(KanbanCard.position.desc())
        .first()
    )
    position = (max_pos[0] + 1000) if max_pos else 1000

    if existing:
        existing.team_id = body.team_id
        existing.assignee = body.assignee or ""
        existing.stage = "todo"
        existing.position = position
        card = existing
    else:
        card = KanbanCard(**body.model_dump(), position=position)
        db.add(card)

    req.status = "assigned"
    db.commit()
    db.refresh(card)
    return card


@router.get("/cards", response_model=KanbanBoardOut)
def list_cards(team_id: int | None = Query(None), db: Session = Depends(get_db), user: User = Depends(require_rd)):
    q = db.query(KanbanCard).options(joinedload(KanbanCard.request))
    if not user.is_admin:
        q = q.filter(KanbanCard.team_id.in_(user.team_ids))
    if team_id is not None:
        q = q.filter(KanbanCard.team_id == team_id)
    cards = q.order_by(KanbanCard.position).all()

    board = {"todo": [], "in_progress": [], "done": [], "release": []}
    for card in cards:
        if card.stage in board:
            board[card.stage].append(card)
    return board


@router.patch("/cards/{card_id}", response_model=KanbanCardOut)
def update_card(card_id: int, body: KanbanCardUpdate, db: Session = Depends(get_db), user: User = Depends(require_rd)):
    card = db.get(KanbanCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    _check_team_access(user, card.team_id)
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(card, key, val if not hasattr(val, "value") else val.value)
    _sync_request_status(card, db)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/cards/{card_id}/move", response_model=KanbanCardOut)
def move_card(card_id: int, body: KanbanCardMove, db: Session = Depends(get_db), user: User = Depends(require_rd)):
    card = db.get(KanbanCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    _check_team_access(user, card.team_id)

    card.stage = body.stage.value
    card.position = body.position
    _sync_request_status(card, db)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(card_id: int, db: Session = Depends(get_db), user: User = Depends(require_rd)):
    card = db.get(KanbanCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    _check_team_access(user, card.team_id)
    if card.request and card.request.status not in ("cancelled", "archived"):
        card.request.status = "new"
    db.delete(card)
    db.commit()


def _sync_request_status(card: KanbanCard, db: Session) -> None:
    req = db.get(Request, card.request_id)
    if not req or req.status == "cancelled":
        return
    if card.stage == "archived":
        new_status = "archived"
    elif card.stage in ("done", "release"):
        new_status = "done"
    else:
        new_status = "assigned"
    if req.status != new_status:
        req.status = new_status

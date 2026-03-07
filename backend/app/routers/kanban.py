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


@router.post("/cards", response_model=KanbanCardOut, status_code=201)
def create_card(body: KanbanCardCreate, db: Session = Depends(get_db), _: User = Depends(require_rd)):
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
def list_cards(team_id: int | None = Query(None), db: Session = Depends(get_db)):
    q = db.query(KanbanCard).options(joinedload(KanbanCard.request))
    if team_id is not None:
        q = q.filter(KanbanCard.team_id == team_id)
    cards = q.order_by(KanbanCard.position).all()

    board = {"todo": [], "in_progress": [], "review": [], "done": []}
    for card in cards:
        board[card.stage].append(card)
    return board


@router.patch("/cards/{card_id}", response_model=KanbanCardOut)
def update_card(card_id: int, body: KanbanCardUpdate, db: Session = Depends(get_db), _: User = Depends(require_rd)):
    card = db.get(KanbanCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(card, key, val if not hasattr(val, "value") else val.value)
    _sync_request_status(card, db)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/cards/{card_id}/move", response_model=KanbanCardOut)
def move_card(card_id: int, body: KanbanCardMove, db: Session = Depends(get_db), _: User = Depends(require_rd)):
    card = db.get(KanbanCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")

    card.stage = body.stage.value
    card.position = body.position
    _sync_request_status(card, db)
    db.commit()
    db.refresh(card)
    return card


def _sync_request_status(card: KanbanCard, db: Session) -> None:
    req = db.get(Request, card.request_id)
    if not req or req.status == "cancelled":
        return
    req.status = "done" if card.stage == "done" else "assigned"

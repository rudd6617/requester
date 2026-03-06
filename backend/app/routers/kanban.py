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
    if req.status != "in_progress":
        raise HTTPException(400, "Only in-progress requests can be assigned to kanban")
    existing = (
        db.query(KanbanCard)
        .filter(KanbanCard.request_id == body.request_id)
        .first()
    )
    if existing:
        raise HTTPException(400, "Request already has a kanban card")

    max_pos = (
        db.query(KanbanCard.position)
        .filter(KanbanCard.team_id == body.team_id, KanbanCard.stage == "todo")
        .order_by(KanbanCard.position.desc())
        .first()
    )
    position = (max_pos[0] + 1000) if max_pos else 1000

    card = KanbanCard(**body.model_dump(), position=position)
    db.add(card)
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
    db.commit()
    db.refresh(card)
    return card

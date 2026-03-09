from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user_or_none
from ..database import get_db
from ..models import KanbanCard, Request, User
from ..schemas import (
    Priority,
    RequestCreate,
    RequestListOut,
    RequestOut,
    RequestUpdate,
    Status,
)

router = APIRouter(prefix="/api/requests", tags=["requests"])

SORT_COLUMNS = {
    "id": Request.id,
    "title": Request.title,
    "requester": Request.requester,
    "priority": Request.priority,
    "status": Request.status,
    "risk": Request.risk,
    "created_at": Request.created_at,
    "updated_at": Request.updated_at,
}


@router.get("", response_model=RequestListOut)
def list_requests(
    status: Status | None = None,
    exclude_status: Status | None = None,
    priority: Priority | None = None,
    search: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Request)
    if status:
        q = q.filter(Request.status == status.value)
    elif exclude_status:
        q = q.filter(Request.status != exclude_status.value)
    if priority:
        q = q.filter(Request.priority == priority.value)
    if search:
        q = q.filter(Request.title.contains(search))

    total = q.count()

    sort_col = SORT_COLUMNS.get(sort, Request.created_at)
    items = (
        q.options(joinedload(Request.kanban_card).joinedload(KanbanCard.team))
        .order_by(desc(sort_col) if order == "desc" else sort_col)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    for item in items:
        item.assigned_team = item.kanban_card.team.name if item.kanban_card else None

    return RequestListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{request_id}", response_model=RequestOut)
def get_request(request_id: int, db: Session = Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.kanban_card).joinedload(KanbanCard.team))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(404, "Request not found")
    req.assigned_team = req.kanban_card.team.name if req.kanban_card else None
    return req


@router.post("", response_model=RequestOut, status_code=201)
def create_request(body: RequestCreate, db: Session = Depends(get_db)):
    req = Request(**body.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.patch("/{request_id}", response_model=RequestOut)
def update_request(
    request_id: int,
    body: RequestUpdate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_or_none),
):
    req = db.get(Request, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    data = body.model_dump(exclude_unset=True)
    # Drop unchanged status/priority before permission check
    for field in ("status", "priority"):
        if field in data:
            val = data[field].value if hasattr(data[field], "value") else data[field]
            if val == getattr(req, field):
                del data[field]
    rd_only_fields = {"status", "priority"}
    if not user and rd_only_fields & data.keys():
        raise HTTPException(403, "Only RD can change status and priority")
    if "status" in data:
        new_status = data["status"].value if hasattr(data["status"], "value") else data["status"]
        allowed = {
            ("new", "cancelled"),
            ("assigned", "cancelled"),
            ("done", "archived"),
            ("cancelled", "archived"),
        }
        if (req.status, new_status) not in allowed:
            raise HTTPException(400, f"Cannot change status from {req.status} to {new_status}")
        if new_status in ("cancelled", "archived") and req.kanban_card:
            db.delete(req.kanban_card)
    for key, val in data.items():
        setattr(req, key, val if not hasattr(val, "value") else val.value)
    db.commit()
    db.refresh(req)
    return req

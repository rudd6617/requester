from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Request
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
    "created_at": Request.created_at,
    "priority": Request.priority,
    "updated_at": Request.updated_at,
}


@router.get("", response_model=RequestListOut)
def list_requests(
    status: Status | None = None,
    priority: Priority | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Request)
    if status:
        q = q.filter(Request.status == status.value)
    if priority:
        q = q.filter(Request.priority == priority.value)

    total = q.count()

    sort_col = SORT_COLUMNS.get(sort, Request.created_at)
    q = q.order_by(desc(sort_col) if order == "desc" else sort_col)
    items = q.offset((page - 1) * page_size).limit(page_size).all()

    return RequestListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{request_id}", response_model=RequestOut)
def get_request(request_id: int, db: Session = Depends(get_db)):
    req = db.get(Request, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
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
    request_id: int, body: RequestUpdate, db: Session = Depends(get_db)
):
    req = db.get(Request, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(req, key, val if not hasattr(val, "value") else val.value)
    db.commit()
    db.refresh(req)
    return req

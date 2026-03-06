from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user_or_none
from ..database import get_db
from ..models import Comment, Request, User
from ..schemas import CommentCreate, CommentOut

router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.get("", response_model=list[CommentOut])
def list_comments(
    request_id: int = Query(...),
    db: Session = Depends(get_db),
):
    return (
        db.query(Comment)
        .filter(Comment.request_id == request_id)
        .order_by(Comment.created_at)
        .all()
    )


@router.post("", response_model=CommentOut, status_code=201)
def create_comment(
    body: CommentCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_or_none),
):
    req = db.get(Request, body.request_id)
    if not req:
        raise HTTPException(404, "Request not found")

    if not user and not body.author:
        raise HTTPException(400, "Author is required for non-logged-in users")

    comment = Comment(
        request_id=body.request_id,
        content=body.content,
        author=user.display_name if user else body.author,
        user_id=user.id if user else None,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

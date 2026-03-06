from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Priority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Status(str, Enum):
    new = "new"
    triage = "triage"
    approved = "approved"
    rejected = "rejected"
    postponed = "postponed"


class Stage(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"


# --- Team ---


class TeamCreate(BaseModel):
    name: str
    description: str = ""


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TeamOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Request ---


class RequestCreate(BaseModel):
    title: str
    description: str = ""
    business_impact: str = ""
    requester: str
    module: str = ""
    priority: Priority = Priority.medium
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    business_impact: Optional[str] = None
    module: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class RequestOut(BaseModel):
    id: int
    title: str
    description: str
    business_impact: str
    requester: str
    module: str
    priority: Priority
    status: Status
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RequestListOut(BaseModel):
    items: list[RequestOut]
    total: int
    page: int
    page_size: int


# --- KanbanCard ---


class KanbanCardCreate(BaseModel):
    request_id: int
    team_id: int
    assignee: str = ""


class KanbanCardUpdate(BaseModel):
    assignee: Optional[str] = None
    stage: Optional[Stage] = None


class KanbanCardMove(BaseModel):
    stage: Stage
    position: int


class KanbanCardOut(BaseModel):
    id: int
    request_id: int
    team_id: int
    assignee: str
    stage: Stage
    position: int
    created_at: datetime
    updated_at: datetime
    request: RequestOut

    model_config = {"from_attributes": True}


class KanbanBoardOut(BaseModel):
    todo: list[KanbanCardOut]
    in_progress: list[KanbanCardOut]
    review: list[KanbanCardOut]
    done: list[KanbanCardOut]

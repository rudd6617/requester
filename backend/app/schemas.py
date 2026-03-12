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
    assigned = "assigned"
    done = "done"
    cancelled = "cancelled"
    archived = "archived"


class Risk(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Stage(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"
    release = "release"
    archived = "archived"


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
    priority: Priority = Priority.medium
    risk: Optional[Risk] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    release_date: Optional[date] = None


class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    business_impact: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    risk: Optional[Risk] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    release_date: Optional[date] = None


class RequestOut(BaseModel):
    id: int
    title: str
    description: str
    business_impact: str
    requester: str
    priority: Priority
    status: Status
    risk: Optional[Risk] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    release_date: Optional[date] = None
    stage: Optional[Stage] = None
    created_at: datetime
    updated_at: datetime
    assigned_team: Optional[str] = None

    model_config = {"from_attributes": True}


class RequestListOut(BaseModel):
    items: list[RequestOut]
    total: int
    page: int
    page_size: int


# --- KanbanCard ---


# --- User / Auth ---


class UserCreate(BaseModel):
    username: str
    display_name: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    is_admin: bool
    team_ids: list[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserTeamUpdate(BaseModel):
    team_ids: list[int]


class TeamMembersUpdate(BaseModel):
    user_ids: list[int]


# --- Comment ---


class CommentCreate(BaseModel):
    request_id: int
    content: str
    author: str = ""


class CommentOut(BaseModel):
    id: int
    request_id: int
    author: str
    user_id: Optional[int] = None
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- KanbanCard ---


class KanbanCardCreate(BaseModel):
    request_id: int
    team_id: int
    assignee: str = ""


class KanbanCardUpdate(BaseModel):
    assignee: Optional[str] = None
    ticket_url: Optional[str] = None
    stage: Optional[Stage] = None


class KanbanCardMove(BaseModel):
    stage: Stage
    position: int


class KanbanCardOut(BaseModel):
    id: int
    request_id: int
    team_id: int
    assignee: str
    ticket_url: str
    stage: Stage
    position: int
    created_at: datetime
    updated_at: datetime
    request: RequestOut

    model_config = {"from_attributes": True}


class KanbanBoardOut(BaseModel):
    todo: list[KanbanCardOut]
    in_progress: list[KanbanCardOut]
    done: list[KanbanCardOut]
    release: list[KanbanCardOut]

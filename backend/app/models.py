from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base

user_teams = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), default="")
    created_at = Column(DateTime, server_default=func.now())

    kanban_cards = relationship("KanbanCard", back_populates="team")
    members = relationship("User", secondary=user_teams, back_populates="teams")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    business_impact = Column(Text, default="")
    requester = Column(String(100), nullable=False)
    priority = Column(
        Enum("critical", "high", "medium", "low", name="priority_enum"),
        default="medium",
        nullable=False,
    )
    status = Column(
        Enum("new", "assigned", "done", "cancelled", "archived", name="status_enum"),
        default="new",
        nullable=False,
    )
    risk = Column(
        Enum("high", "medium", "low", name="risk_enum"),
        nullable=True,
    )
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    release_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    kanban_card = relationship("KanbanCard", back_populates="request", uselist=False)
    comments = relationship("Comment", back_populates="request", order_by="Comment.created_at")

    __table_args__ = (
        Index("idx_status", "status"),
        Index("idx_priority", "priority"),
        Index("idx_created_at", "created_at"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, nullable=False, server_default="0")
    created_at = Column(DateTime, server_default=func.now())

    comments = relationship("Comment", back_populates="user")
    teams = relationship("Team", secondary=user_teams, back_populates="members")

    @property
    def team_ids(self) -> list[int]:
        return [t.id for t in self.teams]


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    author = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    request = relationship("Request", back_populates="comments")
    user = relationship("User", back_populates="comments")

    __table_args__ = (Index("idx_comment_request", "request_id"),)


class KanbanCard(Base):
    __tablename__ = "kanban_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(
        Integer, ForeignKey("requests.id"), nullable=False, unique=True
    )
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    assignee = Column(String(100), default="")
    ticket_url = Column(String(500), default="")
    stage = Column(
        Enum("todo", "in_progress", "done", "release", "archived", name="stage_enum"),
        default="todo",
        nullable=False,
    )
    position = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    request = relationship("Request", back_populates="kanban_card")
    team = relationship("Team", back_populates="kanban_cards")

    __table_args__ = (
        Index("idx_team_stage", "team_id", "stage"),
        Index("idx_position", "stage", "position"),
    )

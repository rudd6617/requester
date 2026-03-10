"""init

Revision ID: 0001
Revises:
Create Date: 2026-03-10 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # requests
    op.create_table(
        "requests",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("business_impact", sa.Text(), nullable=True),
        sa.Column("requester", sa.String(length=100), nullable=False),
        sa.Column("priority", sa.Enum("critical", "high", "medium", "low", name="priority_enum"), nullable=False),
        sa.Column("status", sa.Enum("new", "assigned", "done", "cancelled", "archived", name="status_enum"), nullable=False, server_default="new"),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("risk", sa.Enum("high", "medium", "low", name="risk_enum"), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_created_at", "requests", ["created_at"])
    op.create_index("idx_priority", "requests", ["priority"])
    op.create_index("idx_status", "requests", ["status"])

    # teams
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # kanban_cards
    op.create_table(
        "kanban_cards",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("assignee", sa.String(length=100), nullable=True),
        sa.Column("stage", sa.Enum("todo", "in_progress", "done", "release", "archived", name="stage_enum"), nullable=False, server_default="todo"),
        sa.Column("ticket_url", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("position", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["request_id"], ["requests.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id"),
    )
    op.create_index("idx_position", "kanban_cards", ["stage", "position"])
    op.create_index("idx_team_stage", "kanban_cards", ["team_id", "stage"])

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )

    # comments
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("author", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["request_id"], ["requests.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_comment_request", "comments", ["request_id"])


def downgrade() -> None:
    op.drop_index("idx_comment_request", table_name="comments")
    op.drop_table("comments")
    op.drop_table("users")
    op.drop_index("idx_team_stage", table_name="kanban_cards")
    op.drop_index("idx_position", table_name="kanban_cards")
    op.drop_table("kanban_cards")
    op.drop_table("teams")
    op.drop_index("idx_status", table_name="requests")
    op.drop_index("idx_priority", table_name="requests")
    op.drop_index("idx_created_at", table_name="requests")
    op.drop_table("requests")

"""add user_teams and is_admin

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-12 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_table(
        "user_teams",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("user_id", "team_id"),
    )
    op.create_index("idx_user_teams_team", "user_teams", ["team_id"])


def downgrade() -> None:
    op.drop_table("user_teams")
    op.drop_column("users", "is_admin")

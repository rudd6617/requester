"""add archived status to requests

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-07
"""
from typing import Sequence, Union

from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','assigned','done','cancelled','archived') NOT NULL DEFAULT 'new'"
    )


def downgrade() -> None:
    op.execute("UPDATE requests SET status = 'done' WHERE status = 'archived'")
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','assigned','done','cancelled') NOT NULL DEFAULT 'new'"
    )

"""simplify request status to new/assigned/done/cancelled

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-07
"""
from typing import Sequence, Union

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Expand enum to include both old and new values
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','triage','in_progress','done','closed','cancelled','assigned') "
        "NOT NULL DEFAULT 'new'"
    )
    # Step 2: Map old statuses to new ones
    op.execute("UPDATE requests SET status = 'new' WHERE status = 'triage'")
    op.execute("UPDATE requests SET status = 'assigned' WHERE status = 'in_progress'")
    op.execute("UPDATE requests SET status = 'done' WHERE status = 'closed'")
    # Mark requests that have kanban cards as 'assigned' (if still 'new')
    op.execute(
        "UPDATE requests SET status = 'assigned' "
        "WHERE status = 'new' AND id IN (SELECT request_id FROM kanban_cards)"
    )
    # Step 3: Shrink enum to final values
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','assigned','done','cancelled') NOT NULL DEFAULT 'new'"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','triage','in_progress','done','closed','cancelled','assigned') "
        "NOT NULL DEFAULT 'new'"
    )
    op.execute("UPDATE requests SET status = 'new' WHERE status = 'assigned'")
    op.execute(
        "ALTER TABLE requests MODIFY COLUMN status "
        "ENUM('new','triage','in_progress','done','closed','cancelled') NOT NULL DEFAULT 'new'"
    )

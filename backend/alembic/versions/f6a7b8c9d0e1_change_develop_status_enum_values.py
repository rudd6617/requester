"""change develop_status enum values to match stage

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-03-09 13:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Clear old enum values that don't exist in new enum
    op.execute("UPDATE requests SET develop_status = NULL WHERE develop_status IS NOT NULL")
    op.alter_column(
        'requests', 'develop_status',
        type_=sa.Enum('todo', 'in_progress', 'review', 'done', name='develop_status_enum'),
        existing_type=sa.Enum('pending', 'released', 'rollback', name='release_status_enum'),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.execute("UPDATE requests SET develop_status = NULL WHERE develop_status IS NOT NULL")
    op.alter_column(
        'requests', 'develop_status',
        type_=sa.Enum('pending', 'released', 'rollback', name='release_status_enum'),
        existing_type=sa.Enum('todo', 'in_progress', 'review', 'done', name='develop_status_enum'),
        existing_nullable=True,
    )

"""rename release_status to develop_status

Revision ID: e5f6a7b8c9d0
Revises: 956d358fd574
Create Date: 2026-03-09 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = '956d358fd574'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_type = sa.Enum('pending', 'released', 'rollback', name='release_status_enum')


def upgrade() -> None:
    op.alter_column('requests', 'release_status', new_column_name='develop_status', existing_type=_type)


def downgrade() -> None:
    op.alter_column('requests', 'develop_status', new_column_name='release_status', existing_type=_type)

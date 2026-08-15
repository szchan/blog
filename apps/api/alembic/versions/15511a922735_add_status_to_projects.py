"""add status to projects

Revision ID: 15511a922735
Revises: 84306c014583
Create Date: 2026-08-15 14:12:19.214970

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.models.project import ProjectStatus

revision: str = "15511a922735"
down_revision: str | Sequence[str] | None = "84306c014583"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    status_enum = sa.Enum(ProjectStatus, name="projectstatus")
    status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column("projects", sa.Column("status", status_enum, nullable=True))
    op.add_column("projects", sa.Column("published_at", sa.DateTime(), nullable=True))
    op.execute("UPDATE projects SET status = 'published', published_at = created_at")
    op.alter_column("projects", "status", nullable=False, server_default="draft")


def downgrade() -> None:
    op.drop_column("projects", "published_at")
    op.drop_column("projects", "status")
    op.execute("DROP TYPE projectstatus")

"""Initial database schema for shipping-cost-agent

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-13 03:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Ports table
    op.create_table(
        "ports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unlocode", sa.String(length=5), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ports_unlocode", "ports", ["unlocode"], unique=True)

    # 2. Carriers table
    op.create_table(
        "carriers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("scac_code", sa.String(length=10), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_carriers_scac_code", "carriers", ["scac_code"], unique=True)

    # 3. Sources table
    op.create_table(
        "sources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("url_or_fixture_path", sa.String(length=500), nullable=False),
        sa.Column("port_id", sa.Integer(), sa.ForeignKey("ports.id"), nullable=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=True),
        sa.Column("doc_type", sa.String(length=50), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=True),
        sa.Column("last_crawled_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # 4. Fees table
    op.create_table(
        "fees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id"), nullable=False),
        sa.Column("fee_code", sa.String(length=50), nullable=False),
        sa.Column("fee_type", sa.String(length=20), nullable=False),
        sa.Column("port_id", sa.Integer(), sa.ForeignKey("ports.id"), nullable=False),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=True),
        sa.Column("container_type", sa.String(length=20), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("unit", sa.String(length=50), nullable=False, server_default="per_container"),
        sa.Column("conditions_json", sa.Text(), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("extracted_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_fees_fee_code", "fees", ["fee_code"])
    op.create_index("ix_fees_fee_type", "fees", ["fee_type"])
    op.create_index("ix_fees_port_id", "fees", ["port_id"])
    op.create_index("ix_fees_carrier_id", "fees", ["carrier_id"])
    op.create_index("ix_fees_container_type", "fees", ["container_type"])
    op.create_index("ix_fees_port_carrier_type", "fees", ["port_id", "carrier_id", "fee_type"])

    # 5. Crawl jobs table
    op.create_table(
        "crawl_jobs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="PENDING"),
        sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("crawl_jobs")
    op.drop_index("ix_fees_port_carrier_type", table_name="fees")
    op.drop_index("ix_fees_container_type", table_name="fees")
    op.drop_index("ix_fees_carrier_id", table_name="fees")
    op.drop_index("ix_fees_port_id", table_name="fees")
    op.drop_index("ix_fees_fee_type", table_name="fees")
    op.drop_index("ix_fees_fee_code", table_name="fees")
    op.drop_table("fees")
    op.drop_table("sources")
    op.drop_index("ix_carriers_scac_code", table_name="carriers")
    op.drop_table("carriers")
    op.drop_index("ix_ports_unlocode", table_name="ports")
    op.drop_table("ports")

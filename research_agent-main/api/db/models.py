from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    Text,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    unlocode = Column(String(5), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    country = Column(String(2), nullable=False)

    sources = relationship("Source", back_populates="port", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="port", cascade="all, delete-orphan")


class Carrier(Base):
    __tablename__ = "carriers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    scac_code = Column(String(10), unique=True, index=True, nullable=False)

    sources = relationship("Source", back_populates="carrier", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="carrier", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url_or_fixture_path = Column(String(500), nullable=False)
    port_id = Column(Integer, ForeignKey("ports.id"), nullable=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=True)
    doc_type = Column(String(50), nullable=False)  # carrier_tariff, port_authority, terminal_operator
    content_hash = Column(String(64), nullable=True)
    last_crawled_at = Column(DateTime, nullable=True)

    port = relationship("Port", back_populates="sources")
    carrier = relationship("Carrier", back_populates="sources")
    fees = relationship("Fee", back_populates="source", cascade="all, delete-orphan")
    crawl_jobs = relationship("CrawlJob", back_populates="source", cascade="all, delete-orphan")


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    fee_code = Column(String(50), nullable=False, index=True)
    fee_type = Column(String(20), nullable=False, index=True)  # THC, BAF, CAF, ISPS, DOC, DEMURRAGE, OTHER
    port_id = Column(Integer, ForeignKey("ports.id"), nullable=False, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=True, index=True)
    container_type = Column(String(20), nullable=True, index=True)  # 20GP, 40GP, 40HC, ALL
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    unit = Column(String(50), nullable=False, default="per_container")
    conditions_json = Column(Text, nullable=True)
    effective_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    confidence = Column(Float, nullable=False, default=1.0)
    extracted_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    source = relationship("Source", back_populates="fees")
    port = relationship("Port", back_populates="fees")
    carrier = relationship("Carrier", back_populates="fees")

    __table_args__ = (
        Index("ix_fees_port_carrier_type", "port_id", "carrier_id", "fee_type"),
    )


class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)

    source = relationship("Source", back_populates="crawl_jobs")

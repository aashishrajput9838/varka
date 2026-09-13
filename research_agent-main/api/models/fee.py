from datetime import date, datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class FeeResponse(BaseModel):
    id: int
    source_id: int
    fee_code: str
    fee_type: str
    port_id: int
    port_unlocode: Optional[str] = None
    port_name: Optional[str] = None
    carrier_id: Optional[int] = None
    carrier_name: Optional[str] = None
    carrier_scac: Optional[str] = None
    container_type: Optional[str] = None
    amount: float
    currency: str
    unit: str
    conditions_json: Optional[str] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    confidence: float
    extracted_at: datetime
    source_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SourceResponse(BaseModel):
    id: int
    url_or_fixture_path: str
    doc_type: str
    port_id: Optional[int] = None
    port_unlocode: Optional[str] = None
    carrier_id: Optional[int] = None
    carrier_scac: Optional[str] = None
    last_crawled_at: Optional[datetime] = None
    content_hash: Optional[str] = None
    raw_snippet: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RefreshRequest(BaseModel):
    source_id: Optional[int] = None


class RefreshResponse(BaseModel):
    status: str
    message: str
    task_id: Optional[str] = None
    source_id: Optional[int] = None
    extracted_fees_count: Optional[int] = None

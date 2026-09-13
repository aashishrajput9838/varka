from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field


class QuoteRequest(BaseModel):
    origin_port: str = Field(..., description="UN/LOCODE of origin port, e.g. CNSHA")
    destination_port: str = Field(..., description="UN/LOCODE of destination port, e.g. USLAX")
    carrier: str = Field(..., description="Carrier SCAC code, e.g. MAEU")
    container_type: str = Field(default="40HC", description="20GP, 40GP, 40HC")
    incoterm: str = Field(default="FOB", description="Incoterm: FOB, CIF, CFR, EXW, DDP, FCA, DAP")
    commodity: Optional[str] = Field(None, description="Optional commodity description")


class FeeLineItem(BaseModel):
    id: Optional[int] = None
    fee_code: str
    fee_name: str
    fee_type: str
    category: str  # origin, freight, destination
    amount: float
    currency: str
    converted_amount_usd: float
    unit: str
    payer: str  # buyer, seller
    included_in_landed_cost: bool
    confidence: float
    source_reference: str
    conditions: Optional[str] = None


class CostBreakdown(BaseModel):
    origin_charges_usd: float
    ocean_freight_usd: float
    destination_charges_usd: float
    total_landed_cost_usd: float
    currency: str = "USD"


class WarningItem(BaseModel):
    level: str  # info, warning, caution
    fee_code: Optional[str] = None
    message: str


class QuoteResponse(BaseModel):
    origin_port: str
    origin_port_name: str
    destination_port: str
    destination_port_name: str
    carrier: str
    carrier_name: str
    container_type: str
    incoterm: str
    commodity: Optional[str] = None
    summary: CostBreakdown
    line_items: List[FeeLineItem]
    warnings: List[WarningItem]
    calculated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

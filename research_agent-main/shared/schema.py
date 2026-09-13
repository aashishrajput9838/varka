from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FeeType(str, Enum):
    THC = "THC"
    BAF = "BAF"
    CAF = "CAF"
    ISPS = "ISPS"
    DOC = "DOC"
    DEMURRAGE = "DEMURRAGE"
    OTHER = "OTHER"


class Incoterm(str, Enum):
    EXW = "EXW"
    FCA = "FCA"
    FOB = "FOB"
    CFR = "CFR"
    CIF = "CIF"
    DAP = "DAP"
    DDP = "DDP"


class CanonicalFee(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fee_code: str = Field(..., description="Unique or standard code for the fee, e.g. THC, BAF, ISPS")
    fee_type: str = Field(..., description="Canonical category: THC, BAF, CAF, ISPS, DOC, DEMURRAGE, OTHER")
    port_unlocode: str = Field(..., description="5-letter UN/LOCODE of the applicable port, e.g. CNSHA")
    carrier_scac: Optional[str] = Field(None, description="4-letter standard carrier alpha code, e.g. MAEU")
    container_type: Optional[str] = Field(None, description="20GP, 40GP, 40HC, or ALL")
    amount: float = Field(..., description="Monetary charge amount")
    currency: str = Field("USD", description="ISO 3-letter currency code, e.g. USD, EUR, CNY")
    unit: str = Field("per_container", description="Unit of measure: per_container, per_bl, per_ton, per_day")
    applicability_conditions: Optional[str] = Field(None, description="Human readable or structured eligibility conditions")
    effective_date: Optional[date] = Field(None, description="Tariff start date")
    expiry_date: Optional[date] = Field(None, description="Tariff expiration date")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Extraction confidence score between 0 and 1")
    source_reference: str = Field(..., description="Source snippet, citation, or document URL")

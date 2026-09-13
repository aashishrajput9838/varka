import re
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from api.db.engine import SessionLocal
from api.db.models import Fee, Source, Port, Carrier
from shared.schema import CanonicalFee, FeeType

logger = logging.getLogger(__name__)

KEYWORD_MAP = {
    FeeType.THC: ["terminal handling", "thc", "stevedoring", "quay", "wharfage"],
    FeeType.BAF: ["bunker", "baf", "fuel", "low sulphur", "ebs", "imo2020"],
    FeeType.CAF: ["currency adjustment", "caf", "currency surcharge", "exchange fluctuation"],
    FeeType.ISPS: ["isps", "security", "anti-terrorism", "port facility security", "carrier security"],
    FeeType.DOC: ["doc", "documentation", "bill of lading", "b/l", "manifest", "eei", "ams filing", "export filing"],
    FeeType.DEMURRAGE: ["demurrage", "detention", "storage fee", "free time", "per diem"],
}


def resolve_fee_type(raw_name: str, raw_code: str) -> str:
    """Classifies a fee into a canonical FeeType using keyword matching."""
    text_to_check = f"{raw_name} {raw_code}".lower()

    # Check direct code match first
    upper_code = raw_code.strip().upper()
    if upper_code in [ft.value for ft in FeeType]:
        return upper_code

    for fee_type, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in text_to_check:
                return fee_type.value

    return FeeType.OTHER.value


def normalize(raw_fee: Dict[str, Any], source_id: int, db: Optional[Session] = None) -> CanonicalFee:
    """
    Normalizes a raw extracted fee candidate into a CanonicalFee model
    and persists it into the database fees table.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        source = db.query(Source).filter(Source.id == source_id).first()
        if not source:
            raise ValueError(f"Source with id={source_id} not found in DB.")

        fee_name = str(raw_fee.get("fee_name", "Accessorial Charge")).strip()
        raw_code = str(raw_fee.get("fee_code", "")).strip().upper()
        fee_type = resolve_fee_type(fee_name, raw_code)

        # Standardize fee code if generic or blank
        fee_code = raw_code if raw_code and raw_code != "OTHER" else fee_type

        # Container type normalization
        raw_cntr = str(raw_fee.get("container_type", "ALL")).strip().upper()
        if raw_cntr in ["20", "20'", "20FT", "20DV", "20GP"]:
            container_type = "20GP"
        elif raw_cntr in ["40", "40'", "40FT", "40DV", "40GP"]:
            container_type = "40GP"
        elif raw_cntr in ["40HC", "40HQ", "40'HC", "40'HQ", "HIGHCUBE"]:
            container_type = "40HC"
        else:
            container_type = "ALL"

        # Resolve Port
        port_unlocode = str(raw_fee.get("port_unlocode", "")).strip().upper()
        port_obj = None
        if port_unlocode and len(port_unlocode) == 5:
            port_obj = db.query(Port).filter(Port.unlocode == port_unlocode).first()

        if not port_obj and source.port_id:
            port_obj = db.query(Port).filter(Port.id == source.port_id).first()

        if not port_obj:
            # Fallback to first port in database
            port_obj = db.query(Port).first()

        resolved_port_id = port_obj.id if port_obj else 1
        resolved_unlocode = port_obj.unlocode if port_obj else "CNSHA"

        # Resolve Carrier
        carrier_scac = str(raw_fee.get("carrier_scac", "") or "").strip().upper() or None
        carrier_obj = None
        if carrier_scac:
            carrier_obj = db.query(Carrier).filter(Carrier.scac_code == carrier_scac).first()

        if not carrier_obj and source.carrier_id:
            carrier_obj = db.query(Carrier).filter(Carrier.id == source.carrier_id).first()

        resolved_carrier_id = carrier_obj.id if carrier_obj else None
        resolved_carrier_scac = carrier_obj.scac_code if carrier_obj else None

        amount = float(raw_fee.get("amount", 0.0))
        currency = str(raw_fee.get("currency", "USD")).strip().upper()
        unit = str(raw_fee.get("unit", "per_container")).strip().lower()
        conditions = str(raw_fee.get("conditions", "")).strip() or None
        confidence = float(raw_fee.get("confidence", 0.90))

        source_ref = f"{source.doc_type} (Source #{source.id} - {source.url_or_fixture_path})"

        canonical = CanonicalFee(
            fee_code=fee_code,
            fee_type=fee_type,
            port_unlocode=resolved_unlocode,
            carrier_scac=resolved_carrier_scac,
            container_type=container_type,
            amount=amount,
            currency=currency,
            unit=unit,
            applicability_conditions=conditions,
            effective_date=date(date.today().year, 1, 1),
            expiry_date=date(date.today().year, 12, 31),
            confidence=confidence,
            source_reference=source_ref,
        )

        # Write/Update to database
        db_fee = Fee(
            source_id=source.id,
            fee_code=canonical.fee_code,
            fee_type=canonical.fee_type,
            port_id=resolved_port_id,
            carrier_id=resolved_carrier_id,
            container_type=canonical.container_type,
            amount=canonical.amount,
            currency=canonical.currency,
            unit=canonical.unit,
            conditions_json=canonical.applicability_conditions,
            effective_date=canonical.effective_date,
            expiry_date=canonical.expiry_date,
            confidence=canonical.confidence,
            extracted_at=datetime.utcnow(),
        )
        db.add(db_fee)
        db.commit()
        db.refresh(db_fee)

        return canonical
    finally:
        if close_db:
            db.close()

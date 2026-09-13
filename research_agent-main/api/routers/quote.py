from datetime import datetime
from typing import List, Dict, Tuple
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.deps import get_db
from api.db.models import Port, Carrier, Fee, Source
from api.models.quote import (
    QuoteRequest,
    QuoteResponse,
    FeeLineItem,
    CostBreakdown,
    WarningItem,
)

router = APIRouter(prefix="/v1", tags=["Quote"])

# Standard exchange rates for normalization
FX_TO_USD: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 1.08,
    "CNY": 0.14,
    "GBP": 1.28,
}


def convert_to_usd(amount: float, currency: str) -> float:
    rate = FX_TO_USD.get(currency.upper(), 1.0)
    return round(amount * rate, 2)


def evaluate_incoterm_payer(incoterm: str, category: str, fee_code: str) -> Tuple[str, bool]:
    """
    Returns (payer, is_included_in_buyer_landed_cost).
    Follows Incoterms 2020 cost allocation rules:
    - FOB: Origin THC is buyer's carrier responsibility (per prompt spec); freight & destination = buyer.
    - EXW: Buyer pays all origin, freight, and destination charges.
    - FCA: Seller pays origin export up to handover; buyer pays freight and destination.
    - CFR/CIF: Seller pays origin & freight; buyer pays destination charges.
    - DAP: Seller pays origin & freight; buyer pays destination.
    - DDP: Seller pays origin, freight, and destination; buyer landed cost is minimal/zero.
    """
    inco = incoterm.upper()
    code = fee_code.upper()

    if inco == "EXW":
        return "buyer", True

    if inco == "DDP":
        return "seller", False

    if inco in ["CIF", "CFR"]:
        if category in ["origin", "freight"]:
            return "seller", False
        return "buyer", True

    if inco in ["FCA", "DAP"]:
        if category == "origin":
            return "seller", False
        return "buyer", True

    # Default / FOB logic
    if category == "origin":
        if code in ["THC", "BAS"]:
            # Per prompt: in FOB, origin THC is buyer's carrier's responsibility
            return "buyer", True
        return "seller", False
    elif category == "freight":
        return "buyer", True
    else:  # destination
        return "buyer", True


@router.post("/quote", response_model=QuoteResponse)
def calculate_landed_cost_quote(
    request: QuoteRequest,
    db: Session = Depends(get_db),
):
    """
    Calculates estimated true landed cost for ocean freight shipment.
    Queries applicable fees for origin, destination, carrier, and container type,
    applies Incoterm inclusion rules, and returns full breakdown with confidence warnings.
    """
    # 1. Resolve Origin Port
    origin_port = (
        db.query(Port)
        .filter(or_(Port.unlocode.ilike(request.origin_port.strip()), Port.name.ilike(request.origin_port.strip())))
        .first()
    )
    if not origin_port:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Origin port '{request.origin_port}' not found.",
        )

    # 2. Resolve Destination Port
    destination_port = (
        db.query(Port)
        .filter(
            or_(
                Port.unlocode.ilike(request.destination_port.strip()),
                Port.name.ilike(request.destination_port.strip()),
            )
        )
        .first()
    )
    if not destination_port:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination port '{request.destination_port}' not found.",
        )

    # 3. Resolve Carrier
    carrier = (
        db.query(Carrier)
        .filter(
            or_(
                Carrier.scac_code.ilike(request.carrier.strip()),
                Carrier.name.ilike(request.carrier.strip()),
            )
        )
        .first()
    )
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carrier '{request.carrier}' not found.",
        )

    requested_container = request.container_type.upper().strip()
    applicable_containers = [requested_container, "ALL"]

    # 4. Fetch candidate fees from database
    # Fees for origin port or carrier
    candidate_fees = (
        db.query(Fee)
        .filter(
            Fee.port_id.in_([origin_port.id, destination_port.id]),
            Fee.container_type.in_(applicable_containers),
            or_(Fee.carrier_id == carrier.id, Fee.carrier_id.is_(None)),
        )
        .all()
    )

    # If no base freight was stored under destination port_id, also check general carrier freight fees
    carrier_freight_fees = (
        db.query(Fee)
        .filter(
            Fee.carrier_id == carrier.id,
            Fee.fee_code.in_(["BAS", "BAF", "CAF"]),
            Fee.container_type.in_(applicable_containers),
        )
        .all()
    )

    all_fees_map: Dict[int, Fee] = {f.id: f for f in candidate_fees}
    for cf in carrier_freight_fees:
        all_fees_map[cf.id] = cf

    line_items: List[FeeLineItem] = []
    warnings: List[WarningItem] = []
    currencies_encountered = set()

    origin_total_usd = 0.0
    freight_total_usd = 0.0
    dest_total_usd = 0.0

    for fee in all_fees_map.values():
        # Determine category: origin, freight, or destination
        code = fee.fee_code.upper()
        ftype = fee.fee_type.upper()

        if ftype in ["BAF", "CAF"] or code == "BAS":
            category = "freight"
        elif fee.port_id == origin_port.id:
            category = "origin"
        elif fee.port_id == destination_port.id:
            category = "destination"
        else:
            category = "origin"

        # Special handling for Demurrage: don't sum recurring per-day charges into upfront quote total
        is_per_day = "day" in fee.unit.lower() or ftype == "DEMURRAGE"

        payer, is_included = evaluate_incoterm_payer(request.incoterm, category, code)
        converted_usd = convert_to_usd(fee.amount, fee.currency)
        currencies_encountered.add(fee.currency)

        # Source reference formatting
        source_ref = (
            f"{fee.source.doc_type} (Source #{fee.source_id})"
            if fee.source
            else f"Source #{fee.source_id}"
        )

        fee_name = f"{code} - {fee.conditions_json or ftype}"
        if code == "BAS":
            fee_name = f"Base Ocean Freight ({origin_port.unlocode} -> {destination_port.unlocode})"
        elif code == "THC":
            fee_name = f"{'Origin' if category == 'origin' else 'Destination'} Terminal Handling Charge"
        elif code == "BAF":
            fee_name = "Bunker Adjustment Factor (Fuel Surcharge)"
        elif code == "CAF":
            fee_name = "Currency Adjustment Factor"
        elif code == "ISPS":
            fee_name = "Port & Vessel Security Surcharge (ISPS)"
        elif code == "DOC":
            fee_name = "Bill of Lading Documentation Fee"
        elif ftype == "DEMURRAGE":
            fee_name = "Demurrage Daily Tariff"

        item = FeeLineItem(
            id=fee.id,
            fee_code=code,
            fee_name=fee_name,
            fee_type=ftype,
            category=category,
            amount=fee.amount,
            currency=fee.currency,
            converted_amount_usd=converted_usd,
            unit=fee.unit,
            payer=payer,
            included_in_landed_cost=is_included and not is_per_day,
            confidence=fee.confidence,
            source_reference=source_ref,
            conditions=fee.conditions_json,
        )
        line_items.append(item)

        # Sum into totals if paid by buyer and not a post-discharge per-day penalty
        if is_included and not is_per_day:
            if category == "origin":
                origin_total_usd += converted_usd
            elif category == "freight":
                freight_total_usd += converted_usd
            elif category == "destination":
                dest_total_usd += converted_usd

        # Check confidence for warnings
        if fee.confidence < 0.85:
            warnings.append(
                WarningItem(
                    level="warning",
                    fee_code=code,
                    message=f"Low confidence ({fee.confidence:.2f}) for '{fee_name}'. Verify with carrier tariff.",
                )
            )

        # Demurrage warning alert
        if is_per_day or ftype == "DEMURRAGE":
            warnings.append(
                WarningItem(
                    level="caution",
                    fee_code="DEMURRAGE",
                    message=(
                        f"Demurrage applies at destination after 4 free days: {fee.currency} {fee.amount:,.2f} "
                        f"{fee.unit}. This is an operational contingency and is excluded from upfront landed freight."
                    ),
                )
            )

    # Sort line items: freight first, origin second, destination third
    cat_order = {"freight": 0, "origin": 1, "destination": 2}
    line_items.sort(key=lambda x: (cat_order.get(x.category, 3), -x.converted_amount_usd))

    # Overall warnings
    if len(currencies_encountered) > 1:
        warnings.append(
            WarningItem(
                level="info",
                fee_code="FX",
                message=f"Multi-currency quote detected ({', '.join(currencies_encountered)}). All amounts normalized to USD.",
            )
        )

    if not any(item.fee_code == "BAS" for item in line_items):
        warnings.append(
            WarningItem(
                level="warning",
                fee_code="BAS",
                message="Base Ocean Freight not explicitly loaded for this exact lane. Carrier tariff quote reflects accessorials.",
            )
        )

    total_landed_usd = round(origin_total_usd + freight_total_usd + dest_total_usd, 2)

    summary = CostBreakdown(
        origin_charges_usd=round(origin_total_usd, 2),
        ocean_freight_usd=round(freight_total_usd, 2),
        destination_charges_usd=round(dest_total_usd, 2),
        total_landed_cost_usd=total_landed_usd,
        currency="USD",
    )

    return QuoteResponse(
        origin_port=origin_port.unlocode,
        origin_port_name=f"{origin_port.name} ({origin_port.country})",
        destination_port=destination_port.unlocode,
        destination_port_name=f"{destination_port.name} ({destination_port.country})",
        carrier=carrier.scac_code,
        carrier_name=carrier.name,
        container_type=requested_container,
        incoterm=request.incoterm.upper(),
        commodity=request.commodity,
        summary=summary,
        line_items=line_items,
        warnings=warnings,
    )

from datetime import date
import pytest
from pydantic import ValidationError
from shared.schema import CanonicalFee, FeeType, Incoterm


def test_canonical_fee_valid():
    fee = CanonicalFee(
        fee_code="THC",
        fee_type=FeeType.THC.value,
        port_unlocode="CNSHA",
        carrier_scac="MAEU",
        container_type="40HC",
        amount=210.0,
        currency="USD",
        unit="per_container",
        applicability_conditions="Export terminal handling",
        effective_date=date(date.today().year, 1, 1),
        expiry_date=date(date.today().year, 12, 31),
        confidence=0.95,
        source_reference="Tariff Document #123",
    )
    assert fee.fee_code == "THC"
    assert fee.fee_type == "THC"
    assert fee.amount == 210.0
    assert fee.confidence == 0.95


def test_canonical_fee_invalid_confidence():
    with pytest.raises(ValidationError):
        CanonicalFee(
            fee_code="THC",
            fee_type="THC",
            port_unlocode="CNSHA",
            amount=100.0,
            confidence=1.5,  # must be <= 1.0
            source_reference="Ref",
        )

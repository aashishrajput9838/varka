from workers.normalization_agent import resolve_fee_type
from shared.schema import FeeType


def test_resolve_fee_type_keywords():
    assert resolve_fee_type("Terminal Handling Charge", "THC") == FeeType.THC.value
    assert resolve_fee_type("Bunker Adjustment Factor", "BAF") == FeeType.BAF.value
    assert resolve_fee_type("Port Security Assessment", "ISPS") == FeeType.ISPS.value
    assert resolve_fee_type("Bill of Lading Issuance", "DOC") == FeeType.DOC.value
    assert resolve_fee_type("Demurrage Tier 1", "DEMURRAGE") == FeeType.DEMURRAGE.value
    assert resolve_fee_type("Clean Truck Fund Environmental Rate", "CTF") == FeeType.OTHER.value

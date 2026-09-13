import os
from shared.llm_client import extract_fees_from_text


def test_carrier_tariff_extraction():
    fixture_path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_carrier_tariff.html")
    with open(fixture_path, "r", encoding="utf-8") as f:
        text = f.read()

    fees = extract_fees_from_text(text)
    assert len(fees) > 0

    fee_codes = [f.get("fee_code") for f in fees]
    assert "BAS" in fee_codes or "THC" in fee_codes or "BAF" in fee_codes


def test_port_authority_extraction():
    fixture_path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_port_authority_fees.html")
    with open(fixture_path, "r", encoding="utf-8") as f:
        text = f.read()

    fees = extract_fees_from_text(text)
    assert len(fees) > 0
    assert any(f.get("port_unlocode") == "USLAX" for f in fees)


def test_terminal_charges_extraction():
    fixture_path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_terminal_charges.html")
    with open(fixture_path, "r", encoding="utf-8") as f:
        text = f.read()

    fees = extract_fees_from_text(text)
    assert len(fees) > 0
    assert any("demurrage" in str(f.get("fee_name", "")).lower() or f.get("fee_code") == "DEMURRAGE" for f in fees)

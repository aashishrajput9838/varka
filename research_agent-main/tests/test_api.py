import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data


def test_get_ports():
    response = client.get("/v1/ports")
    assert response.status_code == 200
    ports = response.json()
    assert len(ports) >= 3
    assert any(p["unlocode"] == "CNSHA" for p in ports)


def test_get_carriers():
    response = client.get("/v1/carriers")
    assert response.status_code == 200
    carriers = response.json()
    assert len(carriers) >= 2
    assert any(c["scac_code"] == "MAEU" for c in carriers)


def test_get_fees():
    response = client.get("/v1/fees")
    assert response.status_code == 200
    fees = response.json()
    assert len(fees) > 0


def test_calculate_quote():
    payload = {
        "origin_port": "CNSHA",
        "destination_port": "USLAX",
        "carrier": "MAEU",
        "container_type": "40HC",
        "incoterm": "FOB",
        "commodity": "Electronics",
    }
    response = client.post("/v1/quote", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["origin_port"] == "CNSHA"
    assert data["destination_port"] == "USLAX"
    assert data["carrier"] == "MAEU"
    assert data["summary"]["total_landed_cost_usd"] > 0
    assert len(data["line_items"]) > 0

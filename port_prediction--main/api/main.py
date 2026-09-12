"""FastAPI Service for Varka Dry-Bulk Freight Prediction & Decision Engine.

Exposes endpoints for:
- Route and port catalog
- XGBoost 60-day freight forecasting with confidence bands and driver impacts
- Multi-objective vessel suitability & optimization
- Just-In-Time arrival digital twin (slow-steaming, fuel & CO2 savings)
- Explainable charter strategy recommendations
- Real-time Open-Meteo marine conditions and World Bank macro context
"""
from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root of port_prediction--main is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from charter_strategy import recommend_strategy
from decision_support import (
    fleet_availability,
    freight_scenarios,
    optimize_vessels,
    port_scorecard,
    risk_cockpit,
)
from engine import feasible, forecast_route, just_in_time_plan, load_data
from live_data import PORT_COORDS, live_context, marine_risk

app = FastAPI(
    title="Varka Port Prediction & Charter Engine",
    description="Machine learning forecasting, vessel feasibility, and JIT twin API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Warm up data cache on service startup."""
    try:
        load_data()
        print("[Varka ML API] Datasets cached successfully.")
    except Exception as e:
        print(f"[Varka ML API] Error pre-loading datasets: {e}")


# ============================================================================
# Schemas
# ============================================================================

class VesselOptimizationRequest(BaseModel):
    route_id: str
    cargo: float = Field(default=55000.0, ge=1000.0, le=300000.0)
    congestion: int = Field(default=45, ge=0, le=100)
    priority: str = Field(default="Balanced")


class JITPlanRequest(BaseModel):
    route_id: str
    dest_code: str
    vessel_type: str = "Supramax"
    congestion: int = Field(default=25, ge=0, le=100)
    fuel_price: int = Field(default=580, ge=100, le=2000)
    berth_adjustment_hours: int = Field(default=0, ge=-168, le=336)


class CharterStrategyRequest(BaseModel):
    route_id: str
    cargo: float = Field(default=55000.0, ge=1000.0, le=300000.0)
    vessel_type: str = "Supramax"
    laycan_days: int = Field(default=21, ge=1, le=90)
    congestion: int = Field(default=45, ge=0, le=100)
    voyages: int = Field(default=1, ge=1, le=12)


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health")
def health_check():
    """Liveness and health probe."""
    return {
        "status": "ok",
        "service": "varka-port-prediction-engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "routes_loaded": 33,
    }


@app.get("/api/v1/routes")
def get_routes_and_ports():
    """Return available origins, Indian destinations, vessel classes, and routes."""
    ts, ports_in, ports_origin, vessels, routes, summary = load_data()

    origins = []
    for _, row in ports_origin.iterrows():
        origins.append({
            "port_code": row["port_code"],
            "port_name": row["port_name"],
            "country": row["country"],
            "cargo_handling_rate_tpd": float(row["cargo_handling_rate_tpd"]),
            "max_draft_m": float(row["max_draft_m"]),
            "max_loa_m": float(row["max_loa_m"]),
            "max_beam_m": float(row["max_beam_m"]),
        })

    destinations = []
    for _, row in ports_in.iterrows():
        destinations.append({
            "port_code": row["port_code"],
            "port_name": row["port_name"],
            "avg_delay_days": float(row["avg_pre_berthing_delay_days"]),
            "cargo_handling_rate_tpd": float(row["cargo_handling_rate_tpd"]),
            "max_draft_m": float(row["max_draft_m"]),
            "max_loa_m": float(row["max_loa_m"]),
            "max_beam_m": float(row["max_beam_m"]),
            "dry_bulk_berths": int(row["dry_bulk_berths"]),
        })

    vessel_types = []
    for _, row in vessels.iterrows():
        vessel_types.append({
            "vessel_type": row["vessel_type"],
            "typical_draft_m": float(row["typical_draft_m"]),
            "typical_loa_m": float(row["typical_loa_m"]),
            "typical_beam_m": float(row["typical_beam_m"]),
            "dwt_min": float(row["dwt_min"]),
            "dwt_max": float(row["dwt_max"]),
        })

    route_list = []
    for _, row in routes.iterrows():
        orig_match = ports_origin[ports_origin.port_code == row["origin_port_code"]]
        dest_match = ports_in[ports_in.port_code == row["dest_port_code"]]
        orig_name = orig_match.iloc[0]["port_name"] if not orig_match.empty else row["origin_port_code"]
        orig_country = orig_match.iloc[0]["country"] if not orig_match.empty else "Unknown"
        dest_name = dest_match.iloc[0]["port_name"] if not dest_match.empty else row["dest_port_code"]

        route_list.append({
            "route_id": row["route_id"],
            "origin_port_code": row["origin_port_code"],
            "dest_port_code": row["dest_port_code"],
            "origin_name": orig_name,
            "origin_country": orig_country,
            "dest_name": dest_name,
            "distance_nm": float(row["distance_nm"]),
        })

    return {
        "origins": origins,
        "destinations": destinations,
        "vessels": vessel_types,
        "routes": route_list,
    }


@app.get("/api/v1/predict/forecast")
def get_forecast(
    route_id: str = Query(..., description="Route ID, e.g. AUNTL_INPAR"),
    vessel: str = Query("Supramax", description="Vessel class"),
    horizon: int = Query(60, ge=7, le=120, description="Forecast horizon in days"),
):
    """Generate 60-day freight forecast with XGBoost, confidence bands, and driver impacts."""
    ts, ports_in, ports_origin, vessels, routes, summary = load_data()

    if route_id not in routes["route_id"].values:
        raise HTTPException(status_code=404, detail=f"Route '{route_id}' not recognized.")

    vessel_names = vessels["vessel_type"].values
    if vessel not in vessel_names:
        raise HTTPException(status_code=400, detail=f"Vessel '{vessel}' invalid. Choose from: {list(vessel_names)}")

    try:
        point, uncertainty, outlook_df, impacts_df, explanation = forecast_route(
            ts=ts, route_id=route_id, vessel=vessel, horizon=horizon
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Forecast calculation failed: {exc}")

    # Recent history (last 30 days)
    filtered = ts[(ts.route_id == route_id) & (ts.vessel_type == vessel)].sort_values("date").tail(30)
    history = [
        {"date": row["date"].strftime("%Y-%m-%d"), "rate_usd_t": round(float(row["freight_rate_usd_per_tonne"]), 2)}
        for _, row in filtered.iterrows()
    ]

    outlook = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "forecast_usd_t": round(float(row["forecast_usd_t"]), 2),
            "p10": round(float(row["p10"]), 2),
            "p90": round(float(row["p90"]), 2),
        }
        for _, row in outlook_df.iterrows()
    ]

    drivers = [
        {"driver": str(row["driver"]), "impact": round(float(row["impact"]), 4)}
        for _, row in impacts_df.iterrows()
    ]

    # Weekly market-entry windows
    outlook_temp = outlook_df.copy()
    outlook_temp["week"] = outlook_temp["date"].dt.to_period("W").astype(str)
    p30_thresh = float(outlook_df["forecast_usd_t"].quantile(0.30))
    weekly = (
        outlook_temp.groupby("week", as_index=False)
        .agg(
            min_rate=("forecast_usd_t", "min"),
            average_rate=("forecast_usd_t", "mean"),
            earliest_date=("date", "min"),
        )
        .head(6)
    )
    weekly["action"] = np.where(weekly["min_rate"] <= p30_thresh, "Preferred entry window", "Monitor / defer")
    weekly_windows = [
        {
            "week": str(row["week"]),
            "min_rate": round(float(row["min_rate"]), 2),
            "average_rate": round(float(row["average_rate"]), 2),
            "earliest_date": row["earliest_date"].strftime("%Y-%m-%d"),
            "action": str(row["action"]),
        }
        for _, row in weekly.iterrows()
    ]

    # Accuracy benchmarks
    val = summary[(summary.route_id == route_id) & (summary.vessel_type == vessel)]
    mape = float(val.iloc[0]["mape_pct"]) if not val.empty else None
    rmse = float(val.iloc[0]["rmse"]) if not val.empty else None

    return {
        "route_id": route_id,
        "vessel_type": vessel,
        "horizon_days": horizon,
        "current_rate_usd_t": round(point, 2),
        "uncertainty_band_usd_t": round(uncertainty, 2),
        "explanation_method": explanation,
        "mape_pct": mape,
        "rmse": rmse,
        "historical_recent": history,
        "outlook": outlook,
        "drivers": drivers,
        "weekly_windows": weekly_windows,
    }


@app.get("/api/v1/live/marine")
def get_marine_conditions(port_code: str = Query(..., description="5-character UN/LOCODE")):
    """Fetch live sea state & wave conditions from Open-Meteo."""
    if port_code not in PORT_COORDS:
        raise HTTPException(status_code=404, detail=f"Port code '{port_code}' coordinates not configured.")
    result = marine_risk(port_code)
    return {
        "port_code": port_code,
        **result,
    }


@app.get("/api/v1/live/context")
def get_live_context(
    origin_code: str = Query(..., description="Origin port code"),
    dest_code: str = Query(..., description="Destination port code"),
    origin_country: str = Query("Australia", description="Country of origin port"),
):
    """Enrich with Open-Meteo marine risk and World Bank macro growth."""
    return live_context(origin_code, dest_code, origin_country)


@app.post("/api/v1/optimize/vessel")
def optimize_vessel_choice(req: VesselOptimizationRequest):
    """Run port feasibility checks and multi-objective scoring across vessel classes."""
    ts, ports_in, ports_origin, vessels, routes, summary = load_data()

    route_match = routes[routes.route_id == req.route_id]
    if route_match.empty:
        raise HTTPException(status_code=404, detail=f"Route '{req.route_id}' not found.")
    route = route_match.iloc[0]

    origin = ports_origin[ports_origin.port_code == route.origin_port_code].iloc[0]
    dest = ports_in[ports_in.port_code == route.dest_port_code].iloc[0]

    eligibility = feasible(vessels, origin, dest, req.cargo)
    fleet = fleet_availability(vessels)
    merged = eligibility.merge(fleet, on="vessel_type", how="left")

    predictions = {}
    for v in vessels["vessel_type"]:
        try:
            pt, unc, _, _, _ = forecast_route(ts, req.route_id, v)
            predictions[v] = (pt, unc)
        except Exception:
            predictions[v] = (20.0, 2.0)

    merged["forecast_rate"] = merged["vessel_type"].map(lambda v: predictions[v][0])
    merged["total_freight"] = merged["forecast_rate"] * req.cargo

    candidates = merged[merged.eligible].copy()
    if not candidates.empty:
        ranked = optimize_vessels(candidates, float(route.distance_nm), req.congestion, req.priority)
        best_type = ranked.iloc[0]["vessel_type"]
    else:
        ranked = pd.DataFrame()
        best_type = None

    classes_out = []
    for _, row in merged.iterrows():
        is_best = (row["vessel_type"] == best_type)
        score = float(ranked.loc[ranked.vessel_type == row["vessel_type"], "multi_objective_score"].iloc[0]) if not ranked.empty and row["eligible"] else 0.0
        classes_out.append({
            "vessel_type": row["vessel_type"],
            "eligible": bool(row["eligible"]),
            "typical_draft_m_ok": bool(row["typical_draft_m_ok"]),
            "typical_loa_m_ok": bool(row["typical_loa_m_ok"]),
            "typical_beam_m_ok": bool(row["typical_beam_m_ok"]),
            "cargo_ok": bool(row["cargo_ok"]),
            "draft_limit_m": float(row["typical_draft_m_limit"]),
            "loa_limit_m": float(row["typical_loa_m_limit"]),
            "beam_limit_m": float(row["typical_beam_m_limit"]),
            "utilisation": round(float(row["utilisation"]), 3),
            "forecast_rate_usd_t": round(float(row["forecast_rate"]), 2),
            "total_freight_usd": round(float(row["total_freight"]), 0),
            "available_hulls": int(row.get("available_hulls", 0)),
            "next_available_days": int(row.get("next_available_days", 99)),
            "availability_status": str(row.get("availability_status", "Check repositioning")),
            "multi_objective_score": round(score, 1),
            "is_recommended": is_best,
        })

    return {
        "route_id": req.route_id,
        "cargo_mt": req.cargo,
        "priority": req.priority,
        "recommended_vessel": best_type,
        "vessel_classes": classes_out,
    }


@app.post("/api/v1/plan/jit")
def plan_jit(req: JITPlanRequest):
    """Compute slow-steaming plan, anchorage wait avoided, fuel saved, and CO2 reduction."""
    ts, ports_in, ports_origin, vessels, routes, summary = load_data()

    route_match = routes[routes.route_id == req.route_id]
    if route_match.empty:
        raise HTTPException(status_code=404, detail=f"Route '{req.route_id}' not found.")
    route = route_match.iloc[0]

    dest_match = ports_in[ports_in.port_code == req.dest_code]
    if dest_match.empty:
        raise HTTPException(status_code=404, detail=f"Destination port '{req.dest_code}' not found.")
    dest = dest_match.iloc[0]

    plan = just_in_time_plan(
        route=route,
        dest=dest,
        vessel_type=req.vessel_type,
        congestion=req.congestion,
        fuel_price=req.fuel_price,
        berth_adjustment_hours=req.berth_adjustment_hours,
    )
    return plan


@app.post("/api/v1/strategy/charter")
def get_charter_strategy(req: CharterStrategyRequest):
    """Generate commercial posture and scenario sensitivity for spot vs term commitments."""
    ts, ports_in, ports_origin, vessels, routes, summary = load_data()

    route_match = routes[routes.route_id == req.route_id]
    if route_match.empty:
        raise HTTPException(status_code=404, detail=f"Route '{req.route_id}' not found.")
    route = route_match.iloc[0]

    origin = ports_origin[ports_origin.port_code == route.origin_port_code].iloc[0]
    dest = ports_in[ports_in.port_code == route.dest_port_code].iloc[0]

    point, uncertainty, outlook_df, _, _ = forecast_route(ts, req.route_id, req.vessel_type, horizon=60)

    load_days = req.cargo / float(origin.cargo_handling_rate_tpd) + 1.2 * (1 + req.congestion / 100)
    discharge_days = req.cargo / float(dest.cargo_handling_rate_tpd) + float(dest.avg_pre_berthing_delay_days) * (1 + req.congestion / 100)
    sailing_days = float(route.distance_nm) / (12 * 24)
    cycle = sailing_days + load_days + discharge_days
    risk = min(100, round(20 + req.congestion * 0.5 + (uncertainty / max(point, 0.1)) * 100))

    spot_rate = float(outlook_df.forecast_usd_t.iloc[0])
    scenario_rows = []
    for n, discount, reserve in [(1, 0.0, 0.0), (3, 0.025, 0.015), (6, 0.05, 0.025)]:
        contract_rate = point * (1 - discount)
        all_in = contract_rate * req.cargo * n * (1 + reserve)
        repeated_spot = spot_rate * req.cargo * n
        scenario_rows.append({
            "voyages": n,
            "contract_rate_usd_mt": round(contract_rate, 2),
            "all_in_cost_usd": round(all_in, 0),
            "saving_vs_repeated_spot_usd": round(repeated_spot - all_in, 0),
            "planned_cycle_days": round(cycle * n, 1),
        })

    scenarios_df = pd.DataFrame(scenario_rows)
    laycan_date = (datetime.now(timezone.utc) + timedelta(days=req.laycan_days)).date()

    strategy_res = recommend_strategy(
        scenarios=scenarios_df,
        outlook=outlook_df,
        laycan=laycan_date,
        risk_index=risk,
        cargo_tonnes=req.cargo,
        selected_vessel=req.vessel_type,
        cycle_days=cycle,
    )

    return {
        "route_id": req.route_id,
        "vessel_type": req.vessel_type,
        "cargo_mt": req.cargo,
        "laycan_days": req.laycan_days,
        "risk_index": risk,
        "cycle_days": round(cycle, 1),
        "posture": strategy_res.get("posture"),
        "action": strategy_res.get("action"),
        "rationale": strategy_res.get("rationale"),
        "expected_cost": float(strategy_res.get("expected_cost", 0.0)),
        "expected_saving": float(strategy_res.get("expected_saving", 0.0)),
        "protections": strategy_res.get("protections", []),
        "scenarios": scenario_rows,
    }


@app.get("/api/v1/ports/scorecard")
def get_port_scorecard(cargo: int = Query(55000, ge=5000, le=200000)):
    """Return port efficiency rankings and throughput metrics for Indian discharge ports."""
    _, ports_in, _, _, _, _ = load_data()
    card = port_scorecard(ports_in, cargo)
    rows = []
    for idx, row in card.iterrows():
        rows.append({
            "rank": idx + 1,
            "port_code": row["port_code"],
            "port_name": row["port_name"],
            "dry_bulk_berths": int(row["dry_bulk_berths"]),
            "cargo_handling_rate_tpd": float(row["cargo_handling_rate_tpd"]),
            "avg_pre_berthing_delay_days": float(row["avg_pre_berthing_delay_days"]),
            "estimated_port_days": round(float(row["estimated_port_days"]), 1),
            "port_performance_score": round(float(row["port_performance_score"]), 1),
        })
    return {"cargo_mt": cargo, "scorecard": rows}

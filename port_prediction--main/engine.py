"""Core computational engine for Varka dry-bulk port and chartering intelligence.

Contains pure model and domain calculation functions without Streamlit UI dependencies,
allowing seamless invocation by both FastAPI services and analytical scripts.
"""
from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd
import xgboost as xgb

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
TARGET = "freight_rate_usd_per_tonne"
FEATURES = [
    "lag_1", "lag_7", "lag_14", "lag_30", "lag_90",
    "roll_mean_7", "roll_mean_30", "roll_std_30",
    "bdi_index", "coal_price_index", "port_congestion_index",
    "dow", "month"
]

_CACHED_DATA = None


def load_data():
    """Load and cache the reference datasets and time-series data once in memory."""
    global _CACHED_DATA
    if _CACHED_DATA is not None:
        return _CACHED_DATA

    ts = pd.read_csv(DATA / "freight_rates_timeseries.csv", parse_dates=["date"])
    ports_in = pd.read_csv(DATA / "ports_east_coast_india.csv")
    ports_origin = pd.read_csv(DATA / "loading_ports_origin.csv")
    vessels = pd.read_csv(DATA / "vessel_types.csv")
    routes = pd.read_csv(DATA / "routes.csv")
    summary = pd.read_csv(ROOT / "all_routes_forecast_summary.csv")

    _CACHED_DATA = (ts, ports_in, ports_origin, vessels, routes, summary)
    return _CACHED_DATA


def add_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Derive lag and rolling statistics features from time-series."""
    out = frame.copy()
    for lag in [1, 7, 14, 30, 90]:
        out[f"lag_{lag}"] = out[TARGET].shift(lag)
    out["roll_mean_7"] = out[TARGET].shift(1).rolling(7).mean()
    out["roll_mean_30"] = out[TARGET].shift(1).rolling(30).mean()
    out["roll_std_30"] = out[TARGET].shift(1).rolling(30).std()
    out["dow"] = out.date.dt.dayofweek
    out["month"] = out.date.dt.month
    return out.dropna().reset_index(drop=True)


def forecast_route(ts: pd.DataFrame, route_id: str, vessel: str, horizon: int = 60):
    """Execute XGBoost regression to forecast future freight rates and confidence bands."""
    filtered = ts[(ts.route_id == route_id) & (ts.vessel_type == vessel)].sort_values("date").reset_index(drop=True)
    if filtered.empty:
        raise ValueError(f"No historical freight data found for route '{route_id}' and vessel '{vessel}'")

    df = add_features(filtered)
    train, latest = df.iloc[:-1], df.iloc[[-1]]

    model = xgb.XGBRegressor(
        n_estimators=180,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        verbosity=0,
    )
    model.fit(train[FEATURES], train[TARGET])

    point = float(model.predict(latest[FEATURES])[0])
    residual = train[TARGET] - model.predict(train[FEATURES])
    uncertainty = float(np.quantile(abs(residual), 0.8))

    slope = float(np.polyfit(df.index[-30:], df[TARGET].tail(30), 1)[0])
    days = np.arange(1, horizon + 1)
    seasonal = 0.55 * np.sin((df.index[-1] + days) * 2 * np.pi / 30)
    projected = np.maximum(1, point + slope * days + seasonal)

    today = pd.Timestamp.now().normalize()
    outlook = pd.DataFrame({
        "date": pd.date_range(today + pd.Timedelta(days=1), periods=horizon),
        "forecast_usd_t": projected,
        "p10": np.maximum(1, projected - uncertainty),
        "p90": projected + uncertainty,
    })

    if HAS_SHAP:
        try:
            explainer = shap.TreeExplainer(model)
            values = np.asarray(explainer.shap_values(latest[FEATURES])).reshape(-1)
            explanation = "SHAP"
        except Exception:
            values = model.feature_importances_ * (latest[FEATURES].iloc[0] - train[FEATURES].mean())
            explanation = "feature-contribution fallback"
    else:
        values = model.feature_importances_ * (latest[FEATURES].iloc[0] - train[FEATURES].mean())
        explanation = "feature-contribution fallback"

    impacts = pd.DataFrame({"driver": FEATURES, "impact": values}).sort_values("impact", key=abs, ascending=False).head(6)

    return point, uncertainty, outlook, impacts, explanation


def feasible(vessels: pd.DataFrame, origin: pd.Series, dest: pd.Series, cargo: float) -> pd.DataFrame:
    """Assess whether vessel classes satisfy draft, length, beam, and cargo capacity limits."""
    out = vessels.copy()
    for column in ["typical_draft_m", "typical_loa_m", "typical_beam_m"]:
        limit = min(origin[column.replace("typical_", "max_")], dest[column.replace("typical_", "max_")])
        out[f"{column}_ok"] = out[column] <= limit
        out[f"{column}_limit"] = limit

    out["cargo_ok"] = out.dwt_max >= cargo * 0.90
    checks = ["typical_draft_m_ok", "typical_loa_m_ok", "typical_beam_m_ok", "cargo_ok"]
    out["eligible"] = out[checks].all(axis=1)
    out["utilisation"] = (cargo / out.dwt_max).clip(upper=1.0)
    return out


def just_in_time_plan(
    route: pd.Series,
    dest: pd.Series,
    vessel_type: str,
    congestion: int = 25,
    fuel_price: int = 580,
    berth_adjustment_hours: int = 0,
) -> dict:
    """Compute slow-steaming plan, anchorage wait avoided, fuel saved, and CO2 reduction."""
    standard_speed_kn, minimum_speed_kn = 12.0, 9.0
    standard_hours = float(route.distance_nm) / standard_speed_kn
    baseline_wait_hours = float(dest.avg_pre_berthing_delay_days) * 24 * (1 + congestion / 100)
    berth_ready_hours = max(1.0, standard_hours + baseline_wait_hours + berth_adjustment_hours)
    required_speed_kn = float(route.distance_nm) / berth_ready_hours
    jit_speed_kn = min(standard_speed_kn, max(minimum_speed_kn, required_speed_kn))
    jit_hours = float(route.distance_nm) / jit_speed_kn
    early_wait_hours = max(0.0, berth_ready_hours - standard_hours)
    jit_wait_hours = max(0.0, berth_ready_hours - jit_hours)

    daily_fuel = {"Handysize": 18, "Supramax": 26, "Panamax": 32, "Capesize": 55}.get(vessel_type, 26)

    def fuel(speed_kn: float, sailing_hours: float, waiting_hours: float) -> float:
        sailing = daily_fuel * (speed_kn / standard_speed_kn) ** 3 * sailing_hours / 24
        anchorage = 3.5 * waiting_hours / 24
        return sailing + anchorage

    standard_fuel = fuel(standard_speed_kn, standard_hours, early_wait_hours)
    jit_fuel = fuel(jit_speed_kn, jit_hours, jit_wait_hours)
    saved_fuel = max(0.0, standard_fuel - jit_fuel)
    co2_saved = saved_fuel * 3.114
    cost_saved = saved_fuel * fuel_price

    risk = min(100, round(congestion * 0.55 + min(40, early_wait_hours / 2) + (15 if required_speed_kn < minimum_speed_kn else 0)))

    if required_speed_kn > standard_speed_kn:
        action = "Maintain 12 kn — requested berth window is earlier than standard sailing plan."
    elif required_speed_kn < minimum_speed_kn:
        action = f"Slow steam at {minimum_speed_kn:.1f} kn, then plan for {jit_wait_hours:.0f} hours at anchorage."
    else:
        action = f"Slow steam at {jit_speed_kn:.1f} kn to meet predicted berth window Just-in-Time."

    return {
        "action": action,
        "berth_ready_days": round(berth_ready_hours / 24, 1),
        "standard_speed": standard_speed_kn,
        "jit_speed": round(jit_speed_kn, 1),
        "standard_sailing_days": round(standard_hours / 24, 1),
        "jit_sailing_days": round(jit_hours / 24, 1),
        "early_wait_hours": round(early_wait_hours, 1),
        "jit_wait_hours": round(jit_wait_hours, 1),
        "hours_saved_at_anchorage": round(max(0.0, early_wait_hours - jit_wait_hours), 1),
        "standard_fuel_tonnes": round(standard_fuel, 1),
        "jit_fuel_tonnes": round(jit_fuel, 1),
        "fuel_saved_tonnes": round(saved_fuel, 1),
        "cost_saved_usd": round(cost_saved, 0),
        "co2_saved_tonnes": round(co2_saved, 1),
        "risk_score": risk,
    }

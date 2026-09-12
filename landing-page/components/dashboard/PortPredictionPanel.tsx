'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Anchor,
  Waves,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  BarChart3,
  Sliders,
  DollarSign,
  Activity,
  SlidersHorizontal,
} from 'lucide-react'
import {
  RouteCatalog,
  ForecastResponse,
  MarineRiskData,
  VesselOptimizationResponse,
  JITPlanResponse,
  CharterStrategyResponse,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'

export default function PortPredictionPanel() {
  // Catalog & selection state
  const [catalog, setCatalog] = useState<RouteCatalog | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('AUNTL_INPAR')
  const [selectedVessel, setSelectedVessel] = useState<string>('Supramax')
  const [cargoMt, setCargoMt] = useState<number>(55000)
  const [congestion, setCongestion] = useState<number>(45)
  const [priority, setPriority] = useState<string>('Balanced')
  const [fuelPrice, setFuelPrice] = useState<number>(580)

  // Loading & error states
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true)
  const [isExecutingPrediction, setIsExecutingPrediction] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // API Results
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [originMarine, setOriginMarine] = useState<MarineRiskData | null>(null)
  const [destMarine, setDestMarine] = useState<MarineRiskData | null>(null)
  const [vesselOpt, setVesselOpt] = useState<VesselOptimizationResponse | null>(null)
  const [jitPlan, setJitPlan] = useState<JITPlanResponse | null>(null)
  const [strategy, setStrategy] = useState<CharterStrategyResponse | null>(null)

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'forecast' | 'vessel' | 'jit' | 'strategy'>('forecast')

  // Helper to get auth header
  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('varka_token') : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  // 1. Fetch Route Catalog on mount
  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      setIsLoadingCatalog(true)
      setErrorMessage(null)
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/prediction/routes`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.message || `Failed to load catalog (${res.status})`)
        }

        const json = await res.json()
        if (isMounted && json.data) {
          setCatalog(json.data)
          if (json.data.routes?.length > 0) {
            // Default to Newcastle -> Paradip or first route
            const defaultRoute = json.data.routes.find((r: any) => r.route_id === 'AUNTL_INPAR') || json.data.routes[0]
            setSelectedRouteId(defaultRoute.route_id)
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching route catalog:', err)
          setErrorMessage(
            err.message || 'Unable to connect to Port Prediction Service. Verify that the backend and Python engine are running.'
          )
        }
      } finally {
        if (isMounted) setIsLoadingCatalog(false)
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  // Currently selected route metadata
  const currentRoute = useMemo(() => {
    if (!catalog?.routes) return null
    return catalog.routes.find((r) => r.route_id === selectedRouteId) || catalog.routes[0]
  }, [catalog, selectedRouteId])

  // 2. Fetch all predictions & optimizations
  const executeEngine = async () => {
    if (!selectedRouteId) return
    setIsExecutingPrediction(true)
    setErrorMessage(null)

    try {
      const headers = getAuthHeaders()
      const destCode = currentRoute?.dest_port_code || 'INPAR'
      const originCode = currentRoute?.origin_port_code || 'AUNTL'

      // Parallel execution of all prediction endpoints via Express gateway
      const [
        forecastRes,
        vesselOptRes,
        jitRes,
        strategyRes,
        origMarineRes,
        destMarineRes,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/v1/prediction/forecast?route_id=${selectedRouteId}&vessel=${selectedVessel}&horizon=60`,
          { method: 'GET', headers, credentials: 'include' }
        ),
        fetch(`${API_BASE_URL}/api/v1/prediction/optimize-vessel`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            route_id: selectedRouteId,
            cargo: cargoMt,
            congestion,
            priority,
          }),
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/plan-jit`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            route_id: selectedRouteId,
            dest_code: destCode,
            vessel_type: selectedVessel,
            congestion,
            fuel_price: fuelPrice,
            berth_adjustment_hours: 0,
          }),
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/strategy`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            route_id: selectedRouteId,
            cargo: cargoMt,
            vessel_type: selectedVessel,
            laycan_days: 21,
            congestion,
          }),
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/marine?port_code=${originCode}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/marine?port_code=${destCode}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
      ])

      // Handle forecast
      if (forecastRes.ok) {
        const data = await forecastRes.json()
        setForecast(data.data)
      } else {
        const err = await forecastRes.json().catch(() => null)
        throw new Error(err?.message || 'Forecast calculation failed')
      }

      // Handle vessel optimization
      if (vesselOptRes.ok) {
        const data = await vesselOptRes.json()
        setVesselOpt(data.data)
      }

      // Handle JIT
      if (jitRes.ok) {
        const data = await jitRes.json()
        setJitPlan(data.data)
      }

      // Handle Strategy
      if (strategyRes.ok) {
        const data = await strategyRes.json()
        setStrategy(data.data)
      }

      // Handle Marine data
      if (origMarineRes.ok) {
        const data = await origMarineRes.json()
        setOriginMarine(data.data)
      }
      if (destMarineRes.ok) {
        const data = await destMarineRes.json()
        setDestMarine(data.data)
      }
    } catch (err: any) {
      console.error('Error executing prediction models:', err)
      setErrorMessage(err.message || 'Error executing ML prediction engine.')
    } finally {
      setIsExecutingPrediction(false)
    }
  }

  // Auto-run engine when route or vessel changes
  useEffect(() => {
    if (selectedRouteId && !isLoadingCatalog) {
      executeEngine()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId, selectedVessel, isLoadingCatalog])

  // SVG Chart Calculations for 60-day forecast with confidence bands
  const chartData = useMemo(() => {
    if (!forecast) return null
    const history = forecast.historical_recent || []
    const outlook = forecast.outlook || []

    const allPoints = [
      ...history.map((h) => ({
        date: h.date,
        val: h.rate_usd_t,
        p10: h.rate_usd_t,
        p90: h.rate_usd_t,
        type: 'history' as const,
      })),
      ...outlook.map((o) => ({
        date: o.date,
        val: o.forecast_usd_t,
        p10: o.p10,
        p90: o.p90,
        type: 'outlook' as const,
      })),
    ]

    if (allPoints.length === 0) return null

    const rates = allPoints.map((p) => p.val)
    const p10s = allPoints.map((p) => p.p10)
    const p90s = allPoints.map((p) => p.p90)
    const minVal = Math.min(...rates, ...p10s) * 0.92
    const maxVal = Math.max(...rates, ...p90s) * 1.08

    const width = 850
    const height = 280
    const padX = 50
    const padY = 30
    const innerW = width - padX * 2
    const innerH = height - padY * 2

    const scaleX = (idx: number) => padX + (idx / (allPoints.length - 1)) * innerW
    const scaleY = (val: number) => height - padY - ((val - minVal) / (maxVal - minVal)) * innerH

    // Build historical line
    const historyCoords = allPoints
      .slice(0, history.length)
      .map((p, idx) => `${scaleX(idx)},${scaleY(p.val)}`)
      .join(' ')

    // Build forecast line
    const outlookCoords = allPoints
      .slice(history.length - 1)
      .map((p, idx) => `${scaleX(history.length - 1 + idx)},${scaleY(p.val)}`)
      .join(' ')

    // Build P10-P90 band polygon for outlook
    const bandUpper = outlook.map((o, idx) => `${scaleX(history.length + idx)},${scaleY(o.p90)}`)
    const bandLower = [...outlook]
      .reverse()
      .map((o, idx) => `${scaleX(allPoints.length - 1 - idx)},${scaleY(o.p10)}`)
    const bandPolygon = [...bandUpper, ...bandLower].join(' ')

    return {
      width,
      height,
      minVal,
      maxVal,
      allPoints,
      historyLength: history.length,
      historyCoords,
      outlookCoords,
      bandPolygon,
      scaleX,
      scaleY,
    }
  }, [forecast])

  return (
    <div className="varka-prediction-root">
      {/* Top Banner / Marine Status */}
      <div className="varka-prediction-banner">
        <div className="varka-pred-banner-left">
          <div className="varka-pred-pulse-badge">
            <span className="varka-pulse-dot" />
            <span>XGBOOST ML ENGINE ACTIVE</span>
          </div>
          <h2 className="varka-pred-title">
            {currentRoute
              ? `${currentRoute.origin_name} → ${currentRoute.dest_name}`
              : 'Bulk Freight Rate Forecast'}
          </h2>
          <p className="varka-pred-subtitle">
            Route ID: <code>{selectedRouteId}</code> • Distance:{' '}
            {currentRoute?.distance_nm.toLocaleString()} nm • Origin: {currentRoute?.origin_country}
          </p>
        </div>

        {/* Live Weather Sea Conditions Badges */}
        <div className="varka-marine-telemetry-box">
          <div className="varka-marine-item">
            <div className="varka-marine-header">
              <Waves size={13} className="varka-marine-icon" />
              <span>ORIGIN SEA STATE</span>
            </div>
            <div className="varka-marine-data">
              <span className="varka-marine-val">
                {originMarine?.max_wave_m !== null ? `${originMarine?.max_wave_m}m` : '1.2m'}
              </span>
              <span
                className={`varka-risk-pill ${
                  originMarine?.risk === 'High'
                    ? 'risk-high'
                    : originMarine?.risk === 'Moderate'
                    ? 'risk-moderate'
                    : 'risk-low'
                }`}
              >
                {originMarine?.risk || 'Low'}
              </span>
            </div>
            <span className="varka-marine-sub">Open-Meteo Live</span>
          </div>

          <div className="varka-marine-divider" />

          <div className="varka-marine-item">
            <div className="varka-marine-header">
              <Anchor size={13} className="varka-marine-icon" />
              <span>DISCHARGE SEA STATE</span>
            </div>
            <div className="varka-marine-data">
              <span className="varka-marine-val">
                {destMarine?.max_wave_m !== null ? `${destMarine?.max_wave_m}m` : '1.8m'}
              </span>
              <span
                className={`varka-risk-pill ${
                  destMarine?.risk === 'High'
                    ? 'risk-high'
                    : destMarine?.risk === 'Moderate'
                    ? 'risk-moderate'
                    : 'risk-low'
                }`}
              >
                {destMarine?.risk || 'Moderate'}
              </span>
            </div>
            <span className="varka-marine-sub">Indian Coast Live</span>
          </div>
        </div>
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="varka-pred-error-banner" role="alert">
          <AlertTriangle size={18} className="varka-error-icon" />
          <div className="varka-error-msg-wrap">
            <span className="varka-error-title">Prediction Gateway Warning</span>
            <span className="varka-error-desc">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={executeEngine}
            className="varka-error-retry-btn"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Configuration Toolbar */}
      <section className="varka-pred-toolbar" aria-label="Route and Model Parameters">
        <div className="varka-toolbar-grid">
          {/* Route selector */}
          <div className="varka-control-group">
            <label htmlFor="pred-route-select" className="varka-control-label">
              <Anchor size={13} /> SELECT TRADE ROUTE
            </label>
            <select
              id="pred-route-select"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="varka-control-select"
              disabled={isLoadingCatalog}
            >
              {catalog?.routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.origin_name} ({r.origin_country}) → {r.dest_name} ({r.distance_nm} nm)
                </option>
              ))}
            </select>
          </div>

          {/* Vessel class selector */}
          <div className="varka-control-group">
            <label htmlFor="pred-vessel-select" className="varka-control-label">
              <Gauge size={13} /> VESSEL CLASS
            </label>
            <select
              id="pred-vessel-select"
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="varka-control-select"
            >
              <option value="Supramax">Supramax (50k - 65k DWT)</option>
              <option value="Panamax">Panamax (65k - 85k DWT)</option>
              <option value="Handysize">Handysize (25k - 40k DWT)</option>
              <option value="Capesize">Capesize (120k - 200k DWT)</option>
            </select>
          </div>

          {/* Cargo Parcel MT */}
          <div className="varka-control-group">
            <label htmlFor="pred-cargo-input" className="varka-control-label">
              <Layers size={13} /> CARGO VOLUME (MT)
            </label>
            <input
              id="pred-cargo-input"
              type="number"
              min={5000}
              max={200000}
              step={1000}
              value={cargoMt}
              onChange={(e) => setCargoMt(Number(e.target.value))}
              className="varka-control-input"
            />
          </div>

          {/* Congestion Scenario */}
          <div className="varka-control-group">
            <div className="varka-slider-header">
              <label htmlFor="pred-congestion-slider" className="varka-control-label">
                <Activity size={13} /> CONGESTION INDEX
              </label>
              <span className="varka-slider-val">{congestion}/100</span>
            </div>
            <input
              id="pred-congestion-slider"
              type="range"
              min={0}
              max={100}
              value={congestion}
              onChange={(e) => setCongestion(Number(e.target.value))}
              className="varka-control-slider"
            />
          </div>

          {/* Optimization Priority */}
          <div className="varka-control-group">
            <label htmlFor="pred-priority-select" className="varka-control-label">
              <SlidersHorizontal size={13} /> PRIORITY
            </label>
            <select
              id="pred-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="varka-control-select"
            >
              <option value="Balanced">Balanced Strategy</option>
              <option value="Lowest cost">Lowest Cost Focus</option>
              <option value="Lowest CO₂">Lowest Carbon (CO₂)</option>
              <option value="Highest reliability">Highest Reliability</option>
            </select>
          </div>

          {/* Re-calculate Button */}
          <div className="varka-control-group varka-action-group">
            <button
              type="button"
              onClick={executeEngine}
              disabled={isExecutingPrediction}
              className="varka-btn-predict"
            >
              <RefreshCw
                size={14}
                className={isExecutingPrediction ? 'varka-spin' : ''}
              />
              <span>{isExecutingPrediction ? 'COMPUTING...' : 'RUN FORECAST'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Highlight Summary Cards */}
      <section className="varka-pred-kpis" aria-label="Forecast Metrics">
        <div className="varka-kpi-card">
          <div className="varka-kpi-top">
            <span className="varka-kpi-label">FORECAST FREIGHT RATE</span>
            <TrendingUp size={16} className="varka-kpi-icon accent-cyan" />
          </div>
          <div className="varka-kpi-main">
            <span className="varka-kpi-num">
              ${forecast ? forecast.current_rate_usd_t.toFixed(2) : '—'}
            </span>
            <span className="varka-kpi-unit">/ MT</span>
          </div>
          <div className="varka-kpi-bottom">
            <span className="varka-kpi-badge">
              ±${forecast ? forecast.uncertainty_band_usd_t.toFixed(2) : '—'} residual band
            </span>
            {forecast?.mape_pct && (
              <span className="varka-kpi-sub">{forecast.mape_pct}% MAPE</span>
            )}
          </div>
        </div>

        <div className="varka-kpi-card">
          <div className="varka-kpi-top">
            <span className="varka-kpi-label">OPTIMAL VESSEL CLASS</span>
            <Anchor size={16} className="varka-kpi-icon accent-blue" />
          </div>
          <div className="varka-kpi-main">
            <span className="varka-kpi-num">
              {vesselOpt?.recommended_vessel || selectedVessel}
            </span>
          </div>
          <div className="varka-kpi-bottom">
            <span className="varka-kpi-badge">
              {vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.availability_status ||
                'Available for laycan'}
            </span>
            <span className="varka-kpi-sub">
              {vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.multi_objective_score || 88}
              /100 score
            </span>
          </div>
        </div>

        <div className="varka-kpi-card">
          <div className="varka-kpi-top">
            <span className="varka-kpi-label">JIT BERTH ARRIVAL</span>
            <Zap size={16} className="varka-kpi-icon accent-emerald" />
          </div>
          <div className="varka-kpi-main">
            <span className="varka-kpi-num">
              {jitPlan ? jitPlan.jit_speed.toFixed(1) : '11.0'}
            </span>
            <span className="varka-kpi-unit">knots</span>
          </div>
          <div className="varka-kpi-bottom">
            <span className="varka-kpi-badge">
              {jitPlan ? jitPlan.hours_saved_at_anchorage.toFixed(0) : '36'}h wait avoided
            </span>
            <span className="varka-kpi-sub">
              {jitPlan ? jitPlan.berth_ready_days.toFixed(1) : '20.5'}d berth ready
            </span>
          </div>
        </div>

        <div className="varka-kpi-card">
          <div className="varka-kpi-top">
            <span className="varka-kpi-label">DECARBONIZATION SAVINGS</span>
            <ShieldCheck size={16} className="varka-kpi-icon accent-green" />
          </div>
          <div className="varka-kpi-main">
            <span className="varka-kpi-num">
              {jitPlan ? jitPlan.fuel_saved_tonnes.toFixed(1) : '28.4'}
            </span>
            <span className="varka-kpi-unit">tonnes fuel</span>
          </div>
          <div className="varka-kpi-bottom">
            <span className="varka-kpi-badge">
              ${jitPlan ? jitPlan.cost_saved_usd.toLocaleString() : '16,400'} saved
            </span>
            <span className="varka-kpi-sub">
              -{jitPlan ? jitPlan.co2_saved_tonnes.toFixed(1) : '88.3'}t CO₂
            </span>
          </div>
        </div>
      </section>

      {/* Module Sub-Navigation */}
      <div className="varka-pred-subnav">
        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className={`varka-pred-tab ${activeTab === 'forecast' ? 'is-active' : ''}`}
        >
          <BarChart3 size={15} />
          <span>60-Day Rate Forecast & XAI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vessel')}
          className={`varka-pred-tab ${activeTab === 'vessel' ? 'is-active' : ''}`}
        >
          <Gauge size={15} />
          <span>Vessel Feasibility Gate</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jit')}
          className={`varka-pred-tab ${activeTab === 'jit' ? 'is-active' : ''}`}
        >
          <Zap size={15} />
          <span>JIT Arrival Digital Twin</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('strategy')}
          className={`varka-pred-tab ${activeTab === 'strategy' ? 'is-active' : ''}`}
        >
          <ShieldAlert size={15} />
          <span>Commercial Charter Strategy</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: 60-DAY RATE FORECAST & EXPLAINABLE AI DRIVERS
         ========================================================================= */}
      {activeTab === 'forecast' && (
        <div className="varka-pred-tab-content">
          <div className="varka-pred-card">
            <div className="varka-pred-card-header">
              <div>
                <h3 className="varka-card-title">60-Day Forward Rate Trajectory</h3>
                <p className="varka-card-desc">
                  Calibrated XGBoost recursive multi-step forecasting with 80% empirical residual
                  confidence corridor.
                </p>
              </div>
              <div className="varka-chart-legend">
                <span className="varka-legend-item">
                  <span className="legend-line line-history" /> 30-Day History
                </span>
                <span className="varka-legend-item">
                  <span className="legend-line line-forecast" /> XGBoost Outlook
                </span>
                <span className="varka-legend-item">
                  <span className="legend-box box-p10-p90" /> P10 - P90 Corridor
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="varka-svg-container">
              {chartData ? (
                <svg
                  viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                  className="varka-forecast-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="p10p90Glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.04" />
                    </linearGradient>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#00f5a0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = 30 + (280 - 60) * pct
                    const val = chartData.maxVal - (chartData.maxVal - chartData.minVal) * pct
                    return (
                      <g key={idx}>
                        <line
                          x1="50"
                          y1={y}
                          x2="800"
                          y2={y}
                          stroke="rgba(255, 255, 255, 0.07)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="42"
                          y={y + 4}
                          fill="rgba(255, 255, 255, 0.4)"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          ${val.toFixed(1)}
                        </text>
                      </g>
                    )
                  })}

                  {/* Vertical separator between history and forecast */}
                  <line
                    x1={chartData.scaleX(chartData.historyLength - 1)}
                    y1="25"
                    x2={chartData.scaleX(chartData.historyLength - 1)}
                    y2="255"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={chartData.scaleX(chartData.historyLength - 1) + 6}
                    y="40"
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="600"
                  >
                    TODAY (FORECAST START)
                  </text>

                  {/* P10 - P90 Area */}
                  {chartData.bandPolygon && (
                    <polygon
                      points={chartData.bandPolygon}
                      fill="url(#p10p90Glow)"
                      stroke="rgba(56, 189, 248, 0.3)"
                      strokeWidth="1"
                    />
                  )}

                  {/* Historical Rate Polyline */}
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    points={chartData.historyCoords}
                  />

                  {/* Forecast Rate Polyline */}
                  <polyline
                    fill="none"
                    stroke="url(#lineGlow)"
                    strokeWidth="2.5"
                    points={chartData.outlookCoords}
                  />
                </svg>
              ) : (
                <div className="varka-loading-box">
                  <RefreshCw size={24} className="varka-spin" />
                  <span>Generating forward trajectory...</span>
                </div>
              )}
            </div>

            {/* Weekly Entry Windows */}
            <div className="varka-weekly-section">
              <h4 className="varka-subheading">Market Entry Planning Windows</h4>
              <div className="varka-table-wrap">
                <table className="varka-data-table">
                  <thead>
                    <tr>
                      <th>FORWARD WINDOW</th>
                      <th>EARLIEST DATE</th>
                      <th>PROJECTED MIN RATE</th>
                      <th>AVERAGE RATE</th>
                      <th>RECOMMENDED ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast?.weekly_windows.map((w, i) => (
                      <tr key={i}>
                        <td className="font-mono">{w.week}</td>
                        <td>{w.earliest_date}</td>
                        <td className="font-mono text-emerald">${w.min_rate.toFixed(2)}/MT</td>
                        <td className="font-mono">${w.average_rate.toFixed(2)}/MT</td>
                        <td>
                          <span
                            className={`varka-badge-pill ${
                              w.action.includes('Preferred') ? 'pill-preferred' : 'pill-defer'
                            }`}
                          >
                            {w.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explainable AI Forecast Drivers */}
            <div className="varka-xai-section">
              <div className="varka-xai-header">
                <div>
                  <h4 className="varka-subheading">Local Forecast Drivers (XAI)</h4>
                  <p className="varka-card-desc">
                    Top model features driving rate prediction upwards or downwards (method:{' '}
                    <code>{forecast?.explanation_method || 'feature impact'}</code>).
                  </p>
                </div>
              </div>

              <div className="varka-driver-grid">
                {forecast?.drivers.map((d, idx) => {
                  const isPositive = d.impact >= 0
                  return (
                    <div key={idx} className="varka-driver-card">
                      <div className="varka-driver-title">
                        <span>{d.driver.toUpperCase()}</span>
                        <span className={`varka-driver-val ${isPositive ? 'text-rose' : 'text-emerald'}`}>
                          {isPositive ? '+' : ''}
                          {d.impact.toFixed(4)}
                        </span>
                      </div>
                      <div className="varka-driver-track">
                        <div
                          className={`varka-driver-bar ${isPositive ? 'bar-positive' : 'bar-negative'}`}
                          style={{
                            width: `${Math.min(100, Math.abs(d.impact) * 80)}%`,
                          }}
                        />
                      </div>
                      <span className="varka-driver-note">
                        {isPositive ? 'Increases spot rate premium' : 'Exerts downward pressure'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VESSEL FEASIBILITY GATE & MULTI-OBJECTIVE RANKING
         ========================================================================= */}
      {activeTab === 'vessel' && (
        <div className="varka-pred-tab-content">
          <div className="varka-pred-card">
            <div className="varka-pred-card-header">
              <div>
                <h3 className="varka-card-title">Port Feasibility Gate & Optimization</h3>
                <p className="varka-card-desc">
                  Strict physical validation for loading & discharge ports: Maximum Draft, LOA,
                  Beam, and DWT capacity.
                </p>
              </div>
              <div className="varka-pill-group">
                <span className="varka-badge-pill pill-preferred">
                  Priority: {vesselOpt?.priority || priority}
                </span>
                <span className="varka-badge-pill pill-neutral">
                  Cargo: {cargoMt.toLocaleString()} MT
                </span>
              </div>
            </div>

            <div className="varka-vessel-cards-grid">
              {vesselOpt?.vessel_classes.map((cls) => (
                <div
                  key={cls.vessel_type}
                  className={`varka-vessel-card ${
                    cls.is_recommended ? 'is-best-vessel' : ''
                  } ${!cls.eligible ? 'is-ineligible' : ''}`}
                >
                  {cls.is_recommended && (
                    <div className="varka-best-tag">
                      <CheckCircle2 size={13} /> RECOMMENDED FIT
                    </div>
                  )}

                  <div className="varka-vessel-top">
                    <h4 className="varka-vessel-name">{cls.vessel_type}</h4>
                    <span className="varka-vessel-score">
                      Score: <strong>{cls.multi_objective_score.toFixed(1)}</strong>/100
                    </span>
                  </div>

                  <div className="varka-vessel-metrics">
                    <div className="varka-vm-item">
                      <span className="vm-label">PARCEL RATE</span>
                      <span className="vm-val text-cyan">${cls.forecast_rate_usd_t.toFixed(2)}/t</span>
                    </div>
                    <div className="varka-vm-item">
                      <span className="vm-label">TOTAL FREIGHT</span>
                      <span className="vm-val font-mono">${(cls.total_freight_usd / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="varka-vm-item">
                      <span className="vm-label">UTILISATION</span>
                      <span className="vm-val">{(cls.utilisation * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Physical constraints checks */}
                  <div className="varka-gate-checks">
                    <div className="varka-gate-row">
                      <span>Draft Limit ({cls.draft_limit_m}m)</span>
                      {cls.typical_draft_m_ok ? (
                        <CheckCircle2 size={15} className="text-emerald" />
                      ) : (
                        <XCircle size={15} className="text-rose" />
                      )}
                    </div>
                    <div className="varka-gate-row">
                      <span>LOA Limit ({cls.loa_limit_m}m)</span>
                      {cls.typical_loa_m_ok ? (
                        <CheckCircle2 size={15} className="text-emerald" />
                      ) : (
                        <XCircle size={15} className="text-rose" />
                      )}
                    </div>
                    <div className="varka-gate-row">
                      <span>Beam Limit ({cls.beam_limit_m}m)</span>
                      {cls.typical_beam_m_ok ? (
                        <CheckCircle2 size={15} className="text-emerald" />
                      ) : (
                        <XCircle size={15} className="text-rose" />
                      )}
                    </div>
                    <div className="varka-gate-row">
                      <span>Cargo Capacity Check</span>
                      {cls.cargo_ok ? (
                        <CheckCircle2 size={15} className="text-emerald" />
                      ) : (
                        <XCircle size={15} className="text-rose" />
                      )}
                    </div>
                  </div>

                  {/* Fleet status */}
                  <div className="varka-vessel-footer">
                    <span className="varka-fleet-status">{cls.availability_status}</span>
                    <span className="varka-fleet-hulls">
                      {cls.available_hulls} hulls • ~{cls.next_available_days}d ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: JUST-IN-TIME (JIT) ARRIVAL DIGITAL TWIN
         ========================================================================= */}
      {activeTab === 'jit' && (
        <div className="varka-pred-tab-content">
          <div className="varka-pred-card">
            <div className="varka-pred-card-header">
              <div>
                <h3 className="varka-card-title">Just-in-Time Arrival Digital Twin</h3>
                <p className="varka-card-desc">
                  Berth-aligned speed optimization reducing idle waiting at anchorage and bunker
                  emissions.
                </p>
              </div>
              <div className="varka-pred-badge-live">
                <span className="varka-pulse-dot" /> LIVE TWIN
              </div>
            </div>

            {/* Action Banner */}
            <div className="varka-jit-action-banner">
              <Zap size={22} className="varka-jit-action-icon" />
              <div className="varka-jit-action-body">
                <span className="varka-jit-action-kicker">GOVERNED SPEED INSTRUCTION</span>
                <h4 className="varka-jit-action-text">{jitPlan?.action}</h4>
                <p className="varka-jit-action-sub">
                  Target arrival matches terminal berth readiness window within{' '}
                  {jitPlan?.berth_ready_days.toFixed(1)} days.
                </p>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="varka-jit-compare-grid">
              <div className="varka-compare-box">
                <div className="varka-cb-header">STANDARD 12-KNOT ARRIVAL</div>
                <div className="varka-cb-row">
                  <span>Standard Sailing Speed</span>
                  <strong className="font-mono">12.0 knots</strong>
                </div>
                <div className="varka-cb-row">
                  <span>Sailing Duration</span>
                  <strong className="font-mono">
                    {jitPlan ? jitPlan.standard_sailing_days.toFixed(1) : '20.2'} days
                  </strong>
                </div>
                <div className="varka-cb-row">
                  <span>Anchorage Idling Wait</span>
                  <strong className="font-mono text-rose">
                    {jitPlan ? jitPlan.early_wait_hours.toFixed(0) : '48'} hours
                  </strong>
                </div>
                <div className="varka-cb-row">
                  <span>Total Fuel Burned</span>
                  <strong className="font-mono">
                    {jitPlan ? jitPlan.standard_fuel_tonnes.toFixed(1) : '525.0'} t
                  </strong>
                </div>
              </div>

              <div className="varka-compare-box is-jit-optimized">
                <div className="varka-cb-header text-emerald">JUST-IN-TIME OPTIMIZED PLAN</div>
                <div className="varka-cb-row">
                  <span>Adjusted Steaming Speed</span>
                  <strong className="font-mono text-emerald">
                    {jitPlan ? jitPlan.jit_speed.toFixed(1) : '11.0'} knots
                  </strong>
                </div>
                <div className="varka-cb-row">
                  <span>Sailing Duration</span>
                  <strong className="font-mono">
                    {jitPlan ? jitPlan.jit_sailing_days.toFixed(1) : '22.0'} days
                  </strong>
                </div>
                <div className="varka-cb-row">
                  <span>Anchorage Idling Wait</span>
                  <strong className="font-mono text-emerald">
                    {jitPlan ? jitPlan.jit_wait_hours.toFixed(0) : '0'} hours
                  </strong>
                </div>
                <div className="varka-cb-row">
                  <span>Optimized Fuel Burn</span>
                  <strong className="font-mono text-emerald">
                    {jitPlan ? jitPlan.jit_fuel_tonnes.toFixed(1) : '496.6'} t
                  </strong>
                </div>
              </div>
            </div>

            {/* Environmental & Financial Impact Bar */}
            <div className="varka-jit-impact-strip">
              <div className="varka-jis-item">
                <span className="jis-label">ANCHORAGE DELAY AVOIDED</span>
                <span className="jis-val text-cyan">
                  {jitPlan ? jitPlan.hours_saved_at_anchorage.toFixed(0) : '48'} Hours
                </span>
              </div>
              <div className="varka-jis-item">
                <span className="jis-label">BUNKER FUEL SAVED</span>
                <span className="jis-val text-emerald">
                  {jitPlan ? jitPlan.fuel_saved_tonnes.toFixed(1) : '28.4'} Tonnes
                </span>
              </div>
              <div className="varka-jis-item">
                <span className="jis-label">FINANCIAL EXPENSE SAVED</span>
                <span className="jis-val text-emerald">
                  ${jitPlan ? jitPlan.cost_saved_usd.toLocaleString() : '16,472'} USD
                </span>
              </div>
              <div className="varka-jis-item">
                <span className="jis-label">CARBON FOOTPRINT REDUCTION</span>
                <span className="jis-val text-emerald">
                  -{jitPlan ? jitPlan.co2_saved_tonnes.toFixed(1) : '88.4'} t CO₂
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: COMMERCIAL CHARTER STRATEGY
         ========================================================================= */}
      {activeTab === 'strategy' && (
        <div className="varka-pred-tab-content">
          <div className="varka-pred-card">
            <div className="varka-pred-card-header">
              <div>
                <h3 className="varka-card-title">Governed Commercial Charter Posture</h3>
                <p className="varka-card-desc">
                  Balances spot rate exposure against multi-voyage contract discounts and risk
                  tolerances.
                </p>
              </div>
              <span className="varka-badge-pill pill-preferred">
                Risk Index: {strategy?.risk_index || 48}/100
              </span>
            </div>

            {/* Strategic Posture Callout */}
            <div className="varka-strategy-posture-banner">
              <div className="varka-spb-left">
                <span className="varka-spb-kicker">RECOMMENDED COMMERCIAL POSTURE</span>
                <h3 className="varka-spb-posture">
                  {strategy?.posture || 'Staged 3-Voyage Commitment'}
                </h3>
                <p className="varka-spb-action">{strategy?.action}</p>
                <div className="varka-spb-rationale">
                  <strong>Strategic Rationale:</strong> {strategy?.rationale}
                </div>
              </div>

              <div className="varka-spb-right">
                <div className="varka-spb-metric">
                  <span>STRATEGY EXPOSURE</span>
                  <strong>${strategy ? (strategy.expected_cost / 1000).toFixed(0) : '2,850'}k</strong>
                </div>
                <div className="varka-spb-metric">
                  <span>SAVINGS VS REPEATED SPOT</span>
                  <strong className="text-emerald">
                    +${strategy ? (strategy.expected_saving / 1000).toFixed(0) : '72'}k
                  </strong>
                </div>
              </div>
            </div>

            {/* Commitment Sensitivity Table */}
            <div className="varka-strategy-table-section">
              <h4 className="varka-subheading">Voyage Commitment Sensitivity</h4>
              <div className="varka-table-wrap">
                <table className="varka-data-table">
                  <thead>
                    <tr>
                      <th>COMMITMENT</th>
                      <th>CONTRACT RATE</th>
                      <th>ALL-IN BUDGET</th>
                      <th>SAVING VS REPEATED SPOT</th>
                      <th>CYCLE DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy?.scenarios.map((sc) => (
                      <tr key={sc.voyages}>
                        <td>
                          <strong>
                            {sc.voyages === 1
                              ? 'Single Spot Voyage'
                              : `${sc.voyages}-Voyage Term Contract`}
                          </strong>
                        </td>
                        <td className="font-mono text-cyan">${sc.contract_rate_usd_mt.toFixed(2)}/MT</td>
                        <td className="font-mono">${(sc.all_in_cost_usd / 1000).toFixed(0)}k</td>
                        <td className="font-mono text-emerald">
                          {sc.saving_vs_repeated_spot_usd > 0
                            ? `+$${(sc.saving_vs_repeated_spot_usd / 1000).toFixed(0)}k`
                            : 'Baseline'}
                        </td>
                        <td>{sc.planned_cycle_days.toFixed(0)} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contract Protections List */}
            <div className="varka-protections-box">
              <h4 className="varka-subheading">Mandatory Chartering Clauses & Protections</h4>
              <div className="varka-protections-list">
                {strategy?.protections.map((p, idx) => (
                  <div key={idx} className="varka-protection-item">
                    <ShieldCheck size={16} className="text-emerald" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

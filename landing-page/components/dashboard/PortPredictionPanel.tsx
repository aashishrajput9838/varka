'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  MessageSquareCode,
  Send,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Award,
  Clock,
  Check,
  FileCheck2,
  Ship,
  Download,
  FileText,
  Database,
  Link2,
} from 'lucide-react'
import {
  RouteCatalog,
  ForecastResponse,
  MarineRiskData,
  VesselOptimizationResponse,
  JITPlanResponse,
  CharterStrategyResponse,
  EarlyWarningAlert,
  AssistantMessage,
  PortScorecardItem,
  ScenarioSummaryItem,
  ScenarioDataPoint,
  NavSection,
  FleetRosterItem,
  RiskDetailItem,
  AuditItem,
  StandardsMappingItem,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'

interface PortPredictionPanelProps {
  activeSection?: NavSection
  onSelectSection?: (section: NavSection) => void
}

export default function PortPredictionPanel({
  activeSection,
  onSelectSection,
}: PortPredictionPanelProps) {
  // Catalog & selection state
  const [catalog, setCatalog] = useState<RouteCatalog | null>(null)
  const [dischargePort, setDischargePort] = useState<string>('INPAR')
  const [selectedRouteId, setSelectedRouteId] = useState<string>('AUNTL_INPAR')
  const [selectedVessel, setSelectedVessel] = useState<string>('Panamax')
  const [cargoMt, setCargoMt] = useState<number>(55000)
  const [commodity, setCommodity] = useState<string>('Thermal coal')
  const [charterStrategy, setCharterStrategy] = useState<number>(1) // 1 = Spot, 3 = 3-voyage, 6 = 6-voyage
  const [laycanDate, setLaycanDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })
  const [congestion, setCongestion] = useState<number>(45)
  const [priority, setPriority] = useState<string>('Balanced')

  // Expandable assumptions
  const [showJitAssumptions, setShowJitAssumptions] = useState<boolean>(false)
  const [fuelPrice, setFuelPrice] = useState<number>(650)
  const [berthAdjustmentHours, setBerthAdjustmentHours] = useState<number>(0)

  const [showCommercialAssumptions, setShowCommercialAssumptions] = useState<boolean>(false)
  const [discount3, setDiscount3] = useState<number>(2.5)
  const [discount6, setDiscount6] = useState<number>(5.0)

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
  const [scorecard, setScorecard] = useState<PortScorecardItem[]>([])
  const [scenariosSummary, setScenariosSummary] = useState<ScenarioSummaryItem[]>([])
  const [scenariosData, setScenariosData] = useState<ScenarioDataPoint[]>([])
  const [fleetRoster, setFleetRoster] = useState<FleetRosterItem[]>([])
  const [riskDetails, setRiskDetails] = useState<RiskDetailItem[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditItem[]>([])
  const [standardsMapping, setStandardsMapping] = useState<StandardsMappingItem[]>([])
  const [liveContextData, setLiveContextData] = useState<any | null>(null)
  const [isLoadingLiveContext, setIsLoadingLiveContext] = useState<boolean>(false)

  // Active tab state
  type PanelTab =
    | 'brief'
    | 'optimizer'
    | 'jit'
    | 'scenarios'
    | 'forecast'
    | 'scorecard'
    | 'fleet'
    | 'risk'
    | 'standards'
    | 'assistant'

  const [activeTab, setActiveTab] = useState<PanelTab>('brief')

  // Synchronize activeTab with activeSection from sidebar
  useEffect(() => {
    if (activeSection === 'cockpit') setActiveTab('brief')
    else if (activeSection === 'assistant') setActiveTab('assistant')
    else if (activeSection === 'scorecard') setActiveTab('scorecard')
    else if (activeSection === 'prediction') setActiveTab('forecast')
    else if (activeSection === 'optimizer') setActiveTab('optimizer')
    else if (activeSection === 'jit') setActiveTab('jit')
    else if (activeSection === 'scenarios') setActiveTab('scenarios')
    else if (activeSection === 'fleet') setActiveTab('fleet')
    else if (activeSection === 'risk') setActiveTab('risk')
    else if (activeSection === 'standards') setActiveTab('standards')
  }, [activeSection])

  // Charter Assistant chat state
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        'I am ready to explain this charter recommendation. Ask me why this vessel was selected, whether to fix now, or what the main risks are.',
      timestamp: 'Just now',
    },
  ])
  const [inputQuery, setInputQuery] = useState<string>('')
  const [isAnswering, setIsAnswering] = useState<boolean>(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

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
            const defaultRoute =
              json.data.routes.find((r: any) => r.route_id === 'AUNTL_INPAR') || json.data.routes[0]
            setSelectedRouteId(defaultRoute.route_id)
            setDischargePort(defaultRoute.dest_port_code || 'INPAR')
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching route catalog:', err)
          setErrorMessage(
            err.message ||
              'Unable to connect to Port Prediction Service. Verify that the backend and Python engine are running.'
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

  // Filter routes by currently selected discharge port
  const availableRoutesForPort = useMemo(() => {
    if (!catalog?.routes) return []
    return catalog.routes.filter((r) => r.dest_port_code === dischargePort)
  }, [catalog, dischargePort])

  // Currently selected route metadata
  const currentRoute = useMemo(() => {
    if (!catalog?.routes) return null
    return catalog.routes.find((r) => r.route_id === selectedRouteId) || catalog.routes[0]
  }, [catalog, selectedRouteId])

  // Handle discharge port change: auto-update route options
  const handleDischargePortChange = (portCode: string) => {
    setDischargePort(portCode)
    if (catalog?.routes) {
      const match = catalog.routes.find((r) => r.dest_port_code === portCode)
      if (match) setSelectedRouteId(match.route_id)
    }
  }

  // 2. Fetch all predictions & optimizations
  const executeEngine = async () => {
    if (!selectedRouteId) return
    setIsExecutingPrediction(true)
    setErrorMessage(null)

    try {
      const headers = getAuthHeaders()
      const destCode = currentRoute?.dest_port_code || dischargePort
      const originCode = currentRoute?.origin_port_code || 'AUNTL'

      // Calculate days to laycan
      const laycanMs = new Date(laycanDate).getTime() - new Date().getTime()
      const laycanDays = Math.max(1, Math.round(laycanMs / (1000 * 60 * 60 * 24)))

      // Parallel execution of all prediction endpoints via Express gateway
      const [
        forecastRes,
        vesselOptRes,
        jitRes,
        strategyRes,
        origMarineRes,
        destMarineRes,
        scorecardRes,
        scenariosRes,
        fleetRes,
        standardsRes,
        riskRes,
        auditRes,
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
            berth_adjustment_hours: berthAdjustmentHours,
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
            laycan_days: laycanDays,
            congestion,
            voyages: charterStrategy,
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
        fetch(`${API_BASE_URL}/api/v1/prediction/scorecard?cargo=${cargoMt}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/scenarios`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            route_id: selectedRouteId,
            vessel_type: selectedVessel,
            congestion,
            cargo: cargoMt,
          }),
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/fleet`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/standards`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/risk-cockpit`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            congestion,
            uncertainty: 0.45,
            rate: 14.01,
            port_days: 6.1,
            fleet_days: 11,
            jit_risk: 40,
          }),
        }),
        fetch(`${API_BASE_URL}/api/v1/prediction/audit`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            route_id: selectedRouteId,
            vessel: selectedVessel,
            cargo: cargoMt,
            priority,
            risk_index: 48,
            jit_action: 'Proceed at 10.8 knots; arrive directly for pilotage',
            source_status: 'Calibrated synthetic series + Open-Meteo & World Bank free APIs',
          }),
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

      // Handle Scorecard
      if (scorecardRes.ok) {
        const data = await scorecardRes.json()
        setScorecard(data.data?.scorecard || [])
      }

      // Handle Scenarios
      if (scenariosRes.ok) {
        const data = await scenariosRes.json()
        setScenariosSummary(data.data?.summary || [])
        setScenariosData(data.data?.scenarios_data || [])
      }

      // Handle Fleet Roster
      if (fleetRes && fleetRes.ok) {
        const data = await fleetRes.json()
        setFleetRoster(data.data?.fleet || [])
      }
      if (standardsRes && standardsRes.ok) {
        const data = await standardsRes.json()
        setStandardsMapping(data.data?.standards_mapping || [])
      }
      if (riskRes && riskRes.ok) {
        const data = await riskRes.json()
        setRiskDetails(data.data?.risk_details || [])
      }
      if (auditRes && auditRes.ok) {
        const data = await auditRes.json()
        setAuditTrail(data.data?.audit_trail || [])
      }
    } catch (err: any) {
      console.error('Error executing prediction models:', err)
      setErrorMessage(err.message || 'Error executing ML prediction engine.')
    } finally {
      setIsExecutingPrediction(false)
    }
  }

  // Helper for downloading CSV files
  const downloadCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || !rows.length) return
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h]
            const escaped = typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            return escaped
          })
          .join(',')
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle refresh live context for World Bank + Open-Meteo
  const handleRefreshLiveContext = async () => {
    setIsLoadingLiveContext(true)
    try {
      const originCode = currentRoute?.origin_port_code || 'AUNTL'
      const destCode = dischargePort || 'INPAR'
      const originCountry = currentRoute?.origin_country || 'Australia'

      const res = await fetch(
        `${API_BASE_URL}/api/v1/prediction/context?origin_port=${originCode}&dest_port=${destCode}&origin_country=${encodeURIComponent(
          originCountry
        )}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      if (res.ok) {
        const json = await res.json()
        setLiveContextData(json.data)
      }
    } catch (err) {
      console.warn('Live context fetch warning:', err)
    } finally {
      setIsLoadingLiveContext(false)
    }
  }

  // Auto-run engine when key inputs change
  useEffect(() => {
    if (selectedRouteId && !isLoadingCatalog) {
      executeEngine()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedRouteId,
    selectedVessel,
    cargoMt,
    congestion,
    priority,
    charterStrategy,
    isLoadingCatalog,
  ])

  // Handle Charter Assistant send query
  const handleSendQuery = async (queryText?: string) => {
    const text = queryText || inputQuery
    if (!text.trim()) return

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setIsAnswering(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/prediction/assistant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          query: text,
          route_id: selectedRouteId,
          vessel_type: selectedVessel,
          cargo: cargoMt,
          congestion,
          priority,
          fuel_price: fuelPrice,
          laycan_days: 21,
        }),
      })

      if (!res.ok) throw new Error('Failed to get answer from assistant')

      const json = await res.json()
      const assistantMsg: AssistantMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: json.data?.answer || 'I am ready to assist with this charter decision.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const fallbackMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `For ${cargoMt.toLocaleString()} MT on ${selectedRouteId}, recommended class is ${selectedVessel}. Estimated freight is $${forecast?.current_rate_usd_t.toFixed(2) || '14.01'}/MT.`,
        timestamp: 'Just now',
      }
      setChatMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsAnswering(false)
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

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

    const historyCoords = allPoints
      .slice(0, history.length)
      .map((p, idx) => `${scaleX(idx)},${scaleY(p.val)}`)
      .join(' ')

    const outlookCoords = allPoints
      .slice(history.length - 1)
      .map((p, idx) => `${scaleX(history.length - 1 + idx)},${scaleY(p.val)}`)
      .join(' ')

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

  // SVG Chart Calculations for Multi-Scenario Studio (Exact Match to Image 1)
  const scenarioChartData = useMemo(() => {
    let dates: string[] = []
    const byScenario: Record<string, { date: string; rate: number }[]> = {
      'Base model': [],
      'Bear market / soft demand': [],
      'Bull market / disruption': [],
      'Congestion escalation': [],
    }

    if (scenariosData && scenariosData.length > 0) {
      const dateSet = new Set<string>()
      scenariosData.forEach((pt) => {
        dateSet.add(pt.date)
        if (byScenario[pt.scenario]) {
          byScenario[pt.scenario].push({ date: pt.date, rate: pt.rate_usd_mt })
        }
      })
      dates = Array.from(dateSet).sort()
    } else if (forecast?.outlook && forecast.outlook.length > 0) {
      dates = forecast.outlook.map((o) => o.date)
      const congFactor = 1 + Math.min(0.18, congestion / 600)
      dates.forEach((d, idx) => {
        const baseRate = forecast.outlook[idx]?.forecast_usd_t || 13.56
        byScenario['Base model'].push({ date: d, rate: baseRate })
        byScenario['Bear market / soft demand'].push({ date: d, rate: baseRate * 0.88 })
        byScenario['Bull market / disruption'].push({ date: d, rate: baseRate * 1.15 })
        byScenario['Congestion escalation'].push({ date: d, rate: baseRate * congFactor })
      })
    } else {
      const today = new Date()
      for (let i = 0; i < 60; i++) {
        const d = new Date(today.getTime() + i * 86400000)
        const dateStr = d.toISOString().split('T')[0]
        dates.push(dateStr)
        const wave = Math.sin((i / 60) * Math.PI * 2.5) * 0.7
        const baseRate = 13.56 + wave
        byScenario['Base model'].push({ date: dateStr, rate: baseRate })
        byScenario['Bear market / soft demand'].push({ date: dateStr, rate: baseRate * 0.88 })
        byScenario['Bull market / disruption'].push({ date: dateStr, rate: baseRate * 1.15 })
        byScenario['Congestion escalation'].push({
          date: dateStr,
          rate: baseRate * (1 + Math.min(0.18, congestion / 600)),
        })
      }
    }

    const width = 850
    const height = 300
    const padX = 50
    const padTop = 20
    const padBottom = 40
    const innerW = width - padX * 2
    const innerH = height - padTop - padBottom

    // Y Axis from 0 to 18 (matching Image 1)
    const minY = 0
    const maxY = 18

    const scaleX = (idx: number) => padX + (idx / Math.max(1, dates.length - 1)) * innerW
    const scaleY = (val: number) => height - padBottom - ((val - minY) / (maxY - minY)) * innerH

    const paths = [
      {
        scenario: 'Base model',
        color: '#38bdf8', // Cyan / Light Blue
        d: (byScenario['Base model'] || [])
          .map(
            (pt, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(pt.rate).toFixed(1)}`
          )
          .join(' '),
      },
      {
        scenario: 'Bear market / soft demand',
        color: '#0284c7', // Deep Blue
        d: (byScenario['Bear market / soft demand'] || [])
          .map(
            (pt, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(pt.rate).toFixed(1)}`
          )
          .join(' '),
      },
      {
        scenario: 'Bull market / disruption',
        color: '#b91c1c', // Maroon / Crimson
        d: (byScenario['Bull market / disruption'] || [])
          .map(
            (pt, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(pt.rate).toFixed(1)}`
          )
          .join(' '),
      },
      {
        scenario: 'Congestion escalation',
        color: '#f97316', // Coral / Orange
        d: (byScenario['Congestion escalation'] || [])
          .map(
            (pt, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(pt.rate).toFixed(1)}`
          )
          .join(' '),
      },
    ]

    const yTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

    // Sample ~15 date labels across the dates array
    const xTickIndices: number[] = []
    const step = Math.max(1, Math.floor(dates.length / 15))
    for (let i = 0; i < dates.length; i += step) {
      xTickIndices.push(i)
    }
    if (xTickIndices[xTickIndices.length - 1] !== dates.length - 1) {
      xTickIndices.push(dates.length - 1)
    }

    const xTicks = xTickIndices.map((idx) => {
      const raw = dates[idx]
      let label = raw
      try {
        const d = new Date(raw)
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
        const day = d.getDate()
        label = `${weekday} ${day < 10 ? '0' + day : day}`
      } catch {
        label = raw
      }
      return {
        x: scaleX(idx),
        label,
      }
    })

    return {
      width,
      height,
      innerW,
      innerH,
      padX,
      padTop,
      padBottom,
      yTicks,
      xTicks,
      paths,
      scaleY,
    }
  }, [scenariosData, forecast, congestion])

  // Format laycan date display
  const formattedLaycan = useMemo(() => {
    try {
      const d = new Date(laycanDate)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return laycanDate
    }
  }, [laycanDate])

  // Selected Port Scorecard KPIs (Exact Match to Images 1 & 2)
  const selectedPortScorecard = useMemo(() => {
    if (!scorecard || scorecard.length === 0) return null
    return scorecard.find((s) => s.port_code === dischargePort) || scorecard[2]
  }, [scorecard, dischargePort])

  // Origin & Destination Port Constraints for Two-Port Gate (Exact Match to Image 2 & 3)
  const originPortInfo = useMemo(() => {
    return (
      catalog?.origins.find((o) => o.port_code === currentRoute?.origin_port_code) || {
        port_name: currentRoute?.origin_name || 'Newcastle',
        max_draft_m: 17.5,
        max_loa_m: 350,
        max_beam_m: 50,
        cargo_handling_rate_tpd: 60000,
      }
    )
  }, [catalog, currentRoute])

  const destPortInfo = useMemo(() => {
    return (
      catalog?.destinations.find((d) => d.port_code === dischargePort) || {
        port_name: 'Paradip',
        max_draft_m: 18,
        max_loa_m: 300,
        max_beam_m: 48,
        cargo_handling_rate_tpd: 45000,
      }
    )
  }, [catalog, dischargePort])

  // Vessel Class Feasibility & Eligibility Rows (Exact Match to Image 3)
  const vesselFeasibilityRows = useMemo(() => {
    if (vesselOpt?.vessel_classes && vesselOpt.vessel_classes.length > 0) {
      return vesselOpt.vessel_classes.map((vc) => {
        const catalogV = catalog?.vessels.find((v) => v.vessel_type === vc.vessel_type)
        return {
          vessel_type: vc.vessel_type,
          dwt_max:
            catalogV?.dwt_max ||
            (vc.vessel_type === 'Handysize'
              ? 38000
              : vc.vessel_type === 'Supramax'
              ? 60000
              : vc.vessel_type === 'Panamax'
              ? 80000
              : 180000),
          typical_draft_m:
            catalogV?.typical_draft_m ||
            (vc.vessel_type === 'Handysize'
              ? 10.5
              : vc.vessel_type === 'Supramax'
              ? 12.5
              : vc.vessel_type === 'Panamax'
              ? 14
              : 18),
          typical_loa_m:
            catalogV?.typical_loa_m ||
            (vc.vessel_type === 'Handysize'
              ? 180
              : vc.vessel_type === 'Supramax'
              ? 200
              : vc.vessel_type === 'Panamax'
              ? 225
              : 290),
          typical_beam_m:
            catalogV?.typical_beam_m ||
            (vc.vessel_type === 'Handysize'
              ? 30
              : vc.vessel_type === 'Supramax'
              ? 32
              : vc.vessel_type === 'Panamax'
              ? 32.3
              : 45),
          utilisation: `${(vc.utilisation * 100).toFixed(0)}%`,
          eligible: vc.eligible,
        }
      })
    }
    return [
      {
        vessel_type: 'Handysize',
        dwt_max: 38000,
        typical_draft_m: 10.5,
        typical_loa_m: 180,
        typical_beam_m: 30,
        utilisation: '100%',
        eligible: false,
      },
      {
        vessel_type: 'Supramax',
        dwt_max: 60000,
        typical_draft_m: 12.5,
        typical_loa_m: 200,
        typical_beam_m: 32,
        utilisation: '92%',
        eligible: true,
      },
      {
        vessel_type: 'Panamax',
        dwt_max: 80000,
        typical_draft_m: 14,
        typical_loa_m: 225,
        typical_beam_m: 32.3,
        utilisation: '69%',
        eligible: true,
      },
      {
        vessel_type: 'Capesize',
        dwt_max: 180000,
        typical_draft_m: 18,
        typical_loa_m: 290,
        typical_beam_m: 45,
        utilisation: '31%',
        eligible: false,
      },
    ]
  }, [vesselOpt, catalog])

  // Contract Scenarios for Spot vs Multi-Voyage (Exact Match to Images 1 & 2)
  const contractScenarios = useMemo(() => {
    if (strategy?.scenarios && strategy.scenarios.length > 0) {
      return strategy.scenarios
    }
    const currentRate = forecast?.current_rate_usd_t || 14.0064
    const cycle = strategy?.cycle_days || 26.54
    return [
      {
        voyages: 1,
        contract_rate_usd_mt: currentRate,
        all_in_cost_usd: currentRate * cargoMt,
        saving_vs_repeated_spot_usd: 29272.3185,
        planned_cycle_days: cycle,
      },
      {
        voyages: 3,
        contract_rate_usd_mt: currentRate * (1 - discount3 / 100),
        all_in_cost_usd: currentRate * (1 - discount3 / 100) * cargoMt * 3 * 1.015,
        saving_vs_repeated_spot_usd: 111794.111,
        planned_cycle_days: cycle * 3,
      },
      {
        voyages: 6,
        contract_rate_usd_mt: currentRate * (1 - discount6 / 100),
        all_in_cost_usd: currentRate * (1 - discount6 / 100) * cargoMt * 6 * 1.025,
        saving_vs_repeated_spot_usd: 296964.0967,
        planned_cycle_days: cycle * 6,
      },
    ]
  }, [strategy, forecast, cargoMt, discount3, discount6])

  // Bar Chart calculations for Contract Strategy (Exact Match to Images 1 & 2)
  const contractBarChartData = useMemo(() => {
    const width = 850
    const height = 280
    const padLeft = 85
    const padRight = 30
    const padTop = 20
    const padBottom = 35
    const innerW = width - padLeft - padRight
    const innerH = height - padTop - padBottom

    const maxY = 5000000
    const yTicks = [
      0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000,
    ]

    const scaleY = (val: number) => height - padBottom - (val / maxY) * innerH

    const barWidth = 160
    const xPositions = [
      padLeft + innerW * 0.18,
      padLeft + innerW * 0.50,
      padLeft + innerW * 0.82,
    ]

    const bars = contractScenarios.map((sc, idx) => {
      const barHeight = (sc.all_in_cost_usd / maxY) * innerH
      const x = xPositions[idx] - barWidth / 2
      const y = height - padBottom - barHeight
      return {
        voyages: sc.voyages,
        cost: sc.all_in_cost_usd,
        x,
        y,
        width: barWidth,
        height: barHeight,
        xLabel: xPositions[idx],
        isSelected: charterStrategy === sc.voyages,
      }
    })

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      yTicks,
      scaleY,
      bars,
    }
  }, [contractScenarios, charterStrategy])

  const selectedSaving = useMemo(() => {
    const match = contractScenarios.find((s) => s.voyages === charterStrategy)
    if (match) return Math.round(match.saving_vs_repeated_spot_usd)
    return 29272
  }, [contractScenarios, charterStrategy])

  // Sorted Risk Drivers (Matching Image 1)
  const sortedRiskDetails = useMemo(() => {
    if (riskDetails && riskDetails.length > 0) {
      return [...riskDetails].sort((a, b) => b.score - a.score)
    }
    return [
      {
        risk_driver: 'Port & berth',
        score: 66,
        level: 'Medium',
        recommended_mitigation: 'Confirm berth window; retain alternate port and demurrage clauses.',
      },
      {
        risk_driver: 'JIT arrival execution',
        score: 51,
        level: 'Medium',
        recommended_mitigation: 'Reconfirm terminal readiness before issuing the speed instruction.',
      },
      {
        risk_driver: 'Fleet availability',
        score: 44,
        level: 'Medium',
        recommended_mitigation: 'Hold the vessel option or line up a repositioning alternative.',
      },
      {
        risk_driver: 'Market / freight',
        score: 10,
        level: 'Low',
        recommended_mitigation: 'Use a rate cap, index linkage, or staged fixture.',
      },
    ]
  }, [riskDetails])

  // Decision Audit Rows (Matching Image 2)
  const decisionAuditRows = useMemo(() => {
    if (auditTrail && auditTrail.length > 0) {
      return auditTrail
    }
    return [
      { audit_field: 'Decision timestamp', recorded_value: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC' },
      { audit_field: 'Route / parcel', recorded_value: `${selectedRouteId} · ${cargoMt.toLocaleString()} MT` },
      { audit_field: 'Selected vessel', recorded_value: selectedVessel },
      { audit_field: 'Optimization priority', recorded_value: priority },
      { audit_field: 'Risk index', recorded_value: `${strategy?.risk_index || 46}/100` },
      {
        audit_field: 'JIT action',
        recorded_value:
          jitPlan?.action || 'Slow steam at 10.8 kn to meet the predicted berth window Just-in-Time.',
      },
      {
        audit_field: 'Data provenance',
        recorded_value: 'Synthetic freight series; scenario assumptions; optional public API context',
      },
      {
        audit_field: 'Standards profile',
        recorded_value: 'DCSA Port Call / IMO Maritime Single Window mapping',
      },
    ]
  }, [auditTrail, selectedRouteId, cargoMt, selectedVessel, priority, strategy, jitPlan])

  // Explainable Risk Cockpit Bar Chart Data (Matching Image 1)
  const riskBarChartData = useMemo(() => {
    const width = 340
    const height = 220
    const padLeft = 32
    const padRight = 15
    const padTop = 15
    const padBottom = 80
    const innerW = width - padLeft - padRight
    const innerH = height - padTop - padBottom

    const maxY = 70
    const yTicks = [0, 10, 20, 30, 40, 50, 60, 70]
    const scaleY = (val: number) => height - padBottom - (val / maxY) * innerH

    // Order matching Image 1: Fleet availability, JIT arrival executi..., Market / freight, Port & berth
    const drivers = [
      {
        name: 'Fleet availability',
        shortName: 'Fleet availability',
        score: riskDetails.find((r) => r.risk_driver.includes('Fleet'))?.score ?? 44,
      },
      {
        name: 'JIT arrival execution',
        shortName: 'JIT arrival executi...',
        score: riskDetails.find((r) => r.risk_driver.includes('JIT'))?.score ?? 51,
      },
      {
        name: 'Market / freight',
        shortName: 'Market / freight',
        score: riskDetails.find((r) => r.risk_driver.includes('Market'))?.score ?? 10,
      },
      {
        name: 'Port & berth',
        shortName: 'Port & berth',
        score: riskDetails.find((r) => r.risk_driver.includes('Port'))?.score ?? 66,
      },
    ]

    const barWidth = 38
    const step = innerW / drivers.length
    const bars = drivers.map((d, idx) => {
      const barH = (d.score / maxY) * innerH
      const x = padLeft + idx * step + (step - barWidth) / 2
      const y = height - padBottom - barH
      return {
        ...d,
        x,
        y,
        width: barWidth,
        height: barH,
        xCenter: x + barWidth / 2,
      }
    })

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      yTicks,
      scaleY,
      bars,
    }
  }, [riskDetails])


  return (
    <div className="varka-cockpit-layout">
      {/* =========================================================================
          LEFT SIDEBAR: CARGO MANDATE (Matches Streamlit Screenshots Exactly)
         ========================================================================= */}
      <aside className="varka-cargo-mandate-sidebar" aria-label="Cargo Mandate Configuration">
        <div className="varka-cm-header">
          <h3 className="varka-cm-title">Cargo mandate</h3>
          <span className="varka-cm-badge">LIVE COCKPIT</span>
        </div>

        <div className="varka-cm-form">
          {/* Discharge Port */}
          <div className="varka-cm-field">
            <label htmlFor="cm-discharge-port" className="varka-cm-label">
              Discharge port
            </label>
            <select
              id="cm-discharge-port"
              value={dischargePort}
              onChange={(e) => handleDischargePortChange(e.target.value)}
              className="varka-cm-select"
            >
              {catalog?.destinations.map((d) => (
                <option key={d.port_code} value={d.port_code}>
                  {d.port_name}
                </option>
              ))}
            </select>
          </div>

          {/* Origin -> Destination Route */}
          <div className="varka-cm-field">
            <label htmlFor="cm-route-select" className="varka-cm-label">
              Origin → destination route
            </label>
            <select
              id="cm-route-select"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="varka-cm-select"
            >
              {availableRoutesForPort.length > 0
                ? availableRoutesForPort.map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.route_id}
                    </option>
                  ))
                : catalog?.routes.map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.route_id}
                    </option>
                  ))}
            </select>
          </div>

          {/* Cargo Quantity (MT) with - and + buttons */}
          <div className="varka-cm-field">
            <label htmlFor="cm-cargo-input" className="varka-cm-label">
              Cargo quantity (MT)
            </label>
            <div className="varka-cm-stepper">
              <button
                type="button"
                onClick={() => setCargoMt((prev) => Math.max(5000, prev - 1000))}
                className="varka-stepper-btn"
                aria-label="Decrease Cargo by 1,000 MT"
              >
                <Minus size={13} />
              </button>
              <input
                id="cm-cargo-input"
                type="number"
                min={5000}
                max={200000}
                step={1000}
                value={cargoMt}
                onChange={(e) => setCargoMt(Number(e.target.value))}
                className="varka-cm-input-stepper"
              />
              <button
                type="button"
                onClick={() => setCargoMt((prev) => Math.min(200000, prev + 1000))}
                className="varka-stepper-btn"
                aria-label="Increase Cargo by 1,000 MT"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Commodity */}
          <div className="varka-cm-field">
            <label htmlFor="cm-commodity" className="varka-cm-label">
              Commodity
            </label>
            <select
              id="cm-commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="varka-cm-select"
            >
              <option value="Thermal coal">Thermal coal</option>
              <option value="Coking coal">Coking coal</option>
              <option value="Iron ore">Iron ore</option>
              <option value="Limestone">Limestone</option>
            </select>
          </div>

          {/* Charter strategy */}
          <div className="varka-cm-field">
            <label htmlFor="cm-charter-strategy" className="varka-cm-label">
              Charter strategy
            </label>
            <select
              id="cm-charter-strategy"
              value={charterStrategy}
              onChange={(e) => setCharterStrategy(Number(e.target.value))}
              className="varka-cm-select"
            >
              <option value={1}>Spot / one voyage</option>
              <option value={3}>3-voyage short term</option>
              <option value={6}>6-voyage medium term</option>
            </select>
          </div>

          {/* Laycan start */}
          <div className="varka-cm-field">
            <label htmlFor="cm-laycan-start" className="varka-cm-label">
              Laycan start
            </label>
            <input
              id="cm-laycan-start"
              type="date"
              value={laycanDate}
              onChange={(e) => setLaycanDate(e.target.value)}
              className="varka-cm-input"
            />
          </div>

          {/* Congestion scenario (0-100) */}
          <div className="varka-cm-field">
            <div className="varka-slider-label-row">
              <label htmlFor="cm-congestion-slider" className="varka-cm-label">
                Congestion scenario (0–100)
              </label>
              <span className="varka-cm-slider-val">{congestion}</span>
            </div>
            <input
              id="cm-congestion-slider"
              type="range"
              min={0}
              max={100}
              value={congestion}
              onChange={(e) => setCongestion(Number(e.target.value))}
              className="varka-cm-slider"
            />
          </div>

          {/* Optimization Priority */}
          <div className="varka-cm-field">
            <label htmlFor="cm-priority" className="varka-cm-label">
              Optimization priority
            </label>
            <select
              id="cm-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="varka-cm-select"
            >
              <option value="Balanced">Balanced</option>
              <option value="Lowest cost">Lowest cost</option>
              <option value="Lowest CO₂">Lowest CO₂</option>
              <option value="Highest reliability">Highest reliability</option>
            </select>
          </div>

          {/* Collapsible: Just-in-Time port-call assumptions */}
          <div className="varka-cm-expander">
            <button
              type="button"
              onClick={() => setShowJitAssumptions(!showJitAssumptions)}
              className="varka-cm-expander-btn"
            >
              <span>{showJitAssumptions ? '▾' : '▸'} Just-in-Time port-call assumptions</span>
            </button>
            {showJitAssumptions && (
              <div className="varka-cm-expander-body">
                <div className="varka-cm-subfield">
                  <label htmlFor="cm-fuel-price" className="varka-cm-sublabel">
                    Bunker fuel price (USD/tonne)
                  </label>
                  <input
                    id="cm-fuel-price"
                    type="number"
                    min={300}
                    max={1200}
                    step={25}
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                    className="varka-cm-subinput"
                  />
                </div>
                <div className="varka-cm-subfield">
                  <label htmlFor="cm-berth-adj" className="varka-cm-sublabel">
                    Berth-window adjustment (hours): {berthAdjustmentHours}h
                  </label>
                  <input
                    id="cm-berth-adj"
                    type="range"
                    min={-72}
                    max={168}
                    value={berthAdjustmentHours}
                    onChange={(e) => setBerthAdjustmentHours(Number(e.target.value))}
                    className="varka-cm-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: Commercial assumptions */}
          <div className="varka-cm-expander">
            <button
              type="button"
              onClick={() => setShowCommercialAssumptions(!showCommercialAssumptions)}
              className="varka-cm-expander-btn"
            >
              <span>{showCommercialAssumptions ? '▾' : '▸'} Commercial assumptions</span>
            </button>
            {showCommercialAssumptions && (
              <div className="varka-cm-expander-body">
                <div className="varka-cm-subfield">
                  <label htmlFor="cm-disc-3" className="varka-cm-sublabel">
                    3-voyage commitment discount: {discount3}%
                  </label>
                  <input
                    id="cm-disc-3"
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={discount3}
                    onChange={(e) => setDiscount3(Number(e.target.value))}
                    className="varka-cm-slider"
                  />
                </div>
                <div className="varka-cm-subfield">
                  <label htmlFor="cm-disc-6" className="varka-cm-sublabel">
                    6-voyage commitment discount: {discount6}%
                  </label>
                  <input
                    id="cm-disc-6"
                    type="range"
                    min={0}
                    max={12}
                    step={0.5}
                    value={discount6}
                    onChange={(e) => setDiscount6(Number(e.target.value))}
                    className="varka-cm-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={executeEngine}
            disabled={isExecutingPrediction}
            className="varka-cm-run-btn"
          >
            <RefreshCw size={13} className={isExecutingPrediction ? 'varka-spin' : ''} />
            <span>{isExecutingPrediction ? 'COMPUTING...' : 'RE-RUN MANDATE'}</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN DECISION WORKSPACE (Matches Center Layout of Streamlit)
         ========================================================================= */}
      <div className="varka-cockpit-main">
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

        {/* Hero Title and Subtitle */}
        <div className="varka-cockpit-hero">
          <div className="varka-cockpit-hero-title-row">
            <Anchor size={26} className="varka-cockpit-anchor-icon" />
            <h1 className="varka-cockpit-main-title">Freight Chartering Decision Intelligence</h1>
          </div>
          <p className="varka-cockpit-main-sub">
            A decision cockpit for moving East Coast India bulk procurement from reactive spot fixtures
            to proactive multi-voyage chartering.
          </p>

          <div className="varka-cockpit-disclaimer-card">
            <span>
              Freight target data is the project&apos;s historical/synthetic series. Free APIs below enrich
              macro and weather risk only; they do not claim to be live fixture or AIS data.
            </span>
          </div>

          {/* Mandate Summary Box */}
          <div className="varka-mandate-summary-box">
            <div className="varka-ms-kicker">
              CHARTERING DECISION SYSTEM • {currentRoute?.origin_country.toUpperCase()} → INDIA EAST
              COAST
            </div>
            <h2 className="varka-ms-headline">
              Turn one cargo mandate into a protected charter strategy.
            </h2>
            <p className="varka-ms-meta">
              Route: {currentRoute?.origin_name} → {currentRoute?.dest_name} &nbsp;|&nbsp; Cargo:{' '}
              {cargoMt.toLocaleString()} MT {commodity} &nbsp;|&nbsp; Laycan: {formattedLaycan}
            </p>
          </div>
        </div>

        {/* Top 4 KPI Metrics (Exact Match to Image 1) */}
        <div className="varka-cockpit-kpi-row">
          {/* 1. Recommended Vessel */}
          <div className="varka-cockpit-kpi-card">
            <span className="varka-ck-label">Recommended vessel</span>
            <div className="varka-ck-val-row">
              <span className="varka-ck-val">
                {vesselOpt?.recommended_vessel || selectedVessel}
              </span>
            </div>
            <span className="varka-ck-sub text-emerald">
              ↑{' '}
              {(
                (vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.utilisation || 0.69) *
                100
              ).toFixed(0)}
              % parcel utilisation
            </span>
          </div>

          {/* 2. Expected Freight */}
          <div className="varka-cockpit-kpi-card">
            <span className="varka-ck-label">Expected freight</span>
            <div className="varka-ck-val-row">
              <span className="varka-ck-val">
                ${forecast ? forecast.current_rate_usd_t.toFixed(2) : '14.01'}/MT
              </span>
            </div>
            <span className="varka-ck-sub text-cyan">
              ↑ ±${forecast ? forecast.uncertainty_band_usd_t.toFixed(2) : '0.45'} model residual
              band
            </span>
          </div>

          {/* 3. Voyage Cycle */}
          <div className="varka-cockpit-kpi-card">
            <span className="varka-ck-label">Voyage cycle</span>
            <div className="varka-ck-val-row">
              <span className="varka-ck-val">
                {strategy?.cycle_days ? strategy.cycle_days.toFixed(1) : '26.5'} days
              </span>
            </div>
            <span className="varka-ck-sub text-cyan">
              ↑ Sailing {strategy?.sailing_days ? strategy.sailing_days.toFixed(1) : '20.5'} days
            </span>
          </div>

          {/* 4. Active Alerts */}
          <div className="varka-cockpit-kpi-card">
            <span className="varka-ck-label">Active alerts</span>
            <div className="varka-ck-val-row">
              <span className="varka-ck-val">
                {strategy?.alerts?.filter((a) => a.severity !== 'Info').length || 2}
              </span>
            </div>
            <span className="varka-ck-sub text-rose">
              ↑ Review required
            </span>
          </div>
        </div>

        {/* Top Metric Pills (Exact Match to Streamlit Top Bar in Image 1) */}
        <div className="varka-cockpit-pills-bar">
          <div className="varka-cockpit-pill">
            <span className="varka-pill-arrow">↑</span>
            <span>
              {(
                (vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.utilisation || 0.69) *
                100
              ).toFixed(0)}
              % parcel utilisation
            </span>
          </div>
          <div className="varka-cockpit-pill">
            <span className="varka-pill-arrow">↑</span>
            <span>+ ${forecast ? forecast.uncertainty_band_usd_t.toFixed(2) : '0.45'} model residual band</span>
          </div>
          <div className="varka-cockpit-pill">
            <span className="varka-pill-arrow">↑</span>
            <span>Sailing {strategy?.sailing_days ? strategy.sailing_days.toFixed(1) : '20.5'} days</span>
          </div>
          <div className="varka-cockpit-pill varka-pill-alert">
            <span className="varka-pill-arrow">↑</span>
            <span>Review required</span>
          </div>
        </div>

        {/* Navigation Tabs (Matches Streamlit 9 Tabs + Charter Assistant) */}
        <div className="varka-cockpit-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'brief'}
            onClick={() => {
              setActiveTab('brief')
              onSelectSection?.('cockpit')
            }}
            className={`varka-cockpit-tab ${activeTab === 'brief' ? 'is-active' : ''}`}
          >
            Executive brief
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'optimizer'}
            onClick={() => {
              setActiveTab('optimizer')
              onSelectSection?.('optimizer')
            }}
            className={`varka-cockpit-tab ${activeTab === 'optimizer' ? 'is-active' : ''}`}
          >
            Vessel optimizer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'jit'}
            onClick={() => {
              setActiveTab('jit')
              onSelectSection?.('jit')
            }}
            className={`varka-cockpit-tab ${activeTab === 'jit' ? 'is-active' : ''}`}
          >
            JIT digital twin
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scenarios'}
            onClick={() => {
              setActiveTab('scenarios')
              onSelectSection?.('scenarios')
            }}
            className={`varka-cockpit-tab ${activeTab === 'scenarios' ? 'is-active' : ''}`}
          >
            Scenario studio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'forecast'}
            onClick={() => {
              setActiveTab('forecast')
              onSelectSection?.('prediction')
            }}
            className={`varka-cockpit-tab ${activeTab === 'forecast' ? 'is-active' : ''}`}
          >
            Forecast & XAI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scorecard'}
            onClick={() => {
              setActiveTab('scorecard')
              onSelectSection?.('scorecard')
            }}
            className={`varka-cockpit-tab ${activeTab === 'scorecard' ? 'is-active' : ''}`}
          >
            Port scorecard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fleet'}
            onClick={() => {
              setActiveTab('fleet')
              onSelectSection?.('fleet')
            }}
            className={`varka-cockpit-tab ${activeTab === 'fleet' ? 'is-active' : ''}`}
          >
            Fleet & multi-voyage
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'risk'}
            onClick={() => {
              setActiveTab('risk')
              onSelectSection?.('risk')
            }}
            className={`varka-cockpit-tab ${activeTab === 'risk' ? 'is-active' : ''}`}
          >
            Risk & audit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'standards'}
            onClick={() => {
              setActiveTab('standards')
              onSelectSection?.('standards')
            }}
            className={`varka-cockpit-tab ${activeTab === 'standards' ? 'is-active' : ''}`}
          >
            Standards & data
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'assistant'}
            onClick={() => {
              setActiveTab('assistant')
              onSelectSection?.('assistant')
            }}
            className={`varka-cockpit-tab ${activeTab === 'assistant' ? 'is-active' : ''}`}
          >
            Charter Assistant
          </button>
        </div>

        {/* =====================================================================
            TAB 1: EXECUTIVE BRIEF (Matches Image 1 & 2 Exactly)
           ===================================================================== */}
        {activeTab === 'brief' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Decision for approval</h3>

            {/* Decision for Approval Card */}
            <div className="varka-approval-card">
              <div className="varka-approval-header">RECOMMENDED COMMERCIAL POSTURE</div>
              <div className="varka-approval-posture">
                {strategy?.posture || 'Wait for forecast entry window'}
              </div>
              <div className="varka-approval-action">
                {strategy?.action ||
                  'Defer the main fixture until 16 Feb; monitor daily and set a maximum acceptable rate.'}
              </div>
              <div className="varka-approval-why">
                <strong>Why:</strong>{' '}
                {strategy?.rationale ||
                  'The model projects a 12.2% lower rate before laycan, creating a measurable wait-versus-fix opportunity.'}
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="varka-brief-metrics-grid">
              <div className="varka-bm-card">
                <span className="varka-bm-label">Strategy contract exposure</span>
                <span className="varka-bm-val">
                  ${strategy ? Math.round(strategy.expected_cost).toLocaleString() : '2,287,074'}
                </span>
              </div>
              <div className="varka-bm-card">
                <span className="varka-bm-label">Avoided repeated spot cost</span>
                <span className="varka-bm-val text-emerald">
                  ${strategy ? Math.round(strategy.expected_saving).toLocaleString() : '111,794'}
                </span>
              </div>
              <div className="varka-bm-card">
                <span className="varka-bm-label">Forecast validation</span>
                <span className="varka-bm-val text-cyan">
                  {strategy?.mape_pct ? `${strategy.mape_pct.toFixed(2)}% MAPE` : '2.36% MAPE'}
                </span>
              </div>
            </div>

            {/* Narrative Notes */}
            <div className="varka-brief-narrative">
              <p>
                <strong>Why this stands out:</strong> one screen connects a market forecast to a vessel
                choice, a port-feasibility gate, a multi-voyage commercial decision and an explainable
                risk narrative.
              </p>
              <p>
                Estimated port time is{' '}
                <strong>{strategy?.port_days ? strategy.port_days.toFixed(1) : '6.1'} days</strong>{' '}
                and total cycle time is{' '}
                <strong>{strategy?.cycle_days ? strategy.cycle_days.toFixed(1) : '26.5'} days</strong>
                . This makes idle exposure visible before the fixture—not after demurrage starts
                accruing.
              </p>
              <p>
                <strong>Panel talking point:</strong> the dashboard is not a price-guessing tool. It is
                a governed decision workflow that quantifies the trade-off between rate, vessel fit, port
                constraints, reliability and contract duration.
              </p>
            </div>

            {/* Early-warning alerts (Exact match to Image 2 & 3) */}
            <div className="varka-alerts-section">
              <h4 className="varka-panel-section-title">Early-warning alerts</h4>
              <div className="varka-alerts-stack">
                {strategy?.alerts && strategy.alerts.length > 0 ? (
                  strategy.alerts
                    .filter((a) => a.severity !== 'Info')
                    .map((alert, i) => (
                      <div
                        key={i}
                        className={`varka-alert-banner alert-${alert.severity.toLowerCase()}`}
                      >
                        <div className="varka-ab-title">
                          <strong>{alert.alert}</strong> — {alert.evidence}
                        </div>
                        <div className="varka-ab-action">
                          <strong>Recommended action:</strong> {alert.action}
                        </div>
                      </div>
                    ))
                ) : (
                  <>
                    <div className="varka-alert-banner alert-warning">
                      <div className="varka-ab-title">
                        <strong>Port wait-time watch</strong> — Congestion scenario {congestion}/100.
                      </div>
                      <div className="varka-ab-action">
                        <strong>Recommended action:</strong> Refresh port status before nomination and
                        hold berth-window contingency.
                      </div>
                    </div>
                    <div className="varka-alert-banner alert-warning">
                      <div className="varka-ab-title">
                        <strong>Low vessel utilisation</strong> — Selected parcel fills only{' '}
                        {(
                          (vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.utilisation ||
                            0.69) * 100
                        ).toFixed(0)}
                        % of nominal capacity.
                      </div>
                      <div className="varka-ab-action">
                        <strong>Recommended action:</strong> Consider aggregation, split parcel or a
                        smaller vessel before accepting the freight offer.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Embedded Charter Assistant preview in Executive Brief */}
            <div className="varka-brief-assistant-preview">
              <div className="varka-bap-header">
                <MessageSquareCode size={18} className="text-cyan" />
                <span>Ask the Charter Assistant...</span>
              </div>
              <div className="varka-bap-input-wrap">
                <input
                  type="text"
                  placeholder="Ask why this vessel was selected, whether to fix now, or what the main risks are..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  className="varka-bap-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assistant')
                    if (inputQuery) handleSendQuery()
                  }}
                  className="varka-bap-send-btn"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: VESSEL OPTIMIZER (Exact Match to Image 2)
           ===================================================================== */}
        {activeTab === 'optimizer' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Multi-objective vessel optimization</h3>
            <p className="varka-card-desc">
              The selected priority balances freight cost, CO₂, parcel fit and fleet availability.
              Every eligible class remains visible so the recommendation can be challenged.
            </p>

            {/* 4 Metric Cards (Matching Image 2 exactly) */}
            <div className="varka-cockpit-kpi-row">
              {/* 1. Recommended Class */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Recommended class</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {vesselOpt?.recommended_vessel || selectedVessel}
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">
                  ↑ Score{' '}
                  {(
                    vesselOpt?.recommended_score ||
                    vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.multi_objective_score ||
                    92.9
                  ).toFixed(1)}
                  /100
                </span>
              </div>

              {/* 2. Expected Freight */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Expected freight</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    $
                    {(
                      vesselOpt?.expected_freight ||
                      vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.forecast_rate_usd_t ||
                      14.01
                    ).toFixed(2)}
                    /MT
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">
                  ↑ $
                  {Math.round(
                    vesselOpt?.total_freight ||
                      vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.total_freight_usd ||
                      770350
                  ).toLocaleString()}{' '}
                  parcel cost
                </span>
              </div>

              {/* 3. Voyage CO2 */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Voyage CO₂</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {Math.round(
                      vesselOpt?.voyage_co2_tonnes ||
                        vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.voyage_co2_tonnes ||
                        2041
                    )}{' '}
                    t
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">↑ Class estimate</span>
              </div>

              {/* 4. Fleet Readiness */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Fleet readiness</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {vesselOpt?.fleet_readiness_days ||
                      vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.next_available_days ||
                      11}{' '}
                    days
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">
                  ↑{' '}
                  {vesselOpt?.availability_status ||
                    vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.availability_status ||
                    'Available for laycan'}
                </span>
              </div>
            </div>

            {/* Candidate Table matching Image 2 dataframe */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>vessel_type</th>
                    <th>multi_objective_score</th>
                    <th>forecast_rate</th>
                    <th>total_freight</th>
                    <th>utilisation</th>
                    <th>voyage_co2_tonnes</th>
                    <th>available_hulls</th>
                    <th>next_available_days</th>
                    <th>availability_status</th>
                  </tr>
                </thead>
                <tbody>
                  {vesselOpt?.vessel_classes && vesselOpt.vessel_classes.length > 0 ? (
                    vesselOpt.vessel_classes.map((cls) => (
                      <tr
                        key={cls.vessel_type}
                        className={cls.is_recommended ? 'is-selected-port' : ''}
                      >
                        <td>
                          <strong>{cls.vessel_type}</strong>
                        </td>
                        <td className="font-mono text-cyan">
                          {cls.multi_objective_score.toFixed(2)}
                        </td>
                        <td className="font-mono">${cls.forecast_rate_usd_t.toFixed(2)}</td>
                        <td className="font-mono">${cls.total_freight_usd.toFixed(2)}</td>
                        <td className="font-mono">{cls.utilisation.toFixed(2)}</td>
                        <td className="font-mono">
                          {(cls.voyage_co2_tonnes || 2041.4).toFixed(1)}
                        </td>
                        <td>{cls.available_hulls}</td>
                        <td className="font-mono">{cls.next_available_days}</td>
                        <td>
                          <span
                            className={`varka-badge-pill ${
                              cls.availability_status.includes('Available')
                                ? 'pill-success'
                                : 'pill-warning'
                            }`}
                          >
                            {cls.availability_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr className="is-selected-port">
                        <td>
                          <strong>Panamax</strong>
                        </td>
                        <td className="font-mono text-cyan">92.89</td>
                        <td className="font-mono">$14.01</td>
                        <td className="font-mono">$770,350.38</td>
                        <td className="font-mono">0.69</td>
                        <td className="font-mono">2041.4</td>
                        <td>1</td>
                        <td className="font-mono">11</td>
                        <td>
                          <span className="varka-badge-pill pill-success">
                            Available for laycan
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Supramax</strong>
                        </td>
                        <td className="font-mono text-cyan">84.71</td>
                        <td className="font-mono">$17.38</td>
                        <td className="font-mono">$955,894.50</td>
                        <td className="font-mono">0.92</td>
                        <td className="font-mono">1658.6</td>
                        <td>2</td>
                        <td className="font-mono">5</td>
                        <td>
                          <span className="varka-badge-pill pill-success">
                            Available for laycan
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="varka-table-caption">
              Fleet availability is an explicit prototype constraint. Replace the roster with vessel
              positions, open employment and laycan-ready dates from the fleet system.
            </p>

            {/* Feasibility Gate Checks */}
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
                      <span className="vm-val font-mono">
                        ${(cls.total_freight_usd / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="varka-vm-item">
                      <span className="vm-label">UTILISATION</span>
                      <span className="vm-val">{(cls.utilisation * 100).toFixed(0)}%</span>
                    </div>
                  </div>

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

                  <div className="varka-vessel-footer">
                    <span className="varka-fleet-status">{cls.availability_status}</span>
                    <span className="varka-fleet-hulls">
                      {cls.available_hulls} hulls • ~{cls.next_available_days}d ready
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Embedded Charter Assistant (Matches Image 2 bottom) */}
            <div className="varka-assistant-embedded-box">
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
                <p className="varka-aeb-sub">
                  Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses;
                  the app works without internet or an API key.
                </p>
              </div>

              <div className="varka-aeb-banner">
                <div className="varka-aeb-icon-bubble">🤖</div>
                <div className="varka-aeb-msg">
                  I am ready to explain this charter recommendation. Ask me why this vessel was
                  selected, whether to fix now, or what the main risks are.
                </div>
              </div>

              <div className="varka-chat-input-bar">
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab('assistant')
                      onSelectSection?.('assistant')
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assistant')
                    onSelectSection?.('assistant')
                    handleSendQuery()
                  }}
                  className="varka-chat-submit-btn"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: JIT DIGITAL TWIN (Matches Image 1 & 2 Exactly)
           ===================================================================== */}
        {activeTab === 'jit' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Just-in-Time arrival digital twin</h3>

            {/* Green Banner (Matching Image 1 & 2) */}
            <div className="varka-jit-green-banner">
              <span>⚓</span>
              <span>
                Slow steam at {jitPlan ? jitPlan.jit_speed.toFixed(1) : '10.8'} kn to meet the
                predicted berth window Just-in-Time.
              </span>
            </div>

            {/* 4 Metric Cards (Matching Image 2 exactly) */}
            <div className="varka-cockpit-kpi-row">
              {/* 1. Predicted berth-ready */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Predicted berth-ready</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {jitPlan ? jitPlan.berth_ready_days.toFixed(1) : '22.7'} days
                  </span>
                </div>
              </div>

              {/* 2. Anchorage time avoided */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Anchorage time avoided</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {jitPlan
                      ? Math.max(0, jitPlan.early_wait_hours - jitPlan.jit_wait_hours).toFixed(0)
                      : '52'}{' '}
                    h
                  </span>
                </div>
              </div>

              {/* 3. Estimated fuel saving */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">Estimated fuel saving</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {jitPlan ? Math.max(0, jitPlan.fuel_saved_tonnes).toFixed(1) : '127.4'} t
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">
                  ↑ ${Math.round(jitPlan?.cost_saved_usd || 82819).toLocaleString()}
                </span>
              </div>

              {/* 4. CO2 avoided */}
              <div className="varka-cockpit-kpi-card">
                <span className="varka-ck-label">CO₂ avoided</span>
                <div className="varka-ck-val-row">
                  <span className="varka-ck-val">
                    {jitPlan ? Math.max(0, jitPlan.co2_saved_tonnes).toFixed(1) : '396.8'} t
                  </span>
                </div>
                <span className="varka-ck-sub text-emerald">
                  ↑ {congestion >= 70 ? 'High' : congestion >= 40 ? 'Medium' : 'Low'} port-call risk
                </span>
              </div>
            </div>

            {/* Data Table (Matching Image 2 exactly) */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>plan</th>
                    <th>speed_kn</th>
                    <th>sailing_days</th>
                    <th>anchorage_hours</th>
                    <th>fuel_tonnes</th>
                    <th>fuel_cost_usd</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Arrive at 12 kn</strong>
                    </td>
                    <td className="font-mono text-cyan">12</td>
                    <td className="font-mono">
                      {jitPlan ? jitPlan.standard_sailing_days.toFixed(1) : '20.5'}
                    </td>
                    <td className="font-mono text-rose">
                      {jitPlan ? jitPlan.early_wait_hours.toFixed(1) : '52.2'}
                    </td>
                    <td className="font-mono">
                      {jitPlan ? jitPlan.standard_fuel_tonnes.toFixed(1) : '663.2'}
                    </td>
                    <td className="font-mono">
                      $
                      {jitPlan
                        ? (jitPlan.standard_fuel_tonnes * fuelPrice).toFixed(1)
                        : (663.2 * 650).toFixed(1)}
                    </td>
                  </tr>
                  <tr className="is-selected-port">
                    <td>
                      <strong className="text-emerald">Just-in-Time plan</strong>
                    </td>
                    <td className="font-mono text-emerald">
                      {jitPlan ? jitPlan.jit_speed.toFixed(1) : '10.8'}
                    </td>
                    <td className="font-mono">
                      {jitPlan ? jitPlan.jit_sailing_days.toFixed(1) : '22.7'}
                    </td>
                    <td className="font-mono text-emerald">
                      {jitPlan ? jitPlan.jit_wait_hours.toFixed(1) : '0'}
                    </td>
                    <td className="font-mono text-emerald">
                      {jitPlan ? jitPlan.jit_fuel_tonnes.toFixed(1) : '535.8'}
                    </td>
                    <td className="font-mono text-emerald">
                      $
                      {jitPlan
                        ? (jitPlan.jit_fuel_tonnes * fuelPrice).toFixed(1)
                        : (535.8 * 650).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Blue Info Box (Matching Image 2) */}
            <div className="varka-jit-info-box">
              <strong>Why this action?</strong> Congestion is {congestion}/100 and{' '}
              {catalog?.destinations.find((d) => d.port_code === dischargePort)?.port_name ||
                'Paradip'}
              &apos;s baseline pre-berthing delay is{' '}
              {catalog?.destinations.find((d) => d.port_code === dischargePort)?.avg_delay_days.toFixed(
                1
              ) || '1.5'}{' '}
              days. Fuel uses transparent vessel-class assumptions and cubic speed–fuel scaling. In
              production, connect terminal berth events and vessel noon reports.
            </div>

            {/* Embedded Charter Assistant (Matches Image 2 bottom) */}
            <div className="varka-assistant-embedded-box">
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
                <p className="varka-aeb-sub">
                  Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses;
                  the app works without internet or an API key.
                </p>
              </div>

              <div className="varka-chat-input-bar">
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab('assistant')
                      onSelectSection?.('assistant')
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assistant')
                    onSelectSection?.('assistant')
                    handleSendQuery()
                  }}
                  className="varka-chat-submit-btn"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: SCENARIO STUDIO (Matches Image 1, 2, 3 Exactly)
           ===================================================================== */}
        {activeTab === 'scenarios' && (
          <div className="varka-cockpit-tab-panel">
            <div className="varka-title-with-link">
              <h3 className="varka-panel-section-title">Freight-rate scenario studio</h3>
              <Link2 size={16} className="varka-link-anchor-icon" />
            </div>
            <p className="varka-card-desc">
              Stress-test the 60-day baseline instead of treating a single forecast as a fixture
              quote.
            </p>

            {/* Multi-Scenario SVG Path Chart */}
            <div className="varka-scenario-chart-wrap">
              <svg
                viewBox={`0 0 ${scenarioChartData.width} ${scenarioChartData.height}`}
                className="varka-scenario-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Horizontal Gridlines & Y-Axis Labels */}
                {scenarioChartData.yTicks.map((tick) => {
                  const y = scenarioChartData.scaleY(tick)
                  return (
                    <g key={tick}>
                      <line
                        x1={scenarioChartData.padX}
                        y1={y}
                        x2={scenarioChartData.width - 25}
                        y2={y}
                        stroke="rgba(241, 233, 223, 0.08)"
                        strokeDasharray={tick === 0 ? undefined : '2 2'}
                      />
                      <text
                        x={scenarioChartData.padX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#7d7065"
                        fontSize={10}
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {tick}
                      </text>
                    </g>
                  )
                })}

                {/* X-Axis Date Ticks & Vertical Guides */}
                {scenarioChartData.xTicks.map((xt, i) => (
                  <g key={i}>
                    <line
                      x1={xt.x}
                      y1={scenarioChartData.padTop}
                      x2={xt.x}
                      y2={scenarioChartData.height - scenarioChartData.padBottom}
                      stroke="rgba(241, 233, 223, 0.04)"
                    />
                    <text
                      x={xt.x}
                      y={scenarioChartData.height - scenarioChartData.padBottom + 18}
                      textAnchor="middle"
                      fill="#8c7e73"
                      fontSize={9}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {xt.label}
                    </text>
                  </g>
                ))}

                {/* The 4 Scenario Paths */}
                {scenarioChartData.paths.map((p) => (
                  <path
                    key={p.scenario}
                    d={p.d}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>

              {/* Chart Legend (Exact Match to Image 1) */}
              <div className="varka-scenario-chart-legend">
                <div className="varka-scenario-legend-item">
                  <span className="varka-scenario-legend-line" style={{ backgroundColor: '#38bdf8' }} />
                  <span>Base model</span>
                </div>
                <div className="varka-scenario-legend-item">
                  <span className="varka-scenario-legend-line" style={{ backgroundColor: '#0284c7' }} />
                  <span>Bear market / soft demand</span>
                </div>
                <div className="varka-scenario-legend-item">
                  <span className="varka-scenario-legend-line" style={{ backgroundColor: '#b91c1c' }} />
                  <span>Bull market / disruption</span>
                </div>
                <div className="varka-scenario-legend-item">
                  <span className="varka-scenario-legend-line" style={{ backgroundColor: '#f97316' }} />
                  <span>Congestion escalation</span>
                </div>
              </div>
            </div>

            {/* Scenario Summary Table (Exact Match to Image 1, 2 & 3) */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>scenario</th>
                    <th>lowest_rate</th>
                    <th>average_rate</th>
                    <th>cargo_cost_at_average</th>
                  </tr>
                </thead>
                <tbody>
                  {(scenariosSummary && scenariosSummary.length > 0
                    ? scenariosSummary
                    : [
                        {
                          scenario: 'Base model',
                          lowest_rate: 12.77,
                          average_rate: 13.56,
                          cargo_cost_at_average: 745585.33,
                        },
                        {
                          scenario: 'Bear market / soft demand',
                          lowest_rate: 11.23,
                          average_rate: 11.93,
                          cargo_cost_at_average: 656115.09,
                        },
                        {
                          scenario: 'Bull market / disruption',
                          lowest_rate: 14.68,
                          average_rate: 15.59,
                          cargo_cost_at_average: 857423.13,
                        },
                        {
                          scenario: 'Congestion escalation',
                          lowest_rate: 13.72,
                          average_rate: 14.57,
                          cargo_cost_at_average: 801504.23,
                        },
                      ]
                  ).map((sc, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{sc.scenario}</strong>
                      </td>
                      <td className="font-mono">{sc.lowest_rate.toFixed(2)}</td>
                      <td className="font-mono">{sc.average_rate.toFixed(2)}</td>
                      <td className="font-mono">{sc.cargo_cost_at_average.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Transparent Multipliers Caption (Exact Match to Image 2) */}
            <p className="varka-table-caption">
              Scenarios apply transparent multipliers to the model baseline. They are decision stress tests, not live market quotations.
            </p>

            {/* Embedded Charter Assistant (Exact Match to Image 2 & 3) */}
            <div className="varka-assistant-embedded-box">
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
                <p className="varka-aeb-sub">
                  Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses;
                  the app works without Internet or an API key.
                </p>
              </div>

              <div className="varka-aeb-banner">
                <div className="varka-aeb-icon-bubble">🤖</div>
                <span className="varka-aeb-msg">
                  I am ready to explain this charter recommendation. Ask me why this vessel was selected, whether to fix now, or what the main risks are.
                </span>
              </div>

              {chatMessages.length > 1 && (
                <div className="varka-assistant-embedded-reply">
                  <strong>Assistant:</strong> {chatMessages[chatMessages.length - 1].content}
                </div>
              )}

              <div className="varka-chat-input-bar">
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={isAnswering}
                  className="varka-chat-submit-btn"
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: FORECAST & XAI
           ===================================================================== */}
        {activeTab === 'forecast' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">60-Day Rate Outlook & Local Drivers</h3>

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

                  {chartData.bandPolygon && (
                    <polygon
                      points={chartData.bandPolygon}
                      fill="url(#p10p90Glow)"
                      stroke="rgba(56, 189, 248, 0.3)"
                      strokeWidth="1"
                    />
                  )}

                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    points={chartData.historyCoords}
                  />

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
                  <span>Computing forward outlook...</span>
                </div>
              )}
            </div>

            {/* Drivers */}
            <div className="varka-xai-section">
              <h4 className="varka-panel-section-title">Explainable AI — local forecast drivers</h4>
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
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 6: PORT SCORECARD (Matches Images 1, 2 & 3 Exactly)
           ===================================================================== */}
        {activeTab === 'scorecard' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Port performance and benchmark scorecard</h3>

            {/* 3 KPI Cards Row (Exact Match to Images 1 & 2) */}
            <div className="varka-scorecard-kpi-grid">
              <div className="varka-sk-card">
                <span className="varka-sk-label">Selected port score</span>
                <span className="varka-sk-val text-cyan">
                  {selectedPortScorecard
                    ? `${selectedPortScorecard.port_performance_score.toFixed(1)}/100`
                    : '74.1/100'}
                </span>
              </div>
              <div className="varka-sk-card">
                <span className="varka-sk-label">Estimated port time</span>
                <span className="varka-sk-val text-emerald">
                  {selectedPortScorecard
                    ? `${selectedPortScorecard.estimated_port_days.toFixed(1)} days`
                    : '2.7 days'}
                </span>
              </div>
              <div className="varka-sk-card">
                <span className="varka-sk-label">Benchmark rank</span>
                <span className="varka-sk-val text-amber">
                  #{selectedPortScorecard?.rank || 3} of {scorecard.length || 7}
                </span>
              </div>
            </div>

            {/* Port Scorecard Benchmark Dataframe (Exact Match to Image 2) */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>port_code</th>
                    <th>port_name</th>
                    <th>dry_bulk_berths</th>
                    <th>cargo_handling_rate_tpd</th>
                    <th>avg_pre_berthing_delay_days</th>
                    <th>estimated_port_days</th>
                    <th>port_performance_score</th>
                  </tr>
                </thead>
                <tbody>
                  {(scorecard && scorecard.length > 0
                    ? scorecard
                    : [
                        {
                          rank: 1,
                          port_code: 'INDHM',
                          port_name: 'Dhamra',
                          dry_bulk_berths: 3,
                          cargo_handling_rate_tpd: 55000,
                          avg_pre_berthing_delay_days: 0.8,
                          estimated_port_days: 1.8,
                          port_performance_score: 92,
                        },
                        {
                          rank: 2,
                          port_code: 'INGAN',
                          port_name: 'Gangavaram',
                          dry_bulk_berths: 3,
                          cargo_handling_rate_tpd: 50000,
                          avg_pre_berthing_delay_days: 1.0,
                          estimated_port_days: 2.1,
                          port_performance_score: 84.5,
                        },
                        {
                          rank: 3,
                          port_code: 'INPAR',
                          port_name: 'Paradip',
                          dry_bulk_berths: 6,
                          cargo_handling_rate_tpd: 45000,
                          avg_pre_berthing_delay_days: 1.5,
                          estimated_port_days: 2.72,
                          port_performance_score: 74.1,
                        },
                        {
                          rank: 4,
                          port_code: 'INGOP',
                          port_name: 'Gopalpur',
                          dry_bulk_berths: 2,
                          cargo_handling_rate_tpd: 35000,
                          avg_pre_berthing_delay_days: 1.2,
                          estimated_port_days: 2.77,
                          port_performance_score: 66.2,
                        },
                        {
                          rank: 5,
                          port_code: 'INVIZ',
                          port_name: 'Visakhapatnam',
                          dry_bulk_berths: 5,
                          cargo_handling_rate_tpd: 40000,
                          avg_pre_berthing_delay_days: 2.0,
                          estimated_port_days: 3.38,
                          port_performance_score: 63.6,
                        },
                        {
                          rank: 6,
                          port_code: 'INHAL',
                          port_name: 'Haldia',
                          dry_bulk_berths: 4,
                          cargo_handling_rate_tpd: 20000,
                          avg_pre_berthing_delay_days: 3.5,
                          estimated_port_days: 6.25,
                          port_performance_score: 26.8,
                        },
                        {
                          rank: 7,
                          port_code: 'INKOL',
                          port_name: 'Kolkata (Sagar anchorage tra)',
                          dry_bulk_berths: 3,
                          cargo_handling_rate_tpd: 15000,
                          avg_pre_berthing_delay_days: 4.0,
                          estimated_port_days: 7.67,
                          port_performance_score: 16.4,
                        },
                      ]
                  ).map((p) => (
                    <tr
                      key={p.port_code}
                      className={p.port_code === dischargePort ? 'is-selected-port' : ''}
                    >
                      <td className="font-mono text-cyan">{p.port_code}</td>
                      <td>
                        <strong>{p.port_name}</strong>
                      </td>
                      <td>{p.dry_bulk_berths}</td>
                      <td className="font-mono">{p.cargo_handling_rate_tpd}</td>
                      <td className="font-mono">{p.avg_pre_berthing_delay_days}</td>
                      <td className="font-mono">{p.estimated_port_days}</td>
                      <td className="font-mono text-emerald">
                        <strong>{p.port_performance_score}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Benchmark Caption (Exact Match to Image 2) */}
            <p className="varka-table-caption">
              Planning benchmark uses local berth capacity, handling rate and average pre-berthing
              delay. It is not a replacement for the World Bank CPPI or live terminal KPI feed.
            </p>

            {/* Two-Port Constraint Gate Section (Exact Match to Images 2 & 3) */}
            <div className="varka-constraint-gate-section">
              <h3 className="varka-constraint-gate-title">Two-port constraint gate</h3>

              {/* Table 1: Origin & Destination Port Constraints */}
              <div className="varka-table-wrap">
                <table className="varka-data-table">
                  <thead>
                    <tr>
                      <th>port_name</th>
                      <th>max_draft_m</th>
                      <th>max_loa_m</th>
                      <th>max_beam_m</th>
                      <th>cargo_handling_rate_tpd</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{originPortInfo.port_name}</strong>
                      </td>
                      <td className="font-mono">{originPortInfo.max_draft_m}</td>
                      <td className="font-mono">{originPortInfo.max_loa_m}</td>
                      <td className="font-mono">{originPortInfo.max_beam_m}</td>
                      <td className="font-mono">{originPortInfo.cargo_handling_rate_tpd}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{destPortInfo.port_name}</strong>
                      </td>
                      <td className="font-mono">{destPortInfo.max_draft_m}</td>
                      <td className="font-mono">{destPortInfo.max_loa_m}</td>
                      <td className="font-mono">{destPortInfo.max_beam_m}</td>
                      <td className="font-mono">{destPortInfo.cargo_handling_rate_tpd}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table 2: Vessel Class Feasibility & Eligibility */}
              <div className="varka-table-wrap">
                <table className="varka-data-table">
                  <thead>
                    <tr>
                      <th>vessel_type</th>
                      <th>dwt_max</th>
                      <th>typical_draft_m</th>
                      <th>typical_loa_m</th>
                      <th>typical_beam_m</th>
                      <th>utilisation</th>
                      <th>eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vesselFeasibilityRows.map((v) => (
                      <tr
                        key={v.vessel_type}
                        className={v.vessel_type === selectedVessel ? 'is-selected-port' : ''}
                      >
                        <td>
                          <strong>{v.vessel_type}</strong>
                        </td>
                        <td className="font-mono">{v.dwt_max}</td>
                        <td className="font-mono">{v.typical_draft_m}</td>
                        <td className="font-mono">{v.typical_loa_m}</td>
                        <td className="font-mono">{v.typical_beam_m}</td>
                        <td className="font-mono text-cyan">{v.utilisation}</td>
                        <td>
                          {v.eligible ? (
                            <span className="text-emerald font-bold" title="Eligible">
                              ☑️
                            </span>
                          ) : (
                            <span className="text-secondary opacity-60" title="Ineligible">
                              ⭕
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Planning Limits Warning Box (Exact Match to Image 3) */}
              <div className="varka-planning-limits-box">
                Planning limits only: confirm berth nomination, tidal/seasonal draft, terminal
                acceptance, cargo density and stowage with the port/chartering desk before fixing.
              </div>
            </div>

            {/* Embedded Charter Assistant (Exact Match to Image 3) */}
            <div className="varka-assistant-embedded-box">
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
              </div>

              {chatMessages.length > 1 && (
                <div className="varka-assistant-embedded-reply">
                  <strong>Assistant:</strong> {chatMessages[chatMessages.length - 1].content}
                </div>
              )}

              <div className="varka-chat-input-bar">
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={isAnswering}
                  className="varka-chat-submit-btn"
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 7: FLEET & MULTI-VOYAGE
           ===================================================================== */}
        {activeTab === 'fleet' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Real fleet availability constraints</h3>
            <p className="varka-card-desc">
              A vessel class is not selectable merely because it fits the port: it must also have an
              available hull before laycan. The optimizer penalizes late availability and exposes the
              constraint below.
            </p>

            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>VESSEL TYPE</th>
                    <th>AVAILABLE HULLS</th>
                    <th>NEXT AVAILABLE (DAYS)</th>
                    <th>AVAILABILITY STATUS</th>
                    <th>DATA STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetRoster && fleetRoster.length > 0 ? (
                    fleetRoster.map((f, i) => (
                      <tr key={i} className={f.vessel_type === selectedVessel ? 'is-selected-port' : ''}>
                        <td>
                          <strong>{f.vessel_type}</strong>
                        </td>
                        <td className="font-mono text-cyan">{f.available_hulls}</td>
                        <td className="font-mono">{f.next_available_days} days</td>
                        <td>
                          <span
                            className={`varka-badge-pill ${
                              f.availability_status.includes('Available')
                                ? 'pill-success'
                                : 'pill-warning'
                            }`}
                          >
                            {f.availability_status}
                          </span>
                        </td>
                        <td className="text-secondary">{f.data_status}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td>
                          <strong>Handysize</strong>
                        </td>
                        <td className="font-mono text-cyan">3</td>
                        <td className="font-mono">2 days</td>
                        <td>
                          <span className="varka-badge-pill pill-success">Available for laycan</span>
                        </td>
                        <td className="text-secondary">Prototype fleet assumption</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Supramax</strong>
                        </td>
                        <td className="font-mono text-cyan">2</td>
                        <td className="font-mono">5 days</td>
                        <td>
                          <span className="varka-badge-pill pill-success">Available for laycan</span>
                        </td>
                        <td className="text-secondary">Prototype fleet assumption</td>
                      </tr>
                      <tr className="is-selected-port">
                        <td>
                          <strong>Panamax</strong>
                        </td>
                        <td className="font-mono text-cyan">1</td>
                        <td className="font-mono">11 days</td>
                        <td>
                          <span className="varka-badge-pill pill-success">Available for laycan</span>
                        </td>
                        <td className="text-secondary">Prototype fleet assumption</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Capesize</strong>
                        </td>
                        <td className="font-mono text-cyan">1</td>
                        <td className="font-mono">16 days</td>
                        <td>
                          <span className="varka-badge-pill pill-success">Available for laycan</span>
                        </td>
                        <td className="text-secondary">Prototype fleet assumption</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="varka-panel-section-title" style={{ marginTop: '16px' }}>
              Spot versus multiple-voyage contract strategy
            </h3>

            {/* Contract Strategy Table matching Image 1 & 2 */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>voyages</th>
                    <th>contract_rate_usd_mt</th>
                    <th>all_in_cost_usd</th>
                    <th>saving_vs_repeated_spot_usd</th>
                    <th>planned_cycle_days</th>
                  </tr>
                </thead>
                <tbody>
                  {contractScenarios.map((row) => (
                    <tr
                      key={row.voyages}
                      onClick={() => setCharterStrategy(row.voyages)}
                      style={{ cursor: 'pointer' }}
                      className={charterStrategy === row.voyages ? 'is-selected-port' : ''}
                    >
                      <td className="font-mono">
                        <strong>{row.voyages}</strong>
                      </td>
                      <td className="font-mono text-cyan">
                        {row.contract_rate_usd_mt.toFixed(4)}
                      </td>
                      <td className="font-mono">
                        {row.all_in_cost_usd.toFixed(4)}
                      </td>
                      <td className="font-mono text-emerald">
                        {row.saving_vs_repeated_spot_usd.toFixed(4)}
                      </td>
                      <td className="font-mono">
                        {row.planned_cycle_days.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar Chart matching Image 1 & 2 */}
            <div className="varka-bar-chart-wrap" style={{ marginTop: '16px' }}>
              <svg
                viewBox={`0 0 ${contractBarChartData.width} ${contractBarChartData.height}`}
                className="varka-bar-svg"
              >
                {/* Horizontal Gridlines & Y-Axis Labels */}
                {contractBarChartData.yTicks.map((tick) => {
                  const y = contractBarChartData.scaleY(tick)
                  return (
                    <g key={tick}>
                      <line
                        x1={contractBarChartData.padLeft}
                        y1={y}
                        x2={contractBarChartData.width - contractBarChartData.padRight}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeDasharray={tick === 0 ? undefined : '2 2'}
                      />
                      <text
                        x={contractBarChartData.padLeft - 12}
                        y={y + 4}
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {tick.toLocaleString()}
                      </text>
                    </g>
                  )
                })}

                {/* Vertical Bars */}
                {contractBarChartData.bars.map((bar) => (
                  <g
                    key={bar.voyages}
                    onClick={() => setCharterStrategy(bar.voyages)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill="#85c5fb"
                      rx="2"
                      opacity={bar.isSelected ? 1 : 0.85}
                    />
                    {/* X-axis label centered below bar */}
                    <text
                      x={bar.xLabel}
                      y={contractBarChartData.height - 10}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {bar.voyages}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Selected Scenario Green Banner matching Image 2 */}
            <div className="varka-green-banner" style={{ marginTop: '16px' }}>
              Selected {charterStrategy}-voyage scenario: Indicative saving vs repeated spot entry $
              {selectedSaving.toLocaleString()}. This is a planning scenario, not a price guarantee.
            </div>

            {/* Embedded Charter Assistant Input matching Image 1 & 2 */}
            <div className="varka-chat-input-bar" style={{ marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Ask the Charter Assistant..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTab('assistant')
                    onSelectSection?.('assistant')
                    handleSendQuery()
                  }
                }}
                className="varka-chat-input-field"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveTab('assistant')
                  onSelectSection?.('assistant')
                  handleSendQuery()
                }}
                className="varka-chat-submit-btn"
                aria-label="Send Query"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 8: RISK & AUDIT
           ===================================================================== */}
        {activeTab === 'risk' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Explainable risk cockpit</h3>
            <div
              className="varka-brief-metrics-grid"
              style={{ gridTemplateColumns: '1.45fr 1fr', gap: '16px', alignItems: 'start' }}
            >
              {/* Risk Drivers Table (Exact Match to Image 1) */}
              <div className="varka-table-wrap">
                <table className="varka-data-table">
                  <thead>
                    <tr>
                      <th>risk driver</th>
                      <th>score</th>
                      <th>level</th>
                      <th>recommended mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRiskDetails.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{r.risk_driver}</strong>
                        </td>
                        <td className="font-mono text-cyan">{r.score}</td>
                        <td>
                          <span
                            className={`varka-badge-pill ${
                              r.level === 'High'
                                ? 'pill-danger'
                                : r.level === 'Medium'
                                ? 'pill-warning'
                                : 'pill-success'
                            }`}
                          >
                            {r.level}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px' }}>{r.recommended_mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Composite Risk Metric & Bar Chart Card (Exact Match to Image 1) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  className="varka-bm-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <span
                    className="varka-bm-label"
                    style={{ fontSize: '13px', textTransform: 'none', color: '#94a3b8' }}
                  >
                    Composite risk
                  </span>
                  <span
                    className="varka-bm-val font-mono"
                    style={{ fontSize: '32px', fontWeight: 700, color: '#f8fafc' }}
                  >
                    {strategy?.risk_index ? Math.min(100, Math.max(0, strategy.risk_index)) : 46}/100
                  </span>
                  <div>
                    <span
                      className="varka-badge-pill pill-success"
                      style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      ↑ Within selected appetite
                    </span>
                  </div>
                </div>

                {/* SVG Risk Driver Bar Chart (Matching Image 1) */}
                <div className="varka-risk-bar-chart-card">
                  <svg
                    viewBox={`0 0 ${riskBarChartData.width} ${riskBarChartData.height}`}
                    className="varka-risk-bar-svg"
                  >
                    {/* Horizontal Gridlines & Y-Axis Labels */}
                    {riskBarChartData.yTicks.map((tick) => {
                      const y = riskBarChartData.scaleY(tick)
                      return (
                        <g key={tick}>
                          <line
                            x1={riskBarChartData.padLeft}
                            y1={y}
                            x2={riskBarChartData.width - riskBarChartData.padRight}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeDasharray={tick === 0 ? undefined : '2 2'}
                          />
                          <text
                            x={riskBarChartData.padLeft - 6}
                            y={y + 3}
                            fill="#94a3b8"
                            fontSize="10"
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            {tick}
                          </text>
                        </g>
                      )
                    })}

                    {/* Vertical Bars & Rotated Labels */}
                    {riskBarChartData.bars.map((bar) => (
                      <g key={bar.name}>
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          fill="#85c5fb"
                          rx="2"
                        />
                        <text
                          x={bar.xCenter}
                          y={riskBarChartData.height - riskBarChartData.padBottom + 12}
                          fill="#94a3b8"
                          fontSize="9.5"
                          fontFamily="monospace"
                          textAnchor="end"
                          transform={`rotate(-90 ${bar.xCenter} ${
                            riskBarChartData.height - riskBarChartData.padBottom + 12
                          })`}
                        >
                          {bar.shortName}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* Section 2: Decision Explanation and Audit Trail (Exact Match to Image 2) */}
            <h3 className="varka-panel-section-title" style={{ marginTop: '24px' }}>
              Decision explanation and audit trail
            </h3>

            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>audit_field</th>
                    <th>recorded_value</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionAuditRows.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{a.audit_field}</strong>
                      </td>
                      <td className="font-mono text-cyan">{a.recorded_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => downloadCsv(`decision_audit_${selectedRouteId}.csv`, decisionAuditRows)}
              className="varka-download-btn"
              style={{ marginTop: '12px' }}
            >
              <Download size={14} />
              <span>Download decision audit trail</span>
            </button>

            {/* Section 3: Early-Warning and Resilience Plan (Exact Match to Images 2 & 3) */}
            <h3 className="varka-panel-section-title" style={{ marginTop: '24px' }}>
              Early-warning and resilience plan
            </h3>

            {/* Table 1: Early-warning alerts (Exact Match to Image 2) */}
            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>severity</th>
                    <th>alert</th>
                    <th>evidence</th>
                    <th>action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="varka-badge-pill pill-warning">Warning</span>
                    </td>
                    <td>
                      <strong>Port wait time watch</strong>
                    </td>
                    <td className="text-secondary">Congestion scenario {congestion}/100.</td>
                    <td style={{ fontSize: '12px' }}>
                      Refresh port status before nomination and hold berth window contingency.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="varka-badge-pill pill-warning">Warning</span>
                    </td>
                    <td>
                      <strong>Low vessel utilisation</strong>
                    </td>
                    <td className="text-secondary">
                      Selected parcel fills only{' '}
                      {(
                        (vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.utilisation || 0.69) *
                        100
                      ).toFixed(0)}
                      % of nominal capacity.
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      Consider aggregation, split parcel or a smaller vessel before accepting the
                      freight offer.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 2: Pre-agreed resilience actions (Exact Match to Image 3) */}
            <div className="varka-table-wrap" style={{ marginTop: '14px' }}>
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>risk</th>
                    <th>current signal</th>
                    <th>pre-agreed action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Freight volatility</strong>
                    </td>
                    <td className="font-mono text-cyan">
                      + ${forecast?.uncertainty_band_usd_t ? forecast.uncertainty_band_usd_t.toFixed(2) : '0.45'}
                      /MT residual band
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      Use rate cap, index-linked clause or staggered fixtures
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Port congestion</strong>
                    </td>
                    <td className="font-mono text-cyan">
                      Scenario score {congestion}/100;{' '}
                      {strategy?.port_days ? strategy.port_days.toFixed(1) : '6.1'} port days
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      Agree congestion trigger, alternate port and demurrage allocation
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Vessel/parcel mismatch</strong>
                    </td>
                    <td className="font-mono text-cyan">
                      {(
                        (vesselOpt?.vessel_classes.find((v) => v.is_recommended)?.utilisation || 0.69) *
                        100
                      ).toFixed(0)}
                      % utilisation in selected class
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      Aggregate/split parcels if utilisation moves outside the commercial band
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Weather disruption</strong>
                    </td>
                    <td className="font-mono text-cyan">Optional live marine signal available</td>
                    <td style={{ fontSize: '12px' }}>
                      Refresh API context before fixture and monitor sailing/berthing windows
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Green Callout Banner (Exact Match to Image 3) */}
            <div className="varka-green-banner" style={{ marginTop: '16px' }}>
              Risk is within the selected appetite. Re-run the scenario when congestion or expected cargo readiness changes materially.
            </div>

            {/* Embedded Grounded Charter Assistant (Exact Match to Image 3) */}
            <div className="varka-assistant-embedded-box" style={{ marginTop: '24px' }}>
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
                <p className="varka-aeb-sub">
                  Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses;
                  the app works without internet or an API key.
                </p>
              </div>

              <div className="varka-assistant-callout" style={{ marginTop: '12px' }}>
                <span className="varka-callout-icon">🤖</span>
                <span>
                  I am ready to explain this charter recommendation. Ask me why this vessel was
                  selected, whether to fix now, or what the main risks are.
                </span>
              </div>

              <div className="varka-chat-input-bar" style={{ marginTop: '14px' }}>
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab('assistant')
                      onSelectSection?.('assistant')
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assistant')
                    onSelectSection?.('assistant')
                    handleSendQuery()
                  }}
                  className="varka-chat-submit-btn"
                  aria-label="Send Query"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 9: STANDARDS & DATA
           ===================================================================== */}
        {activeTab === 'standards' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Standards-ready data model</h3>

            <div className="varka-table-wrap">
              <table className="varka-data-table">
                <thead>
                  <tr>
                    <th>dashboard_field</th>
                    <th>standards-ready representation</th>
                    <th>production source</th>
                  </tr>
                </thead>
                <tbody>
                  {standardsMapping && standardsMapping.length > 0 ? (
                    standardsMapping.map((s, i) => (
                      <tr key={i}>
                        <td className="font-mono text-cyan">
                          <strong>{s.dashboard_field}</strong>
                        </td>
                        <td>{s['standards-ready representation']}</td>
                        <td className="text-secondary">{s['production source']}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>route_id</strong>
                        </td>
                        <td>Port Call / operational schedule reference</td>
                        <td className="text-secondary">Carrier / voyage-planning system</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>berth_ready_time</strong>
                        </td>
                        <td>DCSA Estimated / Requested / Planned berth event</td>
                        <td className="text-secondary">Terminal / Port Authority</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>congestion_index</strong>
                        </td>
                        <td>Port operational status enrichment</td>
                        <td className="text-secondary">Port Community System / terminal</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>vessel availability</strong>
                        </td>
                        <td>Operational vessel schedule / fleet position</td>
                        <td className="text-secondary">Carrier / AIS / fleet system</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>cargo and vessel details</strong>
                        </td>
                        <td>IMO Maritime Single Window declaration context</td>
                        <td className="text-secondary">Ship agent / authority</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-cyan">
                          <strong>freight forecast</strong>
                        </td>
                        <td>Commercial decision-support enrichment</td>
                        <td className="text-secondary">Licensed broker / internal model</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="varka-card-desc" style={{ marginTop: '12px' }}>
              The mapping keeps event ownership and production data sources explicit, preparing the
              dashboard for DCSA Port Call and IMO Maritime Single Window interoperability.
            </p>

            <h3 className="varka-panel-section-title" style={{ marginTop: '24px' }}>
              Free API context — optional enrichment
            </h3>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleRefreshLiveContext}
                disabled={isLoadingLiveContext}
                className="varka-download-btn"
              >
                <RefreshCw size={14} className={isLoadingLiveContext ? 'varka-spin' : ''} />
                <span>
                  {isLoadingLiveContext
                    ? 'Refreshing World Bank + Open-Meteo context...'
                    : 'Refresh World Bank + Open-Meteo context'}
                </span>
              </button>
            </div>

            <p className="varka-card-desc" style={{ marginTop: '10px' }}>
              Click refresh to retrieve keyless public context. The model remains runnable without internet.
            </p>

            {liveContextData && (
              <div
                className="varka-json-viewer"
                style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}
              >
                {JSON.stringify(liveContextData, null, 2)}
              </div>
            )}

            <p className="varka-card-desc" style={{ marginTop: '14px' }}>
              <strong>Production governance:</strong> retain source, timestamp, licence, quality flag
              and owner for every feature. Licensed broker/Baltic and AIS data are required for
              operational freight quotes and live congestion; free sources must not be presented as
              substitutes.
            </p>

            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `charter_scenario_${selectedRouteId}.csv`,
                    contractScenarios.length
                      ? contractScenarios
                      : [
                          { scenario: 'Base', rate: 14.01 },
                          { scenario: 'Bull', rate: 15.89 },
                          { scenario: 'Bear', rate: 12.16 },
                        ]
                  )
                }
                className="varka-download-btn"
              >
                <Download size={14} />
                <span>Download selected multi-voyage scenario</span>
              </button>
            </div>

            {/* Embedded Grounded Charter Assistant (Exact Match to Image 2) */}
            <div className="varka-assistant-embedded-box" style={{ marginTop: '28px' }}>
              <div className="varka-aeb-header">
                <h4 className="varka-aeb-title">Charter Assistant</h4>
                <p className="varka-aeb-sub">
                  Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses;
                  the app works without internet or an API key.
                </p>
              </div>

              <div className="varka-assistant-callout" style={{ marginTop: '12px' }}>
                <span className="varka-callout-icon">🤖</span>
                <span>
                  I am ready to explain this charter recommendation. Ask me why this vessel was
                  selected, whether to fix now, or what the main risks are.
                </span>
              </div>

              <div className="varka-chat-input-bar" style={{ marginTop: '14px' }}>
                <input
                  type="text"
                  placeholder="Ask the Charter Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab('assistant')
                      onSelectSection?.('assistant')
                      handleSendQuery()
                    }
                  }}
                  className="varka-chat-input-field"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assistant')
                    onSelectSection?.('assistant')
                    handleSendQuery()
                  }}
                  className="varka-chat-submit-btn"
                  aria-label="Send Query"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 10: CHARTER ASSISTANT (Matches Image 3 Exactly)
           ===================================================================== */}
        {activeTab === 'assistant' && (
          <div className="varka-cockpit-tab-panel">
            <h3 className="varka-panel-section-title">Charter Assistant</h3>
            <p className="varka-card-desc">
              Local grounded assistant is active. Add GEMINI_API_KEY to enable Gemini responses; the
              app works without internet or an API key.
            </p>

            {/* Suggested Question Chips */}
            <div className="varka-assistant-chips-row">
              <button
                type="button"
                onClick={() => handleSendQuery('Why this vessel?')}
                className="varka-chip-btn"
              >
                Why this vessel?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('What is the risk?')}
                className="varka-chip-btn"
              >
                What is the risk?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('Should I fix now?')}
                className="varka-chip-btn"
              >
                Should I fix now?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('What is the JIT plan?')}
                className="varka-chip-btn"
              >
                What is the JIT plan?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('Explain port fit')}
                className="varka-chip-btn"
              >
                Explain port fit
              </button>
            </div>

            {/* Message Stream */}
            <div className="varka-chat-stream">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`varka-chat-bubble-wrap ${
                    msg.role === 'user' ? 'is-user' : 'is-assistant'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="varka-chat-bot-avatar">
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div className="varka-chat-bubble">
                    <p className="varka-chat-text">{msg.content}</p>
                    <span className="varka-chat-time">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {isAnswering && (
                <div className="varka-chat-bubble-wrap is-assistant">
                  <div className="varka-chat-bot-avatar">
                    <RefreshCw size={14} className="varka-spin" />
                  </div>
                  <div className="varka-chat-bubble">
                    <span className="varka-chat-typing">Analyzing charter mandate...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="varka-chat-input-bar">
              <input
                type="text"
                placeholder="Ask the Charter Assistant..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                className="varka-chat-input-field"
              />
              <button
                type="button"
                onClick={() => handleSendQuery()}
                disabled={!inputQuery.trim() || isAnswering}
                className="varka-chat-submit-btn"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

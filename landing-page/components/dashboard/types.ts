export type NavSection = 'tracking' | 'history' | 'agent' | 'prediction'

export interface PortOrigin {
  port_code: string
  port_name: string
  country: string
  cargo_handling_rate_tpd: number
  max_draft_m: number
  max_loa_m: number
  max_beam_m: number
}

export interface PortDestination {
  port_code: string
  port_name: string
  avg_delay_days: number
  cargo_handling_rate_tpd: number
  max_draft_m: number
  max_loa_m: number
  max_beam_m: number
  dry_bulk_berths: number
}

export interface VesselClassInfo {
  vessel_type: string
  typical_draft_m: number
  typical_loa_m: number
  typical_beam_m: number
  dwt_min: number
  dwt_max: number
}

export interface RouteOption {
  route_id: string
  origin_port_code: string
  dest_port_code: string
  origin_name: string
  origin_country: string
  dest_name: string
  distance_nm: number
}

export interface RouteCatalog {
  origins: PortOrigin[]
  destinations: PortDestination[]
  vessels: VesselClassInfo[]
  routes: RouteOption[]
}

export interface ForecastDriver {
  driver: string
  impact: number
}

export interface WeeklyWindow {
  week: string
  min_rate: number
  average_rate: number
  earliest_date: string
  action: string
}

export interface ForecastDataPoint {
  date: string
  rate_usd_t?: number
  forecast_usd_t?: number
  p10?: number
  p90?: number
}

export interface ForecastResponse {
  route_id: string
  vessel_type: string
  horizon_days: number
  current_rate_usd_t: number
  uncertainty_band_usd_t: number
  explanation_method: string
  mape_pct: number | null
  rmse: number | null
  historical_recent: { date: string; rate_usd_t: number }[]
  outlook: { date: string; forecast_usd_t: number; p10: number; p90: number }[]
  drivers: ForecastDriver[]
  weekly_windows: WeeklyWindow[]
}

export interface MarineRiskData {
  port_code: string
  max_wave_m: number | null
  risk: string
  source: string
  status: string
}

export interface VesselFeasibilityClass {
  vessel_type: string
  eligible: boolean
  typical_draft_m_ok: boolean
  typical_loa_m_ok: boolean
  typical_beam_m_ok: boolean
  cargo_ok: boolean
  draft_limit_m: number
  loa_limit_m: number
  beam_limit_m: number
  utilisation: number
  forecast_rate_usd_t: number
  total_freight_usd: number
  available_hulls: number
  next_available_days: number
  availability_status: string
  multi_objective_score: number
  is_recommended: boolean
}

export interface VesselOptimizationResponse {
  route_id: string
  cargo_mt: number
  priority: string
  recommended_vessel: string
  vessel_classes: VesselFeasibilityClass[]
}

export interface JITPlanResponse {
  action: string
  berth_ready_days: number
  standard_speed: number
  jit_speed: number
  standard_sailing_days: number
  jit_sailing_days: number
  early_wait_hours: number
  jit_wait_hours: number
  hours_saved_at_anchorage: number
  standard_fuel_tonnes: number
  jit_fuel_tonnes: number
  fuel_saved_tonnes: number
  cost_saved_usd: number
  co2_saved_tonnes: number
  risk_score: number
}

export interface CharterScenario {
  voyages: number
  contract_rate_usd_mt: number
  all_in_cost_usd: number
  saving_vs_repeated_spot_usd: number
  planned_cycle_days: number
}

export interface CharterStrategyResponse {
  route_id: string
  vessel_type: string
  cargo_mt: number
  laycan_days: number
  risk_index: number
  cycle_days: number
  posture: string
  action: string
  rationale: string
  expected_cost: number
  expected_saving: number
  protections: string[]
  scenarios: CharterScenario[]
}

export type TrackingStatus = 'IN TRANSIT' | 'AT PORT' | 'DEPARTED' | 'ESTIMATED ARRIVAL' | 'COMPLETED'

export interface RouteWaypoint {
  name: string
  code: string
  status: 'completed' | 'current' | 'upcoming'
  timestamp: string
  description: string
  coordinates?: string
}

export interface VoyageData {
  id: string
  trackingNumber: string
  carrier: string
  vesselName: string
  imoNumber: string
  status: TrackingStatus
  originPort: string
  originCode: string
  destinationPort: string
  destinationCode: string
  departureDate: string
  eta: string
  cargoType: string
  volume: string
  containerCount: string
  currentLocation: string
  coordinates: string
  speed: string
  heading: string
  distanceRemaining: string
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk'
  riskDetail: string
  waypoints: RouteWaypoint[]
}

export interface HistoryItem {
  id: string
  trackingNumber: string
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  vessel: string
  status: TrackingStatus
  date: string
  eta: string
  cargo: string
  volume: string
}

export interface HiddenCostItem {
  id: string
  category: string
  code: string
  estimatedMin: number
  estimatedMax: number
  riskLevel: 'Low' | 'Moderate' | 'High'
  explanation: string
  tacticalAdvice: string
}

export interface AgentAnalysisInput {
  origin: string
  destination: string
  cargoType: string
  cargoVolume: string
  containerType: string
  quotedRate: number
}

export interface AgentAnalysisResult {
  quotedRate: number
  currency: string
  estimatedMinLandedCost: number
  estimatedMaxLandedCost: number
  variancePercent: number
  riskIndex: 'Low' | 'Moderate' | 'High'
  costCategories: HiddenCostItem[]
  keyRecommendations: string[]
  timestamp: string
  isSimulated: boolean
}

export interface UserProfileData {
  id: string
  firstName: string
  lastName?: string
  email: string
  avatar?: string
  gender?: string
}

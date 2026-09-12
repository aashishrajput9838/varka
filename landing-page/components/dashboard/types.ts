export type NavSection = 'tracking' | 'history' | 'agent'

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

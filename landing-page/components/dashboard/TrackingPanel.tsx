'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Radio,
  Clock,
  Navigation,
  Info,
  Loader2,
  Ship,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { RouteWaypoint, TrackingStatus, VoyageData } from './types'
import VoyageOverview from './VoyageOverview'

interface AisRawShip {
  mmsi: number
  shipName?: string
  latitude: number | null
  longitude: number | null
  speed: number | null
  course: number | null
  trueHeading: number | null
  lastSeen: number | null
  history?: [number, number][]
}

interface TrackingPanelProps {
  currentVoyage: VoyageData | null
  onVoyageChange: (voyage: VoyageData) => void
}

function mapAisShipToVoyage(ship: AisRawShip): VoyageData {
  const isMoving = (ship.speed || 0) > 0.5
  const status: TrackingStatus = isMoving ? 'IN TRANSIT' : 'AT PORT'
  const speedStr = ship.speed != null ? `${ship.speed.toFixed(1)} kn` : '0.0 kn'
  const headingVal =
    ship.trueHeading && ship.trueHeading !== 511
      ? ship.trueHeading
      : ship.course != null
      ? ship.course.toFixed(0)
      : 0
  const lat = ship.latitude
  const lon = ship.longitude
  const coordsStr =
    lat != null && lon != null
      ? `${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°${lon < 0 ? 'W' : 'E'}`
      : 'Transponder Offline'
  const vesselTitle = ship.shipName?.trim() || `Vessel MMSI ${ship.mmsi}`

  const historyPoints = ship.history || []
  const waypoints: RouteWaypoint[] =
    historyPoints.length > 0
      ? historyPoints.map((pt, idx) => ({
          name:
            idx === 0
              ? 'Initial GPS Fix'
              : idx === historyPoints.length - 1
              ? 'Current Transponder Fix'
              : `Nautical Fix #${idx + 1}`,
          code: `AIS-PT${idx + 1}`,
          status: idx === historyPoints.length - 1 ? 'current' : 'completed',
          timestamp: new Date(
            Date.now() - (historyPoints.length - 1 - idx) * 45000
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: `Telemetry coordinate recorded at ${pt[0].toFixed(
            4
          )}°N, ${Math.abs(pt[1]).toFixed(4)}°${pt[1] < 0 ? 'W' : 'E'}`,
          coordinates: `${pt[0].toFixed(4)}°N, ${Math.abs(pt[1]).toFixed(4)}°${
            pt[1] < 0 ? 'W' : 'E'
          }`,
        }))
      : [
          {
            name: 'Live Transponder Beacon',
            code: 'AIS-BEACON',
            status: 'current',
            timestamp: new Date(ship.lastSeen || Date.now()).toLocaleTimeString(
              [],
              { hour: '2-digit', minute: '2-digit' }
            ),
            description: `Live VHF/Satellite telemetry received at ${coordsStr}`,
            coordinates: coordsStr,
          },
        ]

  return {
    id: `mmsi-${ship.mmsi}`,
    trackingNumber: String(ship.mmsi),
    carrier: 'AISStream Global Nautical Radar',
    vesselName: vesselTitle,
    imoNumber: `MMSI ${ship.mmsi}`,
    status,
    originPort: 'AIS Coastal Sector',
    originCode: 'RADAR-IN',
    destinationPort: 'High-Seas Coastal Corridor',
    destinationCode: 'RADAR-OUT',
    departureDate:
      new Date(Date.now() - Math.max(1, historyPoints.length) * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' (First Sighted)',
    eta: isMoving ? 'Real-Time Synchronized' : 'Moored / At Rest',
    cargoType: 'Commercial Maritime Vessel',
    volume: 'AIS Broadcast Stream',
    containerCount: 'Transponder Telemetry',
    currentLocation: coordsStr,
    coordinates: coordsStr,
    speed: speedStr,
    heading: `${headingVal}°`,
    distanceRemaining: isMoving ? 'In Live Radar Coverage' : '0 NM (At Rest)',
    riskLevel: 'Low Risk',
    riskDetail: 'Vessel continuously broadcasting active position reports over AISStream network.',
    waypoints,
  }
}

export default function TrackingPanel({
  currentVoyage,
  onVoyageChange,
}: TrackingPanelProps) {
  const [searchInput, setSearchInput] = useState(
    currentVoyage?.trackingNumber || ''
  )
  const [isSearching, setIsSearching] = useState(false)
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null)
  const [liveShips, setLiveShips] = useState<AisRawShip[]>([])
  const [radarStatus, setRadarStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')

  // Load real-time ships from ship-tracking module (port 3001)
  useEffect(() => {
    let isMounted = true

    const fetchLiveRadar = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/ships')
        if (res.ok) {
          const json = await res.json()
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            if (!isMounted) return
            setLiveShips(json.data)
            setRadarStatus('connected')

            // If no voyage currently selected, default to the first active vessel with a name
            if (!currentVoyage) {
              const namedShip = json.data.find(
                (s: AisRawShip) => s.shipName && s.latitude != null
              ) || json.data[0]
              if (namedShip) {
                const mapped = mapAisShipToVoyage(namedShip)
                onVoyageChange(mapped)
                setSearchInput(String(namedShip.mmsi))
              }
            }
            return
          }
        }
        if (isMounted) setRadarStatus('offline')
      } catch (err) {
        if (isMounted) setRadarStatus('offline')
      }
    }

    fetchLiveRadar()
    const interval = setInterval(fetchLiveRadar, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [currentVoyage, onVoyageChange])

  // Top 4 real live ships with names for quick selection pills
  const activePills = liveShips
    .filter((s) => s.shipName && s.latitude != null)
    .slice(0, 4)
    .map((s) => ({
      mmsi: String(s.mmsi),
      name: s.shipName!,
      speed: s.speed != null ? `${s.speed.toFixed(1)} kn` : 'At Port',
      raw: s,
    }))

  const saveToHistory = (voyage: VoyageData) => {
    try {
      const existingRaw = localStorage.getItem('varka_search_history')
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      const updated = [
        {
          id: `hist-${Date.now()}`,
          trackingNumber: voyage.trackingNumber,
          origin: voyage.originPort,
          originCode: voyage.originCode,
          destination: voyage.destinationPort,
          destinationCode: voyage.destinationCode,
          vessel: voyage.vesselName,
          status: voyage.status,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          eta: voyage.eta,
          cargo: voyage.cargoType,
          volume: voyage.volume,
        },
        ...existing.filter((item: any) => item.trackingNumber !== voyage.trackingNumber),
      ].slice(0, 20)
      localStorage.setItem('varka_search_history', JSON.stringify(updated))
    } catch {
      // localstorage errors ignored
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchInput.trim().toUpperCase()
    if (!query) return

    setIsSearching(true)
    setSearchFeedback(null)

    // Search local live list first
    const match = liveShips.find(
      (s) =>
        String(s.mmsi) === query ||
        (s.shipName && s.shipName.toUpperCase().includes(query))
    )

    if (match) {
      const mapped = mapAisShipToVoyage(match)
      onVoyageChange(mapped)
      saveToHistory(mapped)
      setSearchFeedback(null)
      setIsSearching(false)
      return
    }

    // Attempt direct server query for MMSI
    try {
      const res = await fetch(`http://localhost:3001/api/ships/${encodeURIComponent(query)}`)
      if (res.ok) {
        const ship = await res.json()
        const mapped = mapAisShipToVoyage(ship)
        onVoyageChange(mapped)
        saveToHistory(mapped)
        setSearchFeedback(null)
      } else {
        setSearchFeedback(`No vessel detected with MMSI or reference "${query}". Ensure transponder is active and within AIS range.`)
      }
    } catch (err) {
      setSearchFeedback(`No active telemetry match for "${query}". Ensure vessel transponder is online.`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectPill = (ship: AisRawShip) => {
    setSearchInput(String(ship.mmsi))
    const mapped = mapAisShipToVoyage(ship)
    onVoyageChange(mapped)
    saveToHistory(mapped)
    setSearchFeedback(null)
  }

  return (
    <div className="varka-tracking-panel">
      {/* Primary prominent search card */}
      <div className="varka-search-card">
        <div className="varka-search-card-header">
          <div className="varka-search-card-title-group">
            <span className="varka-section-kicker">LIVE AIS VESSEL LOCATOR</span>
            <h2 className="varka-search-title">Track a real vessel</h2>
            <p className="varka-search-subtitle">
              Enter any MMSI number or vessel name to inspect live transponder telemetry, headings, speed, and coordinates.
            </p>
          </div>
          <div className="varka-search-badge">
            <Navigation size={13} />
            <span>
              {radarStatus === 'connected'
                ? `RADAR: ${liveShips.length} LIVE AIS VESSELS`
                : radarStatus === 'connecting'
                ? 'CONNECTING TO AISSTREAM...'
                : 'AISSTREAM RADAR STANDBY'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="varka-search-form" noValidate>
          <div className="varka-search-input-wrap">
            <Search size={17} className="varka-search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter vessel MMSI or name (e.g. 338926402, HERAKLES)..."
              className="varka-search-input"
              aria-label="Enter tracking number or MMSI"
            />
            {searchInput && (
              <button
                type="button"
                className="varka-search-clear"
                onClick={() => setSearchInput('')}
                aria-label="Clear tracking input"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="varka-search-submit-btn"
          >
            {isSearching ? (
              <>
                <Loader2 size={15} className="varka-spin" />
                <span>QUERYING AIS...</span>
              </>
            ) : (
              <>
                <span>TRACK VESSEL</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Real Live Vessels from AISStream Radar */}
        {activePills.length > 0 && (
          <div className="varka-quick-pills-row">
            <span className="varka-pills-label">STREAMING AIS VESSELS:</span>
            <div className="varka-pills-list">
              {activePills.map((pill) => (
                <button
                  key={pill.mmsi}
                  type="button"
                  onClick={() => handleSelectPill(pill.raw)}
                  className={`varka-quick-pill ${
                    currentVoyage?.trackingNumber === pill.mmsi
                      ? 'is-active-pill'
                      : ''
                  }`}
                >
                  <span className="varka-pill-ref">{pill.mmsi}</span>
                  <span className="varka-pill-name">
                    {pill.name} • {pill.speed}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchFeedback && (
          <div className="varka-search-notice" role="status">
            <Info size={13} />
            <span>{searchFeedback}</span>
          </div>
        )}
      </div>

      {/* Visual Tracking Result Area */}
      {currentVoyage ? (
        <>
          <div className="varka-tracking-result-card">
            <div className="varka-result-header">
              <div className="varka-result-title-col">
                <div className="varka-result-top-meta">
                  <span className="varka-result-ref">
                    MMSI: {currentVoyage.trackingNumber}
                  </span>
                  <span className="varka-dot-sep">•</span>
                  <span className="varka-result-carrier">
                    {currentVoyage.carrier}
                  </span>
                </div>
                <h3 className="varka-result-vessel">
                  <Ship size={18} className="varka-rust-icon" />
                  <span>{currentVoyage.vesselName}</span>
                </h3>
              </div>

              <div className="varka-result-status-col">
                <span className="varka-result-status-label">
                  TRANSPONDER STATE
                </span>
                <span className="varka-result-status-badge">
                  <Radio size={12} className="varka-beacon-icon" />
                  <span>{currentVoyage.status}</span>
                </span>
              </div>
            </div>

            {/* Visual Route Progression Timeline */}
            <div className="varka-route-timeline-wrap">
              <div className="varka-timeline-header-row">
                <span className="varka-timeline-title">
                  LIVE TELEMETRY FIXES & NAUTICAL RECORD
                </span>
                <span className="varka-timeline-meta">
                  Live Stream via AISStream • {currentVoyage.waypoints.length} GPS Coordinates
                </span>
              </div>

              <div className="varka-route-track" role="list">
                {currentVoyage.waypoints.map((wp, index) => {
                  const isCompleted = wp.status === 'completed'
                  const isCurrent = wp.status === 'current'
                  const isUpcoming = wp.status === 'upcoming'

                  return (
                    <div
                      key={wp.code + index}
                      className={`varka-waypoint-node ${
                        isCurrent
                          ? 'is-current'
                          : isCompleted
                          ? 'is-completed'
                          : 'is-upcoming'
                      }`}
                      role="listitem"
                    >
                      <div className="varka-node-line-before" />
                      <div className="varka-node-marker">
                        {isCompleted && <CheckCircle2 size={14} />}
                        {isCurrent && <span className="varka-node-pulse-ring" />}
                        {isUpcoming && <Clock size={12} />}
                      </div>
                      <div className="varka-node-line-after" />

                      <div className="varka-node-content">
                        <span className="varka-node-code">{wp.code}</span>
                        <strong className="varka-node-name">{wp.name}</strong>
                        <span className="varka-node-time">{wp.timestamp}</span>
                        <p className="varka-node-desc">{wp.description}</p>
                        {wp.coordinates && (
                          <span className="varka-node-coords">
                            {wp.coordinates}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Compact Voyage Overview Section */}
          <VoyageOverview voyage={currentVoyage} />
        </>
      ) : (
        <div className="varka-tracking-empty-card" style={{
          background: '#161311',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '36px',
          textAlign: 'center',
          color: '#a39e99'
        }}>
          <Ship size={36} style={{ color: 'var(--rust)', margin: '0 auto 12px' }} />
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            No Vessel Selected
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
            Enter a vessel MMSI number or select an active ship from the streaming AIS radar above to inspect telemetry.
          </p>
        </div>
      )}
    </div>
  )
}

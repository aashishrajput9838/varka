'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { VoyageData } from './types'
import { DEMO_VOYAGES } from './mockData'
import VoyageOverview from './VoyageOverview'

interface TrackingPanelProps {
  currentVoyage: VoyageData
  onVoyageChange: (voyage: VoyageData) => void
}

export default function TrackingPanel({
  currentVoyage,
  onVoyageChange,
}: TrackingPanelProps) {
  const [searchInput, setSearchInput] = useState(currentVoyage.trackingNumber)
  const [isSearching, setIsSearching] = useState(false)
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null)

  const quickPills = [
    { ref: 'VRK-9021-IN', label: 'Mumbai → Chennai (In Transit)' },
    { ref: 'VRK-6140-SG', label: 'Singapore → Chennai (At Port)' },
    { ref: 'VRK-3382-NL', label: 'Rotterdam → Mumbai (Completed)' },
    { ref: 'VRK-8812-CN', label: 'Shanghai → Colombo (Departed)' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim().toUpperCase()
    if (!trimmed) return

    setIsSearching(true)
    setSearchFeedback(null)

    // Simulate network telemetry search delay
    setTimeout(() => {
      const match = DEMO_VOYAGES[trimmed]
      if (match) {
        onVoyageChange(match)
        setSearchFeedback(null)
      } else {
        // Fallback: create dynamic simulated voyage for any custom entered reference
        const dynamicVoyage: VoyageData = {
          ...DEMO_VOYAGES['VRK-9021-IN'],
          id: `custom-${Date.now()}`,
          trackingNumber: trimmed,
          vesselName: `M/V Pacific Carrier (${trimmed.slice(0, 6)})`,
        }
        onVoyageChange(dynamicVoyage)
        setSearchFeedback(`Simulated itinerary generated for query "${trimmed}"`)
      }
      setIsSearching(false)
    }, 600)
  }

  const handleSelectPill = (ref: string) => {
    setSearchInput(ref)
    setIsSearching(true)
    setSearchFeedback(null)

    setTimeout(() => {
      if (DEMO_VOYAGES[ref]) {
        onVoyageChange(DEMO_VOYAGES[ref])
      }
      setIsSearching(false)
    }, 450)
  }

  return (
    <div className="varka-tracking-panel">
      {/* Primary prominent search card */}
      <div className="varka-search-card">
        <div className="varka-search-card-header">
          <div className="varka-search-card-title-group">
            <span className="varka-section-kicker">VOYAGE LOCATOR</span>
            <h2 className="varka-search-title">Track a shipment</h2>
            <p className="varka-search-subtitle">
              Enter your container, booking, or tracking reference to monitor its current movement.
            </p>
          </div>
          <div className="varka-search-badge">
            <Navigation size={13} />
            <span>GLOBAL AIS RADAR</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="varka-search-form" noValidate>
          <div className="varka-search-input-wrap">
            <Search size={17} className="varka-search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter tracking number (e.g. VRK-9021-IN, MSCU4820SG)..."
              className="varka-search-input"
              aria-label="Enter tracking number"
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
                <span>SCANNING FLEET...</span>
              </>
            ) : (
              <>
                <span>TRACK VOYAGE</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick sample pills */}
        <div className="varka-quick-pills-row">
          <span className="varka-pills-label">QUICK BENCHMARKS:</span>
          <div className="varka-pills-list">
            {quickPills.map((pill) => (
              <button
                key={pill.ref}
                type="button"
                onClick={() => handleSelectPill(pill.ref)}
                className={`varka-quick-pill ${
                  currentVoyage.trackingNumber === pill.ref ? 'is-active-pill' : ''
                }`}
              >
                <span className="varka-pill-ref">{pill.ref}</span>
                <span className="varka-pill-name">{pill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {searchFeedback && (
          <div className="varka-search-notice" role="status">
            <Info size={13} />
            <span>{searchFeedback}</span>
          </div>
        )}
      </div>

      {/* Visual Tracking Result Area */}
      <div className="varka-tracking-result-card">
        <div className="varka-result-header">
          <div className="varka-result-title-col">
            <div className="varka-result-top-meta">
              <span className="varka-result-ref">{currentVoyage.trackingNumber}</span>
              <span className="varka-dot-sep">•</span>
              <span className="varka-result-carrier">{currentVoyage.carrier}</span>
            </div>
            <h3 className="varka-result-vessel">
              <Ship size={18} className="varka-rust-icon" />
              <span>{currentVoyage.vesselName}</span>
            </h3>
          </div>

          <div className="varka-result-status-col">
            <span className="varka-result-status-label">CURRENT VOYAGE STATE</span>
            <span className="varka-result-status-badge">
              <Radio size={12} className="varka-beacon-icon" />
              <span>{currentVoyage.status}</span>
            </span>
          </div>
        </div>

        {/* Visual Route Progression Timeline */}
        <div className="varka-route-timeline-wrap">
          <div className="varka-timeline-header-row">
            <span className="varka-timeline-title">TRANSIT PROGRESSION & WAYPOINTS</span>
            <span className="varka-timeline-meta">
              Updated Live via Simulated AIS Feed • {currentVoyage.waypoints.length} Route Milestones
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
                    isCurrent ? 'is-current' : isCompleted ? 'is-completed' : 'is-upcoming'
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
                      <span className="varka-node-coords">{wp.coordinates}</span>
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
    </div>
  )
}

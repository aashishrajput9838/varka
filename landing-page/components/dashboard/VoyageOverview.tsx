'use client'

import { Anchor, ArrowRight, Compass, ShieldCheck, Waves } from 'lucide-react'
import { VoyageData } from './types'

interface VoyageOverviewProps {
  voyage: VoyageData
}

export default function VoyageOverview({ voyage }: VoyageOverviewProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'IN TRANSIT':
        return 'is-transit'
      case 'AT PORT':
        return 'is-port'
      case 'DEPARTED':
        return 'is-departed'
      case 'COMPLETED':
        return 'is-completed'
      default:
        return 'is-default'
    }
  }

  return (
    <section className="varka-voyage-overview" aria-label="Voyage Overview Summary">
      <div className="varka-card-header-bar">
        <div className="varka-section-kicker-group">
          <Anchor size={14} className="varka-rust-icon" />
          <span className="varka-section-kicker">VOYAGE OVERVIEW</span>
        </div>
        <div className="varka-overview-vessel-meta">
          <span className="varka-overview-carrier">{voyage.carrier}</span>
          <span className="varka-dot-sep">•</span>
          <span className="varka-overview-imo">{voyage.imoNumber}</span>
        </div>
      </div>

      {/* Grid of elegant industrial metric cells */}
      <div className="varka-overview-grid">
        {/* Cell 1: Status */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">STATUS</span>
          <div className="varka-cell-value-wrap">
            <span className={`varka-status-pill ${getStatusClass(voyage.status)}`}>
              <span className="varka-pill-dot" />
              {voyage.status}
            </span>
          </div>
          <span className="varka-cell-footnote">Speed: {voyage.speed}</span>
        </div>

        {/* Cell 2: Origin & Departure */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">ORIGIN</span>
          <span className="varka-cell-value" title={voyage.originPort}>
            {voyage.originPort}
          </span>
          <span className="varka-cell-footnote">
            Port Code: <strong className="varka-code-pill">{voyage.originCode}</strong>
          </span>
        </div>

        {/* Cell 3: Destination & Route arrow */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">DESTINATION</span>
          <span className="varka-cell-value" title={voyage.destinationPort}>
            {voyage.destinationPort}
          </span>
          <span className="varka-cell-footnote">
            Port Code: <strong className="varka-code-pill">{voyage.destinationCode}</strong>
          </span>
        </div>

        {/* Cell 4: Vessel */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">VESSEL</span>
          <span className="varka-cell-value">{voyage.vesselName}</span>
          <span className="varka-cell-footnote">Heading: {voyage.heading}</span>
        </div>

        {/* Cell 5: ETA */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">ESTIMATED ARRIVAL (ETA)</span>
          <span className="varka-cell-value is-highlight">{voyage.eta}</span>
          <span className="varka-cell-footnote">Dep: {voyage.departureDate}</span>
        </div>

        {/* Cell 6: Cargo Details */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">CARGO SPECIFICATION</span>
          <span className="varka-cell-value">{voyage.containerCount}</span>
          <span className="varka-cell-footnote">{voyage.cargoType}</span>
        </div>

        {/* Cell 7: Position & Distance */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">CURRENT COORDINATES</span>
          <div className="varka-cell-coords-row">
            <Compass size={13} className="varka-subtle-icon" />
            <span className="varka-cell-value is-mono">{voyage.coordinates}</span>
          </div>
          <span className="varka-cell-footnote">Rem: {voyage.distanceRemaining}</span>
        </div>

        {/* Cell 8: Port & Weather Risk */}
        <div className="varka-overview-cell">
          <span className="varka-cell-label">DELAY / WEATHER RISK</span>
          <div className="varka-cell-risk-row">
            <ShieldCheck size={13} className="varka-risk-icon" />
            <span className="varka-cell-value">{voyage.riskLevel}</span>
          </div>
          <span className="varka-cell-footnote" title={voyage.riskDetail}>
            {voyage.riskDetail}
          </span>
        </div>
      </div>

      {/* Corridor Banner */}
      <div className="varka-overview-footer-bar">
        <div className="varka-corridor-route">
          <span>{voyage.originCode}</span>
          <ArrowRight size={13} className="varka-corridor-arrow" />
          <span>{voyage.currentLocation}</span>
          <ArrowRight size={13} className="varka-corridor-arrow" />
          <span>{voyage.destinationCode}</span>
        </div>
        <div className="varka-sim-badge">
          <Waves size={12} />
          <span>SIMULATED MARITIME TELEMETRY — LIVE AIS READY</span>
        </div>
      </div>
    </section>
  )
}

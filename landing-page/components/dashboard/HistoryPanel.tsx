'use client'

import { useState, useMemo } from 'react'
import {
  History,
  ArrowRight,
  Search,
  ExternalLink,
  RotateCcw,
  Inbox,
  Filter,
} from 'lucide-react'
import { HistoryItem, TrackingStatus } from './types'
import { SAMPLE_HISTORY } from './mockData'

interface HistoryPanelProps {
  onLoadVoyageInTracking: (trackingNumber: string) => void
}

export default function HistoryPanel({ onLoadVoyageInTracking }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>(SAMPLE_HISTORY)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSimulatedEmpty, setShowSimulatedEmpty] = useState(false)

  const filteredItems = useMemo(() => {
    if (showSimulatedEmpty) return []

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter

      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        item.trackingNumber.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.vessel.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q)

      return matchesStatus && matchesQuery
    })
  }, [items, statusFilter, searchQuery, showSimulatedEmpty])

  const filterTabs = [
    { id: 'ALL', label: 'ALL VOYAGES', count: items.length },
    {
      id: 'IN TRANSIT',
      label: 'IN TRANSIT',
      count: items.filter((i) => i.status === 'IN TRANSIT').length,
    },
    {
      id: 'AT PORT',
      label: 'AT PORT',
      count: items.filter((i) => i.status === 'AT PORT').length,
    },
    {
      id: 'COMPLETED',
      label: 'COMPLETED',
      count: items.filter((i) => i.status === 'COMPLETED').length,
    },
  ]

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'IN TRANSIT':
        return <span className="varka-status-pill is-transit"><span className="varka-pill-dot" />IN TRANSIT</span>
      case 'AT PORT':
        return <span className="varka-status-pill is-port"><span className="varka-pill-dot" />AT PORT</span>
      case 'COMPLETED':
        return <span className="varka-status-pill is-completed"><span className="varka-pill-dot" />COMPLETED</span>
      case 'DEPARTED':
        return <span className="varka-status-pill is-departed"><span className="varka-pill-dot" />DEPARTED</span>
      default:
        return <span className="varka-status-pill">{status}</span>
    }
  }

  return (
    <div className="varka-history-panel">
      {/* Top Filter and Search Bar */}
      <div className="varka-history-control-card">
        <div className="varka-history-top-row">
          <div className="varka-section-kicker-group">
            <History size={14} className="varka-rust-icon" />
            <span className="varka-section-kicker">RECENT VOYAGES & AUDIT TRAIL</span>
          </div>

          <div className="varka-history-actions">
            <button
              type="button"
              onClick={() => setShowSimulatedEmpty(!showSimulatedEmpty)}
              className="varka-toggle-empty-btn"
              title="Toggle empty state to preview design"
            >
              <RotateCcw size={12} />
              <span>{showSimulatedEmpty ? 'Restore Sample Records' : 'Test Empty State'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="varka-history-filters-bar">
          <div className="varka-history-tabs" role="tablist">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`varka-history-tab ${statusFilter === tab.id ? 'is-active' : ''}`}
              >
                <span>{tab.label}</span>
                <span className="varka-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="varka-history-search-wrap">
            <Search size={14} className="varka-subtle-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by port, vessel, or reference..."
              className="varka-history-search-input"
            />
          </div>
        </div>
      </div>

      {/* History Items List or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="varka-empty-state-card">
          <div className="varka-empty-icon-wrap">
            <Inbox size={32} className="varka-rust-icon" />
          </div>
          <h3 className="varka-empty-title">No tracking history found</h3>
          <p className="varka-empty-desc">
            {showSimulatedEmpty
              ? 'You are viewing the simulated empty state. Tracking records and monitored voyages will automatically appear here once tracked.'
              : `No tracked voyages matched your search query "${searchQuery}".`}
          </p>
          <div className="varka-empty-actions">
            {showSimulatedEmpty ? (
              <button
                type="button"
                onClick={() => setShowSimulatedEmpty(false)}
                className="varka-secondary-btn"
              >
                Restore Demo Voyages
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL')
                  setSearchQuery('')
                }}
                className="varka-secondary-btn"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="varka-history-list" role="list">
          {filteredItems.map((item) => (
            <article key={item.id} className="varka-history-card" role="listitem">
              <div className="varka-history-card-main">
                {/* Reference and Status */}
                <div className="varka-history-ref-row">
                  <span className="varka-history-ref">{item.trackingNumber}</span>
                  <span className="varka-dot-sep">•</span>
                  <span className="varka-history-vessel">{item.vessel}</span>
                  <div className="varka-history-status-wrap">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Route corridor */}
                <div className="varka-history-corridor-row">
                  <div className="varka-history-port">
                    <span className="varka-port-code">{item.originCode}</span>
                    <strong className="varka-port-name">{item.origin}</strong>
                  </div>

                  <div className="varka-history-arrow-wrap">
                    <span className="varka-corridor-distance">Direct Voyage</span>
                    <ArrowRight size={16} className="varka-rust-icon" />
                  </div>

                  <div className="varka-history-port is-dest">
                    <span className="varka-port-code">{item.destinationCode}</span>
                    <strong className="varka-port-name">{item.destination}</strong>
                  </div>
                </div>

                {/* Meta details */}
                <div className="varka-history-meta-row">
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">CARGO:</span>
                    <span className="varka-meta-val">{item.cargo}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">VOLUME:</span>
                    <span className="varka-meta-val">{item.volume}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">LOGGED:</span>
                    <span className="varka-meta-val">{item.date}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">ETA:</span>
                    <span className="varka-meta-val is-accent">{item.eta}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="varka-history-card-action">
                <button
                  type="button"
                  onClick={() => onLoadVoyageInTracking(item.trackingNumber)}
                  className="varka-view-voyage-btn"
                  title={`Load ${item.trackingNumber} into Tracking`}
                >
                  <span>View in Tracking</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footer notice */}
      <div className="varka-history-footer-notice">
        <span>Historical logs preserved for supply chain audits and freight tariff reconciliations.</span>
      </div>
    </div>
  )
}

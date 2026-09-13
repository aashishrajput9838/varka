'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  History,
  ArrowRight,
  Search,
  Trash2,
  Inbox,
  Ship,
} from 'lucide-react'
import { HistoryItem, TrackingStatus } from './types'

interface HistoryPanelProps {
  onLoadVoyageInTracking: (trackingNumber: string) => void
}

export default function HistoryPanel({ onLoadVoyageInTracking }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('varka_search_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
          return
        }
      }
    } catch {
      // ignore parse error
    }
    setItems([])
  }, [])

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('varka_search_history')
    } catch {
      // ignore
    }
    setItems([])
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter

      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        (item.trackingNumber && item.trackingNumber.toLowerCase().includes(q)) ||
        (item.origin && item.origin.toLowerCase().includes(q)) ||
        (item.destination && item.destination.toLowerCase().includes(q)) ||
        (item.vessel && item.vessel.toLowerCase().includes(q)) ||
        (item.cargo && item.cargo.toLowerCase().includes(q))

      return matchesStatus && matchesQuery
    })
  }, [items, statusFilter, searchQuery])

  const filterTabs = [
    { id: 'ALL', label: 'ALL INQUIRIES', count: items.length },
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
            <span className="varka-section-kicker">USER AUDIT TRAIL & RECENT INQUIRIES</span>
          </div>

          {items.length > 0 && (
            <div className="varka-history-actions">
              <button
                type="button"
                onClick={handleClearHistory}
                className="varka-toggle-empty-btn"
                title="Clear local inquiry history"
              >
                <Trash2 size={12} />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills and Search */}
        {items.length > 0 && (
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
                placeholder="Filter by MMSI, vessel, or location..."
                className="varka-history-search-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* History Items List or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="varka-empty-state-card">
          <div className="varka-empty-icon-wrap">
            <Inbox size={32} className="varka-rust-icon" />
          </div>
          <h3 className="varka-empty-title">
            {items.length === 0 ? 'No Tracking History Recorded' : 'No Matching Records Found'}
          </h3>
          <p className="varka-empty-desc">
            {items.length === 0
              ? 'Vessels and shipment references you track will automatically be recorded here in your live session audit trail.'
              : `No tracked records matched your search query "${searchQuery}".`}
          </p>
          <div className="varka-empty-actions">
            {items.length === 0 ? (
              <button
                type="button"
                onClick={() => onLoadVoyageInTracking('')}
                className="varka-secondary-btn"
              >
                <Ship size={14} style={{ marginRight: '6px' }} />
                Track Live Vessel
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
                  <span className="varka-history-ref">MMSI / REF: {item.trackingNumber}</span>
                  <span className="varka-dot-sep">•</span>
                  <span className="varka-history-vessel">{item.vessel}</span>
                  <div className="varka-history-status-wrap">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Route corridor */}
                <div className="varka-history-corridor-row">
                  <div className="varka-history-port">
                    <span className="varka-port-code">{item.originCode || 'LOC'}</span>
                    <strong className="varka-port-name">{item.origin}</strong>
                  </div>

                  <div className="varka-history-arrow-wrap">
                    <span className="varka-corridor-distance">Direct Tracking</span>
                    <ArrowRight size={16} className="varka-rust-icon" />
                  </div>

                  <div className="varka-history-port is-dest">
                    <span className="varka-port-code">{item.destinationCode || 'DEST'}</span>
                    <strong className="varka-port-name">{item.destination}</strong>
                  </div>
                </div>

                {/* Meta details */}
                <div className="varka-history-meta-row">
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">VESSEL CLASS:</span>
                    <span className="varka-meta-val">{item.cargo}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">SOURCE:</span>
                    <span className="varka-meta-val">{item.volume}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">LOGGED:</span>
                    <span className="varka-meta-val">{item.date}</span>
                  </div>
                  <div className="varka-meta-pill">
                    <span className="varka-meta-label">STATUS:</span>
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
                  title={`Track ${item.vessel}`}
                >
                  <span>Inspect Vessel</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footer notice */}
      <div className="varka-history-footer-notice">
        <span>Active user inquiries synchronized locally for real-time auditability.</span>
      </div>
    </div>
  )
}

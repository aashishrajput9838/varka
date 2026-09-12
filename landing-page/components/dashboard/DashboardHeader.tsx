'use client'

import { useMemo } from 'react'
import { NavSection, UserProfileData } from './types'

interface DashboardHeaderProps {
  activeSection: NavSection
  user: UserProfileData | null
}

export default function DashboardHeader({ activeSection, user }: DashboardHeaderProps) {
  const greeting = useMemo(() => {
    const firstName = user?.firstName ? user.firstName.toUpperCase() : 'ANALYST'
    const hour = new Date().getHours()
    let timeGreeting = 'GOOD DAY'
    if (hour < 12) timeGreeting = 'GOOD MORNING'
    else if (hour < 17) timeGreeting = 'GOOD AFTERNOON'
    else timeGreeting = 'GOOD EVENING'

    return `${timeGreeting}, ${firstName}`
  }, [user])

  const content = useMemo(() => {
    switch (activeSection) {
      case 'history':
        return {
          eyebrow: 'VOYAGE ARCHIVE & AUDIT',
          headline: (
            <>
              Tracking <em>history.</em>
            </>
          ),
          subtext:
            'Review previously monitored voyages, transit logs, and delivery milestones across your charter network.',
        }
      case 'agent':
        return {
          eyebrow: 'YOUR FREIGHT INTELLIGENCE AGENT',
          headline: (
            <>
              See the costs <em>hiding beneath</em> the quote.
            </>
          ),
          subtext:
            'Varka Agent analyzes your voyage and helps identify potential hidden costs before they become surprises.',
        }
      case 'prediction':
        return {
          eyebrow: 'DRY-BULK ML FORECAST & CHARTER TWIN',
          headline: (
            <>
              Port forecast & <em>charter intelligence.</em>
            </>
          ),
          subtext:
            'Real-time XGBoost freight forecasting, vessel feasibility gate, and berth-aligned Just-in-Time arrival planning.',
        }
      case 'tracking':
      default:
        return {
          eyebrow: greeting,
          headline: (
            <>
              Track your <em>voyage.</em>
            </>
          ),
          subtext:
            'Monitor your freight movement and uncover the information behind every shipment.',
        }
    }
  }, [activeSection, greeting])

  return (
    <header className="varka-dashboard-header">
      <div className="varka-header-text-block">
        <div className="varka-header-eyebrow-row">
          <p className="varka-eyebrow">{content.eyebrow}</p>
          <div className="varka-header-tagline-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 700, padding: '3px 8px', border: '1px solid rgba(230, 90, 47, 0.3)', background: 'rgba(230, 90, 47, 0.1)' }}>
              PREDICTION SE DECISION TAK
            </span>
            <div className="varka-system-status">
              <span className="varka-status-pulse" />
              <span className="varka-status-text">MARITIME FEED: OPERATIONAL</span>
            </div>
          </div>
        </div>

        <h1 className="varka-header-headline">{content.headline}</h1>
        <p className="varka-header-subtext">{content.subtext}</p>
      </div>
    </header>
  )
}

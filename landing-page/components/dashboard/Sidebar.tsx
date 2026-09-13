'use client'

import {
  Compass,
  History,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MessageSquareCode,
  Award,
  Gauge,
  Zap,
  SlidersHorizontal,
  Ship,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react'
import { NavSection, UserProfileData } from './types'
import UserProfile from './UserProfile'

interface SidebarProps {
  activeSection: NavSection
  onSelectSection: (section: NavSection) => void
  user: UserProfileData | null
  onLogout: () => void
  isLoggingOut: boolean
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  user,
  onLogout,
  isLoggingOut,
}: SidebarProps) {
  const navItems = [
    {
      id: 'tracking' as NavSection,
      label: 'TRACKING',
      subtitle: 'Voyage monitoring',
      icon: Compass,
      badge: 'LIVE',
    },
    {
      id: 'cockpit' as NavSection,
      label: 'CHARTER COCKPIT',
      subtitle: 'Approval & early alerts',
      icon: ShieldCheck,
      badge: 'NEW',
    },
    {
      id: 'optimizer' as NavSection,
      label: 'VESSEL OPTIMIZER',
      subtitle: 'Multi-objective ranking',
      icon: Gauge,
      badge: 'OPT',
    },
    {
      id: 'jit' as NavSection,
      label: 'JIT DIGITAL TWIN',
      subtitle: 'Slow steaming & CO₂',
      icon: Zap,
    },
    {
      id: 'prediction' as NavSection,
      label: 'PORT FORECAST',
      subtitle: 'ML rates & XAI drivers',
      icon: TrendingUp,
      badge: 'ML',
    },
    {
      id: 'scenarios' as NavSection,
      label: 'SCENARIO STUDIO',
      subtitle: 'Market stress test',
      icon: SlidersHorizontal,
    },
    {
      id: 'scorecard' as NavSection,
      label: 'PORT SCORECARD',
      subtitle: 'Indian port benchmarks',
      icon: Award,
    },
    {
      id: 'fleet' as NavSection,
      label: 'FLEET & MULTI-VOYAGE',
      subtitle: 'Rosters & multi-trip',
      icon: Ship,
    },
    {
      id: 'risk' as NavSection,
      label: 'RISK & AUDIT',
      subtitle: 'Composite risk & log',
      icon: ShieldAlert,
    },
    {
      id: 'standards' as NavSection,
      label: 'STANDARDS & DATA',
      subtitle: 'DCSA / IMO & APIs',
      icon: FileCheck2,
    },
    {
      id: 'assistant' as NavSection,
      label: 'CHARTER ASSISTANT',
      subtitle: 'Grounded AI advisory',
      icon: MessageSquareCode,
      badge: 'AI',
    },
    {
      id: 'history' as NavSection,
      label: 'HISTORY',
      subtitle: 'Previous voyages',
      icon: History,
      badge: '4',
    },
    {
      id: 'agent' as NavSection,
      label: 'AGENT',
      subtitle: 'Cost intelligence',
      icon: Sparkles,
    },
  ]

  return (
    <aside className="varka-sidebar" aria-label="Main Navigation">
      {/* Brand & Logo */}
      <div className="varka-sidebar-top">
        <div className="varka-sidebar-brand">
          <img
            src="/logo.png"
            alt="VARKA — Prediction se decision tak"
            className="varka-sidebar-logo-img"
          />
          <span className="varka-sidebar-kicker">PREDICTION SE DECISION TAK</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="varka-sidebar-nav" aria-label="Dashboard sections">
        <div className="varka-sidebar-nav-label">WORKSPACE MODULES</div>
        <ul className="varka-sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <li key={item.id} className="varka-sidebar-nav-item">
                <button
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  className={`varka-sidebar-nav-btn ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="varka-nav-indicator" aria-hidden="true" />
                  <Icon size={17} className="varka-nav-icon" />
                  <div className="varka-nav-text-group">
                    <span className="varka-nav-title">{item.label}</span>
                    <span className="varka-nav-sub">{item.subtitle}</span>
                  </div>
                  {item.badge && (
                    <span className={`varka-nav-badge ${isActive ? 'is-active-badge' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Maritime Status Indicator */}
      <div className="varka-sidebar-telemetry">
        <div className="varka-telemetry-header">
          <span className="varka-telemetry-beacon" />
          <span className="varka-telemetry-title">AIS FEED ACTIVE</span>
        </div>
        <div className="varka-telemetry-meta">
          <span>PORT SURCHARGE ENGINE</span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* User Profile & Logout at bottom */}
      <div className="varka-sidebar-footer">
        <UserProfile
          user={user}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      </div>
    </aside>
  )
}

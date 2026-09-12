'use client'

import { Compass, History, Sparkles } from 'lucide-react'
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
      badge: 'AI',
    },
  ]

  return (
    <aside className="varka-sidebar" aria-label="Main Navigation">
      {/* Brand & Logo */}
      <div className="varka-sidebar-top">
        <div className="varka-sidebar-brand">
          <img
            src="/logo.png"
            alt="VARKA — Freight Intelligence"
            className="varka-sidebar-logo-img"
          />
          <span className="varka-sidebar-kicker">FREIGHT CONTROL</span>
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

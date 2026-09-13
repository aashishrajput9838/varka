'use client'

import { useState, useEffect } from 'react'
import {
  Menu,
  X,
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
  DollarSign,
} from 'lucide-react'
import { NavSection, UserProfileData } from './types'
import UserProfile from './UserProfile'

interface MobileNavProps {
  activeSection: NavSection
  onSelectSection: (section: NavSection) => void
  user: UserProfileData | null
  onLogout: () => void
  isLoggingOut: boolean
}

export default function MobileNav({
  activeSection,
  onSelectSection,
  user,
  onLogout,
  isLoggingOut,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const navItems = [
    {
      id: 'tracking' as NavSection,
      label: 'TRACKING',
      subtitle: 'Voyage monitoring',
      icon: Compass,
    },
    {
      id: 'landed-cost' as NavSection,
      label: 'LANDED COST AGENT',
      subtitle: 'True freight & accessorials',
      icon: DollarSign,
    },
    {
      id: 'cockpit' as NavSection,
      label: 'CHARTER COCKPIT',
      subtitle: 'Approval & early alerts',
      icon: ShieldCheck,
    },
    {
      id: 'optimizer' as NavSection,
      label: 'VESSEL OPTIMIZER',
      subtitle: 'Multi-objective ranking',
      icon: Gauge,
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
    },
    {
      id: 'history' as NavSection,
      label: 'HISTORY',
      subtitle: 'Previous voyages',
      icon: History,
    },
    {
      id: 'agent' as NavSection,
      label: 'AGENT',
      subtitle: 'Cost intelligence',
      icon: Sparkles,
    },
  ]

  const handleSelect = (id: NavSection) => {
    onSelectSection(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="varka-mobile-bar" aria-label="Mobile Navigation Bar">
        <div className="varka-mobile-bar-brand">
          <img src="/logo.png" alt="VARKA" className="varka-mobile-bar-logo" />
          <span className="varka-mobile-bar-tag">{activeSection.toUpperCase()}</span>
        </div>

        <button
          type="button"
          className="varka-mobile-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Drawer Backdrop */}
      {isOpen && (
        <div
          className="varka-mobile-drawer-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <div className={`varka-mobile-drawer ${isOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true">
        <div className="varka-mobile-drawer-header">
          <div className="varka-sidebar-brand">
            <img src="/logo.png" alt="VARKA — Prediction se decision tak" className="varka-sidebar-logo-img" />
            <span className="varka-sidebar-kicker">PREDICTION SE DECISION TAK</span>
          </div>
          <button
            type="button"
            className="varka-drawer-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="varka-mobile-drawer-nav" aria-label="Mobile menu links">
          <span className="varka-sidebar-nav-label">MODULES</span>
          <ul className="varka-sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <li key={item.id} className="varka-sidebar-nav-item">
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`varka-sidebar-nav-btn ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="varka-nav-indicator" aria-hidden="true" />
                    <Icon size={18} className="varka-nav-icon" />
                    <div className="varka-nav-text-group">
                      <span className="varka-nav-title">{item.label}</span>
                      <span className="varka-nav-sub">{item.subtitle}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="varka-mobile-drawer-footer">
          <UserProfile
            user={user}
            onLogout={() => {
              setIsOpen(false)
              onLogout()
            }}
            isLoggingOut={isLoggingOut}
          />
        </div>
      </div>
    </>
  )
}

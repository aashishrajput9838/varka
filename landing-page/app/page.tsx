'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import TrackingPanel from '@/components/dashboard/TrackingPanel'
import HistoryPanel from '@/components/dashboard/HistoryPanel'
import AgentPanel from '@/components/dashboard/AgentPanel'
import PortPredictionPanel from '@/components/dashboard/PortPredictionPanel'
import { NavSection, UserProfileData, VoyageData } from '@/components/dashboard/types'
import { DEMO_VOYAGES } from '@/components/dashboard/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'

export default function AuthenticatedDashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null)
  const [isValidatingSession, setIsValidatingSession] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>('tracking')
  const [currentVoyage, setCurrentVoyage] = useState<VoyageData>(
    DEMO_VOYAGES['VRK-9021-IN']
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Validate authenticated session with backend on mount
  useEffect(() => {
    let isMounted = true

    const validateSession = async () => {
      try {
        const storedToken = localStorage.getItem('varka_token')

        // Build headers
        const headers: Record<string, string> = {}
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`
        }

        // Validate session with backend /api/v1/user/me
        const res = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (!isMounted) return

        if (res.ok) {
          const data = await res.json()
          if (data.data?.user) {
            setCurrentUser(data.data.user)
            localStorage.setItem('varka_user', JSON.stringify(data.data.user))
            setIsValidatingSession(false)
            return
          }
        }

        // If backend returns unauthorized or no user:
        localStorage.removeItem('varka_token')
        localStorage.removeItem('varka_user')
        setCurrentUser(null)
        router.replace('/signin')
      } catch (err) {
        console.warn('Authentication verification error:', err)
        // Redirect to signin on verification failure
        if (isMounted) {
          localStorage.removeItem('varka_token')
          localStorage.removeItem('varka_user')
          router.replace('/signin')
        }
      }
    }

    validateSession()

    return () => {
      isMounted = false
    }
  }, [router])

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch(`${API_BASE_URL}/api/v1/user/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.warn('Backend logout warning:', err)
    } finally {
      localStorage.removeItem('varka_token')
      localStorage.removeItem('varka_user')
      setCurrentUser(null)
      router.replace('/signin')
    }
  }

  // Loading Splash Screen while checking auth with backend
  if (isValidatingSession) {
    return (
      <div className="varka-loading-screen" role="status" aria-label="Loading Varka Freight Intelligence">
        <div className="varka-loading-glow" aria-hidden="true" />
        <div className="varka-loading-content">
          <img
            src="/logo.png"
            alt="VARKA"
            className="varka-loading-logo"
          />
          <div className="varka-loading-bar-wrap">
            <div className="varka-loading-bar-fill" />
          </div>
          <span className="varka-loading-text">
            VALIDATING MARITIME FREIGHT WORKSPACE...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="varka-dashboard-layout">
      {/* Background ambient lighting for dashboard */}
      <div className="varka-dashboard-glow" aria-hidden="true" />

      {/* Desktop Fixed Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        user={currentUser}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Mobile & Tablet Header with Drawer */}
      <MobileNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        user={currentUser}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Main Workspace Area */}
      <main className="varka-main-workspace" id="main-content">
        <div className="varka-workspace-container">
          {/* Header with Contextual Greeting and Status */}
          <DashboardHeader activeSection={activeSection} user={currentUser} />

          {/* Active Section Content */}
          <div className="varka-section-content-wrapper">
            {activeSection === 'tracking' && (
              <TrackingPanel
                currentVoyage={currentVoyage}
                onVoyageChange={setCurrentVoyage}
              />
            )}

            {activeSection === 'history' && (
              <HistoryPanel
                onLoadVoyageInTracking={(ref) => {
                  if (DEMO_VOYAGES[ref]) {
                    setCurrentVoyage(DEMO_VOYAGES[ref])
                  }
                  setActiveSection('tracking')
                }}
              />
            )}

            {activeSection === 'agent' && <AgentPanel />}

            {(activeSection === 'prediction' ||
              activeSection === 'cockpit' ||
              activeSection === 'assistant' ||
              activeSection === 'scorecard' ||
              activeSection === 'optimizer' ||
              activeSection === 'jit' ||
              activeSection === 'scenarios' ||
              activeSection === 'fleet' ||
              activeSection === 'risk' ||
              activeSection === 'standards') && (
              <PortPredictionPanel
                activeSection={activeSection}
                onSelectSection={setActiveSection}
              />
            )}
          </div>

          {/* Footer note */}
          <footer className="varka-dashboard-footer">
            <div className="varka-footer-meta">
              <span>VARKA FREIGHT INTELLIGENCE • PREDICTION SE DECISION TAK</span>
              <span>© 2026 VARKA PLATFORM</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

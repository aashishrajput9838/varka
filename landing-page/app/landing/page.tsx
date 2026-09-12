'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Solution', href: '#solution' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About Us', href: '#about' },
]

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>
}

export default function MarketingLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName?: string; avatar?: string } | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('varka_token')
        const headers: Record<string, string> = {}
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'
        const res = await fetch(`${apiBaseUrl}/api/v1/user/me`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data.data?.user) {
            setCurrentUser(data.data.user)
            return
          }
        }
        setCurrentUser(null)
      } catch {
        setCurrentUser(null)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const onScroll = () => document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }
  }, [])

  return (
    <main className="site-shell">
      <div className="video-background" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="video-bg-media"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay" />
      </div>

      <header className="site-header">
        <a className="brand-logo-link" href="#top" aria-label="Varka home">
          <img src="/logo.png" alt="VARKA — Navigate Smarter" className="brand-logo-img" />
        </a>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          {navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          {currentUser ? (
            <Link className="nav-contact" href="/" onClick={() => setMenuOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {currentUser.avatar && !avatarError ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.firstName}
                  onError={() => setAvatarError(true)}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--rust)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--rust)', color: 'var(--ink)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'V'}
                </div>
              )}
              <span>DASHBOARD ({currentUser.firstName.toUpperCase()})</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : (
            <Link className="nav-contact" href="/signin" onClick={() => setMenuOpen(false)}>
              OPTIMIZE YOUR VOYAGE <ArrowUpRight size={14} />
            </Link>
          )}
        </nav>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">INTELLIGENT FREIGHT FORECASTING</p>
          <h1>Make every<br />voyage <em>smarter.</em></h1>
          <p className="hero-intro">We turn freight volatility, port congestion, and vessel constraints into smarter logistics decisions.</p>
          <a className="circle-link" href="#solution" aria-label="Explore the solution"><span>Explore<br />the solution</span><ArrowDown size={18} /></a>
        </div>
        <div className="hero-meta"><span>01—04</span><span>EAST COAST INDIA / GLOBAL TRADE</span></div>
      </section>

      <section className="statement" id="about">
        <Reveal><p className="section-kicker">WHAT WE SOLVE</p></Reveal>
        <Reveal className="statement-content"><h2>There is a <em>cost</em><br />behind every voyage.</h2><p>Varka is an intelligent freight decision engine for bulk cargo procurement. We turn volatile freight rates, vessel constraints, and port risks into smarter chartering decisions.</p></Reveal>
      </section>

      <section className="process" id="how-it-works" key="how-it-works-section">
        <div className="process-intro">
          <p className="section-kicker">HOW VARKA WORKS</p>
          <h2>
            Less manual work.<br />
            <em>More control.</em>
          </h2>
        </div>
        <ol className="process-list">
          <li key="step-1">
            <span>01</span>
            <div>
              <h3>Connect everything</h3>
              <p>Bring your devices, systems, and data together in one connected environment.</p>
            </div>
          </li>
          <li key="step-2">
            <span>02</span>
            <div>
              <h3>Monitor in real time</h3>
              <p>Track what matters through centralized monitoring, live visibility, and intelligent insights.</p>
            </div>
          </li>
          <li key="step-3">
            <span>03</span>
            <div>
              <h3>Act with confidence</h3>
              <p>Identify issues faster, make informed decisions, and respond before small problems become bigger ones.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="contact" id="contact">
        <p className="section-kicker">→ PLAN YOUR NEXT SHIPMENT?</p>
        <h2>
          Make smarter<br />
          <em>freight decisions.</em>
        </h2>
        <a className="contact-link" href="mailto:varka@gmail.com">
          varka@gmail.com <ArrowUpRight size={24} />
        </a>
        <div className="contact-footer">
          <div className="contact-footer-brand">
            <img src="/logo.png" alt="Varka logo" className="footer-logo-img" />
            <span>© 2026 Varka</span>
          </div>
          <a
            href="https://www.instagram.com/hellovarka"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-link"
          >
            Instagram ↗
          </a>
        </div>
      </section>
    </main>
  )
}

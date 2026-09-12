'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Solution', href: '#solution' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About Us', href: '#about' },
]

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Varka home">VARKA</a>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          {navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <a className="nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>OPTIMIZE YOUR VOYAGE <ArrowUpRight size={14} /></a>
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
        <div className="hero-art" aria-label="Abstract orange ribbon sculpture" role="img">
          <div className="orb orb-one" /><div className="orb orb-two" /><div className="ribbon" /><div className="ribbon ribbon-small" />
          <span className="art-caption">A study in<br />optimization / 01</span>
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
          <span>© 2026 Varka</span>
          <span>Instagram ↗</span>
        </div>
      </section>
    </main>
  )
}

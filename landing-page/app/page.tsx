'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Menu, X } from 'lucide-react'

const navItems = ['Work', 'Process', 'About']

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
        <a className="wordmark" href="#top" aria-label="Form and Figure home">FORM<span>/</span>FIGURE</a>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          {navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
          <a className="nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>Start a project <ArrowUpRight size={14} /></a>
        </nav>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Independent image makers / est. 2018</p>
          <h1>Make the<br /><em>unseen</em> visible.</h1>
          <p className="hero-intro">We turn the quiet, complicated, and deeply personal into images that stay with you.</p>
          <a className="circle-link" href="#work" aria-label="Explore selected work"><span>Explore<br />the work</span><ArrowDown size={18} /></a>
        </div>
        <div className="hero-art" aria-label="Abstract orange ribbon sculpture" role="img">
          <div className="orb orb-one" /><div className="orb orb-two" /><div className="ribbon" /><div className="ribbon ribbon-small" />
          <span className="art-caption">A study in<br />becoming / 01</span>
        </div>
        <div className="hero-meta"><span>01—04</span><span>New York / Everywhere</span></div>
      </section>

      <section className="statement" id="about">
        <Reveal><p className="section-kicker">What we believe</p></Reveal>
        <Reveal className="statement-content"><h2>There is a <em>world</em><br />inside every face.</h2><p>Form/Figure is a portrait studio for people, brands, and ideas in the middle of becoming. We work with light, gesture, color, and a little bit of the unknown.</p></Reveal>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading"><Reveal><p className="section-kicker">Selected work</p></Reveal><Reveal><p className="section-note">Portraits / Campaigns / Moving image</p></Reveal></div>
        <div className="work-grid">
          <Reveal className="project project-tall"><div className="image-wrap"><img src="/portrait-one.png" alt="Portrait lit in warm terracotta light" /></div><div className="project-info"><span>01 / Asha, 2024</span><span>Personal portrait</span></div></Reveal>
          <Reveal className="project project-wide"><div className="image-wrap"><img src="/portrait-two.png" alt="Profile portrait behind amber glass" /></div><div className="project-info"><span>02 / In the amber room</span><span>Editorial</span></div></Reveal>
          <Reveal className="project project-black"><div className="image-wrap"><img src="/portrait-three.png" alt="High contrast black and white portrait" /></div><div className="project-info"><span>03 / New rituals</span><span>Campaign</span></div></Reveal>
        </div>
      </section>

      <section className="process" id="process">
        <div className="process-intro"><p className="section-kicker">Our process</p><h2>Less direction.<br /><em>More discovery.</em></h2></div>
        <ol className="process-list"><li><span>01</span><div><h3>Listen first</h3><p>Every image starts with a conversation. We make room for the real story.</p></div></li><li><span>02</span><div><h3>Find the feeling</h3><p>We build a visual language from instinct, texture, movement, and light.</p></div></li><li><span>03</span><div><h3>Leave a trace</h3><p>The final frame should feel less like a picture, more like a memory.</p></div></li></ol>
      </section>

      <section className="contact" id="contact"><p className="section-kicker">Have something in mind?</p><h2>Let&apos;s make<br /><em>something felt.</em></h2><a className="contact-link" href="mailto:hello@formfigure.studio">hello@formfigure.studio <ArrowUpRight size={24} /></a><div className="contact-footer"><span>© 2024 Form/Figure</span><span>Instagram ↗ &nbsp; Are.na ↗</span></div></section>
    </main>
  )
}

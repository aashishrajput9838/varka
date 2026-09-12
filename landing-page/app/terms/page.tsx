import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { termsOfService } from '../legal-content'

export const metadata = {
  title: 'Terms of Service — VARKA',
  description: 'Terms of Service governing access to and use of the VARKA freight forecasting and decision engine.',
}

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="brand-logo-link" aria-label="Varka home">
          <img src="/logo.png" alt="VARKA — Navigate Smarter" className="brand-logo-img" />
        </Link>
        <div className="legal-header-links">
          <Link href="/privacy" className="legal-nav-link">
            Privacy Policy <ArrowUpRight size={13} />
          </Link>
          <Link href="/signin" className="signin-back-link">
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-article">
          <div className="legal-kicker">LEGAL & COMPLIANCE</div>
          <h1 className="legal-title">{termsOfService.title}</h1>
          <p className="legal-date">Last updated: {termsOfService.lastUpdated}</p>

          <p className="legal-intro">{termsOfService.intro}</p>

          <div className="legal-sections">
            {termsOfService.sections.map((sec) => (
              <section key={sec.num} className="legal-section">
                <h2 className="legal-section-title">
                  <span>{sec.num}.</span> {sec.title}
                </h2>
                <div className="legal-section-body">
                  {sec.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="legal-footer-box">
            <p>
              Questions about these Terms? Reach out through our official support channel at{' '}
              <a href="mailto:varka@gmail.com" className="legal-contact-link">
                varka@gmail.com
              </a>
              .
            </p>
          </div>
        </article>
      </main>

      <footer className="legal-page-footer">
        <span>© 2026 Varka. All rights reserved.</span>
        <div className="legal-page-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/signin">Sign In</Link>
          <Link href="/">Overview</Link>
        </div>
      </footer>
    </div>
  )
}

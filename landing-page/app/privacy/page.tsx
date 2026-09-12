import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { privacyPolicy } from '../legal-content'

export const metadata = {
  title: 'Privacy Policy — VARKA',
  description: 'Privacy Policy for the VARKA freight decision platform and services.',
}

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="brand-logo-link" aria-label="Varka home">
          <img src="/logo.png" alt="VARKA — Prediction se decision tak" className="brand-logo-img" />
        </Link>
        <div className="legal-header-links">
          <Link href="/terms" className="legal-nav-link">
            Terms of Service <ArrowUpRight size={13} />
          </Link>
          <Link href="/signin" className="signin-back-link">
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-article">
          <div className="legal-kicker">DATA PROTECTION & PRIVACY</div>
          <h1 className="legal-title">{privacyPolicy.title}</h1>
          <p className="legal-date">Last updated: {privacyPolicy.lastUpdated}</p>

          <p className="legal-intro">{privacyPolicy.intro}</p>

          <div className="legal-sections">
            {privacyPolicy.sections.map((sec) => (
              <section key={sec.num} className="legal-section">
                <h2 className="legal-section-title">
                  <span>{sec.num}.</span> {sec.title}
                </h2>
                <div className="legal-section-body">
                  {sec.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                  {sec.bullets && (
                    <ul className="legal-bullet-list">
                      {sec.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="legal-footer-box">
            <p>
              If you have any questions regarding this Privacy Policy or your data, please contact us at{' '}
              <a href="mailto:varka@gmail.com" className="legal-contact-link">
                varka@gmail.com
              </a>
              .
            </p>
          </div>
        </article>
      </main>

      <footer className="legal-page-footer">
        <span>© 2026 Varka — Prediction se decision tak. All rights reserved.</span>
        <div className="legal-page-footer-links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/signin">Sign In</Link>
          <Link href="/">Overview</Link>
        </div>
      </footer>
    </div>
  )
}

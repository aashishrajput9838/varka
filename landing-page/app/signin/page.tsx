'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react'
import { termsOfService, privacyPolicy } from '../legal-content'

export default function SignInPage({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  
  // Sign in state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  
  // Sign up state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMessage('Signing in...')
    }, 600)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMessage('Account created successfully! Redirecting...')
    }, 600)
  }

  return (
    <div className="signin-page">
      {/* Background ambient lighting */}
      <div className="signin-glow" aria-hidden="true" />

      {/* Header */}
      <header className="signin-header">
        <Link href="/" className="brand-logo-link" aria-label="Varka home">
          <img src="/logo.png" alt="VARKA — Navigate Smarter" className="brand-logo-img" />
        </Link>
        <Link href="/" className="signin-back-link">
          <ArrowLeft size={15} />
          <span>Back to overview</span>
        </Link>
      </header>

      {/* Main container */}
      <main className="signin-container">
        <div className="signin-card">
          {/* Segmented Auth Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-tab ${mode === 'signin' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('signin')
                setSuccessMessage('')
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('signup')
                setSuccessMessage('')
              }}
            >
              Sign Up
            </button>
          </div>

          {successMessage && (
            <div className="auth-feedback-banner">
              {successMessage}
            </div>
          )}

          {mode === 'signin' ? (
            /* --- SIGN IN FORM --- */
            <>
              <div className="signin-kicker">INTELLIGENT FREIGHT ENGINE</div>
              <h1 className="signin-title">Sign in to Varka</h1>
              <p className="signin-subtitle">
                Access real-time voyage optimization, freight forecasting, and vessel analytics.
              </p>

              <form onSubmit={handleSignIn} className="signin-form">
                <div className="form-group">
                  <label htmlFor="signin-email" className="form-label">
                    Work Email
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="signin-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="analyst@freightco.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="signin-password" className="form-label">
                      Password
                    </label>
                    <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-row-remember">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="signin-submit-btn">
                  <span>{isSubmitting ? 'Verifying...' : 'Sign in to Dashboard'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="signin-footer">
                <span>Don&apos;t have an account yet?</span>{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="auth-switch-btn"
                >
                  Create an account
                </button>
              </div>
            </>
          ) : (
            /* --- SIGN UP FORM --- */
            <>
              <div className="signin-kicker">GET STARTED WITH VARKA</div>
              <h1 className="signin-title">Create your account</h1>
              <p className="signin-subtitle">
                Join forward-thinking freight teams optimizing chartering decisions globally.
              </p>

              <form onSubmit={handleSignUp} className="signin-form">
                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="signup-firstname" className="form-label">
                      First Name
                    </label>
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" />
                      <input
                        id="signup-firstname"
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-lastname" className="form-label">
                      Last Name
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="signup-lastname"
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email" className="form-label">
                    Work Email
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="analyst@freightco.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="signup-password" className="form-label">
                      Create Password
                    </label>
                    <span className="password-hint">Min. 8 characters</span>
                  </div>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-row-remember">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>
                      I agree to VARKA&apos;s{' '}
                      <button
                        type="button"
                        className="legal-link"
                        onClick={() => setLegalModal('terms')}
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        className="legal-link"
                        onClick={() => setLegalModal('privacy')}
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="signin-submit-btn">
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Varka Account'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="signin-footer">
                <span>Already have an account?</span>{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="auth-switch-btn"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

        <div className="signin-legal">
          <span>Enterprise-grade security</span>
          <span>•</span>
          <span>256-bit encryption</span>
          <span>•</span>
          <span>SOC 2 Type II compliant</span>
        </div>
      </main>

      {/* Interactive Modal Dialog for Terms of Service and Privacy Policy */}
      {legalModal && (
        <div
          className="modal-backdrop"
          onClick={() => setLegalModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="legal-kicker">
                  {legalModal === 'terms' ? 'LEGAL & COMPLIANCE' : 'DATA PROTECTION & PRIVACY'}
                </div>
                <h2 className="modal-title">
                  {legalModal === 'terms' ? termsOfService.title : privacyPolicy.title}
                </h2>
                <p className="modal-subtitle">
                  Last updated: {legalModal === 'terms' ? termsOfService.lastUpdated : privacyPolicy.lastUpdated}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setLegalModal(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-intro">
                {legalModal === 'terms' ? termsOfService.intro : privacyPolicy.intro}
              </p>

              {(legalModal === 'terms' ? termsOfService.sections : privacyPolicy.sections).map((sec) => (
                <div key={sec.num} className="modal-section">
                  <h3 className="modal-section-title">
                    <span>{sec.num}.</span> {sec.title}
                  </h3>
                  <div className="modal-section-content">
                    {sec.content.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {'bullets' in sec && sec.bullets && (
                      <ul className="legal-bullet-list">
                        {sec.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <Link
                href={legalModal === 'terms' ? '/terms' : '/privacy'}
                target="_blank"
                className="modal-open-page-link"
              >
                <span>Open as dedicated page</span>
                <ExternalLink size={13} />
              </Link>
              <button
                type="button"
                className="modal-action-btn"
                onClick={() => setLegalModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

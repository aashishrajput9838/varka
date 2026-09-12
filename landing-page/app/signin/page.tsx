'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  X,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { termsOfService, privacyPolicy } from '../legal-content'

type AuthMode = 'signin' | 'signup' | 'verify-otp' | 'forgot' | 'reset-password'
type Gender = 'male' | 'female' | 'other'

export interface AuthUser {
  id: string
  firstName: string
  lastName?: string
  email: string
  gender?: string
  avatar?: string
  isEmailVerified?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/

export default function SignInPage({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)

  // Authenticated user session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Sign up state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [phone, setPhone] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // OTP verification state
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isResending, setIsResending] = useState(false)

  // Forgot password & reset state
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [confirmResetPassword, setConfirmResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)
  const [avatarError, setAvatarError] = useState(false)

  const clearFeedback = () => {
    setFormError('')
    setSuccessMessage('')
  }

  // Check for existing authenticated session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('varka_user')
        const storedToken = localStorage.getItem('varka_token')

        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser))
          } catch {
            // invalid JSON
          }
        }

        // Validate session with backend /api/v1/user/me
        const headers: Record<string, string> = {}
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data.data?.user) {
            setCurrentUser(data.data.user)
            localStorage.setItem('varka_user', JSON.stringify(data.data.user))
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('varka_user')
          localStorage.removeItem('varka_token')
          setCurrentUser(null)
        }
      } catch (err) {
        console.warn('Could not verify session with backend:', err)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = signUpEmail.trim().toLowerCase()

    if (!trimmedFirst) {
      setFormError('First name is required.')
      return
    }
    if (trimmedFirst.length > 50) {
      setFormError('First name cannot exceed 50 characters.')
      return
    }
    if (trimmedLast.length > 50) {
      setFormError('Last name cannot exceed 50 characters.')
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    if (!gender) {
      setFormError('Gender is required.')
      return
    }
    if (!agreeTerms) {
      setFormError("Please accept VARKA's Terms of Service and Privacy Policy.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast || undefined,
          email: trimmedEmail,
          password: signUpPassword,
          gender: gender as Gender,
          phone: phone.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setVerificationEmail(trimmedEmail)
        setMode('verify-otp')
        setOtp('')
        setSuccessMessage(data.message || 'Verification code sent. Please check your inbox.')
      } else {
        setFormError(data.message || 'Registration failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Registration network error:', err)
      setFormError('Unable to connect to Varka backend server. Please verify the service is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    const trimmedOtp = otp.trim()
    if (!trimmedOtp) {
      setFormError('Please enter the 6-digit verification code.')
      return
    }
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setFormError('Verification code must be exactly 6 digits.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: verificationEmail,
          otp: trimmedOtp,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        const token = data.accessToken || data.data?.accessToken
        const user = data.data?.user

        if (token) {
          localStorage.setItem('varka_token', token)
        }
        if (user) {
          localStorage.setItem('varka_user', JSON.stringify(user))
          setCurrentUser(user)
        }

        setSuccessMessage('Registration verified! Redirecting to Varka...')
        setTimeout(() => {
          router.push('/')
        }, 800)
      } else {
        setFormError(data.message || 'Invalid or expired OTP. Please try again.')
      }
    } catch (err: any) {
      console.error('OTP verification network error:', err)
      setFormError('Network error during verification. Please check backend connectivity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!verificationEmail) return
    clearFeedback()
    setIsResending(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/register/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verificationEmail }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setSuccessMessage('A fresh 6-digit verification code has been dispatched.')
      } else {
        setFormError(data.message || 'Failed to resend code. Please try again.')
      }
    } catch (err: any) {
      setFormError('Network error while requesting new OTP.')
    } finally {
      setIsResending(false)
    }
  }

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    const trimmedEmail = signInEmail.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }

    if (!signInPassword || signInPassword.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: trimmedEmail,
          password: signInPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.status === 403 && data.requiresVerification) {
        setVerificationEmail(trimmedEmail)
        setMode('verify-otp')
        setOtp('')
        setFormError('Please verify your email before signing in. A new OTP has been dispatched.')
        return
      }

      if (res.ok && data.success) {
        const token = data.accessToken || data.data?.accessToken
        const user = data.data?.user

        if (token) {
          localStorage.setItem('varka_token', token)
        }
        if (user) {
          localStorage.setItem('varka_user', JSON.stringify(user))
          setCurrentUser(user)
        }

        setSuccessMessage('Signing in to Varka Freight Engine...')
        setTimeout(() => {
          router.push('/')
        }, 800)
      } else {
        setFormError(data.message || 'Invalid email or password.')
      }
    } catch (err: any) {
      console.error('Sign-in network error:', err)
      setFormError('Unable to connect to Varka backend server. Please verify backend is running on port 3030.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    clearFeedback()
    setIsSubmitting(true)

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
      setMode('signin')
      setIsSubmitting(false)
      setSuccessMessage('Logged out successfully.')
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    const trimmedEmail = forgotEmail.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setVerificationEmail(trimmedEmail)
        setMode('reset-password')
        setOtp('')
        setResetNewPassword('')
        setConfirmResetPassword('')
        setSuccessMessage('A 6-digit password reset verification code has been dispatched.')
      } else {
        setFormError(data.message || 'Failed to request password reset. Please try again.')
      }
    } catch (err: any) {
      console.error('Forgot password network error:', err)
      setFormError('Unable to connect to Varka backend server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    const trimmedOtp = otp.trim()
    if (!trimmedOtp) {
      setFormError('Please enter the 6-digit recovery code.')
      return
    }
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setFormError('Verification code must be exactly 6 digits.')
      return
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setFormError('New password must be at least 6 characters.')
      return
    }
    if (resetNewPassword !== confirmResetPassword) {
      setFormError('Passwords do not match. Please re-enter.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: verificationEmail,
          otp: trimmedOtp,
          newPassword: resetNewPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        const token = data.accessToken || data.data?.accessToken
        const user = data.data?.user

        if (token) {
          localStorage.setItem('varka_token', token)
        }
        if (user) {
          localStorage.setItem('varka_user', JSON.stringify(user))
          setCurrentUser(user)
        }

        setSuccessMessage('Password updated successfully! Redirecting to Varka...')
        setTimeout(() => {
          router.push('/')
        }, 800)
      } else {
        setFormError(data.message || 'Failed to reset password. Please check your verification code.')
      }
    } catch (err: any) {
      console.error('Reset password network error:', err)
      setFormError('Network error while resetting password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Optional Google SSO action
  const handleGoogleSignIn = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      setFormError('Google SSO is available. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment to connect your enterprise domain.')
      return
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`)
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`
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
        <Link href="/landing" className="signin-back-link">
          <ArrowLeft size={15} />
          <span>Back to overview</span>
        </Link>
      </header>

      {/* Main container */}
      <main className="signin-container">
        <div className="signin-card">
          {/* ================= ACTIVE SESSION VIEW ================= */}
          {!isCheckingSession && currentUser ? (
            <div className="active-session-card">
              <div className="signin-kicker">AUTHENTICATED SESSION</div>
              <div className="active-avatar-wrap">
                {currentUser.avatar && !avatarError ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.firstName}
                    className="active-avatar-img"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="active-avatar-fallback">
                    {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'V'}
                  </div>
                )}
              </div>

              <h1 className="active-user-name">
                {currentUser.firstName} {currentUser.lastName || ''}
              </h1>
              <p className="active-user-email">{currentUser.email}</p>

              <div className="active-status-badge">
                <span className="active-status-dot" />
                <span>Active Session — Verified</span>
              </div>

              {/* Feedback banners */}
              {successMessage && (
                <div className="auth-feedback-banner" role="status" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={15} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="active-session-actions">
                <Link href="/" className="session-primary-btn">
                  <span>Return to Home Platform</span>
                  <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  className="session-logout-btn"
                >
                  <LogOut size={15} />
                  <span>{isSubmitting ? 'Logging Out...' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Segmented Auth Tabs (visible in Sign In and Sign Up modes) */}
              {mode !== 'forgot' && mode !== 'verify-otp' && mode !== 'reset-password' && (
                <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'signin'}
                    className={`auth-tab ${mode === 'signin' ? 'is-active' : ''}`}
                    onClick={() => {
                      setMode('signin')
                      clearFeedback()
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
                      clearFeedback()
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Feedback & Error Banners */}
              {formError && (
                <div className="auth-error-banner" role="alert">
                  {formError}
                </div>
              )}
              {successMessage && (
                <div className="auth-feedback-banner" role="status">
                  <CheckCircle2 size={15} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ================= SIGN IN MODE ================= */}
              {mode === 'signin' && (
                <>
                  <div className="signin-kicker">INTELLIGENT FREIGHT ENGINE</div>
                  <h1 className="signin-title">Sign in to Varka</h1>
                  <p className="signin-subtitle">
                    Access real-time voyage optimization, freight forecasting, and vessel analytics.
                  </p>

                  <form onSubmit={handleSignIn} className="signin-form" noValidate>
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
                          onChange={(e) => {
                            setSignInEmail(e.target.value)
                            if (formError) setFormError('')
                          }}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="label-row">
                        <label htmlFor="signin-password" className="form-label">
                          Password
                        </label>
                        <button
                          type="button"
                          className="forgot-link-btn"
                          onClick={() => {
                            setMode('forgot')
                            clearFeedback()
                            setForgotEmail(signInEmail)
                          }}
                        >
                          Forgot password?
                        </button>
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
                          onChange={(e) => {
                            setSignInPassword(e.target.value)
                            if (formError) setFormError('')
                          }}
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
                      <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign in to Dashboard'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  {/* Social SSO Divider */}
                  <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                  </div>

                  <button
                    type="button"
                    className="google-sso-btn"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  <div className="signin-footer">
                    <span>Don&apos;t have an account yet?</span>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup')
                        clearFeedback()
                      }}
                      className="auth-switch-btn"
                    >
                      Create an account
                    </button>
                  </div>
                </>
              )}

              {/* ================= SIGN UP MODE ================= */}
              {mode === 'signup' && (
                <>
                  <div className="signin-kicker">GET STARTED WITH VARKA</div>
                  <h1 className="signin-title">Create your account</h1>
                  <p className="signin-subtitle">
                    Join forward-thinking freight teams optimizing chartering decisions globally.
                  </p>

                  <form onSubmit={handleSignUp} className="signin-form" noValidate>
                    {/* Names */}
                    <div className="form-row-two">
                      <div className="form-group">
                        <label htmlFor="signup-firstname" className="form-label">
                          First Name <span className="field-required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <User size={16} className="input-icon" />
                          <input
                            id="signup-firstname"
                            type="text"
                            required
                            maxLength={50}
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value)
                              if (formError) setFormError('')
                            }}
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
                            maxLength={50}
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '16px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Work Email */}
                    <div className="form-group">
                      <label htmlFor="signup-email" className="form-label">
                        Work Email <span className="field-required">*</span>
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
                          onChange={(e) => {
                            setSignUpEmail(e.target.value)
                            if (formError) setFormError('')
                          }}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                      <div className="label-row">
                        <label htmlFor="signup-password" className="form-label">
                          Create Password <span className="field-required">*</span>
                        </label>
                        <span className="password-hint">Min. 6 characters</span>
                      </div>
                      <div className="input-wrapper">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          placeholder="••••••••••••"
                          value={signUpPassword}
                          onChange={(e) => {
                            setSignUpPassword(e.target.value)
                            if (formError) setFormError('')
                          }}
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

                    {/* Gender */}
                    <div className="form-group">
                      <label className="form-label">
                        Gender <span className="field-required">*</span>
                      </label>
                      <div className="gender-select-wrapper" role="radiogroup" aria-label="Gender selection">
                        {(['male', 'female', 'other'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={gender === g}
                            className={`gender-chip ${gender === g ? 'is-selected' : ''}`}
                            onClick={() => {
                              setGender(g)
                              if (formError) setFormError('')
                            }}
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                      <div className="label-row">
                        <label htmlFor="signup-phone" className="form-label">
                          Phone Number
                        </label>
                        <span className="password-hint">Optional</span>
                      </div>
                      <div className="input-wrapper">
                        <Phone size={16} className="input-icon" />
                        <input
                          id="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="form-row-remember">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          required
                          checked={agreeTerms}
                          onChange={(e) => {
                            setAgreeTerms(e.target.checked)
                            if (formError) setFormError('')
                          }}
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

                  {/* Social SSO Divider */}
                  <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                  </div>

                  <button
                    type="button"
                    className="google-sso-btn"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  <div className="signin-footer">
                    <span>Already have an account?</span>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        clearFeedback()
                      }}
                      className="auth-switch-btn"
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}

              {/* ================= OTP VERIFICATION MODE ================= */}
              {mode === 'verify-otp' && (
                <>
                  <div className="signin-kicker">TWO-FACTOR VERIFICATION</div>
                  <h1 className="signin-title">Verify Your Email</h1>
                  <p className="signin-subtitle">
                    We have dispatched a 6-digit verification code to{' '}
                    <strong style={{ color: 'var(--cream)' }}>{verificationEmail}</strong>. Enter the code below to complete registration.
                  </p>

                  <form onSubmit={handleVerifyOtp} className="signin-form" noValidate>
                    <div className="form-group">
                      <label htmlFor="verification-otp" className="form-label">
                        6-Digit Verification Code
                      </label>
                      <input
                        id="verification-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setOtp(val)
                          if (formError) setFormError('')
                        }}
                        className="otp-input-field"
                      />
                    </div>

                    <div className="otp-actions-row">
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        Didn&apos;t receive a code?
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending || isSubmitting}
                        className="otp-resend-btn"
                      >
                        {isResending ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otp.length !== 6}
                      className="signin-submit-btn"
                    >
                      <ShieldCheck size={16} />
                      <span>{isSubmitting ? 'Verifying Code...' : 'Verify Code & Complete'}</span>
                    </button>
                  </form>

                  <div className="signin-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        clearFeedback()
                      }}
                      className="auth-switch-btn"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              )}

              {/* ================= FORGOT PASSWORD MODE ================= */}
              {mode === 'forgot' && (
                <>
                  <div className="signin-kicker">ACCOUNT RECOVERY</div>
                  <h1 className="signin-title">Reset your password</h1>
                  <p className="signin-subtitle">
                    Enter your registered work email and we&apos;ll dispatch a 6-digit recovery code to reset your account credentials.
                  </p>

                  <form onSubmit={handleForgotPassword} className="signin-form" noValidate>
                    <div className="form-group">
                      <label htmlFor="forgot-email" className="form-label">
                        Registered Email <span className="field-required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <Mail size={16} className="input-icon" />
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="analyst@freightco.com"
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value)
                            if (formError) setFormError('')
                          }}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="signin-submit-btn">
                      <KeyRound size={15} />
                      <span>{isSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
                    </button>
                  </form>

                  <div className="signin-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        clearFeedback()
                      }}
                      className="auth-switch-btn"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              )}

              {/* ================= RESET PASSWORD MODE ================= */}
              {mode === 'reset-password' && (
                <>
                  <div className="signin-kicker">NEW CREDENTIALS</div>
                  <h1 className="signin-title">Set new password</h1>
                  <p className="signin-subtitle">
                    Enter the 6-digit recovery code sent to{' '}
                    <strong style={{ color: 'var(--cream)' }}>{verificationEmail}</strong> and choose a new secure password.
                  </p>

                  <form onSubmit={handleResetPassword} className="signin-form" noValidate>
                    <div className="form-group">
                      <label htmlFor="reset-otp" className="form-label">
                        6-Digit Recovery Code <span className="field-required">*</span>
                      </label>
                      <input
                        id="reset-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setOtp(val)
                          if (formError) setFormError('')
                        }}
                        className="otp-input-field"
                      />
                    </div>

                    <div className="form-group">
                      <div className="label-row">
                        <label htmlFor="reset-password-input" className="form-label">
                          New Password <span className="field-required">*</span>
                        </label>
                        <span className="password-hint">Min. 6 characters</span>
                      </div>
                      <div className="input-wrapper">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="reset-password-input"
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          placeholder="••••••••••••"
                          value={resetNewPassword}
                          onChange={(e) => {
                            setResetNewPassword(e.target.value)
                            if (formError) setFormError('')
                          }}
                          className="form-input"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                        >
                          {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirm-reset-password-input" className="form-label">
                        Confirm New Password <span className="field-required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="confirm-reset-password-input"
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          placeholder="••••••••••••"
                          value={confirmResetPassword}
                          onChange={(e) => {
                            setConfirmResetPassword(e.target.value)
                            if (formError) setFormError('')
                          }}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otp.length !== 6 || !resetNewPassword || !confirmResetPassword}
                      className="signin-submit-btn"
                    >
                      <ShieldCheck size={16} />
                      <span>{isSubmitting ? 'Updating Password...' : 'Update Password & Sign In'}</span>
                    </button>
                  </form>

                  <div className="signin-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        clearFeedback()
                      }}
                      className="auth-switch-btn"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              )}
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
                    {'bullets' in sec && Array.isArray((sec as any).bullets) && (
                      <ul className="legal-bullet-list">
                        {((sec as any).bullets as string[]).map((b: string, bIdx: number) => (
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

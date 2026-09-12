'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { UserProfileData } from './types'

interface UserProfileProps {
  user: UserProfileData | null
  onLogout: () => void
  isLoggingOut: boolean
  compact?: boolean
}

export default function UserProfile({ user, onLogout, isLoggingOut, compact = false }: UserProfileProps) {
  const [avatarError, setAvatarError] = useState(false)

  if (!user) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Varka Analyst'
  const initial = (user.firstName ? user.firstName.charAt(0) : 'V').toUpperCase()

  return (
    <div className={`varka-user-card ${compact ? 'is-compact' : ''}`}>
      <div className="varka-user-info-row">
        <div className="varka-user-avatar-wrap">
          {user.avatar && !avatarError ? (
            <img
              src={user.avatar}
              alt={fullName}
              className="varka-user-avatar-img"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="varka-user-avatar-fallback">{initial}</div>
          )}
          <span className="varka-user-status-dot" title="Session Authenticated" />
        </div>

        <div className="varka-user-details">
          <span className="varka-user-name" title={fullName}>
            {fullName}
          </span>
          <span className="varka-user-email" title={user.email}>
            {user.email}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="varka-sidebar-logout-btn"
        aria-label="Sign out of Varka"
        title="Sign out of Varka"
      >
        {isLoggingOut ? (
          <>
            <Loader2 size={14} className="varka-spin" />
            <span>Signing Out...</span>
          </>
        ) : (
          <>
            <LogOut size={14} />
            <span>Sign Out</span>
          </>
        )}
      </button>
    </div>
  )
}

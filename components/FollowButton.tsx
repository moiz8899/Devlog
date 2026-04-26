'use client'

import { useEffect, useState } from 'react'
import { toast } from './Toast'

type FollowButtonProps = {
  targetUserId: string
  initialFollowing: boolean
  variant?: 'profile' | 'feed'
  onChange?: (following: boolean, payload: {
    targetUser: {
      id: string
      username: string
      followersCount: number
    }
    currentUser: {
      id: string
      followingCount: number
    }
  }) => void
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
  variant = 'feed',
  onChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsFollowing(initialFollowing)
  }, [initialFollowing])

  const handleClick = async () => {
    if (loading) return

    setLoading(true)

    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.data) {
        throw new Error(payload?.error || 'Failed to update follow state')
      }

      setIsFollowing(payload.data.following)
      onChange?.(payload.data.following, payload.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update follow state')
    } finally {
      setLoading(false)
    }
  }

  const className =
    variant === 'profile'
      ? `rounded-lg px-3 py-1.5 text-sm transition-colors ${
          isFollowing
            ? 'border border-border hover:bg-surface-2'
            : 'bg-accent text-bg hover:bg-accent/90'
        } ${loading ? 'opacity-60' : ''}`
      : `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          isFollowing
            ? 'border-border text-muted hover:bg-surface-2 hover:text-text'
            : 'border-accent bg-accent text-bg hover:bg-accent/90'
        } ${loading ? 'opacity-60' : ''}`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? '...' : isFollowing ? 'unfollow' : 'follow'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import AvatarUpload from './AvatarUpload'

type ProfileAvatarProps = {
  username: string
  name: string | null
  avatar: string | null
  image: string | null
  isOwner: boolean
}

export default function ProfileAvatar({ username, name, avatar, image, isOwner }: ProfileAvatarProps) {
  const initial = avatar || image || null
  const [currentAvatar, setCurrentAvatar] = useState(initial)
  const initials = (name || username).charAt(0).toUpperCase()

  if (isOwner) {
    return (
      <AvatarUpload
        currentAvatar={currentAvatar}
        username={username}
        onUpload={setCurrentAvatar}
        sizeClassName="w-20 h-20"
      />
    )
  }

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-surface-2">
      {currentAvatar ? (
        <Image
          src={currentAvatar}
          alt={username}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted">
          {initials}
        </div>
      )}
    </div>
  )
}

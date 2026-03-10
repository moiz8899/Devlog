'use client'

import Image from 'next/image'
import Link from 'next/link'

interface AvatarProps {
  src?: string | null
  username: string
  size?: number
  className?: string
  href?: string
}

export default function Avatar({ src, username, size = 32, className = '', href }: AvatarProps) {
  const img = (
    <div
      className={`relative rounded-full overflow-hidden ring-2 ring-transparent hover:ring-accent transition-all ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={username}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-surface-2 flex items-center justify-center text-sm">
          {username[0]?.toUpperCase()}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{img}</Link>
  }

  return img
}
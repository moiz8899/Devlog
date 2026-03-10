'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { toast } from './Toast'

interface AvatarUploadProps {
  currentAvatar?: string | null
  username: string
  onUpload: (url: string) => void
  sizeClassName?: string
}

export default function AvatarUpload({
  currentAvatar,
  username,
  onUpload,
  sizeClassName = 'w-32 h-32',
}: AvatarUploadProps) {
  const { update } = useSession()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeUploadPreset: false }),
      })

      const sigPayload = await sigRes.json().catch(() => null)
      if (!sigRes.ok) {
        throw new Error(sigPayload?.error || 'Failed to get upload signature')
      }

      const { cloudName, apiKey, timestamp, signature } = sigPayload || {}
      if (!cloudName || !apiKey || !timestamp || !signature) {
        throw new Error('Upload configuration is incomplete')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.response)
          
          // Update user profile
          const res = await fetch(`/api/users/${username}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: response.secure_url }),
          })

          if (!res.ok) {
            const errorPayload = await res.json().catch(() => null)
            throw new Error(errorPayload?.error || 'Failed to update avatar')
          }

          await update().catch(() => null)

          onUpload(response.secure_url)
          toast.success('Avatar updated!')
        } else {
          let errorMessage = 'Upload failed'
          try {
            const payload = JSON.parse(xhr.responseText)
            errorMessage = payload?.error?.message || payload?.error || errorMessage
          } catch {
            // keep fallback message
          }
          toast.error(errorMessage)
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        toast.error('Upload failed due to a network error')
        setUploading(false)
      }

      xhr.send(formData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={handleClick}
        className={`relative ${sizeClassName} rounded-full overflow-hidden cursor-pointer group`}
      >
        {currentAvatar ? (
          <Image
            src={currentAvatar}
            alt={username}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-2 flex items-center justify-center text-2xl">
            {username[0]?.toUpperCase()}
          </div>
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <div className="text-center">
              <div className="text-sm mb-2">{Math.round(progress)}%</div>
              <svg className="w-8 h-8 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : (
            <span className="text-sm">change photo</span>
          )}
        </div>
      </div>
    </>
  )
}

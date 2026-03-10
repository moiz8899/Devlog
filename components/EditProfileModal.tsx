'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userProfileSchema } from '@/lib/validations'
import { toast } from './Toast'
import { User } from '@prisma/client'

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onUpdate: (data: Partial<User>) => void
}

export default function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      githubUrl: user.githubUrl || '',
      instagramUrl: user.instagramUrl || '',
      linkedinUrl: user.linkedinUrl || '',
    },
  })

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      const updatedUser = await res.json()
      onUpdate(updatedUser.data)
      toast.success('Profile updated!')
      onClose()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-medium">edit profile</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">display name</label>
            <input
              {...register('name')}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            {errors.name && (
              <p className="text-xs text-red mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">bio (max 150 chars)</label>
            <textarea
              {...register('bio')}
              maxLength={150}
              rows={3}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent resize-none"
            />
            {errors.bio && (
              <p className="text-xs text-red mt-1">{errors.bio.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">GitHub URL</label>
            <input
              {...register('githubUrl')}
              type="url"
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            {errors.githubUrl && (
              <p className="text-xs text-red mt-1">{errors.githubUrl.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Instagram URL</label>
            <input
              {...register('instagramUrl')}
              type="url"
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            {errors.instagramUrl && (
              <p className="text-xs text-red mt-1">{errors.instagramUrl.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">LinkedIn URL</label>
            <input
              {...register('linkedinUrl')}
              type="url"
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            {errors.linkedinUrl && (
              <p className="text-xs text-red mt-1">{errors.linkedinUrl.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded hover:bg-surface-2 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-accent text-bg rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'saving...' : 'save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

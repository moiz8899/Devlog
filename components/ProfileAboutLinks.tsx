'use client'

import { ReactNode, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from './Toast'

type ProfileAboutLinksProps = {
  username: string
  initialBio: string | null
  initialGithubUrl: string | null
  initialInstagramUrl: string | null
  initialLinkedinUrl: string | null
  isOwner: boolean
}

type ProfileState = {
  bio: string | null
  githubUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 0.5C5.372 0.5 0 5.872 0 12.5c0 5.302 3.438 9.8 8.205 11.387.6.11.82-.261.82-.579 0-.286-.01-1.042-.016-2.044-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.083-.729.083-.729 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.304-.536-1.526.117-3.18 0 0 1.008-.322 3.3 1.23a11.488 11.488 0 0 1 6.006 0c2.292-1.552 3.298-1.23 3.298-1.23.654 1.654.242 2.876.119 3.18.77.84 1.235 1.911 1.235 3.221 0 4.61-2.805 5.625-5.478 5.922.43.37.814 1.103.814 2.222 0 1.604-.015 2.896-.015 3.289 0 .321.216.694.825.576C20.565 22.296 24 17.8 24 12.5 24 5.872 18.627 0.5 12 0.5Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95V21h-4V9Z" />
    </svg>
  )
}

function ExternalLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs hover:border-accent hover:text-accent transition-colors"
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}

export default function ProfileAboutLinks({
  username,
  initialBio,
  initialGithubUrl,
  initialInstagramUrl,
  initialLinkedinUrl,
  isOwner,
}: ProfileAboutLinksProps) {
  const [profile, setProfile] = useState<ProfileState>({
    bio: initialBio,
    githubUrl: initialGithubUrl,
    instagramUrl: initialInstagramUrl,
    linkedinUrl: initialLinkedinUrl,
  })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    bio: initialBio ?? '',
    githubUrl: initialGithubUrl ?? '',
    instagramUrl: initialInstagramUrl ?? '',
    linkedinUrl: initialLinkedinUrl ?? '',
  })

  const defaultGithub = useMemo(() => `https://github.com/${username}`, [username])
  const githubToShow = profile.githubUrl || defaultGithub

  const openEditor = () => {
    setForm({
      bio: profile.bio ?? '',
      githubUrl: profile.githubUrl || defaultGithub,
      instagramUrl: profile.instagramUrl ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
    })
    setOpen(true)
  }

  const toNullable = (value: string) => {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        bio: toNullable(form.bio),
        githubUrl: toNullable(form.githubUrl),
        instagramUrl: toNullable(form.instagramUrl),
        linkedinUrl: toNullable(form.linkedinUrl),
      }

      const res = await fetch(`/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data?.data) {
        throw new Error('Failed to update profile')
      }

      setProfile({
        bio: data.data.bio ?? null,
        githubUrl: data.data.githubUrl ?? null,
        instagramUrl: data.data.instagramUrl ?? null,
        linkedinUrl: data.data.linkedinUrl ?? null,
      })

      setOpen(false)
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">About</h2>
        {isOwner && (
          <button
            onClick={openEditor}
            className="rounded border border-border px-3 py-1 text-xs uppercase tracking-wide hover:bg-surface-2 transition-colors"
          >
            edit bio & links
          </button>
        )}
      </div>

      <p className="text-sm text-muted">{profile.bio || 'No bio yet.'}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ExternalLink href={githubToShow} label="GitHub" icon={<GithubIcon />} />
        {profile.instagramUrl && (
          <ExternalLink href={profile.instagramUrl} label="Instagram" icon={<InstagramIcon />} />
        )}
        {profile.linkedinUrl && (
          <ExternalLink href={profile.linkedinUrl} label="LinkedIn" icon={<LinkedinIcon />} />
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onSubmit={saveProfile}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5"
            >
              <h3 className="text-lg font-medium">Edit Bio & Links</h3>

              <div>
                <label className="mb-1 block text-sm text-muted">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  maxLength={150}
                  rows={4}
                  className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  placeholder="Tell people about yourself"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">GitHub URL</label>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={e => setForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                  className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Instagram URL</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={e => setForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  placeholder="https://instagram.com/your-handle"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">LinkedIn URL</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={e => setForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  placeholder="https://linkedin.com/in/your-handle"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-accent px-3 py-1.5 text-sm text-bg hover:bg-accent/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

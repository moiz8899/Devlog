'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Experience } from '@prisma/client'
import { toast } from './Toast'

interface ExperienceSectionProps {
  experiences: Experience[]
  isOwner: boolean
  username: string
}

export default function ExperienceSection({ experiences, isOwner, username }: ExperienceSectionProps) {
  const [items, setItems] = useState(experiences)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  const formatMonth = (value: string) => {
    const [year, month] = value.split('-')
    const monthNumber = Number(month)

    if (!year || !month || Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return value
    }

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${shortMonths[monthNumber - 1]} ${year}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/users/${username}/experience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role.trim(),
          company: formData.company.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          description: formData.description.trim() || undefined,
        }),
      })

      const payload = await res.json()
      if (!res.ok || !payload?.data) {
        throw new Error('Failed to add experience')
      }

      setItems(prev => [...prev, payload.data as Experience])
      setFormData({
        role: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      })
      setShowForm(false)
      toast.success('Work experience added')
    } catch (error) {
      toast.error('Failed to add work experience')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${username}/experience/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete experience')
      }

      setItems(prev => prev.filter(exp => exp.id !== id))
      toast.success('Work experience removed')
    } catch (error) {
      toast.error('Failed to remove work experience')
    }
  }

  return (
    <section id="experience" className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Work Experience</h2>
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs uppercase tracking-wide text-accent hover:opacity-80 transition-opacity"
          >
            + Add Work Experience
          </button>
        )}
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted">No work experience added yet.</p>
        )}

        {items.map(exp => (
          <article key={exp.id} className="group relative overflow-hidden rounded-lg border border-border/80 bg-surface-2 p-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-accent/70" />
            <div className="flex items-start justify-between gap-4 pl-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{exp.role}</p>
                <p className="text-sm text-muted">{exp.company}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatMonth(exp.startDate)} - {exp.endDate ? formatMonth(exp.endDate) : 'Present'}
                </p>
                {exp.description && <p className="mt-2 text-sm text-muted">{exp.description}</p>}
              </div>

              {isOwner && (
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-red transition-all"
                >
                  remove
                </button>
              )}
            </div>
          </article>
        ))}

        {isOwner && (
          <AnimatePresence initial={false}>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="space-y-3 rounded-lg border border-border bg-surface-2 p-4"
              >
                <input
                  type="text"
                  placeholder="Role"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  required
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="month"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <input
                    type="month"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-accent px-3 py-1 text-sm text-bg hover:bg-accent/90 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded border border-border px-3 py-1 text-sm hover:bg-surface"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}

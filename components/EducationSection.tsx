'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Education } from '@prisma/client'
import { toast } from './Toast'

interface EducationSectionProps {
  educations: Education[]
  isOwner: boolean
  username: string
}

export default function EducationSection({ educations, isOwner, username }: EducationSectionProps) {
  const [items, setItems] = useState(educations)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field: '',
    startYear: String(new Date().getFullYear()),
    endYear: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startYearNum = Number(formData.startYear)
    const endYearNum = formData.endYear ? Number(formData.endYear) : null

    if (!Number.isInteger(startYearNum)) {
      toast.error('Please enter a valid start year')
      return
    }

    if (endYearNum !== null && !Number.isInteger(endYearNum)) {
      toast.error('Please enter a valid end year')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/users/${username}/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: formData.school.trim(),
          degree: formData.degree.trim(),
          field: formData.field.trim() || undefined,
          startYear: startYearNum,
          endYear: endYearNum,
        }),
      })

      const payload = await res.json()
      if (!res.ok || !payload?.data) {
        throw new Error('Failed to add education')
      }

      setItems(prev => [...prev, payload.data as Education])
      setFormData({
        school: '',
        degree: '',
        field: '',
        startYear: String(new Date().getFullYear()),
        endYear: '',
      })
      setShowForm(false)
      toast.success('Education added')
    } catch (error) {
      toast.error('Failed to add education')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${username}/education/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete education')
      }

      setItems(prev => prev.filter(edu => edu.id !== id))
      toast.success('Education removed')
    } catch (error) {
      toast.error('Failed to remove education')
    }
  }

  return (
    <section id="education" className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">University / School</h2>
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs uppercase tracking-wide text-accent hover:opacity-80 transition-opacity"
          >
            + Add University/School
          </button>
        )}
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted">No education added yet.</p>
        )}

        {items.map(edu => (
          <article key={edu.id} className="group relative overflow-hidden rounded-lg border border-border/80 bg-surface-2 p-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-accent/70" />
            <div className="flex items-start justify-between gap-4 pl-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{edu.school}</p>
                <p className="text-sm text-muted">
                  {edu.degree}
                  {edu.field ? ` - ${edu.field}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {edu.startYear} - {edu.endYear || 'Present'}
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => handleDelete(edu.id)}
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
                  placeholder="University or school"
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                  required
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Degree"
                  value={formData.degree}
                  onChange={e => setFormData({ ...formData, degree: e.target.value })}
                  required
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Field of study (optional)"
                  value={formData.field}
                  onChange={e => setFormData({ ...formData, field: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Start year"
                    value={formData.startYear}
                    onChange={e => setFormData({ ...formData, startYear: e.target.value })}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="End year"
                    value={formData.endYear}
                    onChange={e => setFormData({ ...formData, endYear: e.target.value })}
                    min="1900"
                    max={new Date().getFullYear() + 10}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
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

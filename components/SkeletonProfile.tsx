'use client'

export default function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
        <div className="w-32 h-32 bg-surface-2 rounded-full animate-pulse" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-surface-2 rounded animate-pulse w-48" />
          <div className="h-4 bg-surface-2 rounded animate-pulse w-64" />
          <div className="flex gap-4">
            <div className="h-6 bg-surface-2 rounded animate-pulse w-16" />
            <div className="h-6 bg-surface-2 rounded animate-pulse w-16" />
            <div className="h-6 bg-surface-2 rounded animate-pulse w-16" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-3 gap-px bg-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-surface-2 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
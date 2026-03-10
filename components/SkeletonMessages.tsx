'use client'

export default function SkeletonMessages() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 bg-surface-2 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-2 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-surface-2 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
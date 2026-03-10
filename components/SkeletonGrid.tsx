'use client'

export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square bg-surface-2 animate-pulse" />
      ))}
    </div>
  )
}
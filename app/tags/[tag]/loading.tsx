import SkeletonGrid from '@/components/SkeletonGrid'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="border-b border-border p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="p-4">
        <SkeletonGrid />
      </div>
    </div>
  )
}

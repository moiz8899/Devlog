import SkeletonGrid from '@/components/SkeletonGrid'

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-5 h-24 animate-pulse rounded-xl border border-border bg-surface" />
      <SkeletonGrid />
    </div>
  )
}

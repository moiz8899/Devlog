import SkeletonMessages from '@/components/SkeletonMessages'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <SkeletonMessages />
    </div>
  )
}

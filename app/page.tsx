import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import Feed from '@/components/Feed'
import TagFilter from '@/components/TagFilter'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getServerSession()
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login')
  }

  const posts = await prisma.post.findMany({
    take: 12,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      },
      reactions: {
        select: {
          id: true,
          createdAt: true,
          postId: true,
          userId: true,
        },
      },
      _count: {
        select: {
          reactions: true,
          comments: true,
        },
      },
    },
  })

  const nextCursor = posts.length === 12 ? posts[posts.length - 1].id : null

  return (
    <div className="w-full">
      <div className="sticky top-16 z-40 border-b border-border bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <TagFilter />
        </div>
      </div>

      <Feed 
        initialPosts={posts} 
        initialCursor={nextCursor} 
      />
    </div>
  )
}

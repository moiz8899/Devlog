import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import Feed from '@/components/Feed'
import StoriesBar from '@/components/StoriesBar'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getServerSession()
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login')
  }

  const currentUserId = session.user.id

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
        where: {
          userId: currentUserId,
        },
        select: {
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
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
        },
      },
      views: {
        where: {
          viewerId: session.user.id,
        },
        select: { id: true },
      },
    },
  })

  return (
    <div className="w-full">
      <StoriesBar
        initialStories={stories.map((story) => ({
          ...story,
          seen: story.views.length > 0,
        }))}
      />

      <Feed 
        initialPosts={posts} 
        initialCursor={nextCursor} 
      />
    </div>
  )
}

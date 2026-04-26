import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import Feed from '@/components/Feed'

export default async function TagPage({
  params,
}: {
  params: { tag: string }
}) {
  const session = await getServerSession()
  const currentUserId = session?.user.id

  const posts = await prisma.post.findMany({
    where: { tags: { has: params.tag } },
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
        where: currentUserId
          ? {
              userId: currentUserId,
            }
          : undefined,
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-medium">#{params.tag}</h1>
      </div>
      <Feed 
        initialPosts={posts} 
        initialCursor={nextCursor} 
        tag={params.tag}
      />
    </div>
  )
}

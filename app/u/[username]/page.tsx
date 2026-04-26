import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import ProfilePage from '@/components/ProfilePage'

export default async function UserProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const session = await getServerSession()
  
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      },
      experiences: {
        orderBy: { order: 'asc' },
      },
      educations: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          posts: true,
          reactions: true,
          comments: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }
  const profileUser = user

  const isOwner = session?.user?.id === profileUser.id
  const isFollowing = session && !isOwner
    ? Boolean(
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: profileUser.id,
            },
          },
        })
      )
    : false

  return (
    <ProfilePage
      user={profileUser}
      isOwner={isOwner}
      isFollowing={isFollowing}
      canFollow={Boolean(session) && !isOwner}
    />
  )
}

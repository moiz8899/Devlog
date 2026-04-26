import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { id: existing.id },
      })
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: userId,
        },
      })
    }

    const [targetCounts, currentUserCounts] = await Promise.all([
      prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
      prisma.follow.count({
        where: {
          followerId: session.user.id,
        },
      }),
    ])

    revalidatePath('/')
    revalidatePath(`/u/${targetUser.username}`)

    return NextResponse.json({
      data: {
        following: !existing,
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          followersCount: targetCounts,
        },
        currentUser: {
          id: session.user.id,
          followingCount: currentUserCounts,
        },
      },
    })
  } catch (error) {
    console.error('Failed to toggle follow:', error)
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    )
  }
}

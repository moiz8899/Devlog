import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent reactions on user's posts
    const reactions = await prisma.reaction.findMany({
      where: {
        post: {
          authorId: session.user.id,
        },
        user: {
          id: { not: session.user.id },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get recent comments on user's posts
    const comments = await prisma.comment.findMany({
      where: {
        post: {
          authorId: session.user.id,
        },
        author: {
          id: { not: session.user.id },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get unread message counts
    const unreadMessages = await prisma.participant.findMany({
      where: {
        userId: session.user.id,
        lastReadAt: {
          not: null,
        },
      },
      include: {
        conversation: {
          include: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                createdAt: {
                  gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    const notifications = [
      ...reactions.map(r => ({
        id: `reaction-${r.id}`,
        type: 'reaction',
        user: r.user,
        post: r.post,
        createdAt: r.createdAt,
        read: false,
      })),
      ...comments.map(c => ({
        id: `comment-${c.id}`,
        type: 'comment',
        user: c.author,
        post: c.post,
        comment: c.body,
        createdAt: c.createdAt,
        read: false,
      })),
      ...unreadMessages
        .filter(p => p.conversation.messages.length > 0)
        .map(p => ({
          id: `message-${p.conversation.id}`,
          type: 'message',
          conversationId: p.conversation.id,
          message: p.conversation.messages[0],
          createdAt: p.conversation.messages[0].createdAt,
          read: false,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

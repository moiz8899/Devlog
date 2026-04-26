import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { body, clientTempId } = await req.json()
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'Reply is required' }, { status: 400 })
    }

    const story = await prisma.story.findFirst({
      where: {
        id: params.id,
        expiresAt: {
          gt: new Date(),
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
      },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    if (story.authorId === session.user.id) {
      return NextResponse.json({ error: 'You cannot reply to your own story' }, { status: 400 })
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: session.user.id,
              },
            },
          },
          {
            participants: {
              some: {
                userId: story.authorId,
              },
            },
          },
        ],
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: session.user.id },
              { userId: story.authorId },
            ],
          },
        },
      })
    }

    const message = await prisma.message.create({
      data: {
        body: body.trim(),
        conversationId: conversation.id,
        senderId: session.user.id,
        recipientId: story.authorId,
        storyId: story.id,
        storyMediaUrl: story.mediaUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        story: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            expiresAt: true,
          },
        },
      },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    const io = (global as any).io
    if (io) {
      io.to(`conversation:${conversation.id}`).emit('new_message', {
        ...message,
        clientTempId: typeof clientTempId === 'string' ? clientTempId : undefined,
      })
      io.to(`user:${story.authorId}`).emit('dm_notification', {
        type: 'story_reply',
        conversationId: conversation.id,
      })
    }

    return NextResponse.json({
      data: {
        conversationId: conversation.id,
        message: {
          ...message,
          clientTempId: typeof clientTempId === 'string' ? clientTempId : undefined,
        },
      },
    })
  } catch (error) {
    console.error('Failed to reply to story:', error)
    return NextResponse.json(
      { error: 'Failed to reply to story' },
      { status: 500 }
    )
  }
}

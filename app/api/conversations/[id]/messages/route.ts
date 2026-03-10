import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { body } = await req.json()
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const participant = await prisma.participant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: session.user.id,
        },
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const recipient = participant.conversation.participants.find(
      (p: { userId: string }) => p.userId !== session.user.id
    )

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        body,
        conversationId: params.id,
        senderId: session.user.id,
        recipientId: recipient.userId,
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
      },
    })

    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    const io = (global as any).io
    if (io) {
      io.to(`conversation:${params.id}`).emit('new_message', message)
    }

    return NextResponse.json({ data: message })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

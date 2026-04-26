import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.participant.update({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    })

    // Emit read receipt
    const io = (global as any).io
    if (io) {
      io.to(`conversation:${params.id}`).emit('message_read', {
        conversationId: params.id,
        userId: session.user.id,
        lastReadAt: new Date(),
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Failed to mark conversation as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark conversation as read' },
      { status: 500 }
    )
  }
}

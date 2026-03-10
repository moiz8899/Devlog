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

    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      await prisma.reaction.delete({
        where: {
          postId_userId: {
            postId: params.id,
            userId: session.user.id,
          },
        },
      })
    } else {
      await prisma.reaction.create({
        data: {
          postId: params.id,
          userId: session.user.id,
        },
      })

      // Create notification for post author
      const post = await prisma.post.findUnique({
        where: { id: params.id },
        select: { authorId: true },
      })

      if (post && post.authorId !== session.user.id) {
        // You could store notifications in a separate model
        // For now, we'll just trigger a toast via Socket.io
        const io = (global as any).io
        if (io) {
          io.to(`user:${post.authorId}`).emit('notification', {
            type: 'reaction',
            postId: params.id,
            userId: session.user.id,
          })
        }
      }
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Failed to toggle reaction:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    )
  }
}
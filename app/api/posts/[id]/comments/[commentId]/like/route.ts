import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: params.commentId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId: params.commentId,
            userId: session.user.id,
          },
        },
      })
    } else {
      await prisma.commentLike.create({
        data: {
          commentId: params.commentId,
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Failed to toggle comment like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle comment like' },
      { status: 500 }
    )
  }
}
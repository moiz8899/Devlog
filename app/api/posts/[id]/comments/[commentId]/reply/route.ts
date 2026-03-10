import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { commentSchema } from '@/lib/validations'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = commentSchema.parse({
      body: body.body,
      postId: params.id,
      parentId: params.commentId,
    })

    const reply = await prisma.comment.create({
      data: {
        body: validated.body,
        postId: params.id,
        authorId: session.user.id,
        parentId: params.commentId,
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
        likes: true,
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })

    // Notify parent comment author
    const parentComment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      select: { authorId: true },
    })

    if (parentComment && parentComment.authorId !== session.user.id) {
      const io = (global as any).io
      if (io) {
        io.to(`user:${parentComment.authorId}`).emit('notification', {
          type: 'reply',
          postId: params.id,
          commentId: reply.id,
          userId: session.user.id,
        })
      }
    }

    return NextResponse.json({ data: reply })
  } catch (error) {
    console.error('Failed to create reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
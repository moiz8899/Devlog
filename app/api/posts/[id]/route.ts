import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(80, 'Title must be less than 80 characters'),
  caption: z.string().max(300, 'Caption must be less than 300 characters').optional(),
  tags: z.array(
    z.string()
      .max(20, 'Tag must be less than 20 characters')
      .regex(/^[a-zA-Z0-9-]+$/, 'Tag can only contain letters, numbers, and hyphens')
  ).max(10, 'Cannot have more than 10 tags'),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = updatePostSchema.parse(body)

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        title: validated.title.trim(),
        caption: validated.caption?.trim() || null,
        tags: validated.tags,
      },
    })

    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '12')
    const tag = searchParams.get('tag')
    const currentUserId = session?.user.id

    const posts = await prisma.post.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: tag ? { tags: { has: tag } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
      },
      reactions: {
        where: currentUserId
          ? {
              userId: currentUserId,
            }
          : undefined,
        select: {
          userId: true,
        },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    })

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null

    return NextResponse.json({
      data: posts,
      cursor: nextCursor,
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = postSchema.parse(body)
    const mediaUrls =
      validated.mediaUrls && validated.mediaUrls.length > 0
        ? validated.mediaUrls
        : [validated.mediaUrl]
    const mediaTypes =
      validated.mediaTypes && validated.mediaTypes.length > 0
        ? validated.mediaTypes
        : [validated.mediaType]

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        caption: validated.caption,
        mediaUrl: validated.mediaUrl,
        mediaUrls,
        mediaTypes,
        mediaType: validated.mediaType,
        thumbUrl: validated.thumbUrl,
        duration: validated.duration,
        tags: validated.tags,
        authorId: session.user.id,
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
        reactions: true,
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

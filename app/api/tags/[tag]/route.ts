import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '12')

    const posts = await prisma.post.findMany({
      where: { tags: { has: params.tag } },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
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
    console.error('Failed to fetch posts by tag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts by tag' },
      { status: 500 }
    )
  }
}
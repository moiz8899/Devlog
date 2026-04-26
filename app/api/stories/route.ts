import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { storySchema } from '@/lib/validations'

const STORY_TTL_HOURS = 24

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        author: {
          select: { id: true, username: true, name: true, avatar: true, image: true },
        },
        views: {
          where: { viewerId: session.user.id },
          select: { id: true },
        },
      },
    })

    return NextResponse.json({
      data: stories.map((story) => ({
        ...story,
        seen: story.views.length > 0,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch stories:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = storySchema.parse(body)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + STORY_TTL_HOURS * 60 * 60 * 1000)
    const items = validated.mediaItems?.length
      ? validated.mediaItems
      : [{ mediaUrl: validated.mediaUrl!, mediaType: validated.mediaType! }]
    const createdStories = await prisma.$transaction(
      items.map((item) =>
        prisma.story.create({
          data: {
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            caption: validated.caption?.trim() || null,
            authorId: session.user.id,
            expiresAt,
          },
          include: {
            author: {
              select: { id: true, username: true, name: true, avatar: true, image: true },
            },
          },
        })
      )
    )

    return NextResponse.json({ data: createdStories.map((story) => ({ ...story, seen: false })) })
  } catch (error) {
    console.error('Failed to create story:', error)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}

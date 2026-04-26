import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId: params.id,
          viewerId: session.user.id,
        },
      },
      update: { viewedAt: new Date() },
      create: {
        storyId: params.id,
        viewerId: session.user.id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to mark story as viewed:', error)
    return NextResponse.json(
      { error: 'Failed to mark story as viewed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userProfileSchema } from '@/lib/validations'

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
          },
        },
        experiences: {
          orderBy: { order: 'asc' },
        },
        educations: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            posts: true,
            reactions: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.username !== params.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = userProfileSchema.parse(body)
    const data = {
      ...validated,
      ...('avatar' in validated ? { image: validated.avatar } : {}),
    }

    const user = await prisma.user.update({
      where: { username: params.username },
      data,
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

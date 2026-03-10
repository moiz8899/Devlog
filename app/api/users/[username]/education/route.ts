import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { educationSchema } from '@/lib/validations'

export async function POST(
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
    const validated = educationSchema.parse(body)

    const education = await prisma.education.create({
      data: {
        ...validated,
        userId: session.user.id,
        order: await prisma.education.count({
          where: { userId: session.user.id },
        }),
      },
    })

    return NextResponse.json({ data: education })
  } catch (error) {
    console.error('Failed to create education:', error)
    return NextResponse.json(
      { error: 'Failed to create education' },
      { status: 500 }
    )
  }
}

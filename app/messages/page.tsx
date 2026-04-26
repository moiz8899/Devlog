import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import MessageInbox from '@/components/MessageInbox'

export default async function MessagesPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessageInbox
        initialConversations={conversations}
        currentUserId={session.user.id}
      />
    </div>
  )
}

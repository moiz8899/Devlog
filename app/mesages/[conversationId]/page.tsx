import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import ConversationView from '@/components/ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string }
}) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
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
        take: 50,
        orderBy: { createdAt: 'asc' },
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
    },
  })

  if (!conversation) {
    notFound()
  }

  // Check if user is participant
  const isParticipant = conversation.participants.some(p => p.user.id === session.user.id)
  if (!isParticipant) {
    redirect('/messages')
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ConversationView 
        conversation={conversation} 
        currentUserId={session.user.id}
      />
    </div>
  )
}

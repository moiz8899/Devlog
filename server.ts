import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import { prisma } from './lib/prisma'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Initialize Socket.io
  // Get allowed origins from environment - can include Vercel domain
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : process.env.NEXTAUTH_URL 
      ? [process.env.NEXTAUTH_URL]
      : ['*']
  
  const io = new Server(server, {
    cors: {
      origin: dev 
        ? ['http://localhost:3000', 'http://localhost:3001']
        : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Make io accessible globally for API routes
  ;(global as any).io = io

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId
    const token = socket.handshake.auth.token

    if (!userId) {
      return next(new Error('Authentication required'))
    }

    // Verify user exists in database
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.data.userId = userId
      socket.data.username = user.username
      next()
    } catch (error) {
      console.error('Socket auth error:', error)
      next(new Error('Authentication failed'))
    }
  })

  // Socket.io connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.userId
    const username = socket.data.username

    console.log(`🔌 Socket connected: ${username} (${userId})`)

    // Join user to their personal room for notifications
    socket.join(`user:${userId}`)

    // Track online status
    socket.broadcast.emit('user_online', { userId, username })

    // Handle joining a conversation
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        // Verify user is participant
        const participant = await prisma.participant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        })

        if (participant) {
          socket.join(`conversation:${conversationId}`)
          console.log(`👥 ${username} joined conversation: ${conversationId}`)
          
          // Notify others in conversation
          socket.to(`conversation:${conversationId}`).emit('user_joined', {
            conversationId,
            userId,
            username,
          })
        }
      } catch (error) {
        console.error('Error joining conversation:', error)
        socket.emit('error', 'Failed to join conversation')
      }
    })

    // Handle leaving a conversation
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`👋 ${username} left conversation: ${conversationId}`)
      
      socket.to(`conversation:${conversationId}`).emit('user_left', {
        conversationId,
        userId,
        username,
      })
    })

    // Handle sending a message
    socket.on('send_message', async ({ conversationId, body, tempId }) => {
      try {
        // Verify user is participant
        const participant = await prisma.participant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
          include: {
            conversation: {
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
              },
            },
          },
        })

        if (!participant) {
          throw new Error('Not a participant in this conversation')
        }

        // Find recipient (the other participant)
        const recipient = participant.conversation.participants.find(
          (p: { userId: string }) => p.userId !== userId
        )

        if (!recipient) {
          throw new Error('No recipient found')
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            body,
            conversationId,
            senderId: userId,
            recipientId: recipient.userId,
          },
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
        })

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        })

        // Emit to all in conversation
        io.to(`conversation:${conversationId}`).emit('new_message', {
          ...message,
          tempId, // Include tempId for optimistic UI updates
        })

        // Send notification to recipient if they're not in the conversation room
        const recipientSockets = await io.in(`user:${recipient.userId}`).fetchSockets()
        const isRecipientInConversation = recipientSockets.some(socket => 
          socket.rooms.has(`conversation:${conversationId}`)
        )

        if (!isRecipientInConversation) {
          io.to(`user:${recipient.userId}`).emit('dm_notification', {
            type: 'message',
            conversationId,
            message: {
              id: message.id,
              body: message.body,
              createdAt: message.createdAt,
              sender: message.sender,
            },
            unreadCount: await prisma.message.count({
              where: {
                conversationId,
                senderId: { not: recipient.userId },
                createdAt: {
                  gt: (await prisma.participant.findUnique({
                    where: {
                      conversationId_userId: {
                        conversationId,
                        userId: recipient.userId,
                      },
                    },
                    select: { lastReadAt: true },
                  }))?.lastReadAt || new Date(0),
                },
              },
            }),
          })
        }

        console.log(`💬 Message sent in ${conversationId} by ${username}`)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('message_error', {
          tempId,
          error: 'Failed to send message',
        })
      }
    })

    // Handle typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping,
      })
    })

    // Handle marking messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await prisma.participant.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
          data: { lastReadAt: new Date() },
        })

        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          readAt: new Date(),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Handle reactions (for future features)
    socket.on('reaction', ({ postId, reaction }) => {
      // Could broadcast to post viewers
      socket.to(`post:${postId}`).emit('new_reaction', {
        postId,
        userId,
        reaction,
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${username} (${userId})`)
      socket.broadcast.emit('user_offline', { userId, username })
      
      // Leave all rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room)
        }
      })
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${username}:`, error)
    })
  })

  // Health check endpoint
  server.on('request', (req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connections: io.engine.clientsCount,
      }))
    }
  })

  // Start server
  server.listen(port, () => {
    console.log(`
🚀 Devlog server ready on http://${hostname}:${port}
📊 Environment: ${dev ? 'development' : 'production'}
🔌 Socket.io server attached
    `)
  })
})

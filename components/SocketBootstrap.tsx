'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    socket?: Socket
  }
}

export default function SocketBootstrap() {
  const { data: session, status } = useSession()

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    const userId = session?.user?.id

    if (!socketUrl || !userId || status !== 'authenticated') {
      if (window.socket) {
        window.socket.disconnect()
        delete window.socket
      }
      return
    }

    const socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        userId,
      },
    })

    window.socket = socket

    return () => {
      socket.disconnect()
      if (window.socket === socket) {
        delete window.socket
      }
    }
  }, [session?.user?.id, status])

  return null
}

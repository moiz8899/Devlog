import { io } from 'socket.io-client'

export const initSocket = (userId: string) => {
  // Use environment variable for WebSocket URL in production
  // Falls back to current origin for development
  // For separate WebSocket server deployment (e.g., Vercel + Render WebSocket)
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
  
  console.log('Initializing socket with URL:', socketUrl)
  
  const socket = io(socketUrl)
}

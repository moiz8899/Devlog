'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/Toast'
import SocketBootstrap from '@/components/SocketBootstrap'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketBootstrap />
      {children}
      <Toaster />
    </SessionProvider>
  )
}

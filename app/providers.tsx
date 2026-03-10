'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
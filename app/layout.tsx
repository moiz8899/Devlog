import type { Metadata } from 'next'
import './global.css'
import { Providers } from './providers'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Devlog! - The Social Platform For Developers',
  description: 'The Social Platform For Developers',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono bg-bg text-text antialiased">
        <Providers>
          <Nav />
          <main className="min-h-screen pb-20 pt-16 md:pb-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

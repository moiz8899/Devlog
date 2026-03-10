import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

async function getCsrfToken() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http'
  // Use the current request host first so OAuth state/callback stay on the same origin.
  const baseUrl = host
    ? `${proto}://${host}`
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: {
      cookie: requestHeaders.get('cookie') ?? '',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return ''
  }

  const data = (await res.json()) as { csrfToken?: string }
  return data.csrfToken ?? ''
}

export default async function LoginPage() {
  const session = await getServerSession()
  if (session) {
    redirect('/')
  }

  const csrfToken = await getCsrfToken()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 text-center">
        <h1 className="text-2xl font-medium mb-2">Devlog!</h1>
        <p className="text-muted mb-8">The Social Platform For Developers</p>
        
        <form method="post" action="/api/auth/signin/github">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value="/" />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.58 0-.287-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.39-1.335-1.76-1.335-1.76-1.09-.746.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.306.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.698.83.578C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            continue with GitHub
          </button>
        </form>

        <p className="text-xs text-muted mt-6">
          by continuing, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  )
}

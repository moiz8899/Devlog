import { NextAuthOptions, getServerSession as nextGetServerSession } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GithubProvider({
      clientId: githubClientId || '',
      clientSecret: githubClientSecret || '',
      profile(profile) {
        return {
          id: profile.id.toString(),
          githubId: profile.id.toString(),
          username: profile.login,
          name: profile.name || profile.login,
          avatar: profile.avatar_url,
          githubUrl: profile.html_url,
          bio: profile.bio,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.avatar = (user as any).avatar || (user as any).image || null
        token.image = (user as any).image || (user as any).avatar || null
      }

      // Keep JWT in sync when client calls useSession().update(...)
      if (trigger === 'update') {
        const sessionAvatar =
          (session as any)?.avatar ?? (session as any)?.user?.avatar
        const sessionImage =
          (session as any)?.image ?? (session as any)?.user?.image

        if (sessionAvatar !== undefined) {
          token.avatar = sessionAvatar
        }
        if (sessionImage !== undefined) {
          token.image = sessionImage
        }
      }
      return token
    },
    async session({ session, token }) {
      const userId = (token.id || token.sub || '') as string
      let dbUser: {
        username: string
        name: string | null
        avatar: string | null
        image: string | null
      } | null = null

      if (userId) {
        try {
          dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              username: true,
              name: true,
              avatar: true,
              image: true,
            },
          })
        } catch (error) {
          // Keep session usable when DB has a transient connectivity issue.
          console.warn('[next-auth][session] falling back to token due to DB error')
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: userId,
          username: dbUser?.username || token.username || '',
          name: dbUser?.name ?? session.user.name,
          avatar: dbUser?.avatar ?? (token as any).avatar ?? null,
          image:
            dbUser?.image ?? (token as any).image ?? session.user.image ?? null,
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  logger: {
    error(code, metadata) {
      console.error('[next-auth][error]', code, metadata)
    },
  },
}

export const getServerSession = () => nextGetServerSession(authOptions)

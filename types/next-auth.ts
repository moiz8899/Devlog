import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      avatar?: string | null
      name?: string
      email?: string
      image?: string | null
    } & DefaultSession['user']
  }

  interface Profile {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string | null
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
    name?: string
    company: string | null
    blog: string | null
    location: string | null
    email?: string
    hireable: boolean | null
    bio: string | null
    twitter_username: string | null
    public_repos: number
    public_gists: number
    followers: number
    following: number
    created_at: string
    updated_at: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    avatar?: string | null
    image?: string | null
  }
}

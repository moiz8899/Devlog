import Link from 'next/link'
import { Experience, Education } from '@prisma/client'
import ExperienceSection from './ExperienceSection'
import EducationSection from './EducationSection'
import ProfileAboutLinks from './ProfileAboutLinks'
import ProfileAvatar from './ProfileAvatar'
import ProfilePostsSection from './ProfilePostsSection'

type ProfilePageProps = {
  user: {
    id: string
    username: string
    name: string | null
    image: string | null
    avatar: string | null
    bio: string | null
    githubUrl: string | null
    instagramUrl: string | null
    linkedinUrl: string | null
    posts: Array<{
      id: string
      title: string
      caption: string | null
      tags: string[]
      mediaUrl: string
      thumbUrl: string | null
      mediaType: 'IMAGE' | 'GIF' | 'VIDEO'
      _count: {
        reactions: number
        comments: number
      }
    }>
    experiences: Experience[]
    educations: Education[]
    _count: {
      posts: number
      followers: number
      following: number
    }
  }
  isOwner: boolean
  isFollowing: boolean
  canFollow: boolean
  onToggleFollow?: () => Promise<void>
}

export default function ProfilePage({
  user,
  isOwner,
  isFollowing,
  canFollow,
  onToggleFollow,
}: ProfilePageProps) {
  const socialLinks = [
    {
      label: 'GitHub',
      href: user.githubUrl || `https://github.com/${user.username}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M12 0.5C5.372 0.5 0 5.872 0 12.5c0 5.302 3.438 9.8 8.205 11.387.6.11.82-.261.82-.579 0-.286-.01-1.042-.016-2.044-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.083-.729.083-.729 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.304-.536-1.526.117-3.18 0 0 1.008-.322 3.3 1.23a11.488 11.488 0 0 1 6.006 0c2.292-1.552 3.298-1.23 3.298-1.23.654 1.654.242 2.876.119 3.18.77.84 1.235 1.911 1.235 3.221 0 4.61-2.805 5.625-5.478 5.922.43.37.814 1.103.814 2.222 0 1.604-.015 2.896-.015 3.289 0 .321.216.694.825.576C20.565 22.296 24 17.8 24 12.5 24 5.872 18.627 0.5 12 0.5Z" />
        </svg>
      ),
    },
    ...(user.instagramUrl
      ? [{
          label: 'Instagram',
          href: user.instagramUrl,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          ),
        }]
      : []),
    ...(user.linkedinUrl
      ? [{
          label: 'LinkedIn',
          href: user.linkedinUrl,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95V21h-4V9Z" />
            </svg>
          ),
        }]
      : []),
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
        >
          back to home
        </Link>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <ProfileAvatar
              username={user.username}
              name={user.name}
              avatar={user.avatar}
              image={user.image}
              isOwner={isOwner}
            />

            <div>
              <h1 className="text-2xl font-semibold">{user.name || user.username}</h1>
              <p className="text-muted">@{user.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs hover:border-accent hover:text-accent transition-colors"
                  >
                    {social.icon}
                    {social.label}
                  </a>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <p>
                  <span className="font-medium">{user._count.posts}</span> posts
                </p>
                <p>
                  <span className="font-medium">{user._count.followers}</span> followers
                </p>
                <p>
                  <span className="font-medium">{user._count.following}</span> following
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canFollow && onToggleFollow && (
              <form action={onToggleFollow}>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </form>
            )}
            {isOwner && <span className="text-xs uppercase tracking-wide text-muted">your profile</span>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="#experience"
            className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide hover:bg-surface-2 transition-colors"
          >
            Experience
          </a>
          <a
            href="#education"
            className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide hover:bg-surface-2 transition-colors"
          >
            Education
          </a>
          <a
            href="#posts"
            className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide hover:bg-surface-2 transition-colors"
          >
            Posts
          </a>
        </div>
      </section>

      <ProfileAboutLinks
        username={user.username}
        initialBio={user.bio}
        initialGithubUrl={user.githubUrl}
        initialInstagramUrl={user.instagramUrl}
        initialLinkedinUrl={user.linkedinUrl}
        isOwner={isOwner}
      />

      <div className="space-y-6">
        <ExperienceSection
          experiences={user.experiences}
          isOwner={isOwner}
          username={user.username}
        />

        <EducationSection
          educations={user.educations}
          isOwner={isOwner}
          username={user.username}
        />

        <ProfilePostsSection posts={user.posts} isOwner={isOwner} />
      </div>
    </div>
  )
}

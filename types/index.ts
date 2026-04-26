import { 
  User, 
  Post, 
  Comment, 
  Reaction, 
  Experience, 
  Education, 
  Conversation, 
  Message,
  CommentLike,
  Participant,
  NotificationSettings,
  Report,
  MediaType,
  ReportStatus
} from '@prisma/client'

// Extended types with relations
export type PostWithAuthor = Post & {
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar' | 'githubUrl' | 'linkedinUrl'> & {
    isFollowedByCurrentUser?: boolean
  }
  reactions?: Pick<Reaction, 'userId'>[]
  _count?: {
    reactions: number
    comments: number
  }
  isReactedByUser?: boolean
  isOwnPost?: boolean
}

export type PostWithDetails = Post & {
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
  reactions: (Reaction & {
    user: Pick<User, 'id' | 'username' | 'avatar'>
  })[]
  comments: (Comment & {
    author: Pick<User, 'id' | 'username' | 'avatar'>
    likes: CommentLike[]
    replies?: CommentWithAuthor[]
    _count?: {
      likes: number
      replies: number
    }
  })[]
  _count: {
    reactions: number
    comments: number
  }
}

export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
  likes: { userId: string }[]
  _count?: {
    likes: number
    replies: number
  }
  replies?: CommentWithAuthor[]
  isLikedByUser?: boolean
}

export type ReactionWithUser = Reaction & {
  user: Pick<User, 'id' | 'username' | 'avatar'>
}

export type ConversationWithParticipants = Conversation & {
  participants: (Participant & {
    user: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
  })[]
  messages?: MessageWithSender[]
  _count?: {
    messages: number
  }
  lastMessage?: MessageWithSender
  unreadCount?: number
}

export type MessageWithSender = Message & {
  sender: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
  recipient: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
}

export type ProfileData = User & {
  posts: (Post & {
    _count: {
      reactions: number
      comments: number
    }
    reactions?: Reaction[]
  })[]
  experiences: Experience[]
  educations: Education[]
  _count: {
    posts: number
    reactions: number
    comments: number
  }
  notificationSettings?: NotificationSettings | null
}

export type UserWithStats = User & {
  _count: {
    posts: number
    reactions: number
    comments: number
    followers?: number
    following?: number
  }
}

export type ReportWithDetails = Report & {
  reporter: Pick<User, 'id' | 'username' | 'avatar'>
  reported: Pick<User, 'id' | 'username' | 'avatar'>
  post?: Pick<Post, 'id' | 'title' | 'mediaUrl'> | null
  comment?: (Comment & {
    author: Pick<User, 'id' | 'username' | 'avatar'>
  }) | null
}

// API Response types
export type ApiResponse<T> = {
  data?: T
  error?: string
  cursor?: string | null
  hasMore?: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// Auth types
export interface SessionUser {
  id: string
  username: string
  name?: string | null
  email?: string | null
  image?: string | null
}

// Form types
export interface PostFormData {
  title: string
  caption?: string
  mediaUrl: string
  mediaUrls?: string[]
  mediaTypes?: MediaType[]
  mediaType: MediaType
  thumbUrl?: string
  duration?: number
  tags: string[]
}

export interface CommentFormData {
  body: string
  postId: string
  parentId?: string
}

export interface ProfileFormData {
  name?: string | null
  bio?: string | null
  avatar?: string | null
  githubUrl?: string | null
  instagramUrl?: string | null
  linkedinUrl?: string | null
}

export interface ExperienceFormData {
  role: string
  company: string
  startDate: string
  endDate?: string | null
  description?: string
}

export interface EducationFormData {
  school: string
  degree: string
  field?: string
  startYear: number
  endYear?: number | null
}

export interface MessageFormData {
  body: string
  conversationId: string
}

// Notification types
export type NotificationType = 'reaction' | 'comment' | 'reply' | 'message'

export interface Notification {
  id: string
  type: NotificationType
  read: boolean
  createdAt: Date
  user?: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
  }
  post?: {
    id: string
    title: string
  }
  comment?: string
  conversationId?: string
  message?: MessageWithSender
}

// Socket events
export interface SocketEvents {
  // Client -> Server
  join_conversation: { conversationId: string }
  leave_conversation: { conversationId: string }
  send_message: { conversationId: string; body: string }
  mark_read: { conversationId: string }
  user_typing: { conversationId: string; isTyping: boolean }
  
  // Server -> Client
  new_message: MessageWithSender
  message_read: { conversationId: string; userId: string; lastReadAt: Date }
  user_typing_update: { conversationId: string; userId: string; isTyping: boolean }
  notification: Notification
}

// Filter and sort types
export type PostFilter = {
  tag?: string
  authorId?: string
  search?: string
}

export type SortOption = 'newest' | 'oldest' | 'most_reactions' | 'most_comments'

// Stats types
export interface UserStats {
  totalPosts: number
  totalReactions: number
  totalComments: number
  totalViews?: number
  reactionRate?: number
  topTags?: { tag: string; count: number }[]
}

export interface PostStats {
  reactionCount: number
  commentCount: number
  uniqueReactors: number
  reactionRate?: number
}

// Theme types
export type Theme = 'dark' | 'light'

// Search types
export interface SearchResult {
  users: Pick<User, 'id' | 'username' | 'name' | 'avatar' | 'bio'>[]
  posts: Pick<Post, 'id' | 'title' | 'mediaUrl' | 'mediaType' | 'createdAt'>[]
  tags: string[]
}

// Re-export Prisma enums for convenience
export { MediaType, ReportStatus }

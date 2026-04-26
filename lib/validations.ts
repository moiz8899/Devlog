import { z } from 'zod'

// Post validation
export const postSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(80, 'Title must be less than 80 characters'),
  caption: z.string()
    .max(300, 'Caption must be less than 300 characters')
    .optional(),
  mediaUrl: z.string()
    .url('Invalid media URL'),
  mediaUrls: z.array(
    z.string().url('Invalid media URL')
  )
    .max(10, 'Cannot upload more than 10 images')
    .optional(),
  mediaTypes: z.array(z.enum(['IMAGE', 'GIF', 'VIDEO']))
    .max(10, 'Cannot upload more than 10 media items')
    .optional(),
  mediaType: z.enum(['IMAGE', 'GIF', 'VIDEO']),
  thumbUrl: z.string()
    .url('Invalid thumbnail URL')
    .optional(),
  duration: z.number()
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .max(60, 'Video cannot exceed 60 seconds')
    .optional(),
  tags: z.array(
    z.string()
      .max(20, 'Tag must be less than 20 characters')
      .regex(/^[a-zA-Z0-9-]+$/, 'Tag can only contain letters, numbers, and hyphens')
  ).max(10, 'Cannot have more than 10 tags'),
})

export const storySchema = z
  .object({
    mediaUrl: z.string().url('Invalid media URL').optional(),
    mediaType: z.enum(['IMAGE', 'GIF', 'VIDEO']).optional(),
    mediaItems: z
      .array(
        z.object({
          mediaUrl: z.string().url('Invalid media URL'),
          mediaType: z.enum(['IMAGE', 'GIF', 'VIDEO']),
        })
      )
      .max(10, 'Cannot upload more than 10 story items')
      .optional(),
    caption: z
      .string()
      .max(150, 'Caption must be less than 150 characters')
      .optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.mediaItems?.length ||
          (data.mediaUrl && data.mediaType)
      ),
    {
      message: 'Provide mediaUrl/mediaType or mediaItems',
      path: ['mediaItems'],
    }
  )

// Comment validation
export const commentSchema = z.object({
  body: z.string()
    .min(1, 'Comment cannot be empty')
    .max(300, 'Comment must be less than 300 characters'),
  postId: z.string()
    .cuid('Invalid post ID'),
  parentId: z.string()
    .cuid('Invalid parent comment ID')
    .optional(),
})

// User profile validation
export const userProfileSchema = z.object({
  name: z.string()
    .max(50, 'Name must be less than 50 characters')
    .optional()
    .nullable(),
  bio: z.string()
    .max(150, 'Bio must be less than 150 characters')
    .optional()
    .nullable(),
  avatar: z.string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  githubUrl: z.string()
    .url('Invalid GitHub URL')
    .regex(/^https?:\/\/(www\.)?github\.com\/.+$/, 'Must be a valid GitHub URL')
    .optional()
    .nullable(),
  instagramUrl: z.string()
    .url('Invalid Instagram URL')
    .regex(/^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/, 'Must be a valid Instagram URL')
    .optional()
    .nullable(),
  linkedinUrl: z.string()
    .url('Invalid LinkedIn URL')
    .regex(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+$/, 'Must be a valid LinkedIn URL')
    .optional()
    .nullable(),
})

// Experience validation
export const experienceSchema = z.object({
  role: z.string()
    .min(1, 'Role is required')
    .max(100, 'Role must be less than 100 characters'),
  company: z.string()
    .min(1, 'Company is required')
    .max(100, 'Company must be less than 100 characters'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format')
    .optional()
    .nullable(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate > data.endDate) {
      return false
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Education validation
export const educationSchema = z.object({
  school: z.string()
    .min(1, 'School is required')
    .max(100, 'School must be less than 100 characters'),
  degree: z.string()
    .min(1, 'Degree is required')
    .max(100, 'Degree must be less than 100 characters'),
  field: z.string()
    .max(100, 'Field must be less than 100 characters')
    .optional(),
  startYear: z.number()
    .int('Start year must be an integer')
    .min(1900, 'Start year must be after 1900')
    .max(new Date().getFullYear(), 'Start year cannot be in the future'),
  endYear: z.number()
    .int('End year must be an integer')
    .min(1900, 'End year must be after 1900')
    .max(new Date().getFullYear() + 10, 'End year is too far in the future')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (data.endYear && data.startYear > data.endYear) {
      return false
    }
    return true
  },
  {
    message: 'End year must be after start year',
    path: ['endYear'],
  }
)

// Message validation
export const messageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
  conversationId: z.string()
    .cuid('Invalid conversation ID'),
})

// Reaction validation
export const reactionSchema = z.object({
  postId: z.string()
    .cuid('Invalid post ID'),
})

// Conversation validation
export const conversationSchema = z.object({
  userId: z.string()
    .cuid('Invalid user ID'),
})

// Search validation
export const searchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(50, 'Search query must be less than 50 characters'),
})

// Pagination validation
export const paginationSchema = z.object({
  cursor: z.string()
    .cuid('Invalid cursor')
    .optional(),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(12),
})

// Upload validation
export const uploadSchema = z.object({
  fileType: z.enum(['image', 'video']),
  fileSize: z.number()
    .max(100 * 1024 * 1024, 'File cannot exceed 100MB'),
})

// Notification settings validation
export const notificationSettingsSchema = z.object({
  emailReactions: z.boolean().default(true),
  emailComments: z.boolean().default(true),
  emailMessages: z.boolean().default(true),
  pushReactions: z.boolean().default(true),
  pushComments: z.boolean().default(true),
  pushMessages: z.boolean().default(true),
})

// Report validation
export const reportSchema = z.object({
  postId: z.string()
    .cuid('Invalid post ID')
    .optional(),
  commentId: z.string()
    .cuid('Invalid comment ID')
    .optional(),
  userId: z.string()
    .cuid('Invalid user ID')
    .optional(),
  reason: z.enum([
    'spam',
    'harassment',
    'inappropriate',
    'copyright',
    'other',
  ]),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
}).refine(
  (data) => {
    // Must have at least one target
    return data.postId || data.commentId || data.userId
  },
  {
    message: 'Must specify a post, comment, or user to report',
  }
)

// Type exports for use in components
export type PostInput = z.infer<typeof postSchema>
export type StoryInput = z.infer<typeof storySchema>
export type CommentInput = z.infer<typeof commentSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ReactionInput = z.infer<typeof reactionSchema>
export type ConversationInput = z.infer<typeof conversationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type UploadInput = z.infer<typeof uploadSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type ReportInput = z.infer<typeof reportSchema>

// Helper function to validate with custom error formatting
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}

// Helper function for safe validation (returns null on error)
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  return result
}

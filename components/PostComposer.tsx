'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { toast } from './Toast'

interface PostComposerProps {
  onClose: () => void
}

type UploadedMedia = {
  url: string
  type: 'IMAGE' | 'GIF' | 'VIDEO'
  thumbUrl?: string
  duration?: number
}

type UploadCredentials = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
}

export default function PostComposer({ onClose }: PostComposerProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [posting, setPosting] = useState(false)
  const [mediaItems, setMediaItems] = useState<UploadedMedia[]>([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    tags: [] as string[],
    tagInput: '',
  })

  const uploadMedia = useCallback(async (
    file: File,
    credentials: UploadCredentials,
    onProgress?: (progress: number) => void
  ): Promise<UploadedMedia> => {
    const isImage = file.type.startsWith('image/')
    const isGif = file.type === 'image/gif'
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isGif && !isVideo) {
      throw new Error('File type not supported')
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      throw new Error('Images must be less than 10MB')
    }

    if (isGif && file.size > 15 * 1024 * 1024) {
      throw new Error('GIFs must be less than 15MB')
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      throw new Error('Videos must be less than 100MB')
    }

    return new Promise<UploadedMedia>((resolve, reject) => {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('api_key', credentials.apiKey)
      uploadFormData.append('timestamp', credentials.timestamp.toString())
      uploadFormData.append('signature', credentials.signature)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.response)
          resolve({
            url: response.secure_url,
            type: isGif ? 'GIF' : isVideo ? 'VIDEO' : 'IMAGE',
            thumbUrl: isVideo ? `${response.secure_url}.jpg` : undefined,
          })
          return
        }

        let errorMessage = 'Upload failed'
        try {
          const payload = JSON.parse(xhr.responseText)
          errorMessage = payload?.error?.message || payload?.error || errorMessage
        } catch {
          // Keep fallback message
        }
        reject(new Error(errorMessage))
      }

      xhr.onerror = () => reject(new Error('Upload failed due to a network error'))
      xhr.send(uploadFormData)
    })
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeUploadPreset: false }),
      })
      const sigPayload = await sigRes.json().catch(() => null)
      if (!sigRes.ok) {
        throw new Error(sigPayload?.error || 'Failed to get upload signature')
      }

      const credentials: UploadCredentials = {
        signature: sigPayload?.signature,
        timestamp: sigPayload?.timestamp,
        cloudName: sigPayload?.cloudName,
        apiKey: sigPayload?.apiKey,
      }

      if (!credentials.signature || !credentials.timestamp || !credentials.cloudName || !credentials.apiKey) {
        throw new Error('Upload configuration is incomplete')
      }

      const progressByFile = new Array(acceptedFiles.length).fill(0)
      const uploaded = new Array<UploadedMedia>(acceptedFiles.length)
      let nextIndex = 0
      const maxConcurrentUploads = Math.min(3, acceptedFiles.length)

      const runUploadWorker = async () => {
        while (nextIndex < acceptedFiles.length) {
          const fileIndex = nextIndex
          nextIndex += 1
          const item = await uploadMedia(acceptedFiles[fileIndex], credentials, (itemProgress) => {
            progressByFile[fileIndex] = itemProgress
            const totalProgress =
              progressByFile.reduce((sum, value) => sum + value, 0) / acceptedFiles.length
            setUploadProgress(totalProgress)
          })
          uploaded[fileIndex] = item
        }
      }

      await Promise.all(
        Array.from({ length: maxConcurrentUploads }, () => runUploadWorker())
      )

      setMediaItems(uploaded)
      setActiveMediaIndex(0)

      if (uploaded.length > 1) {
        toast.success(`${uploaded.length} media items uploaded`)
      } else {
        toast.success('Media uploaded')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [uploadMedia])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => {
      toast.error('Upload up to 10 images/videos/GIFs')
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'image/gif': ['.gif'],
      'video/*': ['.mp4', '.mov', '.webm'],
    },
    maxFiles: 10,
  })

  const handleAddTag = () => {
    if (formData.tagInput.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: '',
      }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!mediaItems.length) {
      toast.error('Upload media first')
      return
    }

    const primaryMedia = mediaItems[0]
    const mediaType: 'IMAGE' | 'GIF' | 'VIDEO' = primaryMedia.type
    const mediaUrls = mediaItems.map(item => item.url)
    const mediaTypes = mediaItems.map(item => item.type)

    setPosting(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          caption: formData.caption.trim() || undefined,
          mediaUrl: primaryMedia.url,
          mediaUrls,
          mediaTypes,
          mediaType,
          thumbUrl: mediaType === 'VIDEO' ? primaryMedia.thumbUrl : undefined,
          duration: mediaType === 'VIDEO' ? primaryMedia.duration : undefined,
          tags: formData.tags,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to create post')
      }

      toast.success('Post created')
      router.refresh()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const activeMedia = mediaItems[activeMediaIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-2xl rounded-lg border border-border bg-surface shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-medium">new post</h2>
        </div>

        <div className="space-y-4 p-4">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragActive ? 'border-accent bg-accent-dim' : 'border-border hover:border-muted'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-4">
                <div className="text-muted">uploading {Math.round(uploadProgress)}%</div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : activeMedia ? (
              <div className="space-y-3">
                <div className="mx-auto aspect-video max-w-lg overflow-hidden rounded-lg bg-surface-2">
                  {activeMedia.type === 'VIDEO' ? (
                    <video
                      src={activeMedia.url}
                      className="h-full w-full object-contain"
                      controls
                    />
                  ) : (
                    <Image
                      src={activeMedia.url}
                      alt="Post preview"
                      width={1280}
                      height={720}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                {mediaItems.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {mediaItems.map((item, index) => (
                      <button
                        type="button"
                        key={item.url}
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMediaIndex(index)
                        }}
                        className={`h-12 w-12 overflow-hidden rounded border ${
                          activeMediaIndex === index
                            ? 'border-accent'
                            : 'border-border'
                        }`}
                      >
                        {item.type === 'VIDEO' ? (
                          <video
                            src={item.url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <Image
                            src={item.url}
                            alt={`Preview ${index + 1}`}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted">
                  {mediaItems.length > 1
                    ? `carousel with ${mediaItems.length} media items - click to replace`
                    : 'click to replace media'}
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-muted">drag and drop or click to upload</p>
                <p className="text-xs text-muted">
                  upload up to 10 images/videos/GIFs
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">title *</label>
            <input
              type="text"
              maxLength={80}
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
              placeholder="what did you build?"
            />
            <div className="mt-1 text-right text-xs text-muted">
              {formData.title.length}/80
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">caption</label>
            <textarea
              maxLength={300}
              value={formData.caption}
              onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              className="h-24 w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
              placeholder="write something about your post..."
            />
            <div className="mt-1 text-right text-xs text-muted">
              {formData.caption.length}/300
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.tagInput}
                onChange={e => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
                placeholder="react, typescript, nextjs..."
                disabled={formData.tags.length >= 10}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!formData.tagInput.trim() || formData.tags.length >= 10}
                className="rounded border border-border bg-surface-2 px-4 py-2 transition-colors hover:bg-surface disabled:opacity-50"
              >
                add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted transition-colors hover:text-text"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            className="rounded border border-border px-4 py-2 transition-colors hover:bg-surface-2"
          >
            cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={posting || uploading || mediaItems.length === 0 || !formData.title.trim()}
            className="rounded bg-accent px-4 py-2 text-bg transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {posting ? 'posting...' : 'post'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

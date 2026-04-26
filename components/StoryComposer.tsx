'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { toast } from './Toast'

type UploadCredentials = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
}

type StoryComposerProps = {
  onClose: () => void
  onCreated: () => void
}

export default function StoryComposer({ onClose, onCreated }: StoryComposerProps) {
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mediaItems, setMediaItems] = useState<Array<{ url: string; type: 'IMAGE' | 'GIF' | 'VIDEO' }>>([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [caption, setCaption] = useState('')

  const uploadMedia = useCallback(async (file: File, credentials: UploadCredentials) => {
    return new Promise<{ url: string; type: 'IMAGE' | 'GIF' | 'VIDEO' }>((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)
      form.append('api_key', credentials.apiKey)
      form.append('timestamp', credentials.timestamp.toString())
      form.append('signature', credentials.signature)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress((e.loaded / e.total) * 100)
      }
      xhr.onload = () => {
        if (xhr.status !== 200) return reject(new Error('Upload failed'))
        const payload = JSON.parse(xhr.responseText)
        resolve({
          url: payload.secure_url,
          type: file.type === 'image/gif' ? 'GIF' : file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        })
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(form)
    })
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    setProgress(0)
    try {
      const sigRes = await fetch('/api/upload', { method: 'POST' })
      const sig = await sigRes.json()
      if (!sigRes.ok) throw new Error(sig?.error || 'Failed to prepare upload')
      const uploaded: Array<{ url: string; type: 'IMAGE' | 'GIF' | 'VIDEO' }> = []
      for (let i = 0; i < files.length; i += 1) {
        const item = await uploadMedia(files[i], {
          signature: sig.signature,
          timestamp: sig.timestamp,
          cloudName: sig.cloudName,
          apiKey: sig.apiKey,
        })
        uploaded.push(item)
        setProgress(((i + 1) / files.length) * 100)
      }
      setMediaItems(uploaded)
      setActiveMediaIndex(0)
      toast.success(`${uploaded.length} story item${uploaded.length > 1 ? 's' : ''} uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [uploadMedia])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 10,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.webm'],
    },
  })

  const handleSubmit = async () => {
    if (!mediaItems.length) {
      toast.error('Upload media first')
      return
    }

    setPosting(true)
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaItems: mediaItems.map((item) => ({
            mediaUrl: item.url,
            mediaType: item.type,
          })),
          caption,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Failed to post story')
      toast.success('Story posted')
      onCreated()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post story')
    } finally {
      setPosting(false)
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div className="w-full max-w-xl rounded-xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-lg font-medium">new story</h3>
        <div
          {...getRootProps()}
          className="mb-3 cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center"
        >
          <input {...getInputProps()} />
          {uploading
            ? `uploading ${Math.round(progress)}%`
            : mediaItems.length
              ? 'click to replace media'
              : 'drag/drop or click to upload'}
        </div>
        {mediaItems.length > 0 && (
          <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-surface-2">
            {mediaItems[activeMediaIndex]?.type === 'VIDEO' ? (
              <video src={mediaItems[activeMediaIndex]?.url} controls className="h-full w-full object-contain" />
            ) : (
              <Image
                src={mediaItems[activeMediaIndex]?.url}
                alt="Story preview"
                width={1280}
                height={720}
                unoptimized
                className="h-full w-full object-contain"
              />
            )}
          </div>
        )}
        {mediaItems.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {mediaItems.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setActiveMediaIndex(index)}
                className={`h-12 w-12 overflow-hidden rounded border ${activeMediaIndex === index ? 'border-accent' : 'border-border'}`}
              >
                {item.type === 'VIDEO' ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  <Image
                    src={item.url}
                    alt={`Story item ${index + 1}`}
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
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={150}
          placeholder="caption (optional)"
          className="mb-3 h-20 w-full rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-2">cancel</button>
          <button onClick={handleSubmit} disabled={!mediaItems.length || posting || uploading} className="rounded bg-accent px-3 py-2 text-bg disabled:opacity-50">
            {posting ? 'posting...' : 'post story'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

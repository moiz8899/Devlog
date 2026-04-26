import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { generateSignature } from '@/lib/cloudinary'

type UploadSignatureRequest = {
  includeUploadPreset?: boolean
}

const readEnv = (value: string | undefined) => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/^['"]|['"]$/g, '')
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as UploadSignatureRequest
    const includeUploadPreset = body.includeUploadPreset ?? true

    const cloudName =
      readEnv(process.env.CLOUDINARY_CLOUD_NAME) ||
      readEnv(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    const apiKey = readEnv(process.env.CLOUDINARY_API_KEY)
    const uploadPreset = readEnv(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)

    if (!cloudName || !apiKey) {
      const missing = [
        !cloudName
          ? 'CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
          : null,
        !apiKey ? 'CLOUDINARY_API_KEY' : null,
      ].filter(Boolean)

      return NextResponse.json(
        {
          error: `Cloudinary is not configured. Missing ${missing.join(' and ')}.`,
        },
        { status: 500 }
      )
    }

    if (includeUploadPreset && !uploadPreset) {
      return NextResponse.json(
        {
          error:
            'Cloudinary upload preset is missing. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
        },
        { status: 500 }
      )
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = generateSignature({
      timestamp,
      upload_preset: includeUploadPreset ? uploadPreset : undefined,
    })

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      uploadPreset: includeUploadPreset ? uploadPreset : null,
    })
  } catch (error) {
    console.error('Upload signature error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate upload signature',
      },
      { status: 500 }
    )
  }
}

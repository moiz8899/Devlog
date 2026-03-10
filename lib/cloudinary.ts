import { createHash } from 'crypto'

type SignatureParams = Record<string, string | number | undefined>

const buildSignatureBase = (params: SignatureParams) => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}

export const generateSignature = (params: SignatureParams) => {
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!apiSecret || apiSecret.includes('*')) {
    throw new Error('Missing or invalid Cloudinary API secret')
  }

  const signatureBase = `${buildSignatureBase(params)}${apiSecret}`
  return createHash('sha1').update(signatureBase).digest('hex')
}

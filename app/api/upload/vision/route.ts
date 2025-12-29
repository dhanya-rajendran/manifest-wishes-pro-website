import { NextResponse } from 'next/server'
// Use dynamic import for basic-ftp in Node runtime
import { Readable } from 'stream'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

function getUserIdFromCookie(req: Request): number | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me') as { uid: number | string }
    const uid = payload?.uid
    return typeof uid === 'string' ? (uid === 'demo' ? null : parseInt(uid, 10)) : uid ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromCookie(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/png', 'image/jpeg']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (only PNG/JPEG)' }, { status: 400 })
  }
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const baseName = `vision_${userId}_${Date.now()}.${ext}`

  const host = process.env.HOSTGATOR_FTP_HOST
  const user = process.env.HOSTGATOR_FTP_USER
  const password = process.env.HOSTGATOR_FTP_PASSWORD
  const secure = (process.env.HOSTGATOR_FTP_SECURE || 'false').toLowerCase() === 'true'
  const baseDirRaw = process.env.HOSTGATOR_FTP_BASE_DIR || 'public_html'
  const baseDir = (baseDirRaw.startsWith('/') ? baseDirRaw : `/${baseDirRaw}`).replace(/\/+$/,'').replace(/\\/g, '/')
  const uploadDirRaw = process.env.HOSTGATOR_UPLOAD_DIR_VISION || process.env.HOSTGATOR_UPLOAD_DIR || 'vision'
  const uploadDir = uploadDirRaw.replace(/^\/+/, '').replace(/\\/g, '/').replace(/\/+$/,'')
  const publicBaseUrl = process.env.HOSTGATOR_PUBLIC_BASE_URL?.replace(/\/+$/,'')

  if (!host || !user || !password || !publicBaseUrl) {
    return NextResponse.json({ error: 'Upload server not configured' }, { status: 500 })
  }

  const { Client } = await import('basic-ftp')
  const client = new Client()
  client.ftp.verbose = false

  try {
    await client.access({ host, user, password, secure, secureOptions: secure ? { rejectUnauthorized: false } : undefined })
    const remoteDir = `${baseDir}/${userId}/${uploadDir}`.replace(/\/+/g, '/')
    await client.ensureDir(remoteDir)
    const remotePath = `${remoteDir}/${baseName}`.replace(/\/+/g, '/')
    await client.uploadFrom(Readable.from(buffer), remotePath)

    const publicUrl = `${publicBaseUrl}/${userId}/${uploadDir}/${baseName}`.replace(/\/+/g, '/')

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (err: unknown) {
    const message = typeof err === 'object' && err && 'message' in err ? String((err as { message?: unknown }).message) : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.close()
  }
}